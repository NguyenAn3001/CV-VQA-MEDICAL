from fastapi import APIRouter, status
from app.ml.inference import vqa_pipeline
from app.core.config import settings
import torch

router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Basic health check for Docker/Load Balancer to know API is up."""
    return {"status": "healthy", "version": settings.VERSION}

@router.get("/ready", status_code=status.HTTP_200_OK)
def readiness_check():
    """Checks if the heavy ML models have finished loading."""
    if vqa_pipeline.is_ready():
        device_info = "cuda" if torch.cuda.is_available() else "cpu"
        return {
            "status": "ready", 
            "models_loaded": True, 
            "device": device_info
        }
    else:
        # If not ready, return 503 so Load Balancers don't route traffic here yet
        from fastapi import Response
        return Response(status_code=503, content="Models not fully loaded yet.")
