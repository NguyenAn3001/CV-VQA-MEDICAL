from sqlalchemy.future import select
from app.db.base import AsyncSessionLocal
from app.db.models import ModelProvider, SystemSetting
from app.llm.base import BaseLLMProvider
from app.llm.openai_compatible import OpenAICompatibleProvider
from app.llm.gemini_provider import GeminiProvider
from app.utils.security import decrypt_secret
import logging

logger = logging.getLogger(__name__)

async def get_llm_provider() -> BaseLLMProvider:
    """
    Fetches the Default LLM Provider dynamically from the database.
    """
    async with AsyncSessionLocal() as db:
        # Get the default provider
        result = await db.execute(select(ModelProvider).where(ModelProvider.isDefault == True))
        provider = result.scalar_one_or_none()
        
        # Fallback to the first enabled provider if no default
        if not provider:
            result = await db.execute(select(ModelProvider).where(ModelProvider.enabled == True).order_by(ModelProvider.created_at))
            provider = result.scalars().first()
            
        if not provider:
            raise ValueError("No model providers configured or enabled in the system.")
            
        # Get the default model from settings
        result_model = await db.execute(select(SystemSetting).where(SystemSetting.key == "general.defaultModel"))
        setting_model = result_model.scalar_one_or_none()
        
        model_name = (setting_model.value if setting_model and setting_model.value else None) or provider.chatModel or "gpt-4o-mini"

        api_key = provider.apiKey or ""
                
        provider_type = provider.type
        base_url = provider.baseUrl
        temperature = provider.temperature if provider.temperature is not None else 0.7
        max_tokens = provider.maxTokens if provider.maxTokens is not None else 1024
        timeout = provider.timeout if provider.timeout is not None else 120
        supports_tools = provider.supportsToolCalling if provider.supportsToolCalling is not None else False

        if provider_type == "Gemini":
            return GeminiProvider(
                api_key=api_key,
                model=model_name,
                temperature=temperature,
                max_tokens=max_tokens
            )
        else: 
            return OpenAICompatibleProvider(
                base_url=base_url,
                api_key=api_key,
                model=model_name,
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=timeout,
                supports_tool_calling=supports_tools
            )
