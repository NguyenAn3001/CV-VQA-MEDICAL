# Deployment Checklist & Guide

This guide outlines the exact steps required to successfully deploy the VQA System (Backend + Frontend) via GitHub Actions to your AWS EC2 instance.

## Phase 1: AWS Setup (One-time only)

### 1. Create ECR Repositories
You need two Elastic Container Registry (ECR) repositories to store your Docker images. Go to the AWS ECR Console and create these exactly as named below (Private repositories):
- `vqa-system-api`
- `vqa-system-frontend`

### 2. Prepare the EC2 Instance
SSH into your target EC2 instance and run the following commands to prepare the required directory structure:

```bash
# 1. Create the application directory where docker-compose will run
mkdir -p /home/ubuntu/app

# 2. Create the models directory
mkdir -p /home/ubuntu/models
```

### 3. Upload Models and `docker-compose.yml` to EC2
You must manually upload your large model `.pth` files and the `docker-compose.yml` file to the server.

From your local machine, run (replacing `IP_ADDRESS` and `key.pem`):

```bash
# Upload docker-compose.yml to the app folder
scp -i path/to/key.pem docker-compose.yml ubuntu@<IP_ADDRESS>:/home/ubuntu/app/

# Upload models to the models folder
scp -i path/to/key.pem models/best_vit_pubmedbert_slake.pth ubuntu@<IP_ADDRESS>:/home/ubuntu/models/
scp -i path/to/key.pem models/best_captioning_roco_v6_fulldata.pth ubuntu@<IP_ADDRESS>:/home/ubuntu/models/
```

---

## Phase 2: GitHub Repository Secrets Configuration

Navigate to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**. 

You must add all of the following secrets exactly as listed below.

### Global Secrets
- `AWS_ACCESS_KEY_ID` : IAM user must have ECR push/pull permissions
- `AWS_SECRET_ACCESS_KEY` : AWS Secret Key
- `EC2_HOST` : Public IP address of your EC2 instance (e.g., `54.123.45.67`)
- `EC2_SSH_KEY` : The full contents of your `.pem` file, including `-----BEGIN RSA PRIVATE KEY-----`

### Application Secrets

Create the following secrets:

#### Backend Secrets:
- `DATABASE_URL` : (e.g., `postgresql+asyncpg://vqa_user:vqa_pass@postgres:5432/vqa_db`)
- `REDIS_URL` : (e.g., `redis://redis:6379/0`)
- `MINIO_ENDPOINT` : (e.g., `minio:9000`)
- `MINIO_ACCESS_KEY` : (e.g., `minioadmin`)
- `MINIO_SECRET_KEY` : (e.g., `minioadmin`)
- `LLM_API_KEY` : (Your OpenAI or compatible LLM API Key)
- `JWT_SECRET_KEY` : Secret key for signing JWT tokens
- `ENCRYPTION_KEY` : Used for encrypting API keys in DB. Must be 32 URL-safe base64-encoded bytes (Generate via `from cryptography.fernet import Fernet; Fernet.generate_key()`)

#### Frontend Secrets:
- `VITE_API_URL` : (The public URL where your backend is accessible, e.g., `http://<EC2_IP>:8080`)

---

## Phase 3: Trigger the Deployment

Once Phase 1 and Phase 2 are complete, you can trigger the deployment:

1. Push any code changes to the `main` branch. The workflow will start automatically.
```bash
git push origin main
```