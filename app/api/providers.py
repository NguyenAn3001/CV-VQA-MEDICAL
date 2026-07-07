from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
import httpx
from typing import List
from uuid import UUID

from app.api.deps import get_db, get_current_active_admin
from app.db.models import ModelProvider
from app.schemas.providers import ProviderCreate, ProviderUpdate, ProviderResponse
from app.utils.security import encrypt_secret, decrypt_secret

router = APIRouter()

@router.get("", response_model=List[ProviderResponse])
async def list_providers(
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    result = await db.execute(select(ModelProvider).order_by(ModelProvider.isDefault.desc(), ModelProvider.name))
    providers = result.scalars().all()
    
    # Mask API Keys
    res = []
    for p in providers:
        p_dict = p.__dict__.copy()
        if p_dict.get('apiKey'):
            p_dict['apiKey'] = "********"
        res.append(p_dict)
    return res

from sqlalchemy.exc import IntegrityError

@router.post("", response_model=ProviderResponse)
async def create_provider(
    provider: ProviderCreate,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    if provider.isDefault:
        await db.execute(update(ModelProvider).values(isDefault=False))

    db_provider = ModelProvider(**provider.model_dump(exclude={'apiKey'}))
    if provider.apiKey and provider.apiKey != "********":
        db_provider.apiKey = provider.apiKey
        
    db.add(db_provider)
    
    try:
        await db.commit()
        await db.refresh(db_provider)
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=f"A provider with the name '{provider.name}' already exists.")
    
    db_provider.apiKey = "********" if db_provider.apiKey else None
    return db_provider

@router.put("/{provider_id}", response_model=ProviderResponse)
async def update_provider(
    provider_id: UUID,
    provider_update: ProviderUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    result = await db.execute(select(ModelProvider).where(ModelProvider.id == provider_id))
    db_provider = result.scalar_one_or_none()
    
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    if provider_update.isDefault and not db_provider.isDefault:
        await db.execute(update(ModelProvider).values(isDefault=False))

    update_data = provider_update.model_dump(exclude_unset=True)
    
    if 'apiKey' in update_data:
        if update_data['apiKey'] == "********":
            del update_data['apiKey']
            
    for key, value in update_data.items():
        setattr(db_provider, key, value)
        
    await db.commit()
    await db.refresh(db_provider)
    
    db_provider.apiKey = "********" if db_provider.apiKey else None
    return db_provider

@router.delete("/{provider_id}")
async def delete_provider(
    provider_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    result = await db.execute(select(ModelProvider).where(ModelProvider.id == provider_id))
    db_provider = result.scalar_one_or_none()
    
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    if db_provider.isDefault:
        raise HTTPException(status_code=400, detail="Cannot delete default provider. Set another provider as default first.")
        
    await db.delete(db_provider)
    await db.commit()
    return {"status": "success"}

@router.post("/{provider_id}/test-connection")
async def test_provider_connection(
    provider_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    result = await db.execute(select(ModelProvider).where(ModelProvider.id == provider_id))
    db_provider = result.scalar_one_or_none()
    
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    api_key = db_provider.apiKey if db_provider.apiKey else ""
    provider_type = db_provider.type
    base_url = (db_provider.baseUrl or "").rstrip('/')
    
    try:
        if provider_type == "Gemini":
            if not api_key:
                 raise ValueError("API Key is required for Gemini")
            from google import genai
            client = genai.Client(api_key=api_key)
            db_provider.connectionStatus = "Connected"
            await db.commit()
            return {"status": "success", "message": "Connection configuration valid for Gemini"}
            
        else: # OpenAI Compatible, Ollama, etc.
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {}
                if api_key and api_key != "not-needed":
                    headers["Authorization"] = f"Bearer {api_key}"
                
                # Try to list models
                url = f"{base_url}/models" if provider_type != "Ollama" else f"{base_url}/api/tags"
                if provider_type == "Ollama":
                    response = await client.get(url)
                else:
                    response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    db_provider.connectionStatus = "Connected"
                    await db.commit()
                    return {"status": "success", "message": "Connection successful"}
                else:
                    db_provider.connectionStatus = "Disconnected"
                    await db.commit()
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Connection failed with status {response.status_code}"
                    )
                    
    except Exception as e:
        db_provider.connectionStatus = "Disconnected"
        await db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"Connection test failed: {str(e)}"
        )

@router.post("/{provider_id}/models")
async def reload_provider_models(
    provider_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    result = await db.execute(select(ModelProvider).where(ModelProvider.id == provider_id))
    db_provider = result.scalar_one_or_none()
    
    if not db_provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    api_key = db_provider.apiKey if db_provider.apiKey else ""
    provider_type = db_provider.type
    base_url = (db_provider.baseUrl or "").rstrip('/')
    
    models = []
    try:
        if provider_type == "Gemini":
            if not api_key:
                raise ValueError("API Key is required to list Gemini models")
            from google import genai
            client = genai.Client(api_key=api_key)
            models_info = client.models.list()
            models = [m.name for m in models_info]
        else:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {}
                if api_key and api_key != "not-needed":
                    headers["Authorization"] = f"Bearer {api_key}"
                
                url = f"{base_url}/models" if provider_type != "Ollama" else f"{base_url}/api/tags"
                if provider_type == "Ollama":
                    response = await client.get(url)
                    if response.status_code == 200:
                        data = response.json()
                        models = [m["name"] for m in data.get("models", [])]
                else:
                    response = await client.get(url, headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        models = [m["id"] for m in data.get("data", [])]
                        
        return {"status": "success", "models": models}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch models: {str(e)}")

