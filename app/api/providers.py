from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.api.deps import get_db, get_current_active_admin
from app.schemas.providers import ProviderCreate, ProviderUpdate, ProviderResponse
from app.services.provider_service import provider_service

router = APIRouter()

@router.get("", response_model=List[ProviderResponse])
async def list_providers(
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    return await provider_service.list_providers(db)

@router.post("", response_model=ProviderResponse)
async def create_provider(
    provider: ProviderCreate,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    return await provider_service.create_provider(db, provider)

@router.put("/{provider_id}", response_model=ProviderResponse)
async def update_provider(
    provider_id: UUID,
    provider_update: ProviderUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    return await provider_service.update_provider(db, provider_id, provider_update)

@router.delete("/{provider_id}")
async def delete_provider(
    provider_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    return await provider_service.delete_provider(db, provider_id)

@router.post("/{provider_id}/test-connection")
async def test_provider_connection(
    provider_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    return await provider_service.test_provider_connection(db, provider_id)

@router.post("/{provider_id}/models")
async def reload_provider_models(
    provider_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    return await provider_service.reload_provider_models(db, provider_id)
