from fastapi import HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.models import User
from app.schemas.user import UserResponse, ResetPasswordRequest, UserProfileUpdate
from app.core.config import settings
from app.core.security import get_password_hash
from app.services.minio_service import minio_service

class UserService:
    async def list_users(self, db: AsyncSession, skip: int = 0, limit: int = 100) -> List[User]:
        result = await db.execute(select(User).offset(skip).limit(limit))
        return list(result.scalars().all())

    async def get_user(self, db: AsyncSession, user_id: str) -> User:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    async def reset_password(self, db: AsyncSession, user_id: str, req: ResetPasswordRequest) -> dict:
        user = await self.get_user(db, user_id)
        new_pw = req.new_password if req.new_password else settings.DEFAULT_RESET_PASSWORD
        
        user.hashed_password = get_password_hash(new_pw)
        user.must_change_password = True
        
        await db.commit()
        return {"msg": f"Password reset successfully. User must change it on next login."}

    async def deactivate_user(self, db: AsyncSession, user_id: str, admin_id: str) -> dict:
        if admin_id == user_id:
            raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
            
        user = await self.get_user(db, user_id)
        user.is_active = False
        await db.commit()
        return {"msg": "User deactivated"}

    async def activate_user(self, db: AsyncSession, user_id: str) -> dict:
        user = await self.get_user(db, user_id)
        user.is_active = True
        await db.commit()
        return {"msg": "User activated"}

    async def get_profile(self, db: AsyncSession, user: User) -> User:
        return user

    async def update_profile(self, db: AsyncSession, user: User, data: UserProfileUpdate) -> User:
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return user
        for field, value in update_data.items():
            setattr(user, field, value)
        await db.commit()
        await db.refresh(user)
        return user

    async def update_avatar(self, db: AsyncSession, user: User, file: UploadFile) -> User:
        contents = await file.read()
        object_name = minio_service.upload_image(
            user_id=str(user.id),
            file_bytes=contents,
            content_type=file.content_type or "image/jpeg"
        )
        user.avatar_url = minio_service.get_presigned_url(object_name)
        await db.commit()
        await db.refresh(user)
        return user

user_service = UserService()
