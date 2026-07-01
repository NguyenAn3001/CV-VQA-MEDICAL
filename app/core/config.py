from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "VQA ViT-PubMedBERT API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Model Configuration
    MODEL_PATH: str = "models/best_vit_pubmedbert_slake.pth"
    CAPTIONING_MODEL_PATH: str = "models/best_captioning_roco_v6_fulldata.pth"
    VIT_MODEL_NAME: str = "google/vit-base-patch16-224"
    BERT_MODEL_NAME: str = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract"
    GPT2_MODEL_NAME: str = "gpt2"
    
    # Inference Settings
    DEVICE: str = "cuda" # cuda or cpu
    USE_ONNX: bool = False
    ONNX_MODEL_PATH: str = "models/vqa_model_fp16.onnx"
    
    # App Performance & Limits
    MAX_IMAGE_SIZE_MB: int = 5
    MAX_QUESTION_LENGTH: int = 128
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
