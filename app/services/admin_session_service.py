import uuid
from typing import List, Optional, Tuple
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc, func

from app.db.models import ChatSession, ChatMessage, User
from app.schemas.chat import AdminChatSessionResponse, ChatSessionDetailResponse
from app.services.minio_service import minio_service


class AdminSessionService:

    async def list_all_sessions(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        user_id: Optional[str] = None,
    ) -> Tuple[List[AdminChatSessionResponse], int]:
        """Return all sessions across all users, with optional user filter."""

        # ── Base filter ───────────────────────────────────────────────
        filters = []
        if user_id:
            try:
                filters.append(ChatSession.user_id == uuid.UUID(user_id))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid user_id format")

        # ── Total count ───────────────────────────────────────────────
        count_query = select(func.count(ChatSession.id))
        if filters:
            count_query = count_query.where(*filters)
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        # ── Paginated JOIN query ──────────────────────────────────────
        data_query = (
            select(ChatSession, User.username)
            .join(User, ChatSession.user_id == User.id)
            .order_by(desc(ChatSession.updated_at))
            .offset(skip)
            .limit(limit)
        )
        if filters:
            data_query = data_query.where(*filters)

        result = await db.execute(data_query)
        rows = result.all()

        sessions: List[AdminChatSessionResponse] = []
        for session, username in rows:
            sessions.append(
                AdminChatSessionResponse(
                    id=session.id,
                    title=session.title,
                    message_count=session.message_count,
                    created_at=session.created_at,
                    updated_at=session.updated_at,
                    user_id=session.user_id,
                    username=username,
                )
            )

        return sessions, total

    async def get_session_detail_admin(
        self, db: AsyncSession, session_id: str
    ) -> ChatSessionDetailResponse:
        """Get full session detail (admin can access any session)."""
        try:
            sid = uuid.UUID(session_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid session_id format")

        query = (
            select(ChatSession)
            .options(selectinload(ChatSession.messages))
            .where(ChatSession.id == sid)
        )
        result = await db.execute(query)
        session = result.scalars().first()

        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")

        response_data = ChatSessionDetailResponse.model_validate(session)
        for msg, resp_msg in zip(session.messages, response_data.messages):
            if msg.image_object_key:
                resp_msg.image_url = minio_service.get_presigned_url(msg.image_object_key)

        return response_data

    async def delete_session_admin(self, db: AsyncSession, session_id: str) -> None:
        """Delete any session (admin only), cleaning up images from MinIO."""
        try:
            sid = uuid.UUID(session_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid session_id format")

        query = (
            select(ChatSession)
            .options(selectinload(ChatSession.messages))
            .where(ChatSession.id == sid)
        )
        result = await db.execute(query)
        session = result.scalars().first()

        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")

        for msg in session.messages:
            if msg.image_object_key:
                minio_service.delete_object(msg.image_object_key)

        await db.delete(session)
        await db.commit()


admin_session_service = AdminSessionService()
