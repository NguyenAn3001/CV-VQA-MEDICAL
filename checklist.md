# Deployment Checklist & Guide

This guide outlines the exact steps required to successfully deploy the VQA System (Backend + Frontend) via GitHub Actions to your AWS EC2 instance.

---

## Phase 1: AWS Setup (One-time only)

### 1. Create ECR Repositories
Go to AWS ECR Console and create two **Private** repositories:
- `vqa-system-api`
- `vqa-system-frontend`

### 2. EC2 Disk Space (IMPORTANT)
The backend Docker image is large (PyTorch + ML models). Your EC2 instance needs enough disk space.

**Recommended:** At least **30 GB** EBS volume.

To check current disk usage on your EC2:
```bash
df -h
```

To resize your EBS volume (via AWS Console):
1. Go to **EC2 -> Volumes**, select your instance volume.
2. Click **Modify Volume** and increase the size (e.g., to 30 GB).
3. SSH into EC2 and apply the resize:
```bash
sudo growpart /dev/xvda 1
sudo resize2fs /dev/xvda1
# Or for nvme:
sudo growpart /dev/nvme0n1 1
sudo resize2fs /dev/nvme0n1p1
```

### 3. Prepare EC2 Instance
SSH into your EC2 and run:
```bash
# Create app and models directories
mkdir -p /home/ubuntu/app
mkdir -p /home/ubuntu/models
```

### 4. Upload `docker-compose.yml` and Models to EC2
From your **local machine** (replace `key.pem` and `IP_ADDRESS`):
```bash
# Upload docker-compose.yml
scp -i path/to/key.pem docker-compose.yml ubuntu@<IP_ADDRESS>:/home/ubuntu/app/

# Upload ML model files
scp -i path/to/key.pem models/best_vit_pubmedbert_slake.pth ubuntu@<IP_ADDRESS>:/home/ubuntu/models/
scp -i path/to/key.pem models/best_captioning_roco_v6_fulldata.pth ubuntu@<IP_ADDRESS>:/home/ubuntu/models/
```

---

## Phase 2: GitHub Repository Secrets

Navigate to: **GitHub Repository -> Settings -> Secrets and variables -> Actions**

Add all of the following secrets exactly as named:

### AWS & Server Access
| Secret Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user key (must have ECR push/pull + EC2 access) |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `EC2_HOST` | Public IP of EC2 (e.g. `54.123.45.67`) |
| `EC2_SSH_KEY` | Full contents of `.pem` file including `-----BEGIN RSA PRIVATE KEY-----` |

### Backend Application
| Secret Name | Value |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://vqa_user:vqa_pass@postgres:5432/vqa_db` |
| `REDIS_URL` | `redis://redis:6379/0` |
| `MINIO_ENDPOINT` | `minio:9000` |
| `MINIO_ACCESS_KEY` | `minioadmin` |
| `MINIO_SECRET_KEY` | `minioadmin` |
| `JWT_SECRET_KEY` | Your secret key for JWT signing |
| `ENCRYPTION_KEY` | 32-byte Fernet key. Generate: `python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `LLM_API_KEY` | Your OpenAI / Gemini / compatible LLM API key |

### Frontend
| Secret Name | Value |
|---|---|
| `VITE_API_URL` | Public URL of backend (e.g. `http://<EC2_IP>:8080`) |

---

## Phase 3: Trigger Deployment

Push code to the `main` branch. The workflow runs automatically:

```bash
git push origin main
```

---

## Troubleshooting

| Error | Fix |
|---|---|
| `no space left on device` | Resize your EBS volume (see Phase 1 Step 2). The workflow now auto-cleans old images before pulling. |
| `unable to prepare context: path frontend not found` | Fixed: `build` context removed from `docker-compose.yml`. Server only pulls from ECR. |
| Frontend blank / can't reach API | Check `VITE_API_URL` secret is set to the correct public IP of your backend. |
| Backend fails: missing models | SSH to server, verify: `ls /home/ubuntu/models`. File names must match `.env.example`. |
| `no basic auth credentials` | The workflow now runs `sudo docker login` to ensure root-level ECR auth. |
