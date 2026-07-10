## Purpose
Define README documentation requirements specific to the CV-VQA-MEDICAL project.

## Requirements

### Requirement: README preserves CV-VQA-MEDICAL identity
The repository README MUST prominently identify the project as `CV-VQA-MEDICAL 🏥🤖` and describe it as a dual-purpose medical AI system for Visual Question Answering and Medical Image Captioning.

#### Scenario: Reader opens repository README
- **WHEN** a user opens `README.md`
- **THEN** the title and introduction clearly communicate the CV-VQA-MEDICAL project name and medical VQA/captioning purpose

### Requirement: README documents core capabilities
The README MUST include the key project capabilities: VQA with ViT + PubMedBERT, Image Captioning with ViT + GPT-2 via Cross-Attention Fusion, shared ViT backbone memory optimization, SSE chatbot, JWT/RBAC authentication, Redis caching, MinIO storage, service-layer architecture, metrics, Docker deployment, and pytest coverage.

#### Scenario: Reader reviews feature overview
- **WHEN** a user reads the README feature section
- **THEN** they can understand the main medical AI, backend, infrastructure, and production-readiness features

### Requirement: README includes complete setup and run commands
The README MUST include practical commands for prerequisites, environment setup, model weights, Docker Compose infrastructure, backend startup, frontend startup, testing, and coverage.

#### Scenario: Developer follows local setup
- **WHEN** a developer follows the README setup and running sections
- **THEN** they have commands for installing dependencies, configuring `.env`, starting services, running backend/frontend applications, and running tests

### Requirement: README documents default admin account
The README MUST include default admin credentials: username `admin`, email `admin@vqa.com`, and password `Admin@123`, with a warning to change them outside local development.

#### Scenario: Admin signs in locally
- **WHEN** a user needs to access the system after first initialization
- **THEN** the README provides the default admin username, email, and password

### Requirement: README links to documentation and visual assets
The README MUST link to relevant docs under `docs/`, including API integration guidance, and MUST reference available visual assets such as `docs/images/readme/home-chat.png` and available logo/icon assets.

#### Scenario: Reader needs more detail
- **WHEN** a user needs API integration, testing, implementation, or architecture details
- **THEN** the README provides links to repository docs and includes visual references for the UI
