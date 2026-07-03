from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt, JWTError
import redis.asyncio as redis
from datetime import datetime

from app.api.deps import get_db, get_current_user, get_redis
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.db.models import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, RefreshRequest, ChangePasswordRequest, LogoutRequest
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

security = HTTPBearer()
router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if username exists
    result = await db.execute(select(User).where(User.username == req.username))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Username already registered")
        
    # Check if email exists
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        username=req.username,
        email=req.email,
        hashed_password=get_password_hash(req.password),
        role="user"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    access_token = create_access_token(subject=str(new_user.id), role=new_user.role)
    refresh_token = create_refresh_token(subject=str(new_user.id), role=new_user.role)
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "must_change_password": new_user.must_change_password
    }

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalars().first()
    
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token = create_access_token(subject=str(user.id), role=user.role)
    refresh_token = create_refresh_token(subject=str(user.id), role=user.role)
    
    return {
        "access_token": access_token, 
        "refresh_token": refresh_token,
        "must_change_password": user.must_change_password
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    req: RefreshRequest, 
    db: AsyncSession = Depends(get_db),
    redis_client: redis.Redis = Depends(get_redis)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(req.refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        jti: str = payload.get("jti")
        
        if user_id is None or token_type != "refresh":
            raise credentials_exception
            
        # Check blacklist
        if await redis_client.get(f"blacklist:{jti}"):
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")
             
    except JWTError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.is_active:
        raise credentials_exception
        
    access_token = create_access_token(subject=str(user.id), role=user.role)
    new_refresh_token = create_refresh_token(subject=str(user.id), role=user.role)
    
    # Blacklist the old refresh token
    exp_timestamp = payload.get("exp")
    if exp_timestamp:
        ttl = max(0, exp_timestamp - int(datetime.utcnow().timestamp()))
        if ttl > 0:
            await redis_client.set(f"blacklist:{jti}", "true", ex=ttl)
    
    return {
        "access_token": access_token, 
        "refresh_token": new_refresh_token,
        "must_change_password": user.must_change_password
    }

@router.post("/logout")
async def logout(
    req: Optional[LogoutRequest] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    redis_client: redis.Redis = Depends(get_redis),
):
    # 1. Blacklist the access token
    access_token = credentials.credentials
    try:
        payload = jwt.decode(access_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        jti = payload.get("jti")
        exp = payload.get("exp")
        if jti and exp:
            ttl = max(0, exp - int(datetime.utcnow().timestamp()))
            if ttl > 0:
                await redis_client.set(f"blacklist:{jti}", "true", ex=ttl)
    except JWTError:
        pass

    # 2. Blacklist the refresh token if provided
    if req and req.refresh_token:
        try:
            payload = jwt.decode(req.refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti and exp:
                ttl = max(0, exp - int(datetime.utcnow().timestamp()))
                if ttl > 0:
                    await redis_client.set(f"blacklist:{jti}", "true", ex=ttl)
        except JWTError:
            pass

    return {"msg": "Successfully logged out"}

@router.put("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    current_user.hashed_password = get_password_hash(req.new_password)
    current_user.must_change_password = False
    
    await db.commit()
    return {"msg": "Password updated successfully"}
