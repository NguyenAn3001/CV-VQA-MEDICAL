import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.base import AsyncSessionLocal
from app.db.models import User
from app.core.config import settings
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

if __name__ == "__main__":
    asyncio.run(init_db())