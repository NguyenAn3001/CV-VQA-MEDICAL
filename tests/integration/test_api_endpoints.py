import pytest

def test_health_endpoint(test_client):
    """Test the basic health check endpoint."""
    response = test_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "version": "1.0.0"}

def test_metrics_endpoint(test_client):
    """Test the Prometheus metrics endpoint."""
    response = test_client.get("/metrics")
    assert response.status_code == 200
    assert "process_cpu_seconds_total" in response.text

def test_predict_success_english(test_client, mock_vqa_pipeline, test_image_bytes):
    """Test successful prediction with an English question."""
    response = test_client.post(
        "/api/v1/predict",
        data={"question": "What modality is used to take this image?"},
        files={"image": ("test.jpg", test_image_bytes, "image/jpeg")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["answer"] == "MRI"
    assert "confidence" in data
    assert "inference_time_ms" in data

def test_predict_success_chinese(test_client, mock_vqa_pipeline, test_image_bytes):
    """Test successful prediction with a Chinese question."""
    response = test_client.post(
        "/api/v1/predict",
        data={"question": "图像里包含的区域属于身体哪个部分?"},
        files={"image": ("test.jpg", test_image_bytes, "image/jpeg")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["answer"] == "腹部"

def test_predict_empty_question(test_client, mock_vqa_pipeline, test_image_bytes):
    """Test validation error for empty question."""
    response = test_client.post(
        "/api/v1/predict",
        data={"question": "   "},
        files={"image": ("test.jpg", test_image_bytes, "image/jpeg")}
    )
    assert response.status_code == 400
    assert "Question cannot be empty" in response.json()["detail"]

def test_predict_missing_image(test_client, mock_vqa_pipeline):
    """Test validation error for missing image."""
    response = test_client.post(
        "/api/v1/predict",
        data={"question": "What modality is used?"}
    )
    assert response.status_code == 422 # Unprocessable Entity (Pydantic Validation)

def test_caption_success(test_client, mock_vqa_pipeline, test_image_bytes):
    """Test successful image captioning generation."""
    response = test_client.post(
        "/api/v1/caption",
        files={"image": ("test.jpg", test_image_bytes, "image/jpeg")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "caption" in data
    assert data["caption"] == "This is a generated medical caption."
    assert "inference_time_ms" in data

def test_caption_missing_image(test_client, mock_vqa_pipeline):
    """Test validation error for missing image on caption endpoint."""
    response = test_client.post("/api/v1/caption")
    assert response.status_code == 422
