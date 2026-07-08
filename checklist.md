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

### Global Secrets (Applied to all environments)
- `AWS_ACCESS_KEY_ID` : IAM user must have ECR push/pull permissions
- `AWS_SECRET_ACCESS_KEY` : AWS Secret Key
- `EC2_HOST` : Public IP address of your EC2 instance (e.g., `54.123.45.67`)
- `EC2_SSH_KEY` : The full contents of your `.pem` file, including `-----BEGIN RSA PRIVATE KEY-----`
- `JWT_SECRET_KEY` : Secret key for signing JWT tokens
- `ENCRYPTION_KEY` : Used for encrypting API keys in DB. Must be 32 URL-safe base64-encoded bytes (Generate via `from cryptography.fernet import Fernet; Fernet.generate_key()`)

### Environment-Specific Secrets
> **Important:** The workflow dynamically formats these secrets based on the `environment` string you input when triggering the workflow. 
> The format is `<SECRET_NAME>_<ENVIRONMENT_UPPERCASE>`.
> For example, if you input `staging` as the environment, you must create a secret exactly named `DATABASE_URL_STAGING`.

Create the following secrets replacing `<ENV>` with your uppercase environment name:

#### Backend Secrets:
- `DATABASE_URL_<ENV>` : (e.g., `postgresql+asyncpg://vqa_user:vqa_pass@postgres:5432/vqa_db`)
- `REDIS_URL_<ENV>` : (e.g., `redis://redis:6379/0`)
- `MINIO_ENDPOINT_<ENV>` : (e.g., `minio:9000`)
- `MINIO_ACCESS_KEY_<ENV>` : (e.g., `minioadmin`)
- `MINIO_SECRET_KEY_<ENV>` : (e.g., `minioadmin`)
- `LLM_API_KEY_<ENV>` : (Your OpenAI or compatible LLM API Key)

#### Frontend Secrets:
- `VITE_API_URL_<ENV>` : (The public URL where your backend is accessible, e.g., `http://<EC2_IP>:8080`)

---

## Phase 3: Trigger the Deployment

Once Phase 1 and Phase 2 are complete, you can trigger the deployment.

1. Go to the **Actions** tab in your GitHub Repository.
2. Select **Deploy App to AWS Server** from the left sidebar.
3. Click the **Run workflow** dropdown on the right side.
4. Enter your environment name (e.g., `staging`, `dev`). **This must match the `<ENV>` suffix you used for your secrets.**
5. Click **Run workflow**.

## Troubleshooting
- **If the frontend is blank or can't reach the API:** Verify that the `VITE_API_URL_<ENV>` secret was correctly set to the public IP/Domain of your server.
- **If the backend fails to start complaining about missing models:** SSH into the server and run `ls /home/ubuntu/models`. Verify the `.pth` files are there and their names match exactly what is defined in your backend environment configuration.
