from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.api.deps import get_db, require_role
from app.db.models import User
from app.schemas.user import UserResponse, ResetPasswordRequest
from app.services.user_service import user_service

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    return await user_service.list_users(db, skip, limit)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    return await user_service.get_user(db, user_id)

@router.put("/{user_id}/reset-password")
async def reset_password(
    user_id: str,
    req: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    return await user_service.reset_password(db, user_id, req)

@router.put("/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    return await user_service.deactivate_user(db, user_id, str(admin.id))

@router.put("/{user_id}/activate")
async def activate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    return await user_service.activate_user(db, user_id)
