## 1. Cleanup Unused Files

- [x] 1.1 Delete `checklist.md` from the root directory.
- [x] 1.2 Identify and delete any other explicitly unused or scratch files in the root directory.

## 2. Refactor Deployment Structure

- [x] 2.1 Create `deployment/backend/` directory if it doesn't exist.
- [x] 2.2 Create `deployment/frontend/` directory if it doesn't exist.
- [x] 2.3 Move `Dockerfile` from root to `deployment/backend/Dockerfile`.
- [x] 2.4 Move `entrypoint.sh` from root to `deployment/backend/entrypoint.sh`.
- [x] 2.5 Update paths within `deployment/backend/Dockerfile` to correctly reference the build context (which will likely be the project root or the `app/` directory depending on docker-compose setup).
- [x] 2.6 Move `docker-compose.yml` from root to `deployment/docker-compose.yml`.
- [x] 2.7 Update paths within `deployment/docker-compose.yml` to reflect the new locations of the build contexts and Dockerfiles.

## 3. Update README.md

- [x] 3.1 Replace the current content of `README.md` with the requested template.
- [x] 3.2 Update the "About The Project" section with a relevant description.
- [x] 3.3 Update the "Getting Started" section with instructions on using the new deployment structure (e.g., running docker-compose from the `deployment` directory).
- [x] 3.4 Add information about default admin credentials and any other required environment variables.
- [x] 3.5 Add links to documentation if available.