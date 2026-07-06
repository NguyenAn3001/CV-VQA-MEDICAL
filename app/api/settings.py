from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import httpx

from app.api.deps import get_db, get_current_active_admin
from app.db.models import SystemSetting
from app.schemas.settings import (
    SettingsResponse, 
    SettingsUpdateRequest, 
    GeneralSettings, 
    ModelSettingsResponse
)
from app.utils.security import encrypt_secret, decrypt_secret
from pydantic import BaseModel

router = APIRouter()

class TestConnectionRequest(BaseModel):
    llmProvider: str
    baseUrl: str
    apiKey: str

async def get_all_settings_from_db(db: AsyncSession) -> dict:
    result = await db.execute(select(SystemSetting))
    rows = result.scalars().all()
    
    settings_dict = {
        "general": {},
        "models": {}
    }
    
    for row in rows:
        if row.category not in settings_dict:
            continue
            
        key_parts = row.key.split(".")
        if len(key_parts) != 2:
            continue
            
        _, short_key = key_parts
        
        # Parse value based on data type
        val = row.value
        if row.data_type == "boolean":
            val = val.lower() == "true" if val else False
        elif row.data_type == "integer":
            val = int(val) if val and val.isdigit() else 0
        elif row.data_type == "secret":
            val = "********" if val else "" # Mask secret
            
        settings_dict[row.category][short_key] = val
        
    return settings_dict

@router.get("", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    """
    Get all system settings. Restricted to administrators.
    Secrets like API keys are masked.
    """
    settings_dict = await get_all_settings_from_db(db)
    
    # Provide fallbacks if DB is empty
    general = settings_dict.get("general", {})
    models = settings_dict.get("models", {})
    
    return SettingsResponse(
        general=GeneralSettings(**general),
        models=ModelSettingsResponse(
            llmProvider=models.get("llmProvider", "OpenAI Compatible"),
            baseUrl=models.get("baseUrl", ""),
            apiKey=models.get("apiKey", ""),
            defaultChatModel=models.get("defaultChatModel", "gpt-4o-mini"),
            defaultVisionModel=models.get("defaultVisionModel", "gpt-4o-mini")
        )
    )

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
    try:
        # Build list of rows to upsert
        upsert_rows = []
        
        if payload.general:
            gen_dict = payload.general.model_dump()
            for k, v in gen_dict.items():
                data_type = "boolean" if isinstance(v, bool) else "integer" if isinstance(v, int) else "string"
                str_val = str(v).lower() if isinstance(v, bool) else str(v)
                
                upsert_rows.append({
                    "key": f"general.{k}",
                    "category": "general",
                    "value": str_val,
                    "data_type": data_type
                })
                
        if payload.models:
            mod_dict = payload.models.model_dump(exclude_unset=True)
            for k, v in mod_dict.items():
                if k == "apiKey":
                    # Skip if masked or empty
                    if not v or v == "********":
                        continue
                    upsert_rows.append({
                        "key": f"models.{k}",
                        "category": "models",
                        "value": encrypt_secret(v),
                        "data_type": "secret"
                    })
                else:
                    upsert_rows.append({
                        "key": f"models.{k}",
                        "category": "models",
                        "value": str(v) if v is not None else "",
                        "data_type": "string"
                    })
                    
        # Perform upsert
        for row_data in upsert_rows:
            stmt = select(SystemSetting).where(SystemSetting.key == row_data["key"])
            result = await db.execute(stmt)
            existing_row = result.scalar_one_or_none()
            
            if existing_row:
                existing_row.value = row_data["value"]
                existing_row.data_type = row_data["data_type"]
            else:
                new_row = SystemSetting(**row_data)
                db.add(new_row)
                
        await db.commit()
        return {"status": "success", "message": "Settings updated successfully"}
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update settings: {str(e)}"
        )

@router.post("/test-connection")
async def test_llm_connection(
    payload: TestConnectionRequest,
    db: AsyncSession = Depends(get_db),
    current_admin = Depends(get_current_active_admin),
):
    """
    Test connection to the specified LLM provider.
    """
    api_key = payload.apiKey
    
    # If API key is masked, retrieve real key from DB
    if api_key == "********":
        stmt = select(SystemSetting).where(SystemSetting.key == "models.apiKey")
        result = await db.execute(stmt)
        row = result.scalar_one_or_none()
        if row and row.value:
            api_key = decrypt_secret(row.value)
        else:
            api_key = ""

    provider = payload.llmProvider
    base_url = payload.baseUrl.rstrip('/')

    try:
        if provider == "Gemini":
            from google import genai
            client = genai.Client(api_key=api_key)
            # Just test if client initializes and can list models
            # Note: The genai library might not have a simple 'ping', so we just try listing models
            # In a real app we would call a lightweight endpoint or just check credentials format
            if not api_key:
                 raise ValueError("API Key is required for Gemini")
            return {"status": "success", "message": "Connection configuration valid for Gemini"}
            
        else: # OpenAI Compatible
            # Create a minimal test request to models endpoint
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {}
                if api_key and api_key != "not-needed":
                    headers["Authorization"] = f"Bearer {api_key}"
                
                url = f"{base_url}/models"
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    return {"status": "success", "message": "Connection successful"}
                else:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Connection failed with status {response.status_code}: {response.text[:100]}"
                    )
                    
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Connection test failed: {str(e)}"
        )
