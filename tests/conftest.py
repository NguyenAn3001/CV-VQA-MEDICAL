import pytest
from fastapi.testclient import TestClient
import io
import os
import datetime
from pathlib import Path
import sys
import types

# Mock heavy ML modules before importing app to avoid dependency hell
from unittest.mock import MagicMock

class MockModule(types.ModuleType):
    def __getattr__(self, name):
        return MagicMock()

# Mock torch
sys.modules["torch"] = MockModule("torch")
sys.modules["torch.nn"] = MagicMock()
sys.modules["torch.nn.functional"] = MagicMock()

# Mock transformers
sys.modules["transformers"] = MockModule("transformers")

# Mock app.ml.inference completely so it doesn't try to import torch submodules
ml_inference_mock = MagicMock()
ml_inference_mock.ai_pipeline = MagicMock()
ml_inference_mock.ai_pipeline.is_ready = MagicMock(return_value=True)
ml_inference_mock.ai_pipeline.vqa_model = MagicMock()
ml_inference_mock.ai_pipeline.caption_model = MagicMock()
ml_inference_mock.ai_pipeline.predict = MagicMock(return_value={
    "answer": "MRI", "confidence": 0.99, "inference_time_ms": 42.0
})
ml_inference_mock.ai_pipeline.generate_caption = MagicMock(return_value={
    "caption": "test caption", "inference_time_ms": 150.0
})
ml_inference_mock.MedicalAIPipeline = MagicMock()
sys.modules["app.ml.inference"] = ml_inference_mock

# Fix relative imports for pytest
sys.path.append(str(Path(__file__).parent.parent))

from app.main import app
from app.api.deps import get_current_user
from app.db.models import User
import uuid

@pytest.fixture(autouse=True)
def override_auth():
    now = datetime.datetime.utcnow()
    dummy_user = User(
        id=uuid.uuid4(),
        username="testuser",
        email="test@vqa.com",
        role="user",
        is_active=True,
        must_change_password=False,
        full_name="Test User",
        avatar_url=None,
        bio="A test user",
        specialty="Radiology",
        created_at=now,
        updated_at=now
    )
    app.dependency_overrides[get_current_user] = lambda: dummy_user
    yield
    app.dependency_overrides.pop(get_current_user, None)

@pytest.fixture
def test_client():
    """Fixture for FastAPI TestClient."""
    return TestClient(app)

@pytest.fixture
def test_image_path():
    """Path to the real test image."""
    return Path(__file__).parent / "fixtures" / "test_image.jpg"

@pytest.fixture
def test_image_bytes(test_image_path):
    """Provides the test image as bytes."""
    with open(test_image_path, "rb") as f:
        return f.read()

@pytest.fixture
def mock_vqa_pipeline(mocker):
    """Fixture to mock the heavy ML pipeline."""
    from app.services.prediction_service import ai_pipeline as pred_pipeline
    
    pred_pipeline.is_ready.return_value = True
    pred_pipeline.vqa_model = MagicMock()
    pred_pipeline.caption_model = MagicMock()
    
    def mock_predict(image, question):
        q_lower = question.lower().strip()
        
        # Ground truth mapping based on provided dataset
        if "modality" in q_lower or "成像方式" in q_lower:
            answer = "MRI"
        elif "part of the body" in q_lower:
             answer = "Abdomen"
        elif "属于身体哪个部分" in q_lower:
             answer = "腹部"
        elif "mr weighting" in q_lower or "加权方式" in q_lower:
             answer = "T2"
        elif "how many kidneys" in q_lower or "几个肾脏" in q_lower:
             answer = "2"
        elif "kidney normal" in q_lower or "contain liver" in q_lower or "contain kidney" in q_lower:
             answer = "Yes"
        elif "包含肝脏吗" in q_lower or "包含肾脏吗" in q_lower:
             answer = "包含"
        elif "spleen" in q_lower:
             answer = "No"
        elif "脾脏吗" in q_lower:
             answer = "不包含"
        else:
             answer = "Unknown"
            
        return {
            "answer": answer,
            "confidence": 0.9987,
            "inference_time_ms": 42.5
        }
        
    def mock_caption(image, max_new_tokens=50):
        return {
            "caption": "This is a generated medical caption.",
            "inference_time_ms": 150.5
        }
        
    pred_pipeline.predict = mock_predict
    pred_pipeline.generate_caption = mock_caption
    
    return pred_pipeline
