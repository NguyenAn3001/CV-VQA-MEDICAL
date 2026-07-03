from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from prometheus_fastapi_instrumentator import Instrumentator
import uvicorn

from app.core.config import settings
from app.core.logger import logger
from app.api.routes import router as predict_router
from app.api.health import router as health_router

# New Imports
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.chat import router as chat_router
from app.core.redis import redis_client
from app.services.minio_service import minio_service
from app.db.init_db import init_db
from app.middleware.rate_limit import setup_rate_limiting
from app.ml.inference import ai_pipeline

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Code to execute on Startup ---
    logger.info("Starting up FastAPI Server...")
    try:
        # 1. Initialize Database (Create default admin)
        await init_db()
        logger.info("Database initialized.")
        
        # 2. Connect to Redis
        await redis_client.connect()
        logger.info("Redis connected.")
        
        # 3. Ensure MinIO bucket exists
        minio_service.ensure_bucket_exists()
        logger.info("MinIO initialized.")

        # 4. Load heavy deep learning models into RAM/VRAM ONLY ONCE here.
        ai_pipeline.load_models()
        logger.info("Successfully loaded ML models.")
    except Exception as e:
        logger.error(f"CRITICAL ERROR: Failed to start services during startup: {str(e)}")
        # In a real cluster, you might want to exit(1) here if models are absolutely required.
        
    yield
    # --- Code to execute on Shutdown ---
    logger.info("Shutting down FastAPI Server...")
    await redis_client.disconnect()
    # Release VRAM/RAM if necessary (PyTorch handles this mostly fine on process exit)
    
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None
)

# Setup Rate Limiting
setup_rate_limiting(app)

# Prometheus metrics setup
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# Setup CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health_router, tags=["Health"])
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/admin/users", tags=["Admin Users"])
app.include_router(chat_router, prefix=f"{settings.API_V1_STR}/chat", tags=["Chatbot"])
app.include_router(predict_router, prefix=settings.API_V1_STR, tags=["Medical AI Inference"])

if __name__ == "__main__":
    # Local dev runner. For prod, use gunicorn with Uvicorn workers.
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
