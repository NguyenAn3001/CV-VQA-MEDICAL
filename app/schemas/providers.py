from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ProviderBase(BaseModel):
    name: str
    type: str
    baseUrl: Optional[str] = None
    apiKey: Optional[str] = None
    chatModel: Optional[str] = None
    temperature: Optional[float] = 0.7
    maxTokens: Optional[int] = 1024
    timeout: Optional[int] = 120
    supportsToolCalling: Optional[bool] = False
    enabled: Optional[bool] = True
    isDefault: Optional[bool] = False

class ProviderCreate(ProviderBase):
    pass

class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    baseUrl: Optional[str] = None
    apiKey: Optional[str] = None
    chatModel: Optional[str] = None
    temperature: Optional[float] = 0.7
    maxTokens: Optional[int] = 1024
    timeout: Optional[int] = 120
    supportsToolCalling: Optional[bool] = False
    enabled: Optional[bool] = True
    isDefault: Optional[bool] = False

class ProviderResponse(ProviderBase):
    id: UUID
    connectionStatus: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
