# VQA Medical Imaging System

This project is a FastAPI-based backend for a Visual Question Answering (VQA) system. It combines a Vision Transformer (ViT) and PubMedBERT to answer questions about medical images.

## Architecture

The project is structured modularly, separating machine learning logic from the API routing:

- `app/main.py`: The FastAPI application entry point. It handles loading models into RAM/VRAM exactly once at startup via lifespan events.
- `app/api/`: Contains API routes (e.g., `POST /predict`).
- `app/core/`: Application configuration, including device selection and model paths.
- `app/schemas/`: Pydantic models for request and response validation.
- `app/ml/`: The core machine learning components, including the architecture definition and inference pipeline.
- `models/`: Directory for storing model weights (ignored by git, except for `.gitkeep`).

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python3 -m venv venv
    ```
    
    *   **On Linux/macOS:**
        ```bash
        source venv/bin/activate
        ```
    *   **On Windows:**
        ```cmd
        venv\Scripts\activate
        ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    pip install "numpy<2" # Required for ONNX compatibility
    ```

4.  **Configure Environment Variables:**
    Copy the example environment file and rename it to `.env`:
    ```bash
    cp .env.example .env
    ```
    *(Optional)* Edit the `.env` file to customize settings like the device (CPU/CUDA) or model paths.

5.  **Download Model Weights:**
    Place the required model weights (e.g., `best_vit_pubmedbert_slake.pth`) into the `models/` directory.

## Running the Application

To start the FastAPI server, use `uvicorn`:

*   **On Linux/macOS:**
    ```bash
    source venv/bin/activate
    uvicorn app.main:app --host 0.0.0.0 --port 8000
    ```
*   **On Windows:**
    ```cmd
    venv\Scripts\activate
    uvicorn app.main:app --host 0.0.0.0 --port 8000
    ```

The API documentation (Swagger UI) will be available at `http://localhost:8000/docs`.

## Endpoints

-   `GET /health`: Health check endpoint.
-   `POST /api/v1/predict`: Accepts an image and a question, returns the predicted answer.
-   `GET /metrics`: Prometheus metrics endpoint.