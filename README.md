<a id="readme-top"></a>

<br />
<div align="center">
  <a href="frontend/public/favicon.svg">
    <img src="frontend/public/favicon.svg" alt="CV-VQA-MEDICAL Logo" width="80" height="80">
  </a>

  <h1 align="center">CV-VQA-MEDICAL 🏥🤖</h1>

  <p align="center">
    A dual-purpose Medical AI system for Visual Question Answering and Medical Image Captioning.
    <br />
    <a href="docs/API_INTEGRATION.md"><strong>Explore the API docs »</strong></a>
    <br />
    <br />
    <a href="docs/images/readme/home-chat.png">View Screenshot</a>
    &middot;
    <a href="docs/chapter_2_features.md">Features</a>
    &middot;
    <a href="docs/TESTING_LAYERS_ML_UI_METRICS_COVERAGE.md">Testing Guide</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#key-features">Key Features</a></li>
    <li><a href="#built-with">Built With</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#getting-started">Getting Started</a></li>
    <li><a href="#running-the-application">Running The Application</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#default-credentials">Default Credentials</a></li>
    <li><a href="#testing-and-coverage">Testing And Coverage</a></li>
    <li><a href="#documentation">Documentation</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

## About The Project

![CV-VQA-MEDICAL Home Chat](docs/images/readme/home-chat.png)

CV-VQA-MEDICAL is a FastAPI-based backend and React frontend for a dual-purpose Medical Artificial Intelligence system. It provides both Visual Question Answering (VQA) and Medical Image Captioning for medical images.

* **VQA**: Combines a Vision Transformer (ViT) and PubMedBERT to answer complex medical questions about an image.
* **Image Captioning**: Combines a Vision Transformer (ViT) and GPT-2 via Cross-Attention Fusion to autonomously generate detailed radiological descriptions of an image.

> **Note**: Both pipelines share the exact same ViT backbone in RAM/VRAM to heavily optimize memory usage.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Key Features

* **Dual-Purpose Medical AI Pipeline**: Uses a shared ViT backbone for both VQA with PubMedBERT and Image Captioning with GPT-2 via Cross-Attention Fusion.
* **Conversational AI Chatbot**: ChatGPT-style interface with SSE (Server-Sent Events) streaming and an LLM orchestrator with tool-calling capabilities for uploaded medical images.
* **Robust Authentication & RBAC**: Secure JWT-based authentication with access and refresh tokens, Admin/User authorization, and Redis-backed token blacklisting on logout.
* **High-Performance Caching**: Redis-backed caching for VQA and captioning inference results using SHA-256 image/question hashing to reduce redundant GPU/CPU compute.
* **Reliable Storage**: MinIO S3-compatible object storage for image uploads and presigned URLs for frontend rendering.
* **Clean Architecture**: SOLID-aligned separation of concerns with API Routers, Services, DB access, and ML model code separated by responsibility.
* **Production Ready**: Includes rate limiting, Prometheus metrics at `/metrics`, Docker Compose deployment, PostgreSQL, Redis, MinIO, and Pytest coverage.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Built With

* **Backend**: Python, FastAPI, SQLAlchemy, Alembic, Pydantic, Uvicorn
* **Machine Learning**: PyTorch, Transformers (HuggingFace), Pillow
* **Infrastructure**: PostgreSQL, Redis, MinIO, Docker Compose
* **Frontend**: React, Vite, TypeScript, Tailwind CSS
* **Testing**: Pytest, pytest-asyncio, pytest-mock, Coverage, Playwright

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Project Structure

```text
.
├── app/
│   ├── api/             # API controllers / routing
│   ├── core/            # Configuration, security, logging, Redis setup
│   ├── db/              # SQLAlchemy models and database session
│   ├── llm/             # LLM wrappers, prompts, and orchestration
│   ├── middleware/      # Rate limiting, CORS, request middleware
│   ├── ml/              # ViT, PubMedBERT, captioning, and inference pipeline
│   ├── schemas/         # Pydantic validation schemas
│   ├── services/        # Business logic for auth, chat, prediction, users, MinIO
│   └── utils/           # Image processing and shared utilities
├── alembic/             # Database migrations
├── deployment/
│   ├── backend/         # Backend Dockerfile and entrypoint
│   ├── frontend/        # Frontend Dockerfile and Nginx config
│   └── docker-compose.yml
├── docs/                # API integration, architecture, testing, and feature docs
├── frontend/            # React/Vite frontend application
├── models/              # Local PyTorch weights (.pth)
├── tests/               # Unit and integration tests
└── README.md
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

### Prerequisites

* Python 3.10+ for the backend runtime used by Docker, or Python 3.12+ for local development if preferred.
* Node.js 20+ and npm for the React frontend.
* Docker and Docker Compose.
* GPU with CUDA is recommended for model inference, but CPU fallback is supported through `DEVICE="cpu"`.
* https://drive.google.com/drive/folders/1nAnHR0L3cFgoIREKYhLlkndpVoup99iX?usp=drive_link (models link).

### Clone The Repository

```sh
git clone https://github.com/NguyenAn3001/CV-VQA-MEDICAL.git
cd CV-VQA-MEDICAL
```

### Configure Environment Variables

Copy the example environment file:

```sh
cp .env.example .env
```

Important defaults from `.env.example`:

```env
DEVICE="cpu"
MODEL_PATH="models/best_vit_pubmedbert_slake.pth"
CAPTIONING_MODEL_PATH="models/best_captioning_roco_v6_fulldata.pth"
DATABASE_URL="postgresql+asyncpg://vqa_user:vqa_pass@localhost:5432/vqa_db"
REDIS_URL="redis://localhost:6379/0"
MINIO_ENDPOINT="localhost:9000"
```

### Download Model Weights

Place the required model weights in the `models/` directory:

* **VQA Weights**: `models/best_vit_pubmedbert_slake.pth`
* **Captioning Weights**: `models/best_captioning_roco_v6_fulldata.pth`

### Backend Local Installation

Create and activate a virtual environment:

```sh
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```sh
pip install -r requirements.txt
pip install "numpy<2"
```

