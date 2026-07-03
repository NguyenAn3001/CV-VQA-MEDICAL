from app.core.config import settings
from app.llm.base import BaseLLMProvider
from app.llm.openai_compatible import OpenAICompatibleProvider
from app.llm.gemini_provider import GeminiProvider

def get_llm_provider() -> BaseLLMProvider:
    if settings.LLM_PROVIDER == "gemini":
        return GeminiProvider(
            api_key=settings.LLM_API_KEY,
            model=settings.LLM_MODEL_NAME,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS
        )
    elif settings.LLM_PROVIDER == "openai_compatible":
        return OpenAICompatibleProvider(
            base_url=settings.LLM_BASE_URL,
            api_key=settings.LLM_API_KEY,
            model=settings.LLM_MODEL_NAME,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
            timeout=settings.LLM_TIMEOUT,
            supports_tool_calling=settings.LLM_SUPPORTS_TOOL_CALLING
        )
    else:
        raise ValueError(f"Unsupported LLM_PROVIDER: {settings.LLM_PROVIDER}")
