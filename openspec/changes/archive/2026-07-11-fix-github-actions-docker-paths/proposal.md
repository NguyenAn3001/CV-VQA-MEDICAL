## Why

The current GitHub Actions deployment workflow (`.github/workflows/deploy.yml`) is failing with `ERROR: failed to build: failed to solve: failed to read dockerfile: open Dockerfile: no such file or directory`. This is because the `Dockerfile` was moved to `deployment/backend/Dockerfile` in a previous refactoring change, but the GitHub Actions workflow was not updated to reflect the new path. We need to update the workflow to build the backend image using the correct Dockerfile path and build context.

## What Changes

- **Update Backend Build Command**: Modify the `docker build` command for the backend in `.github/workflows/deploy.yml` to specify the `-f deployment/backend/Dockerfile` flag, and ensure the build context is still `.`.
- **Update Frontend Build Command**: Modify the `docker build` command for the frontend in `.github/workflows/deploy.yml` to specify the `-f deployment/frontend/Dockerfile` flag, and ensure the build context is `frontend`.

## Capabilities

### Modified Capabilities
- `deploy`: Update GitHub Actions deployment workflow to use correct Dockerfile paths.

## Impact

- **Affected Code**: `.github/workflows/deploy.yml`
- **Impact**: The GitHub Actions deployment workflow will successfully build and push the Docker images again, fixing the CI/CD pipeline. No application code or deployment configuration on the EC2 instance is affected.