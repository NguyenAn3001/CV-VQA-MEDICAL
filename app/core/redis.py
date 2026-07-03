import redis.asyncio as redis
from typing import Optional
from app.core.config import settings

class RedisClient:
    def __init__(self):
        self.redis: Optional[redis.Redis] = None

    async def connect(self):
        if self.redis is None:
            self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def disconnect(self):
        if self.redis is not None:
            await self.redis.close()
            self.redis = None
            
    async def get_client(self) -> redis.Redis:
        if self.redis is None:
            await self.connect()
        return self.redis

# Singleton instance
redis_client = RedisClient()

async def get_redis() -> redis.Redis:
    return await redis_client.get_client()
