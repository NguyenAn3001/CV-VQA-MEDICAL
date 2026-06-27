# Agent Instructions

This repository is a FastAPI backend for a Visual Question Answering (VQA) system combining ViT (Vision Transformer) and PubMedBERT. The system achieved ~76% Test Acc and is being deployed as a modular Backend API.

## Project Architecture

The project follows a modular structure separating ML logic from API routing. Agents must adhere to this structure when adding or modifying features.

- `app/main.py`: FastAPI application entrypoint. Uses `lifespan` events to load models into RAM/VRAM exactly once at startup.
- `app/api/`: API routes. Specifically `routes.py` for endpoints like `POST /predict` (accepts image + question).
- `app/core/`: Configuration (e.g., CUDA/CPU device selection, model paths, HuggingFace model names in `config.py`).
- `app/schemas/`: Pydantic models for request/response validation (e.g., `models.py`).
- `app/ml/`: Machine learning core.
  - `architecture.py`: Contains the `ViT_PubMedBERT_VQA` PyTorch class.
  - `inference.py`: Contains the `VQAPipeline` class. Handles loading the model, tokenizer, image processor, and orchestrates the inference pipeline (preprocess, forward pass, postprocess). Extracts `idx2answer` from model weights.
- `app/utils/`: Utilities like `image_utils.py` (resize, RGB conversion).
- `models/`: Stores model weights. The primary weight file is `models/ViT/best_vit_pubmedbert_slake.pth` (note: this file contains `answer2idx`).

## Inference Pipeline Flow

1. **Startup**: `app/main.py` lifespan loads `VQAPipeline` (from `app/ml/inference.py`), initializing ViT, PubMedBERT, the `ViT_PubMedBERT_VQA` architecture, loading the `.pth` weights, and extracting `idx2answer`.
2. **Request**: User sends an image and question string to the API (`/predict`).
3. **Processing**: Request is routed to `VQAPipeline.predict(image, question)`.
4. **Preprocessing**: Image is processed via `vit_extractor`, question via `bert_tokenizer`.
5. **Inference**: Forward pass on the configured device (CUDA/CPU). Output is argmax of logits.
6. **Postprocessing**: Map predicted index to text answer using the loaded `idx2answer` dictionary.
7. **Response**: Return JSON result.

## Operational Guidelines

- **Model Loading**: DO NOT load models on every request. They must be loaded only once during FastAPI startup (`lifespan`).
- **Separation of Concerns**: Keep AI/ML code strictly in `app/ml/` and API routing strictly in `app/api/`. Do not mix FastAPI route definitions with PyTorch model definitions.
