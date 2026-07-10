## Purpose
Define the structure and standards for deployment files within the repository.

## Requirements

### Requirement: Standardized deployment directory
The repository MUST organize deployment files into dedicated directories.

#### Scenario: Docker compose location
- **WHEN** a developer looks for the docker-compose file
- **THEN** it is found in the `deployment/` directory

#### Scenario: Dockerfile location
- **WHEN** the backend image is built
- **THEN** the Dockerfile and entrypoint script are located in a structured path (e.g., `deployment/backend/`) and correctly reference the application code.