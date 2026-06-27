from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional
from app.schemas.pydantic_models import PredictResponse, ErrorResponse
from app.utils.image_utils import validate_and_load_image
from app.ml.inference import vqa_pipeline
from app.core.logger import logger
from app.core.config import settings

router = APIRouter()

@router.post(
    "/predict", 
    response_model=PredictResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def predict(
    image: UploadFile = File(..., description="Ảnh y tế (JPEG/PNG)"),
    question: str = Form(..., description="Câu hỏi tiếng Anh về bức ảnh")
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
         
    if not vqa_pipeline.is_ready():
        raise HTTPException(
             status_code=503, 
             detail="Model is still loading. Please try again later."
         )

    # 2. Parse Image safely
    pil_image = await validate_and_load_image(image)
    
    # 3. Model Inference
    try:
        result = vqa_pipeline.predict(pil_image, question)
        logger.info(f"Prediction successful. Answer: '{result['answer']}' (Time: {result['inference_time_ms']}ms)")
        
        return PredictResponse(
            answer=result["answer"],
            confidence=result["confidence"],
            inference_time_ms=result["inference_time_ms"]
        )
    except Exception as e:
        logger.error(f"Prediction pipeline failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Inference pipeline failed.")
