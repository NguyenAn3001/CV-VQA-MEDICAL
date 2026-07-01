from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.core.logger import logger
from app.api.routes import router as predict_router
from app.api.health import router as health_router
from app.ml.inference import ai_pipeline

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Code to execute on Startup ---
    logger.info("Starting up FastAPI Server...")
    try:
        # Load heavy deep learning models into RAM/VRAM ONLY ONCE here.
        ai_pipeline.load_models()
        logger.info("Successfully loaded ML models.")
    except Exception as e:
        logger.error(f"CRITICAL ERROR: Failed to load ML Models during startup: {str(e)}")
        # In a real cluster, you might want to exit(1) here if models are absolutely required.
        
    yield
    # --- Code to execute on Shutdown ---
    logger.info("Shutting down FastAPI Server...")
    # Release VRAM/RAM if necessary (PyTorch handles this mostly fine on process exit)
    
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None
)

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
app.include_router(predict_router, prefix=settings.API_V1_STR, tags=["Medical AI Inference"])

if __name__ == "__main__":
    import uvicorn
    # Local dev runner. For prod, use gunicorn with Uvicorn workers.
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
