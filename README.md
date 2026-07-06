# CV-VQA-MEDICAL 🏥🤖

This project is a FastAPI-based backend for a dual-purpose Medical Artificial Intelligence system. It provides both Visual Question Answering (VQA) and Medical Image Captioning.

* **VQA**: Combines a Vision Transformer (ViT) and PubMedBERT to answer complex medical questions about an image.
* **Image Captioning**: Combines a Vision Transformer (ViT) and GPT-2 via Cross-Attention Fusion to autonomously generate detailed radiological descriptions of an image.

> **Note**: Both pipelines share the exact same ViT backbone in RAM/VRAM to heavily optimize memory usage.

---

## ✨ Key Features

* **Dual-Purpose Medical AI Pipeline**: Uses a shared ViT backbone for both VQA (with PubMedBERT) and Image Captioning (with GPT-2 via Cross-Attention Fusion).
* **Conversational AI Chatbot**: ChatGPT-style interface with SSE (Server-Sent Events) streaming. Uses an LLM Orchestrator with tool-calling capabilities to seamlessly answer questions about uploaded medical images.
* **Robust Authentication & RBAC**: Secure JWT-based authentication (Access & Refresh tokens). Includes comprehensive role-based access control (Admin/User) and token blacklisting via Redis upon logout.
* **High-Performance Caching**: Redis-backed caching for VQA and captioning inference results (using SHA-256 image/question hashing) to minimize redundant GPU/CPU compute.
* **Reliable Storage**: MinIO (S3-compatible) integration for secure image uploads and presigned URL generation for frontend rendering.
* **Clean Architecture**: Follows SOLID principles with a strict separation of concerns (API Routers -> Services -> DB/ML Models).
* **Production Ready**: Includes Rate Limiting, Prometheus Metrics (`/metrics`), Docker Compose for infrastructure, and comprehensive Pytest coverage.

## 🛠️ Tech Stack

* **Backend**: Python 3.12, FastAPI, SQLAlchemy, Alembic, Pydantic, Uvicorn
* **Machine Learning**: PyTorch, Transformers (HuggingFace), Pillow
* **Infrastructure**: PostgreSQL, Redis, MinIO, Docker Compose
* **Frontend**: Streamlit (isolated virtual environment)
* **Testing**: Pytest, pytest-asyncio, pytest-mock, Coverage

---

## 📂 Project Structure

```text
.
├── app/
│   ├── api/          # API Controllers / Routing (auth, chat, predictions, users)
│   ├── core/         # Configuration, Security, Logger, Redis connection
│   ├── db/           # SQLAlchemy Models, Database Session, Alembic Migrations
│   ├── llm/          # OpenAI-Compatible LLM Wrappers & Prompts
│   ├── middleware/   # Rate Limiting, CORS
│   ├── ml/           # ViT + PubMedBERT Architecture & Inference Pipeline
│   ├── schemas/      # Pydantic validation schemas
│   ├── services/     # Business Logic (Auth, Chat, Prediction, Users, MinIO)
│   └── utils/        # Image processing utilities
├── docs/             # API Integration documents for frontend
├── frontend/         # Streamlit UI Application
├── models/           # Local directory for downloaded PyTorch weights (.pth)
├── tests/            # Unit & Integration tests
├── docker-compose.yml# Infrastructure configuration
└── README.md
```

---

## 🚀 Setup and Installation

### 1. Prerequisites
* Python 3.12+
* Docker & Docker Compose
* GPU (CUDA) recommended but not strictly required (supports CPU fallback).

### 2. Infrastructure Setup
Start the PostgreSQL database, Redis cache, and MinIO object storage:
```bash
sudo docker compose up -d
```

### 3. Clone and Backend Installation
Clone the repository:
```bash
git clone https://github.com/NguyenAn3001/CV-VQA-MEDICAL.git
cd CV-VQA-MEDICAL
```

Create and activate a virtual environment:
* **On Linux/macOS**:
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```
* **On Windows**:
  ```cmd
  python -m venv venv
  venv\Scripts\activate
  ```

Install dependencies:
```bash
pip install -r requirements.txt
pip install "numpy<2" # Required for ONNX compatibility
```

### 4. Configure Environment Variables
Copy the example environment file and rename it to `.env`:
```bash
cp .env.example .env
```
*(Optional)* Edit the `.env` file to customize settings like the device (CPU/CUDA) or model paths.

### 5. Download Model Weights
Place the required model weights into the `models/` directory:
* **VQA Weights**: `models/best_vit_pubmedbert_slake.pth` (VQA pipeline weights containing `answer2idx`)
* **Captioning Weights**: `models/best_captioning_roco_v6_fulldata.pth` (Captioning pipeline weights)

---

## 🏃 Running the Application

### Start the FastAPI Backend
To start the FastAPI server, use uvicorn:
* **On Linux/macOS**:
  ```bash
  source venv/bin/activate
  uvicorn app.main:app --host 0.0.0.0 --port 8000
  ```
* **On Windows**:
  ```cmd
  venv\Scripts\activate
  uvicorn app.main:app --host 0.0.0.0 --port 8000
  ```
*The API documentation (Swagger UI) will be available at: http://localhost:8000/docs*

### Start the Streamlit Frontend
To prevent dependency conflicts with FastAPI, the Streamlit frontend uses its own isolated environment:
```bash
cd frontend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```
*The Streamlit App will be available at: http://localhost:8501*

---

## 🔐 Default Credentials
Upon the first database initialization, a default admin account is automatically created:
* **Username**: `admin`
* **Email**: `admin@vqa.com`
* **Password**: `Admin@123`

---

## 🧪 Testing and Coverage

This project uses pytest for unit and integration testing. Tests are designed to verify the VQA and captioning pipeline against specific medical image questions.

### Run the Test Suite
```bash
source venv/bin/activate
pytest tests/ -v
```

### Run Tests with Coverage Report
```bash
source venv/bin/activate
coverage run -m pytest
coverage report -m
```

---

## 📝 API Integration for React Frontend
For detailed instructions on integrating a custom frontend (e.g., Reactjs) with our JWT Authentication, REST APIs, and Server-Sent Events (SSE) Chat Streaming, please refer to the integration guide:
👉 **[React/Web API Integration Guide](docs/API_INTEGRATION.md)**

---

## 📝 License
This project is proprietary and confidential. Do not distribute without permission.
