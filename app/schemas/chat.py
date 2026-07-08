from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ChatMessageResponse(BaseModel):
    id: UUID
    role: str
    content: str
    image_url: Optional[str] = None # Presigned URL, not the raw key
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: UUID
    title: Optional[str]
    message_count: int
    is_pinned: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ChatSessionDetailResponse(ChatSessionResponse):
    model: Optional[str] = None
    messages: List[ChatMessageResponse]

class SendMessageRequest(BaseModel):
    message: str


class AdminChatSessionResponse(BaseModel):
    """Extended session info for admin view — includes username."""
    id: UUID
    title: Optional[str]
    message_count: int
    is_pinned: bool = False
    created_at: datetime
    updated_at: datetime
    user_id: UUID
    username: Optional[str] = None

    class Config:
        from_attributes = True


class PinSessionRequest(BaseModel):
    is_pinned: bool
