## Purpose
Define the requirements for the GitHub Actions deployment workflow.

## Requirements

### Requirement: GitHub Actions deployment workflow
The GitHub Actions workflow MUST build and push Docker images for both backend and frontend, using the correct paths for Dockerfiles that were relocated during refactoring.

#### Scenario: Building the backend image
- **WHEN** the "Build, tag, and push Backend image to ECR" step is executed
- **THEN** it must use the Dockerfile located at `deployment/backend/Dockerfile` with the build context set to the repository root.

#### Scenario: Building the frontend image
- **WHEN** the "Build, tag, and push Frontend image to ECR" step is executed
- **THEN** it must use the Dockerfile located at `deployment/frontend/Dockerfile` with the build context set to the frontend directory.