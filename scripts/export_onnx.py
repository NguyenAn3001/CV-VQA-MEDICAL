import torch
import os
from transformers import AutoTokenizer, ViTModel, AutoModel

# Mock the relative paths since script runs from root
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ml.architecture import ViT_PubMedBERT_VQA
from app.core.config import settings

def export_to_onnx():
    print(f"Loading checkpoint from {settings.MODEL_PATH}...")
    
    # 1. Load dummy components
    device = torch.device("cpu") # Exporting is usually done on CPU to avoid device mismatch issues in graph
    
    vit = ViTModel.from_pretrained(settings.VIT_MODEL_NAME)
    bert = AutoModel.from_pretrained(settings.BERT_MODEL_NAME)
    
    checkpoint = torch.load(settings.MODEL_PATH, map_location=device)
    num_answers = checkpoint.get("num_answers", 220) # fallback based on your logs
    
    model = ViT_PubMedBERT_VQA(vit, bert, num_answers)
    model.load_state_dict(checkpoint["model_state"])
    model.to(device)
    model.eval()

    # 2. Create Dummy Inputs for tracing
    print("Creating dummy inputs...")
    dummy_pixel_values = torch.randn(1, 3, 224, 224, device=device)
    dummy_input_ids = torch.randint(0, 30522, (1, 64), device=device) # 30522 is typical bert vocab size
    dummy_attention_mask = torch.ones(1, 64, device=device)
    
    # 3. Export
    output_path = settings.ONNX_MODEL_PATH
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    print(f"Exporting ONNX model to {output_path}...")
    torch.onnx.export(
        model, 
        (dummy_pixel_values, dummy_input_ids, dummy_attention_mask), 
        output_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['pixel_values', 'input_ids', 'attention_mask'],
        output_names=['logits'],
        dynamic_axes={
            'pixel_values': {0: 'batch_size'},
            'input_ids': {0: 'batch_size'},
            'attention_mask': {0: 'batch_size'},
            'logits': {0: 'batch_size'}
        }
    )
    print("✅ ONNX Export Successful!")

if __name__ == "__main__":
    if not os.path.exists(settings.MODEL_PATH):
        print(f"Error: Could not find model checkpoint at {settings.MODEL_PATH}")
        print("Please ensure the weights file is placed correctly before exporting.")
    else:
        export_to_onnx()
