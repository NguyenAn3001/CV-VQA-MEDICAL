from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc
from fastapi import HTTPException
import uuid

from app.db.models import ChatSession, ChatMessage
from app.services.minio_service import minio_service
from app.core.config import settings

class ChatService:
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
            .order_by(desc(ChatSession.updated_at))
            .offset(offset)
            .limit(limit)
        )
        return result.scalars().all()
        
    async def get_session(self, db: AsyncSession, session_id: str, user_id: str = None) -> ChatSession:
        query = select(ChatSession).options(selectinload(ChatSession.messages)).where(ChatSession.id == uuid.UUID(session_id))
        result = await db.execute(query)
        session = result.scalars().first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
            
        if user_id and str(session.user_id) != user_id:
             raise HTTPException(status_code=403, detail="Not authorized to access this session")
             
        return session
        
    async def delete_session(self, db: AsyncSession, session_id: str, user_id: str = None):
        session = await self.get_session(db, session_id, user_id)
        
        # Cleanup images from MinIO
        for msg in session.messages:
            if msg.image_object_key:
                minio_service.delete_object(msg.image_object_key)
                
        await db.delete(session)
        await db.commit()
        
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

chat_service = ChatService()
