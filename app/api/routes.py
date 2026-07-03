from fastapi import APIRouter, UploadFile, File, Form, Depends, Request
from app.schemas.pydantic_models import PredictResponse, CaptionResponse, ErrorResponse
from app.core.logger import logger
from app.api.deps import get_current_user, get_redis
from app.db.models import User
from app.middleware.rate_limit import limiter
from app.services.prediction_service import prediction_service

router = APIRouter()

@router.post(
    "/predict", 
    response_model=PredictResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}, 503: {"model": ErrorResponse}}
)
@limiter.limit("30/minute")
async def predict(
    request: Request,
    image: UploadFile = File(..., description="Ảnh y tế (JPEG/PNG)"),
    question: str = Form(..., description="Câu hỏi tiếng Anh hoặc tiếng Trung về bức ảnh"),
    current_user: User = Depends(get_current_user), # Require Auth
    redis_conn = Depends(get_redis)
):
    """
    Nhận ảnh và câu hỏi, trả về dự đoán từ model VQA.
    """
    logger.info(f"Received prediction request. Question: '{question}' from user: {current_user.username}")
    return await prediction_service.predict(image, question, str(current_user.id), redis_conn)


@router.post(
    "/caption", 
    response_model=CaptionResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}, 503: {"model": ErrorResponse}}
)
@limiter.limit("30/minute")
async def generate_caption(
    request: Request,
    image: UploadFile = File(..., description="Ảnh y tế (JPEG/PNG)"),
    current_user: User = Depends(get_current_user), # Require Auth
    redis_conn = Depends(get_redis)
):
    """
    Nhận ảnh y tế, trả về mô tả (caption) sinh ra từ model Image Captioning.
    """
    logger.info(f"Received caption generation request from user: {current_user.username}")
    return await prediction_service.generate_caption(image, str(current_user.id), redis_conn)
