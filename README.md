# Medical VQA & Chatbot System 🏥🤖

An advanced, production-ready AI Medical Visual Question Answering (VQA) and Image Captioning system. This project combines a **Vision Transformer (ViT)** with **PubMedBERT** to analyze medical images (X-rays, CT scans, MRIs) and answer complex medical questions. It features a robust FastAPI backend, a Streamlit frontend, and a highly scalable infrastructure.

## ✨ Key Features

* **Medical AI Pipeline**: Integrates ViT and PubMedBERT for high-accuracy medical image analysis and captioning.
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
* **Testing**: Pytest, pytest-asyncio, pytest-mock

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
├── frontend/         # Streamlit UI Application
├── models/           # Local directory for downloaded PyTorch weights (.pth)
├── tests/            # Unit & Integration tests
├── docker-compose.yml# Infrastructure configuration
└── README.md
```

## 🚀 Getting Started

### 1. Prerequisites
* Python 3.12+
* Docker & Docker Compose
* GPU (CUDA) recommended but not strictly required (supports CPU fallback).

### 2. Infrastructure Setup
Start the PostgreSQL database, Redis cache, and MinIO object storage:
```bash
sudo docker compose up -d
```

### 3. Backend Setup
Create a virtual environment and install dependencies:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Run database migrations to initialize tables:
```bash
alembic upgrade head
```

Start the FastAPI server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*The API documentation (Swagger UI) will be available at: http://localhost:8000/docs*

### 4. Frontend Setup
To prevent dependency conflicts with FastAPI, the Streamlit frontend uses its own isolated environment:
```bash
cd frontend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```
*The Streamlit App will be available at: http://localhost:8501*

## 🔐 Default Credentials
Upon the first database initialization, a default admin account is automatically created:
* **Username**: `admin`
* **Email**: `admin@vqa.com`
* **Password**: `Admin@123`

## 🧪 Running Tests
The project includes a robust suite of unit and integration tests covering the ML pipeline, API endpoints, and business logic services.
```bash
source venv/bin/activate
pytest
```

## 📝 License
This project is proprietary and confidential. Do not distribute without permission.
