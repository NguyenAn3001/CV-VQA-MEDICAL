import pytest
from PIL import Image
import io

from app.ml.inference import ai_pipeline

def test_ai_pipeline_singleton(mocker):
    """Test that MedicalAIPipeline is a singleton."""
    from app.ml.inference import MedicalAIPipeline
    # Reset singleton state if tests are run in random order
    if hasattr(MedicalAIPipeline, '_instance'):
        MedicalAIPipeline._instance = None
    
    pipeline1 = MedicalAIPipeline()
    pipeline2 = MedicalAIPipeline()
    assert pipeline1 is pipeline2

def test_mocked_inference_english(mock_vqa_pipeline, test_image_path):
    """Test the mocked inference logic for English questions."""
    img = Image.open(test_image_path)
    
    # Test Modality
    res = mock_vqa_pipeline.predict(img, "What modality is used to take this image?")
    assert res["answer"] == "MRI"
    
    # Test Body Part
    res = mock_vqa_pipeline.predict(img, "Which part of the body does this image belong to?")
    assert res["answer"] == "Abdomen"
    
    # Test Count
    res = mock_vqa_pipeline.predict(img, "How many kidneys in this image?")
    assert res["answer"] == "2"
    
    # Test Yes/No
    res = mock_vqa_pipeline.predict(img, "Does the picture contain spleen?")
    assert res["answer"] == "No"

def test_mocked_inference_chinese(mock_vqa_pipeline, test_image_path):
    """Test the mocked inference logic for Chinese questions."""
    img = Image.open(test_image_path)
    
    # Test Modality
    res = mock_vqa_pipeline.predict(img, "这张图片的成像方式是什么?")
    assert res["answer"] == "MRI"
    
    # Test Body Part
    res = mock_vqa_pipeline.predict(img, "图像里包含的区域属于身体哪个部分?")
    assert res["answer"] == "腹部"
    
    # Test Count
    res = mock_vqa_pipeline.predict(img, "图片里存在几个肾脏?")
    assert res["answer"] == "2"
    
    # Test Yes/No
    res = mock_vqa_pipeline.predict(img, "图片中包含脾脏吗?")
    assert res["answer"] == "不包含"

def test_mocked_captioning(mock_vqa_pipeline, test_image_path):
    """Test the mocked image captioning logic."""
    img = Image.open(test_image_path)
    res = mock_vqa_pipeline.generate_caption(img)
    
    assert "caption" in res
    assert res["caption"] == "This is a generated medical caption."
    assert "inference_time_ms" in res
