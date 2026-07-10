# VQA FastAPI Backend Architecture Plan

## Goal
Establish a production-ready FastAPI backend architecture for serving the VQA model (ViT + PubMedBERT) with proper MLOps practices.

## Context
This is the foundational plan for the VQA project backend, outlining the structure, MLOps upgrades, and request flow for a robust, scalable, and observable service.

## Proposal

### 1. Project Structure (Docker-based Production System)
Define a standard, modular layout:
- `app/`: Main application code (API, ML pipeline, config, schemas).
- `scripts/`: Tooling (ONNX export, load testing).
- `tests/`: Unit and integration testing.
- `deployment/`: Production configs (Dockerfile, gunicorn).
- `models/`: Storage for weights.

### 2. Core MLOps Upgrades
- **Optimization**: Support ONNX export for lower latency.
- **Serving**: Use Gunicorn with Uvicorn workers for concurrency.
- **Monitoring**: Add Prometheus metrics and health checks.
- **Reliability**: Implement strict Pydantic validation and structured logging.

### 3. Pipeline Flow
- **Startup**: Load models via FastAPI lifespan.
- **Execution**: Validate input -> preprocess -> run inference in `torch.inference_mode()` -> map output -> return response.
