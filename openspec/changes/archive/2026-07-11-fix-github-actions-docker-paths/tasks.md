## 1. Update GitHub Actions Workflow

- [x] 1.1 In `.github/workflows/deploy.yml`, update the backend build command to `docker build -f deployment/backend/Dockerfile -t $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG .`
- [x] 1.2 In `.github/workflows/deploy.yml`, update the frontend build command to `docker build -f ../deployment/frontend/Dockerfile --build-arg VITE_API_URL=$VITE_API_URL -t $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG .`