import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.future import select
from app.db.base import AsyncSessionLocal
from app.db.models import ModelProvider
from app.utils.security import decrypt_secret

load_dotenv()

async def test():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(ModelProvider).where(ModelProvider.isDefault == True))
        provider = result.scalars().first()
        if provider:
            print("Encrypted Key:", provider.apiKey)
            try:
                decrypted = decrypt_secret(provider.apiKey)
                print("Decrypted Key:", decrypted)
            except Exception as e:
                print("Decryption Failed:", e)

asyncio.run(test())
