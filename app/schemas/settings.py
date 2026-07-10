from pydantic import BaseModel, HttpUrl, Field
from typing import Optional

class GeneralSettings(BaseModel):
    systemName: str = Field(default="MedVQA Medical Assistant")
    defaultModel: Optional[str] = None
    language: str = Field(default="en")
    timezone: str = Field(default="Asia/Bangkok")
    maxUploadSizeMB: int = Field(default=10, ge=1, le=100)
    enableImageAnalysis: bool = Field(default=True)
    enableSessionAutoTitle: bool = Field(default=True)

class ModelSettingsUpdate(BaseModel):
    llmProvider: str = Field(default="OpenAI Compatible")
    baseUrl: Optional[str] = None
    apiKey: Optional[str] = None
    defaultChatModel: str = Field(default="gpt-4o-mini")
    defaultVisionModel: str = Field(default="gpt-4o-mini")

class ModelSettingsResponse(BaseModel):
    llmProvider: str
    baseUrl: Optional[str] = None
    apiKey: str  # We return '********' instead of a boolean to match frontend form
    defaultChatModel: str
    defaultVisionModel: str

class SettingsUpdateRequest(BaseModel):
    general: Optional[GeneralSettings] = None
    models: Optional[ModelSettingsUpdate] = None

class SettingsResponse(BaseModel):
    general: GeneralSettings
    models: ModelSettingsResponse

class TestConnectionRequest(BaseModel):
    llmProvider: str
    baseUrl: str
    apiKey: str
