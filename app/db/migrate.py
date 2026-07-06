import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.base import engine
from app.db.models import Base

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("Database tables created successfully!")

if __name__ == "__main__":
    asyncio.run(init_models())
