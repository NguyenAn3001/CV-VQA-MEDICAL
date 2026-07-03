from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends, Request
from typing import Optional
from app.schemas.pydantic_models import PredictResponse, CaptionResponse, ErrorResponse
from app.utils.image_utils import validate_and_load_image
from app.ml.inference import ai_pipeline
from app.core.logger import logger
from app.core.config import settings

# New Imports
from app.api.deps import get_current_user, get_redis
from app.db.models import User
from app.services.minio_service import minio_service
from app.middleware.rate_limit import limiter
import hashlib
import json

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
    
    # 1. Strict Validation
    if len(question.strip()) == 0:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    if len(question) > settings.MAX_QUESTION_LENGTH:
         raise HTTPException(
             status_code=400, 
             detail=f"Question too long. Max {settings.MAX_QUESTION_LENGTH} chars."
         )
         
    if not ai_pipeline.is_ready() or ai_pipeline.vqa_model is None:
        raise HTTPException(
             status_code=503, 
             detail="VQA Model is still loading or unavailable. Please try again later."
         )

    # 2. Parse Image safely
    pil_image = await validate_and_load_image(image)
    
    # 2.5 Cache check
    cache_key = None
    try:
        image.file.seek(0)
        img_bytes = await image.read()
        image.file.seek(0)
        
        img_hash = hashlib.sha256(img_bytes).hexdigest()
        q_hash = hashlib.sha256(question.encode('utf-8')).hexdigest()
        cache_key = f"inference:predict:{img_hash}:{q_hash}"
        
        cached_res = await redis_conn.get(cache_key)
        if cached_res:
            logger.info(f"Returning cached VQA result for: {question}")
            cached_data = json.loads(cached_res)
            return PredictResponse(
                answer=cached_data["answer"],
                confidence=cached_data["confidence"],
                inference_time_ms=0.0
            )
    except Exception as e:
        logger.warning(f"Cache lookup failed: {e}")
        
    # Upload to MinIO (Background or synchronous)
    # Note: For strict legacy backwards compatibility, we might not want to save it to a "chat session",
    # but we should still save it to MinIO for auditing.
    try:
        image.file.seek(0)
        minio_service.upload_image(
            user_id=str(current_user.id),
            file_bytes=image.file.read(),
            content_type=image.content_type
        )
    except Exception as e:
        logger.error(f"Failed to backup legacy upload to MinIO: {e}")
    
    # 3. Model Inference
    try:
        result = ai_pipeline.predict(pil_image, question)
        logger.info(f"Prediction successful. Answer: '{result['answer']}' (Time: {result['inference_time_ms']}ms)")
        
        if cache_key:
            try:
                cache_data = {
                    "answer": result["answer"],
                    "confidence": result["confidence"]
                }
                await redis_conn.set(cache_key, json.dumps(cache_data), ex=3600)
            except Exception as e:
                logger.warning(f"Failed to cache prediction: {e}")

        return PredictResponse(
            answer=result["answer"],
            confidence=result["confidence"],
            inference_time_ms=result["inference_time_ms"]
        )
    except Exception as e:
        logger.error(f"Prediction pipeline failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Inference pipeline failed.")


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
    
    if not ai_pipeline.is_ready() or ai_pipeline.caption_model is None:
        raise HTTPException(
             status_code=503, 
             detail="Captioning Model is still loading or unavailable. Please try again later."
         )

    # 1. Parse Image safely
    pil_image = await validate_and_load_image(image)
    
    # 1.5 Cache check
    cache_key = None
    try:
        image.file.seek(0)
        img_bytes = await image.read()
        image.file.seek(0)
        
        img_hash = hashlib.sha256(img_bytes).hexdigest()
        cache_key = f"inference:caption:{img_hash}"
        
        cached_res = await redis_conn.get(cache_key)
        if cached_res:
            logger.info("Returning cached Captioning result")
            cached_data = json.loads(cached_res)
            return CaptionResponse(
                caption=cached_data["caption"],
                inference_time_ms=0.0
            )
    except Exception as e:
        logger.warning(f"Cache lookup failed: {e}")
        
    try:
        image.file.seek(0)
        minio_service.upload_image(
            user_id=str(current_user.id),
            file_bytes=image.file.read(),
            content_type=image.content_type
        )
    except Exception as e:
        logger.error(f"Failed to backup legacy upload to MinIO: {e}")
    
    # 2. Model Inference
    try:
        result = ai_pipeline.generate_caption(pil_image, max_new_tokens=50)
        logger.info(f"Caption generated. (Time: {result['inference_time_ms']}ms)")
        
        if cache_key:
            try:
                cache_data = {
                    "caption": result["caption"]
                }
                await redis_conn.set(cache_key, json.dumps(cache_data), ex=3600)
            except Exception as e:
                logger.warning(f"Failed to cache caption: {e}")

        return CaptionResponse(
            caption=result["caption"],
            inference_time_ms=result["inference_time_ms"]
        )
    except Exception as e:
        logger.error(f"Captioning pipeline failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Captioning pipeline failed.")
