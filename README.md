# CV-VQA-MEDICAL

This project is a FastAPI-based backend for a dual-purpose Medical Artificial Intelligence system. It provides both **Visual Question Answering (VQA)** and **Medical Image Captioning**.

- **VQA:** Combines a Vision Transformer (ViT) and PubMedBERT to answer complex medical questions about an image.
- **Image Captioning:** Combines a Vision Transformer (ViT) and GPT-2 via Cross-Attention Fusion to autonomously generate detailed radiological descriptions of an image.

*Note: Both pipelines share the exact same ViT backbone in RAM/VRAM to heavily optimize memory usage.*

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
    git clone https://github.com/NguyenAn3001/CV-VQA-MEDICAL.git
    cd CV-VQA-MEDICAL
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
    Place the required model weights into the `models/` directory:
    - VQA Weights: `best_vit_pubmedbert_slake.pth`
    - Captioning Weights: `best_captioning_roco_v6_fulldata.pth`

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

## Testing

This project uses `pytest` for unit and integration testing. Tests are designed to verify the VQA pipeline against specific medical image questions.

To run the test suite:

```bash
source venv/bin/activate
pytest tests/ -v
```

To run tests and generate a coverage report:

```bash
source venv/bin/activate
coverage run -m pytest
coverage report -m
```

## Endpoints

-   `GET /health`: Basic health check endpoint.
-   `GET /ready`: Readiness probe to verify all heavy ML models are fully loaded into memory.
-   `POST /api/v1/predict`: (VQA) Accepts a medical image and a question, returns the predicted text answer.
-   `POST /api/v1/caption`: (Captioning) Accepts a medical image and returns an autoregressively generated radiological description.
-   `GET /metrics`: Prometheus metrics endpoint.
