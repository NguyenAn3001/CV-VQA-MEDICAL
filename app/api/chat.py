import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.db.models import User
from app.schemas.chat import ChatSessionResponse, ChatSessionDetailResponse, PinSessionRequest
from app.services.chat_service import chat_service

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_session(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await chat_service.create_session(db, str(current_user.id))

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_sessions(
    skip: int = 0, limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await chat_service.get_user_sessions(db, str(current_user.id), limit, skip)

@router.get("/sessions/{session_id}", response_model=ChatSessionDetailResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await chat_service.get_session_detail(db, session_id, str(current_user.id))

@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await chat_service.delete_session(db, session_id, str(current_user.id))

@router.patch("/sessions/{session_id}/pin", response_model=ChatSessionResponse)
async def toggle_pin_session(
    session_id: str,
    body: PinSessionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await chat_service.toggle_pin_session(
        db, session_id, str(current_user.id), body.is_pinned
    )

@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    message: str = Form(..., description="User's text message"),
    image: Optional[UploadFile] = File(None, description="Optional medical image"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pil_image, history, new_title = await chat_service.prepare_message_and_context(
        db, session_id, str(current_user.id), message, image
    )
    return chat_service.get_sse_stream(session_id, history, message, pil_image, new_title)
