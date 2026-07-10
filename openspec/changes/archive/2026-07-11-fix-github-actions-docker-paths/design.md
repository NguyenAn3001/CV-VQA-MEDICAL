## Context

A recent refactoring moved the backend `Dockerfile` to `deployment/backend/Dockerfile` and the frontend `Dockerfile` to `deployment/frontend/Dockerfile`. However, the GitHub Actions deployment workflow (`.github/workflows/deploy.yml`) was not updated and still expects `Dockerfile` in the root and `frontend/Dockerfile`. This causes the build step to fail.

## Goals / Non-Goals

**Goals:**
- Fix the `deploy.yml` workflow so that it successfully builds both the backend and frontend Docker images.

**Non-Goals:**
- Modifying the application code.
- Restructuring the repository.
- Changing deployment infrastructure or platforms.

## Decisions

- **Update Docker Build Commands in GitHub Actions**:
  - For the backend image build step (`Build, tag, and push Backend image to ECR`), modify the command from `docker build -t ... .` to `docker build -f deployment/backend/Dockerfile -t ... .` to point to the correct Dockerfile while maintaining the build context at the project root.
  - For the frontend image build step (`Build, tag, and push Frontend image to ECR`), modify the command from `docker build --build-arg ... -t ... .` to `docker build -f ../deployment/frontend/Dockerfile --build-arg ... -t ... .` (or change context to root and adjust paths accordingly). Since the step runs with `cd frontend`, the Dockerfile is located at `../deployment/frontend/Dockerfile` relative to the `frontend` directory, and the context remains `.`.

## Risks / Trade-offs

- **Risk:** Build contexts could be incorrect if the paths are misconfigured, resulting in missing files during the Docker build process.
  - **Mitigation:** The build context (`.`) remains unchanged. We are only specifying the correct Dockerfile location using the `-f` flag. For the frontend, since the context is set to the `frontend` directory (`cd frontend`), the Dockerfile is correctly referenced as `../deployment/frontend/Dockerfile`.