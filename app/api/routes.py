from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional
from app.schemas.pydantic_models import PredictResponse, CaptionResponse, ErrorResponse
from app.utils.image_utils import validate_and_load_image
from app.ml.inference import ai_pipeline
from app.core.logger import logger
from app.core.config import settings

router = APIRouter()

@router.post(
    "/predict", 
    response_model=PredictResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}, 503: {"model": ErrorResponse}}
)
async def predict(
    image: UploadFile = File(..., description="Ảnh y tế (JPEG/PNG)"),
    question: str = Form(..., description="Câu hỏi tiếng Anh hoặc tiếng Trung về bức ảnh")
):
    """
    Nhận ảnh và câu hỏi, trả về dự đoán từ model VQA.
    """
    logger.info(f"Received prediction request. Question: '{question}'")
    
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
    
    # 3. Model Inference
    try:
        result = ai_pipeline.predict(pil_image, question)
        logger.info(f"Prediction successful. Answer: '{result['answer']}' (Time: {result['inference_time_ms']}ms)")
        
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
async def generate_caption(
    image: UploadFile = File(..., description="Ảnh y tế (JPEG/PNG)")
):
    """
    Nhận ảnh y tế, trả về mô tả (caption) sinh ra từ model Image Captioning.
    """
    logger.info("Received caption generation request.")
    
    if not ai_pipeline.is_ready() or ai_pipeline.caption_model is None:
        raise HTTPException(
             status_code=503, 
             detail="Captioning Model is still loading or unavailable. Please try again later."
         )

    # 1. Parse Image safely
    pil_image = await validate_and_load_image(image)
    
    # 2. Model Inference
    try:
        result = ai_pipeline.generate_caption(pil_image, max_new_tokens=50)
        logger.info(f"Caption generated. (Time: {result['inference_time_ms']}ms)")
        
        return CaptionResponse(
            caption=result["caption"],
            inference_time_ms=result["inference_time_ms"]
        )
    except Exception as e:
        logger.error(f"Captioning pipeline failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Captioning pipeline failed.")
