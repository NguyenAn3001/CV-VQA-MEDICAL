import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.base import AsyncSessionLocal
from app.db.models import User, SystemSetting, ModelProvider
from app.core.config import settings
from app.utils.security import get_password_hash, encrypt_secret

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_SETTINGS = [
    # General
    {"key": "general.systemName", "category": "general", "value": "MedVQA Medical Assistant", "data_type": "string"},
    {"key": "general.defaultModel", "category": "general", "value": "llama3.1", "data_type": "string"},
    {"key": "general.language", "category": "general", "value": "en", "data_type": "string"},
    {"key": "general.timezone", "category": "general", "value": "Asia/Bangkok", "data_type": "string"},
    {"key": "general.maxUploadSizeMB", "category": "general", "value": "10", "data_type": "integer"},
    {"key": "general.enableImageAnalysis", "category": "general", "value": "true", "data_type": "boolean"},
    {"key": "general.enableSessionAutoTitle", "category": "general", "value": "true", "data_type": "boolean"},
    
    # Models
    {"key": "models.llmProvider", "category": "models", "value": "OpenAI Compatible", "data_type": "string"},
    {"key": "models.baseUrl", "category": "models", "value": "http://localhost:11434/v1", "data_type": "string"},
    {"key": "models.apiKey", "category": "models", "value": "ollama", "data_type": "secret"},
    {"key": "models.defaultChatModel", "category": "models", "value": "llama3.1", "data_type": "string"},
    {"key": "models.defaultVisionModel", "category": "models", "value": "llama3.1", "data_type": "string"}
]

async def init_db() -> None:
    async with AsyncSessionLocal() as session:
        # Check if admin user already exists
        result = await session.execute(
            select(User).where(User.username == settings.DEFAULT_ADMIN_USERNAME)
        )
        user = result.scalars().first()
        
        if not user:
            logger.info("Creating default admin user...")
            admin_user = User(
                username=settings.DEFAULT_ADMIN_USERNAME,
                email=settings.DEFAULT_ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.DEFAULT_ADMIN_PASSWORD),
                role="admin",
                is_active=True,
                must_change_password=True  # Force change on first login
            )
            session.add(admin_user)
            await session.commit()
            logger.info(f"Default admin user created. Username: {settings.DEFAULT_ADMIN_USERNAME}")
        else:
            logger.info("Default admin user already exists.")
            
        # Initialize default settings if they don't exist
        logger.info("Initializing system settings...")
        for setting_data in DEFAULT_SETTINGS:
            result = await session.execute(select(SystemSetting).where(SystemSetting.key == setting_data["key"]))
            existing_setting = result.scalars().first()
            if not existing_setting:
                val = setting_data["value"]
                if setting_data["data_type"] == "secret":
                    val = encrypt_secret(val)
                new_setting = SystemSetting(
                    key=setting_data["key"],
                    category=setting_data["category"],
                    value=val,
                    data_type=setting_data["data_type"]
                )
                session.add(new_setting)
        
        await session.commit()
        logger.info("System settings initialized.")

        # Initialize default provider if none exists
        logger.info("Checking for model providers...")
        result = await session.execute(select(ModelProvider))
        providers = result.scalars().all()
        if not providers:
            logger.info("No model providers found, creating default provider...")
            default_provider = ModelProvider(
                name="Default Ollama",
                type="Ollama",
                baseUrl="http://localhost:11434",
                apiKey=encrypt_secret("not-needed"),
                chatModel="llama3.1",
                temperature=0.7,
                maxTokens=1024,
                timeout=120,
                supportsToolCalling=False,
                enabled=True,
                isDefault=True,
                connectionStatus="Disconnected"
            )
            session.add(default_provider)
            await session.commit()
            logger.info("Default model provider created.")


if __name__ == "__main__":
    asyncio.run(init_db())