On Windows:

```cmd
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install "numpy<2"
```

### Frontend Local Installation

```sh
cd frontend
npm install
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Running The Application

### Start With Docker Compose

The Docker Compose file lives under `deployment/`.

```sh
docker compose -f deployment/docker-compose.yml up -d --build
```

Stop all services:

```sh
docker compose -f deployment/docker-compose.yml down
```

View logs:

```sh
docker compose -f deployment/docker-compose.yml logs -f
```

Expected service URLs:

* **Frontend**: `http://localhost`
* **Backend API**: `http://localhost:8080`
* **Backend Swagger UI**: `http://localhost:8080/docs`
* **MinIO API**: `http://localhost:9000`
* **MinIO Console**: `http://localhost:9001`
* **PostgreSQL**: `localhost:5432`
* **Redis**: `localhost:6379`

### Start Infrastructure Only

If you want to run the backend locally while keeping PostgreSQL, Redis, and MinIO in Docker, start the compose stack and run your local app against the exposed ports from `.env`.

```sh
docker compose -f deployment/docker-compose.yml up -d postgres redis minio
```

### Start The FastAPI Backend Locally

```sh
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

On Windows:

```cmd
venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Local API documentation is available at `http://localhost:8000/docs`.

### Start The React Frontend Locally

```sh
cd frontend
npm run dev
```

Build the frontend for production:

```sh
cd frontend
npm run build
```

Preview the production build:

```sh
cd frontend
npm run preview
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

1. Start the backend and frontend using Docker Compose or local commands.
2. Open the frontend at `http://localhost` for Docker or the Vite URL printed by `npm run dev` for local development.
3. Sign in with the default admin account for local development.
4. Upload a medical image.
5. Ask questions about the image through the chat interface, or use captioning features to generate radiological descriptions.
6. Use `http://localhost:8080/docs` or `http://localhost:8000/docs` to inspect and test backend endpoints.

Additional API integration details are available in [React/Web API Integration Guide](docs/API_INTEGRATION.md).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Default Credentials

Upon first database initialization, a default admin account is automatically created:

* **Username**: `admin`
* **Email**: `admin@vqa.com`
* **Password**: `Admin@123`

Change these credentials before using the system outside local development.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Testing And Coverage

Run the backend test suite:

```sh
source venv/bin/activate
pytest tests/ -v
```

Run backend tests with coverage:

```sh
source venv/bin/activate
coverage run -m pytest
coverage report -m
```

Run frontend checks and end-to-end tests:

```sh
cd frontend
npm run lint
npm run test:e2e
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Documentation

* [React/Web API Integration Guide](docs/API_INTEGRATION.md)
* [User Requirements](docs/chapter_1_user_requirements.md)
* [Features](docs/chapter_2_features.md)
* [Technical Solutions](docs/chapter_3_tech_solutions.md)
* [AI Logic](docs/chapter_4_logic_ai.md)
* [Implementation](docs/chapter_5_implement.md)
* [Testing, ML, UI, Metrics, Coverage](docs/TESTING_LAYERS_ML_UI_METRICS_COVERAGE.md)

Architecture and UI assets:

* [Home Chat Screenshot](docs/images/readme/home-chat.png)
* [Docker Container Topology](docs/images/chapter_3/Hình%203.3_%20Docker%20Container%20Topology.png)
* [Real-Time Chat Sequence Diagram](docs/images/chapter_3/Hình%203.1_%20Sequence%20Diagram%20-%20Luồng%20Chat%20thời%20gian%20thực.png)
* [Entity Relationship Diagram](docs/images/chapter_3/Hình%203.2_%20ERD%20-%20Sơ%20đồ%20thực%20thể%20quan%20hệ.png)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

This project is proprietary and confidential. Do not distribute without permission.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
