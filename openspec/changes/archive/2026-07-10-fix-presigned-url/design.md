## Context

Currently, the `MinIOService` uses a single MinIO client initialized with the internal network endpoint (`MINIO_ENDPOINT`, e.g., `minio:9000`). This client is used for all operations: checking buckets, uploading objects, deleting objects, and generating presigned URLs. 

Because presigned URLs for MinIO are generated entirely client-side (no network request is made to the MinIO server), the signature included in the URL is cryptographically tied to the host/endpoint passed to the client during initialization. 

The previous code attempted a shortcut: generate the URL using the internal client, then manually string-replace the internal host with the external host (`MINIO_EXTERNAL_ENDPOINT`) before returning the URL to the frontend. This breaks the AWS v4 Signature because the signature embedded in the URL is expecting the internal host, but the browser sends the external host in the request headers. This results in a `<Code>SignatureDoesNotMatch</Code>` error.

## Goals / Non-Goals

**Goals:**
- Fix the `SignatureDoesNotMatch` error when accessing images via presigned URLs in the browser.
- Generate valid presigned URLs for external consumption.
- Keep internal MinIO operations (uploads, bucket creation) routed via the internal docker network.

**Non-Goals:**
- Upgrading or changing the underlying MinIO server deployment.
- Changing the authentication method for image retrieval (we will continue to use presigned URLs).
- Refactoring other services (like User, Chat, or Admin) that consume `MinIOService`.

## Decisions

**Decision 1: Introduce a secondary, dedicated MinIO client for presigning.**
- *Rationale*: A single MinIO client instance is bound to a single endpoint. To generate a signature for an external endpoint, we must instantiate a client that uses that external endpoint. We will add `self.presign_client` to `MinIOService`.
- *Alternatives Considered*: 
  - Overriding the host header during the `get_presigned_url` call: The Python MinIO client doesn't cleanly expose a way to override the signing host for a single method call without monkey-patching internal methods.
  - Exposing MinIO only externally and forcing backend to route out to the internet and back in: This adds unnecessary network latency and breaks standard docker-compose internal networking practices.

**Decision 2: Initialize `presign_client` with `MINIO_EXTERNAL_ENDPOINT`.**
- *Rationale*: By initializing `presign_client` with the external endpoint, any presigned URLs it generates will have a signature natively calculated against that domain/IP.
- *Implementation Details*:
  - The `MINIO_EXTERNAL_ENDPOINT` is already defined in `app/core/config.py`.
  - We will configure `self.presign_client` identically to `self.client` (same credentials, SSL settings), but swap the endpoint parameter.

**Decision 3: Remove string replacement hack.**
- *Rationale*: The string replacement (`url.replace(settings.MINIO_ENDPOINT, external_endpoint)`) is the root cause of the broken signature. It is no longer needed once the URL is generated correctly from the start.

## Risks / Trade-offs

- **[Risk]** Extra memory footprint. → *Mitigation*: We are instantiating one additional MinIO client object per worker thread. The overhead of a MinIO client object is negligible (it's mostly configuration state and an HTTP connection pool).
- **[Risk]** The external endpoint might require SSL, but the internal one might not. → *Mitigation*: Currently, `MINIO_USE_SSL` applies globally. If the external endpoint sits behind a reverse proxy (like Nginx) that handles SSL termination, the external endpoint string itself might need to specify https, or we may need a separate `MINIO_EXTERNAL_USE_SSL` config in the future. For now, we will stick to the existing configurations to minimize scope creep, as this fixes the immediate cryptographic mismatch.