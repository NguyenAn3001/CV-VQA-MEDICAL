import hashlib
import json
import logging
from fastapi import UploadFile, HTTPException
from app.schemas.pydantic_models import PredictResponse, CaptionResponse
from app.utils.image_utils import validate_and_load_image
from app.ml.inference import ai_pipeline
from app.services.minio_service import minio_service
from app.core.config import settings

logger = logging.getLogger(__name__)

class PredictionService:
    async def predict(self, image: UploadFile, question: str, current_user_id: str, redis_conn) -> PredictResponse:
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
        
        # 3. Cache check
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
            
        # Upload to MinIO
        try:
            image.file.seek(0)
            minio_service.upload_image(
                user_id=current_user_id,
                file_bytes=image.file.read(),
                content_type=image.content_type
            )
        except Exception as e:
            logger.error(f"Failed to backup legacy upload to MinIO: {e}")
        
        # 4. Model Inference
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

    async def generate_caption(self, image: UploadFile, current_user_id: str, redis_conn) -> CaptionResponse:
        if not ai_pipeline.is_ready() or ai_pipeline.caption_model is None:
            raise HTTPException(
                 status_code=503, 
                 detail="Captioning Model is still loading or unavailable. Please try again later."
             )

        # 1. Parse Image safely
        pil_image = await validate_and_load_image(image)
        
        # 2. Cache check
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
                user_id=current_user_id,
                file_bytes=image.file.read(),
                content_type=image.content_type
            )
        except Exception as e:
            logger.error(f"Failed to backup legacy upload to MinIO: {e}")
        
        # 3. Model Inference
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

prediction_service = PredictionService()
