from pydantic import BaseModel, Field, validator
from typing import Optional

class PredictResponse(BaseModel):
    answer: str = Field(..., description="Dự đoán văn bản trả lời cho câu hỏi")
    confidence: Optional[float] = Field(None, description="Độ tự tin của mô hình (tùy chọn)")
    inference_time_ms: float = Field(..., description="Thời gian Inference tính bằng ms")

class ErrorResponse(BaseModel):
    error: str = Field(..., description="Mô tả lỗi")
    details: Optional[str] = Field(None, description="Chi tiết lỗi hệ thống")
