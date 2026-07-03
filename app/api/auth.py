from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
from typing import Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.api.deps import get_db, get_current_user, get_redis
from app.db.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, RefreshRequest, ChangePasswordRequest, LogoutRequest
from app.services.auth_service import auth_service

security = HTTPBearer()
router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.register(db, req)

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.login(db, req)

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    req: RefreshRequest, 
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    return await auth_service.refresh_token(db, redis_client, req)

@router.post("/logout")
async def logout(
    req: Optional[LogoutRequest] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    redis_client: redis.Redis = Depends(get_redis),
):
    access_token = credentials.credentials
    return await auth_service.logout(redis_client, access_token, req)

@router.post("/change-password")
@router.put("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await auth_service.change_password(db, current_user, req)
