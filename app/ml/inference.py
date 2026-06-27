import torch
from transformers import AutoTokenizer, ViTModel, AutoImageProcessor, AutoModel
import time
from PIL import Image

from app.core.config import settings
from app.core.logger import logger
from app.ml.architecture import ViT_PubMedBERT_VQA

class VQAPipeline:
    _instance = None

    def __new__(cls):
        """Singleton pattern: Ensure only one instance of the pipeline exists."""
        if cls._instance is None:
            cls._instance = super(VQAPipeline, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.device = torch.device(settings.DEVICE if torch.cuda.is_available() else "cpu")
        logger.info(f"Initializing VQAPipeline on device: {self.device}")
        
        self.vit_extractor = None
        self.vit_model = None
        self.bert_tokenizer = None
        self.bert_model = None
        self.vqa_model = None
        self.idx2answer = {}
        
        self._initialized = True
        self._is_loaded = False

    def load_models(self):
        """Loads all heavy models into RAM/VRAM. Must be called once during startup."""
        if self._is_loaded:
            logger.info("Models already loaded. Skipping.")
            return

        try:
            logger.info("Loading tokenizers and extractors...")
            self.vit_extractor = AutoImageProcessor.from_pretrained(settings.VIT_MODEL_NAME)
            self.bert_tokenizer = AutoTokenizer.from_pretrained(settings.BERT_MODEL_NAME)
            
            logger.info("Loading Base ViT and PubMedBERT models...")
            vit = ViTModel.from_pretrained(settings.VIT_MODEL_NAME)
            bert = AutoModel.from_pretrained(settings.BERT_MODEL_NAME)
            
            logger.info(f"Loading VQA Weights from {settings.MODEL_PATH}...")
            checkpoint = torch.load(settings.MODEL_PATH, map_location=self.device)
            
            self.idx2answer = checkpoint.get("idx2answer", {})
            num_answers = checkpoint.get("num_answers", len(self.idx2answer))
            if not self.idx2answer:
                 logger.warning("idx2answer not found in checkpoint! Inference might fail to decode answers.")
            
            self.vqa_model = ViT_PubMedBERT_VQA(vit, bert, num_answers)
            self.vqa_model.load_state_dict(checkpoint["model_state"])
            self.vqa_model.to(self.device)
            self.vqa_model.eval()
            
            self._is_loaded = True
            logger.info("All models loaded successfully!")
            
        except Exception as e:
            logger.error(f"Failed to load models: {str(e)}")
            raise e

    def is_ready(self) -> bool:
        return self._is_loaded
        
    def predict(self, image: Image.Image, question: str) -> dict:
        """Executes the full inference pipeline."""
        if not self._is_loaded:
            raise RuntimeError("Models are not loaded. Call load_models() first.")
            
        start_time = time.time()
        
        try:
            # 1. Preprocess Image
            pixel_values = self.vit_extractor(
                images=image.convert("RGB"), 
                return_tensors="pt"
            ).pixel_values.to(self.device)
            
            # 2. Preprocess Text
            encoding = self.bert_tokenizer(
                question,
                max_length=64,
                padding="max_length",
                truncation=True,
                return_tensors="pt"
            )
            input_ids = encoding["input_ids"].to(self.device)
            attention_mask = encoding["attention_mask"].to(self.device)
            
            # 3. Forward Pass
            with torch.inference_mode(): # Highly optimized inference without gradients
                logits = self.vqa_model(pixel_values, input_ids, attention_mask)
                probs = torch.softmax(logits, dim=1)
                confidence, predicted_idx_tensor = torch.max(probs, dim=1)
                
                predicted_idx = predicted_idx_tensor.item()
                confidence_val = confidence.item()
                
            # 4. Postprocess Output
            answer = self.idx2answer.get(predicted_idx, "Unknown")
            
            inference_time_ms = (time.time() - start_time) * 1000
            
            return {
                "answer": answer,
                "confidence": round(confidence_val, 4), # Calculated via softmax
                "inference_time_ms": round(inference_time_ms, 2)
            }
            
        except Exception as e:
            logger.error(f"Inference error: {str(e)}")
            raise e

# Create a global instance
vqa_pipeline = VQAPipeline()
