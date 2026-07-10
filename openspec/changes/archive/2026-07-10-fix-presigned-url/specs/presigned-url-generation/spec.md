## ADDED Requirements

### Requirement: External presigned URL generation
The system MUST generate MinIO presigned URLs using the external host endpoint, ensuring the embedded AWS v4 cryptographic signature is valid when accessed by external clients (browsers).

#### Scenario: Requesting image URL for an external client
- **WHEN** the backend needs to generate a presigned URL to return to the frontend
- **THEN** the URL must be generated using `MINIO_EXTERNAL_ENDPOINT` instead of the internal `MINIO_ENDPOINT`
- **AND THEN** the cryptographic signature embedded within the URL must match the host present in the URL itself.