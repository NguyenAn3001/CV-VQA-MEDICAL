import hashlib
import io
import json
from unittest.mock import AsyncMock

import pytest
from fastapi import UploadFile

from app.core.config import settings
from app.ml.inference import ai_pipeline
from app.services.minio_service import minio_service
from app.services.prediction_service import prediction_service


def _build_upload_file(content: bytes, filename: str = "test.jpg", content_type: str = "image/jpeg") -> UploadFile:
    return UploadFile(filename=filename, file=io.BytesIO(content), headers={"content-type": content_type})


@pytest.mark.asyncio
async def test_predict_rejects_empty_question(test_image_bytes):
    upload_file = _build_upload_file(test_image_bytes)
    redis_conn = AsyncMock()

    with pytest.raises(Exception) as exc_info:
        await prediction_service.predict(upload_file, "   ", "user-1", redis_conn)

    assert getattr(exc_info.value, "status_code", None) == 400
    assert "Question cannot be empty" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_predict_returns_cached_result_without_model_call(mocker, test_image_bytes):
    question = "What modality is used to take this image?"
    upload_file = _build_upload_file(test_image_bytes)
    redis_conn = AsyncMock()
    redis_conn.get = AsyncMock(return_value=json.dumps({"answer": "MRI", "confidence": 0.91}))
    redis_conn.set = AsyncMock()

    predict_mock = mocker.patch.object(ai_pipeline, "predict")
    upload_mock = mocker.patch.object(minio_service, "upload_image")

    result = await prediction_service.predict(upload_file, question, "user-1", redis_conn)

    expected_key = (
        "inference:predict:"
        f"{hashlib.sha256(test_image_bytes).hexdigest()}:"
        f"{hashlib.sha256(question.encode('utf-8')).hexdigest()}"
    )

    assert result.answer == "MRI"
    assert result.confidence == 0.91
    assert result.inference_time_ms == 0.0
    redis_conn.get.assert_awaited_once_with(expected_key)
    redis_conn.set.assert_not_awaited()
    predict_mock.assert_not_called()
    upload_mock.assert_not_called()


@pytest.mark.asyncio
async def test_predict_returns_503_when_pipeline_not_ready(mocker, test_image_bytes):
    upload_file = _build_upload_file(test_image_bytes)
    redis_conn = AsyncMock()
    ready_mock = mocker.patch.object(ai_pipeline, "is_ready", return_value=False)

    with pytest.raises(Exception) as exc_info:
        await prediction_service.predict(upload_file, "What modality is used to take this image?", "user-1", redis_conn)

    assert getattr(exc_info.value, "status_code", None) == 503
    assert "VQA Model is still loading" in str(exc_info.value.detail)
    ready_mock.assert_called_once()


@pytest.mark.asyncio
async def test_generate_caption_rejects_overly_large_image(mocker):
    large_bytes = b"x" * ((settings.MAX_IMAGE_SIZE_MB * 1024 * 1024) + 1)
    upload_file = _build_upload_file(large_bytes, filename="large.jpg")
    redis_conn = AsyncMock()
    mocker.patch.object(ai_pipeline, "is_ready", return_value=True)

    with pytest.raises(Exception) as exc_info:
        await prediction_service.generate_caption(upload_file, "user-1", redis_conn)

    assert getattr(exc_info.value, "status_code", None) == 400
    assert "Image size exceeds limit" in str(exc_info.value.detail)