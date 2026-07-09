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
    MEDICAL_MODEL_DISPLAY_NAME: str = "ViT-PubMedBERT"
    
    # Inference Settings
    DEVICE: str = "cuda" # cuda or cpu
    USE_ONNX: bool = False
    ONNX_MODEL_PATH: str = "models/vqa_model_fp16.onnx"
    
    # App Performance & Limits
    MAX_IMAGE_SIZE_MB: int = 5
    MAX_QUESTION_LENGTH: int = 128

    # --- Infrastructure Configuration ---
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://vqa_user:vqa_pass@localhost:5432/vqa_db"

    # JWT Authentication
    JWT_SECRET_KEY: str = "super-secret-key"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Redis Caching
    REDIS_URL: str = "redis://localhost:6379/0"

    # MinIO Object Storage
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_EXTERNAL_ENDPOINT: str = "localhost:9000" # Add this for external presigned URLs
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "medical-images"
    MINIO_USE_SSL: bool = False
    MINIO_PRESIGNED_URL_EXPIRE_HOURS: int = 2

    # --- Security Configuration ---
    # Used for encrypting/decrypting API keys in the database.
    # MUST be 32 url-safe base64-encoded bytes (Fernet key).
    # You can generate one via `from cryptography.fernet import Fernet; Fernet.generate_key()`
    ENCRYPTION_KEY: str = "1AJqXqtGbJZP9TTWx3N5V6CfdBXzGDzp4VAseJaQwFc="

    # --- System Defaults ---
    DEFAULT_ADMIN_USERNAME: str = "admin"
    DEFAULT_ADMIN_EMAIL: str = "admin@vqa.com"
    DEFAULT_ADMIN_PASSWORD: str = "Admin@123"
    DEFAULT_RESET_PASSWORD: str = "ChangeMe@123"

    # --- Application Limits ---
    MAX_MESSAGES_PER_SESSION: int = 50
    MAX_CONVERSATION_HISTORY: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
