## 1. Modify MinIOService Initialization

- [x] 1.1 In `app/services/minio_service.py`, add a secondary `self.presign_client` to `MinIOService.__init__`.
- [x] 1.2 Initialize `self.presign_client` identically to `self.client` but substitute `settings.MINIO_ENDPOINT` with `settings.MINIO_EXTERNAL_ENDPOINT`.

## 2. Update presigned URL generation logic

- [x] 2.1 In `app/services/minio_service.py`, update `get_presigned_url` to call `self.presign_client.get_presigned_url` instead of `self.client.get_presigned_url`.
- [x] 2.2 Remove the string replacement logic (`url.replace(...)`) from `get_presigned_url` since it is no longer necessary.