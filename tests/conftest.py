import pytest
from fastapi.testclient import TestClient
import io
import os
from pathlib import Path

# Fix relative imports for pytest
import sys
sys.path.append(str(Path(__file__).parent.parent))

from app.main import app
from app.ml.inference import ai_pipeline
from app.api.deps import get_current_user
from app.db.models import User
import uuid

@pytest.fixture(autouse=True)
def override_auth():
    dummy_user = User(
        id=uuid.uuid4(),
        username="testuser",
        email="test@vqa.com",
        role="user",
        is_active=True
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
    # Mock is_ready to True so API doesn't throw 503
    mocker.patch('app.api.routes.ai_pipeline.is_ready', return_value=True)
    mocker.patch('app.ml.inference.MedicalAIPipeline.is_ready', return_value=True)
    
    # Mock models to pass the API readiness check
    mocker.patch('app.api.routes.ai_pipeline.vqa_model', "mock_model")
    mocker.patch('app.api.routes.ai_pipeline.caption_model', "mock_model")
    
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
        
    mocker.patch('app.api.routes.ai_pipeline.predict', side_effect=mock_predict)
    mocker.patch('app.api.routes.ai_pipeline.generate_caption', side_effect=mock_caption)
    mocker.patch('app.ml.inference.MedicalAIPipeline.predict', side_effect=mock_predict)
    mocker.patch('app.ml.inference.MedicalAIPipeline.generate_caption', side_effect=mock_caption)
    
    return ai_pipeline
