import json
import logging
from typing import List, Optional
from PIL import Image
import io
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse
import asyncio

from app.api.deps import get_db, get_current_user
from app.db.base import AsyncSessionLocal
from app.db.models import User
from app.schemas.chat import ChatSessionResponse, ChatSessionDetailResponse, ChatMessageResponse
from app.services.chat_service import chat_service
from app.services.llm_orchestrator import llm_orchestrator
from app.services.minio_service import minio_service
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_session(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = await chat_service.create_session(db, str(current_user.id))
    return session

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_sessions(
    skip: int = 0, limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = await chat_service.get_user_sessions(db, str(current_user.id), limit, skip)
    return sessions

@router.get("/sessions/{session_id}", response_model=ChatSessionDetailResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = await chat_service.get_session(db, session_id, str(current_user.id))
    
    # Process messages to inject presigned URLs
    response_data = ChatSessionDetailResponse.model_validate(session)
    for msg, resp_msg in zip(session.messages, response_data.messages):
        if msg.image_object_key:
            resp_msg.image_url = minio_service.get_presigned_url(msg.image_object_key)
            
    return response_data

@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await chat_service.delete_session(db, session_id, str(current_user.id))

@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    message: str = Form(..., description="User's text message"),
    image: Optional[UploadFile] = File(None, description="Optional medical image"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = await chat_service.get_session(db, session_id, str(current_user.id))
    
    if session.message_count >= settings.MAX_MESSAGES_PER_SESSION:
        raise HTTPException(status_code=400, detail="Session message limit reached.")

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
            user_id=str(current_user.id),
            session_id=session_id,
            file_bytes=contents,
            content_type=image.content_type
        )
    else:
        # Check if there's a previous image in this session we should use
        latest_image_key = await chat_service.get_latest_session_image(db, session_id)
        if latest_image_key:
            try:
                img_bytes = minio_service.get_object(latest_image_key)
                pil_image = Image.open(io.BytesIO(img_bytes))
            except Exception as e:
                logger.error(f"Failed to load previous session image: {e}")

    # 2. Save User Message
    await chat_service.save_message(
        db=db, session_id=session_id, role="user", 
        content=message, image_key=image_key
    )

    # Auto-generate title if this is the first message
    if session.message_count == 1 and (not session.title or session.title == "New Session"):
        new_title = await llm_orchestrator.generate_title(message)
        session.title = new_title
        await db.commit()

    # 3. Streaming Response Generator
    async def sse_generator():
        try:
            # We need a new DB session for the background task if we query inside the generator
            # Here we just pass the history we already have
            history = session.messages[-settings.MAX_CONVERSATION_HISTORY:] if session.messages else []
            
            full_response = ""
            tool_calls_record = []
            
            async for chunk in llm_orchestrator.stream_chat(history, message, pil_image):
                if chunk.content:
                    full_response += chunk.content
                    yield {
                        "event": "message",
                        "data": json.dumps({"content": chunk.content})
                    }
                elif chunk.tool_calls:
                    # Log tool calls for final DB save
                    for tc in chunk.tool_calls:
                        tool_calls_record.append({
                            "name": tc.name,
                            "arguments": tc.arguments,
                        })
                    yield {
                        "event": "tool_call",
                        "data": json.dumps({"tools": [{"name": tc.name, "args": tc.arguments} for tc in chunk.tool_calls]})
                    }
                
                # Small sleep to allow connection checks
                await asyncio.sleep(0.01)

            # Done streaming, save assistant message
            async with AsyncSessionLocal() as bg_db:
                await chat_service.save_message(
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
            logger.error(f"Error in SSE generator: {e}")
            yield {
                "event": "error",
                "data": json.dumps({"detail": "An error occurred during generation"})
            }

    return EventSourceResponse(sse_generator())
