## Why

Currently, when the frontend tries to load a medical image from MinIO via a presigned URL, it results in a 403 Forbidden with a `SignatureDoesNotMatch` error. This happens because the application generates the presigned URL using the internal MinIO endpoint (`minio:9000`), but then uses a string replacement hack to swap in the external endpoint (`44.207.24.43:9000`). Since the MinIO signature is inextricably linked to the host header used during URL generation, the string replacement breaks the cryptographic integrity of the URL.

## What Changes

- Add a dedicated, secondary MinIO client instance specifically for generating presigned URLs.
- Initialize this secondary client using the `MINIO_EXTERNAL_ENDPOINT` configuration instead of the internal `MINIO_ENDPOINT`.
- Remove the brittle string replacement logic from the `get_presigned_url` method.
- Update `get_presigned_url` to use the secondary client, ensuring the URL is natively signed for the correct external host.

## Capabilities

### New Capabilities
- `presigned-url-generation`: The generation of presigned URLs using an external MinIO endpoint to ensure valid signatures for external access.

### Modified Capabilities
- None

## Impact

- **Affected Code**: `app/services/minio_service.py` (specifically the `MinIOService` initialization and `get_presigned_url` method).
- **APIs**: Any endpoint that returns image URLs (e.g., chat APIs returning `image_url`, user profile APIs returning `avatar_url`) will now return functionally valid presigned URLs.
- **Systems**: Solves the broken image loading issue in the frontend application when accessing images hosted on MinIO.