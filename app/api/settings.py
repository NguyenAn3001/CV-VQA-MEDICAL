from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_admin
from app.schemas.settings import (
    SettingsResponse, 
    SettingsUpdateRequest,
    TestConnectionRequest
)
from app.services.settings_service import settings_service

router = APIRouter()

@router.get("", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    """
    Get all system settings. Restricted to administrators.
    Secrets like API keys are masked.
    """
    return await settings_service.get_settings(db)

@router.put("")
async def update_settings(
    payload: SettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    """
    Update system settings. Restricted to administrators.
    If '********' is sent for a secret, it will be ignored and the old secret retained.
    """
    return await settings_service.update_settings(db, payload)

@router.post("/test-connection")
async def test_llm_connection(
    payload: TestConnectionRequest,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    """
    Test connection to the specified LLM provider.
    """
    return await settings_service.test_llm_connection(db, payload)
