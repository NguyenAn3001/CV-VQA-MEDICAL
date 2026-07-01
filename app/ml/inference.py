import torch
from transformers import AutoTokenizer, ViTModel, AutoImageProcessor, AutoModel, GPT2Tokenizer, GPT2LMHeadModel
import time
from PIL import Image
import os

from app.core.config import settings
from app.core.logger import logger
from app.ml.architecture import ViT_PubMedBERT_VQA, ViT_GPT2_Captioning

class MedicalAIPipeline:
    _instance = None

    def __new__(cls):
        """Singleton pattern: Ensure only one instance of the pipeline exists."""
        if cls._instance is None:
            cls._instance = super(MedicalAIPipeline, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.device = torch.device(settings.DEVICE if torch.cuda.is_available() else "cpu")
        logger.info(f"Initializing MedicalAIPipeline on device: {self.device}")
        
        # Shared components
        self.vit_extractor = None
        self.shared_vit_model = None
        
        # VQA components
        self.bert_tokenizer = None
        self.vqa_model = None
        self.idx2answer = {}
        
        # Captioning components
        self.gpt2_tokenizer = None
        self.caption_model = None
        
        self._initialized = True
        self._is_loaded = False

    def load_models(self):
        """Loads all heavy models into RAM/VRAM. Must be called once during startup."""
        if self._is_loaded:
            logger.info("Models already loaded. Skipping.")
            return

        try:
            logger.info("Loading shared tokenizers and extractors...")
            self.vit_extractor = AutoImageProcessor.from_pretrained(settings.VIT_MODEL_NAME)
            
            logger.info("Loading Base Shared ViT model...")
            self.shared_vit_model = ViTModel.from_pretrained(settings.VIT_MODEL_NAME)
            
            # ---------------- VQA Loading ----------------
            if os.path.exists(settings.MODEL_PATH):
                logger.info("Loading PubMedBERT for VQA...")
                self.bert_tokenizer = AutoTokenizer.from_pretrained(settings.BERT_MODEL_NAME)
                bert = AutoModel.from_pretrained(settings.BERT_MODEL_NAME)
                
                logger.info(f"Loading VQA Weights from {settings.MODEL_PATH}...")
                vqa_checkpoint = torch.load(settings.MODEL_PATH, map_location=self.device)
                
                self.idx2answer = vqa_checkpoint.get("idx2answer", {})
                num_answers = vqa_checkpoint.get("num_answers", len(self.idx2answer))
                
                self.vqa_model = ViT_PubMedBERT_VQA(self.shared_vit_model, bert, num_answers)
                self.vqa_model.load_state_dict(vqa_checkpoint["model_state"])
                self.vqa_model.to(self.device)
                self.vqa_model.eval()
                logger.info("VQA Model loaded.")
            else:
                logger.warning(f"VQA Model weights not found at {settings.MODEL_PATH}. VQA disabled.")
                
            # ---------------- Captioning Loading ----------------
            if os.path.exists(settings.CAPTIONING_MODEL_PATH):
                logger.info("Loading GPT-2 for Captioning...")
                self.gpt2_tokenizer = GPT2Tokenizer.from_pretrained(settings.GPT2_MODEL_NAME)
                self.gpt2_tokenizer.pad_token = self.gpt2_tokenizer.eos_token
                gpt2_model = GPT2LMHeadModel.from_pretrained(settings.GPT2_MODEL_NAME)
                
                logger.info(f"Loading Captioning Weights from {settings.CAPTIONING_MODEL_PATH}...")
                cap_checkpoint = torch.load(settings.CAPTIONING_MODEL_PATH, map_location=self.device)
                
                # Support both standard checkpoints and state_dict only checkpoints
                state_dict = cap_checkpoint.get("model_state_dict", cap_checkpoint)
                
                self.caption_model = ViT_GPT2_Captioning(self.shared_vit_model, gpt2_model, self.gpt2_tokenizer.vocab_size)
                self.caption_model.load_state_dict(state_dict)
                self.caption_model.to(self.device)
                self.caption_model.eval()
                logger.info("Captioning Model loaded.")
            else:
                logger.warning(f"Captioning weights not found at {settings.CAPTIONING_MODEL_PATH}. Captioning disabled.")
                
            self._is_loaded = True
            logger.info("Pipeline initialization completed!")
            
        except Exception as e:
            logger.error(f"Failed to load models: {str(e)}")
            raise e

    def is_ready(self) -> bool:
        return self._is_loaded
        
    def predict(self, image: Image.Image, question: str) -> dict:
        """Executes the full VQA inference pipeline."""
        if not self._is_loaded or self.vqa_model is None:
            raise RuntimeError("VQA Models are not loaded. Call load_models() first.")
            
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
            with torch.inference_mode():
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
                "confidence": round(confidence_val, 4),
                "inference_time_ms": round(inference_time_ms, 2)
            }
            
        except Exception as e:
            logger.error(f"VQA Inference error: {str(e)}")
            raise e

    def generate_caption(self, image: Image.Image, max_new_tokens: int = 50) -> dict:
        """Executes the Image Captioning autoregressive inference pipeline."""
        if not self._is_loaded or self.caption_model is None:
            raise RuntimeError("Captioning Models are not loaded. Call load_models() first.")
            
        start_time = time.time()
        
        try:
            # Preprocess Image
            pixel_values = self.vit_extractor(
                images=image.convert("RGB"), 
                return_tensors="pt"
            ).pixel_values.to(self.device)
            
            # Setup initial token (<bos>)
            input_ids = torch.tensor([[self.gpt2_tokenizer.bos_token_id]]).to(self.device)
            
            with torch.inference_mode():
                # Extract image features once
                img_feat = self.caption_model.vit(pixel_values).last_hidden_state[:, 0, :]
                img_proj = self.caption_model.projection(img_feat).unsqueeze(1)
                
                # Autoregressive generation
                for _ in range(max_new_tokens):
                    token_embeds = self.caption_model.gpt2.transformer.wte(input_ids)
                    inputs_embeds = torch.cat([img_proj, token_embeds], dim=1)
                    
                    outputs = self.caption_model.gpt2(inputs_embeds=inputs_embeds)
                    next_token = outputs.logits[:, -1, :].argmax(dim=-1, keepdim=True)
                    input_ids = torch.cat([input_ids, next_token], dim=1)
                    
                    if next_token.item() == self.gpt2_tokenizer.eos_token_id:
                        break
                        
            # Decode output
            caption = self.gpt2_tokenizer.decode(input_ids[0], skip_special_tokens=True)
            inference_time_ms = (time.time() - start_time) * 1000
            
            return {
                "caption": caption.strip(),
                "inference_time_ms": round(inference_time_ms, 2)
            }
            
        except Exception as e:
            logger.error(f"Captioning error: {str(e)}")
            raise e

# Create a global instance replacing vqa_pipeline
ai_pipeline = MedicalAIPipeline()
vqa_pipeline = ai_pipeline  # Keep alias for backwards compatibility with existing code
