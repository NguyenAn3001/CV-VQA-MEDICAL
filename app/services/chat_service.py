import asyncio
import io
import json
import logging
import uuid
from typing import List, Optional, Tuple
from PIL import Image
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc
from sse_starlette.sse import EventSourceResponse

from app.db.models import ChatSession, ChatMessage, ModelProvider, SystemSetting
from app.db.base import AsyncSessionLocal
from app.services.minio_service import minio_service
from app.services.llm_orchestrator import llm_orchestrator
from app.core.config import settings
from app.schemas.chat import ChatSessionDetailResponse

logger = logging.getLogger(__name__)

class ChatService:
    async def _get_default_model_name(self, db: AsyncSession) -> Optional[str]:
        llm_model = None
        try:
            result = await db.execute(select(ModelProvider).where(ModelProvider.isDefault == True))
            provider = result.scalar_one_or_none()
            if not provider:
                result = await db.execute(select(ModelProvider).where(ModelProvider.enabled == True).order_by(ModelProvider.created_at))
                provider = result.scalars().first()
            if provider and provider.chatModel:
                llm_model = provider.chatModel
            if not llm_model:
                result = await db.execute(select(SystemSetting).where(SystemSetting.key == "general.defaultModel"))
                setting = result.scalar_one_or_none()
                if setting and setting.value:
                    llm_model = setting.value
        except Exception:
            pass
        llm_model = llm_model or "gpt-4o-mini"
        medical_model = settings.MEDICAL_MODEL_DISPLAY_NAME
        return f"{llm_model} + {medical_model}"

    async def create_session(self, db: AsyncSession, user_id: str, title: str = "New Session") -> ChatSession:
        session = ChatSession(
            user_id=uuid.UUID(user_id),
            title=title
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session
        
    async def get_user_sessions(self, db: AsyncSession, user_id: str, limit: int = 20, offset: int = 0):
        result = await db.execute(
            select(ChatSession)
            .where(ChatSession.user_id == uuid.UUID(user_id))
            .order_by(desc(ChatSession.is_pinned), desc(ChatSession.updated_at))
            .offset(offset)
            .limit(limit)
        )
        sessions = result.scalars().all()
        model_name = await self._get_default_model_name(db)
        for s in sessions:
            s.model = model_name
        return sessions
        
    async def get_session(self, db: AsyncSession, session_id: str, user_id: str = None) -> ChatSession:
        query = select(ChatSession).options(selectinload(ChatSession.messages)).where(ChatSession.id == uuid.UUID(session_id))
        result = await db.execute(query)
        session = result.scalars().first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
            
        if user_id and str(session.user_id) != user_id:
             raise HTTPException(status_code=403, detail="Not authorized to access this session")
             
        return session

    async def get_session_detail(self, db: AsyncSession, session_id: str, user_id: str) -> ChatSessionDetailResponse:
        session = await self.get_session(db, session_id, user_id)
        
        response_data = ChatSessionDetailResponse.model_validate(session)
        for msg, resp_msg in zip(session.messages, response_data.messages):
            if msg.image_object_key:
                resp_msg.image_url = minio_service.get_presigned_url(msg.image_object_key)

        response_data.model = await self._get_default_model_name(db)
        return response_data
        
    async def delete_session(self, db: AsyncSession, session_id: str, user_id: str = None):
        session = await self.get_session(db, session_id, user_id)
        
        # Cleanup images from MinIO
        for msg in session.messages:
            if msg.image_object_key:
                minio_service.delete_object(msg.image_object_key)
                
        await db.delete(session)
        await db.commit()

    async def toggle_pin_session(self, db: AsyncSession, session_id: str, user_id: str, is_pinned: bool) -> ChatSession:
        session = await self.get_session(db, session_id, user_id)
        session.is_pinned = is_pinned
        await db.commit()
        await db.refresh(session)
        return session
        
    async def save_message(self, db: AsyncSession, session_id: str, role: str, content: str, 
                           image_key: str = None, tool_calls: list = None) -> ChatMessage:
        msg = ChatMessage(
            session_id=uuid.UUID(session_id),
            role=role,
            content=content,
            image_object_key=image_key,
            tool_calls=tool_calls
        )
        db.add(msg)
        
        # Update session timestamp and count
        session = await db.get(ChatSession, uuid.UUID(session_id))
        if session:
            session.message_count += 1
            
        await db.commit()
        await db.refresh(msg)
        return msg
        
    async def get_latest_session_image(self, db: AsyncSession, session_id: str) -> str:
        """Find the most recently uploaded image key in this session"""
        result = await db.execute(
            select(ChatMessage.image_object_key)
            .where(ChatMessage.session_id == uuid.UUID(session_id))
            .where(ChatMessage.image_object_key != None)
            .order_by(desc(ChatMessage.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def prepare_message_and_context(
        self, db: AsyncSession, session_id: str, user_id: str, message: str, image: Optional[UploadFile] = None
    ) -> Tuple[Optional[Image.Image], List[ChatMessage], Optional[str]]:
        session = await self.get_session(db, session_id, user_id)
        
        if session.message_count >= settings.MAX_MESSAGES_PER_SESSION:
            raise HTTPException(status_code=400, detail="Session message limit reached.")

        # Provide a default prompt if user only sent an image
        if not message.strip() and image:
            message = "Please analyze this image."

        # 1. Handle Image Upload
        image_key = None
        pil_image = None
        if image:
            if not image.content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail="File must be an image.")
            
            contents = await image.read()
            file_size_mb = len(contents) / (1024 * 1024)
            if file_size_mb > settings.MAX_IMAGE_SIZE_MB:
                raise HTTPException(status_code=400, detail=f"Image too large. Max {settings.MAX_IMAGE_SIZE_MB}MB.")
                
            try:
                pil_image = Image.open(io.BytesIO(contents))
                pil_image.verify()
                pil_image = Image.open(io.BytesIO(contents)) # Reopen after verify
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid image file.")
                
            # Upload to MinIO
            image_key = minio_service.upload_image(
                user_id=user_id,
                session_id=session_id,
                file_bytes=contents,
                content_type=image.content_type
            )
        else:
            # Check if there's a previous image in this session we should use
            latest_image_key = await self.get_latest_session_image(db, session_id)
            if latest_image_key:
                try:
                    img_bytes = minio_service.get_object(latest_image_key)
                    pil_image = Image.open(io.BytesIO(img_bytes))
                except Exception as e:
                    logger.error(f"Failed to load previous session image: {e}")

        # 2. Save User Message
        await self.save_message(
            db=db, session_id=session_id, role="user", 
            content=message, image_key=image_key
        )

        # Auto-generate title if this is the first message
        new_title = None
        if session.message_count == 1 and (not session.title or session.title == "New Session"):
            new_title = await llm_orchestrator.generate_title(message)
            if not new_title or new_title == "New Chat Session":
                words = message.split()[:8]
                new_title = " ".join(words) if words else "New Chat"
            session.title = new_title
            await db.commit()

        # Capture history context before streaming
        history = list(session.messages[-settings.MAX_CONVERSATION_HISTORY:]) if session.messages else []
        return pil_image, history, new_title

    def get_sse_stream(self, session_id: str, history: List[ChatMessage], message: str, pil_image: Optional[Image.Image], new_title: Optional[str] = None) -> EventSourceResponse:
        async def sse_generator():
            try:
                full_response = ""
                tool_calls_record = []

                if new_title:
                    yield {
                        "event": "title_changed",
                        "data": json.dumps({"session_id": session_id, "title": new_title})
                    }

                async for chunk in llm_orchestrator.stream_chat(history, message, pil_image):
                    if chunk.content:
                        full_response += chunk.content
                        yield {
                            "event": "message",
                            "data": json.dumps({"content": chunk.content})
                        }
                    elif chunk.tool_calls:
                        for tc in chunk.tool_calls:
                            tool_calls_record.append({
                                "name": tc.name,
                                "arguments": tc.arguments,
                            })
                        yield {
                            "event": "tool_call",
                            "data": json.dumps({"tools": [{"name": tc.name, "args": tc.arguments} for tc in chunk.tool_calls]})
                        }
                    
                    await asyncio.sleep(0.01)

                # Done streaming, save assistant message in bg
                async with AsyncSessionLocal() as bg_db:
                    await self.save_message(
                        db=bg_db,
                        session_id=session_id,
                        role="assistant",
                        content=full_response,
                        tool_calls=tool_calls_record if tool_calls_record else None
                    )
                    
                yield {
                    "event": "done",
                    "data": json.dumps({"status": "completed"})
                }
                
            except asyncio.CancelledError:
                logger.info("Client disconnected during stream")
            except Exception as e:
                logger.exception("Error in SSE generator")
                yield {
                    "event": "error",
                    "data": json.dumps({"detail": "An error occurred during generation"})
                }

        return EventSourceResponse(sse_generator())

chat_service = ChatService()
