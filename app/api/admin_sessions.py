from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.api.deps import get_db, require_role
from app.db.models import User
from app.schemas.chat import AdminChatSessionResponse, ChatSessionDetailResponse
from app.services.admin_session_service import admin_session_service

router = APIRouter()


@router.get("/", response_model=dict)
async def list_all_sessions(
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(20, ge=1, le=5000, description="Max sessions to return"),
    user_id: Optional[str] = Query(None, description="Filter by user UUID"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """
    [Admin] List all chat sessions across all users.
    Supports pagination (skip/limit) and optional filtering by user_id.
    """
    sessions, total = await admin_session_service.list_all_sessions(
        db, skip=skip, limit=limit, user_id=user_id
    )
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "sessions": [s.model_dump() for s in sessions],
    }


@router.get("/{session_id}", response_model=ChatSessionDetailResponse)
async def get_session_detail(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """[Admin] Get full message history of any session."""
    return await admin_session_service.get_session_detail_admin(db, session_id)


@router.delete("/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """[Admin] Permanently delete any session and its associated images."""
    await admin_session_service.delete_session_admin(db, session_id)
