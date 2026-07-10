# Chương 3: Kiến trúc Hạ tầng & Giải pháp Kỹ thuật (Tech Solutions)

Chương này phân tích các quyết định thiết kế kiến trúc hệ thống và giải pháp kỹ thuật của dự án **CV-VQA-MEDICAL**. Thay vì sử dụng các hệ thống nguyên khối (monolithic) truyền thống như Django, hệ thống áp dụng triết lý thiết kế **microservices-light** kết hợp với kiến trúc bất đồng bộ (async architecture). Cấu trúc này được chia thành bốn khía cạnh chính: Backend Framework & Thiết kế API, Cơ sở dữ liệu & Lưu trữ đa phương tiện, Tầng Cache (Caching Layer), và Hạ tầng Triển khai (Infrastructure & Deployment).

---

## 3.1 Backend Framework & Thiết kế API (FastAPI)

### 3.1.1 Phân tích & Lựa chọn công nghệ

Dự án sử dụng **FastAPI** làm web framework cốt lõi. Quyết định này dựa trên ba lợi thế vượt trội so với các framework Python khác:

1. **Hỗ trợ Async/Await Native**: Phù hợp hoàn hảo với yêu cầu truyền dữ liệu theo luồng (streaming) qua Server-Sent Events (SSE) khi tương tác với các mô hình LLM lớn. Flask ban đầu không được thiết kế cho async, còn cấu trúc ORM của Django quá nặng cho một kiến trúc hướng microservices.
2. **Hiệu năng cao**: Tốc độ xử lý của FastAPI (dựa trên Starlette và Pydantic) sánh ngang với Node.js và Go, đáp ứng tốt các API gọi mô hình AI nặng.
3. **Pydantic Validation & OpenAPI tự động**: Khả năng sinh OpenAPI schema tự động từ các model Pydantic giúp frontend và các LLM Agent dễ dàng tương tác mà không cần bảo trì tài liệu thủ công.

### 3.1.2 Thiết kế API và Cấu trúc Router

Hệ thống áp dụng kiến trúc module hóa với 11 router groups được phân tách theo nghiệp vụ rõ ràng, đăng ký tại `app/main.py` với tiền tố `/api/v1`:

```python
# app/main.py:80-90 (Trích xuất: Đăng ký Routers)
app.include_router(health_router, tags=["Health"])
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(users_router, prefix=f"{settings.API_V1_STR}/admin/users", tags=["Admin Users"])
app.include_router(admin_sessions_router, prefix=f"{settings.API_V1_STR}/admin/sessions", tags=["Admin Sessions"])
app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/admin/analytics", tags=["Admin Analytics"])
app.include_router(settings_router, prefix=f"{settings.API_V1_STR}/admin/settings", tags=["Admin Settings"])
app.include_router(providers_router, prefix=f"{settings.API_V1_STR}/admin/providers", tags=["Admin Providers"])
app.include_router(chat_router, prefix=f"{settings.API_V1_STR}/chat", tags=["Chatbot"])
app.include_router(profile_router, prefix=f"{settings.API_V1_STR}/profile", tags=["Profile"])
app.include_router(predict_router, prefix=settings.API_V1_STR, tags=["Medical AI Inference"])
```

### 3.1.3 Vòng đời ứng dụng (Lifespan Events)

Quá trình khởi động ứng dụng đóng vai trò quan trọng trong việc thiết lập môi trường cho các models AI nặng. FastAPI quản lý vòng đời này thông qua cơ chế `lifespan`:

```python
# app/main.py:27-51 (Trích xuất: Startup Flow)
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up FastAPI Server...")
    try:
        # 1. Khởi tạo DB & tạo Admin mặc định
        await init_db()
        # 2. Kết nối Redis (caching & blacklist)
        await redis_client.connect()
        # 3. Tạo bucket MinIO nếu chưa có
        minio_service.ensure_bucket_exists()
        # 4. Load models Deep Learning vào RAM/VRAM DUY NHẤT 1 LẦN
        ai_pipeline.load_models()
    except Exception as e:
        logger.error(f"CRITICAL ERROR: Failed to start services: {str(e)}")
    yield
    # Shutdown flow
    await redis_client.disconnect()
```

_Đoạn mã trên thể hiện pattern Singleton trong việc tải các mô hình ML nặng, loại bỏ hoàn toàn độ trễ khởi động (cold-start) cho mỗi request._

### 3.1.4 Authentication, RBAC và JWT Blacklist

Bảo mật hệ thống (Security) dựa trên kiến trúc **Stateless JWT (JSON Web Token)** nhưng được tinh chỉnh để giải quyết bài toán lớn nhất của JWT: khả năng thu hồi (revocation) tức thời.

- Hệ thống sinh hai loại token: Access Token (thời hạn 30 phút) và Refresh Token (7 ngày) (xem `app/core/security.py`).
- Token payload lưu trữ `sub` (user ID), `role` (user/admin), `type` (access/refresh) và `jti` (JWT ID).

Khi người dùng đăng xuất, `jti` được đẩy vào Redis Blacklist với TTL bằng đúng thời gian sống còn lại của token. Middleware xác thực sẽ kiểm tra trạng thái này trước khi cấp quyền:

```python
# app/api/deps.py:34-50 (Trích xuất: Redis Blacklist Check)
try:
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    user_id: str = payload.get("sub")
    jti: str = payload.get("jti")

    # Kiểm tra token có bị revoke trong Redis không
    is_blacklisted = await redis_client.get(f"blacklist:{jti}")
    if is_blacklisted:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )
```

Phân quyền (RBAC - Role-Based Access Control) được thực thi thông qua các dependency decorators như `require_role()` hoặc `get_current_active_admin`:

```python
# app/api/deps.py:67-75 (Trích xuất: RBAC role checker)
def require_role(role: str):
    async def role_checker(current_user: User = Depends(get_current_user)):
        # Admin có quyền truy cập vạn năng
        if current_user.role != role and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user
    return role_checker
```

### 3.1.5 Xử lý Multipart Form và SSE Streaming

Điểm phức tạp nhất của API nằm ở tính năng chat đa phương thức (multimodal chat). Endpoint `/chat/sessions/{id}/messages` cần đồng thời xử lý text (câu hỏi) và file nhị phân (ảnh X-quang) qua `multipart/form-data`, sau đó trả về luồng text thời gian thực (SSE):

```python
# app/api/chat.py:56-70 (Trích xuất: Endpoint gửi tin nhắn)
@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    message: str = Form("", description="User's text message"),
    image: Optional[UploadFile] = File(None, description="Optional medical image"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Chuẩn bị ngữ cảnh: Xác thực ảnh, upload lên MinIO, lưu tin nhắn user vào DB
    pil_image, history, new_title = await chat_service.prepare_message_and_context(
        db, session_id, str(current_user.id), message, image
    )
    # Trả về luồng SSE phản hồi từ LLM
    return chat_service.get_sse_stream(session_id, history, message, pil_image, new_title)
```

> **Hình 3.1: Sequence Diagram - Luồng Chat thời gian thực**

---

## 3.2 Cơ sở dữ liệu & Chiến lược Lưu trữ (Database Schema & Storage)

### 3.2.1 Phân tích chiến lược lưu trữ Hybrid

Dự án áp dụng mô hình lưu trữ kết hợp:

- **PostgreSQL**: Quản lý dữ liệu có cấu trúc (metadata). Cung cấp tính toàn vẹn ACID, khả năng tạo khóa ngoại cứng (foreign keys) và hỗ trợ tốt định dạng JSONB linh hoạt cho các `tool_calls` sinh ra từ LLM. Hệ thống dùng driver bất đồng bộ `asyncpg` với SQLAlchemy 2.0.
- **MinIO**: Hệ thống object storage tương thích chuẩn S3, chuyên biệt cho việc lưu trữ hàng triệu file nhị phân (hình ảnh y tế). Tách file nhị phân khỏi RDBMS giúp cơ sở dữ liệu không bị phình to (bloat), dễ dàng backup, và tương thích cloud-native (dễ dàng migrate sang AWS S3 sau này).

### 3.2.2 Cấu trúc cơ sở dữ liệu cốt lõi (SQLAlchemy)

Schema cơ sở dữ liệu bao gồm 5 bảng (Entity) chính:

```python
# app/db/models.py (Tổng hợp ERD Models chính)
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String(20), default="user", nullable=False)

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=True)
    is_pinned = Column(Boolean, default=False)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False) # 'user' or 'assistant'
    content = Column(String, nullable=False)
    image_object_key = Column(String, nullable=True) # Pointer tới object trong MinIO
    tool_calls = Column(JSONB, nullable=True) # Lưu trữ JSON linh hoạt

class ModelProvider(Base):
    __tablename__ = "model_providers"
    # Lưu trữ thông tin LLM (OpenAI, Gemini, Ollama...)
    apiKey = Column(String, nullable=True) # Trường này luôn được mã hóa đối xứng

class SystemSetting(Base):
    __tablename__ = "system_settings"
    key = Column(String(100), primary_key=True)
    value = Column(String, nullable=True)
```

> **Hình 3.2: Sơ đồ thực thể - quan hệ (ERD)**
>
> _Ghi chú:_
>
> - `image_object_key` là con trỏ chuỗi đến MinIO, không phải FK SQL.
> - `tool_calls` dùng JSONB cho truy vấn nested object hiệu năng cao.
> - `apiKey` được mã hóa AES (Fernet) trước khi lưu.

### 3.2.3 Cơ chế Migration (Alembic)

Dự án sử dụng Alembic để version control cấu trúc database. Toàn bộ kịch bản DDL (Data Definition Language) được sinh tự động. Việc áp dụng migration trong môi trường bất đồng bộ yêu cầu sử dụng `async_engine_from_config` thay vị engine thông thường:

```python
# alembic/env.py:70-85 (Trích xuất: Async Migration Runner)
async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()
```

### 3.2.4 Bảo mật thông tin nhạy cảm (Encryption)

Để tránh lộ lọt API Key của các dịch vụ LLM cao cấp (GPT-4o, Gemini) nếu bị dump database, `app/utils/security.py` sử dụng thư viện `cryptography.fernet` (Mã hóa đối xứng AES) để tự động mã hóa API Key trước khi chèn vào PostgreSQL và giải mã khi nạp cấu hình inference:

```python
# app/utils/security.py:28-43 (Trích xuất: Fernet Encryption)
def encrypt_secret(plain_text: str) -> str:
    if not plain_text: return ""
    return _get_fernet().encrypt(plain_text.encode('utf-8')).decode('utf-8')

def decrypt_secret(encrypted_text: str) -> str:
    if not encrypted_text: return ""
    try:
        return _get_fernet().decrypt(encrypted_text.encode('utf-8')).decode('utf-8')
    except InvalidToken:
        return ""
```

### 3.2.5 Object Storage Tương tác (MinIO)

Class `MinIOService` chịu trách nhiệm 4 tác vụ chính: `ensure_bucket_exists`, `upload_image`, `get_presigned_url`, và `delete_object`. Đáng chú ý là cơ chế tạo **Presigned URL**: Frontend không đọc file trực tiếp bằng đường dẫn tĩnh (để tránh rò rỉ hình ảnh y tế cá nhân). MinIO sinh ra các URL động chỉ có hiệu lực tạm thời (VD: 2 giờ). Class cũng được thiết kế xử lý linh hoạt việc phân tách giữa endpoint LAN (nội bộ Docker) và public hostname:

```python
# app/services/minio_service.py:52-80 (Trích xuất: Cơ chế Presigned URL)
def get_presigned_url(self, object_name: str) -> str:
    url = self.client.get_presigned_url(
        "GET",
        self.bucket_name,
        object_name,
        expires=timedelta(hours=settings.MINIO_PRESIGNED_URL_EXPIRE_HOURS)
    )

    # Replace internal Docker hostname with external public hostname if needed
    external_endpoint = getattr(settings, 'MINIO_EXTERNAL_ENDPOINT', 'localhost:9000')
    if external_endpoint and external_endpoint != settings.MINIO_ENDPOINT:
        url = url.replace(settings.MINIO_ENDPOINT, external_endpoint)

    return url
```

---

## 3.3 Tầng Cache (Caching Layer – Redis)

### 3.3.1 Singleton RedisClient và Graceful Degradation

Hệ thống truy xuất Redis thông qua mẫu Singleton `RedisClient`, được đóng gói thành dependency `Depends(get_redis)`. Việc kết nối được mở (connect) một lần tại lifespan startup, và đóng (disconnect) khi server shutdown. Hệ thống được thiết kế theo tư duy **Graceful Degradation** (Suy giảm mềm mại): Nếu Redis bị crash, hệ thống sẽ bỏ qua bước cache và gọi trực tiếp các mô hình AI hoặc bỏ qua blacklist check, không làm sập toàn bộ ứng dụng:

```python
# app/services/llm_orchestrator.py:74-84 (Trích xuất: Graceful Degradation)
async def _get_cached_result(self, cache_key: str) -> Optional[dict]:
    # Nếu Redis không hoạt động (None), trả về None, ứng dụng vẫn tiếp tục chạy
    if not redis_client.redis:
        return None
    try:
        cached_res = await redis_client.redis.get(cache_key)
        if cached_res:
            return json.loads(cached_res)
    except Exception as e:
        logger.warning(f"Cache lookup failed for key {cache_key}: {e}")
    return None
```

### 3.3.2 Các loại Key và Chiến lược TTL (Time-To-Live)

Redis lưu trữ 3 nhóm key chính:

1. `blacklist:{jti}`: Cờ đánh dấu JWT revoked. Giá trị TTL được tính toán tự động bằng thời gian sống còn lại của token gốc (expire timestamp - current timestamp).
2. `inference:predict:{img_hash}:{q_hash}`: Cache cho tác vụ VQA (Câu hỏi - Trả lời). Khóa hash tạo bằng mã băm SHA256 của byte-array hình ảnh và chuỗi câu hỏi. TTL cấu hình mặc định là 3600s (1 giờ).
3. `inference:caption:{img_hash}`: Cache cho tác vụ mô tả ảnh.

_Hiệu năng_: Khi cache hit, độ trễ hệ thống đối với truy vấn AI giảm từ khoảng 2-5 giây (thời gian mô hình infer) xuống chỉ còn dưới 10 mili-giây, giúp tiết kiệm triệt để tài nguyên tính toán (GPU/CPU).

---

## 3.4 Hạ tầng Triển khai (Infrastructure & Deployment)

### 3.4.1 Cấu trúc Dịch vụ Docker Compose

Hệ thống sử dụng Docker Compose điều phối 4 microservices tương tác chặt chẽ qua mạng lưới network nội bộ:

1. `postgres` (image `postgres:16-alpine`): Chứa khối dữ liệu Persistent qua volume `pgdata`. Sử dụng healthcheck `pg_isready`.
2. `redis` (image `redis:latest`): In-memory database, healthcheck qua `redis-cli ping`.
3. `minio` (image `minio/minio`): S3 server tại cổng 9000, giao diện admin console cổng 9001, lưu trữ persistent qua volume `miniodata`.
4. `backend` (FastAPI app): Image tự build, có dependency ràng buộc (`depends_on: condition: service_healthy`) với cả 3 service trên.

```yaml
# docker-compose.yml:46-67 (Trích xuất: Backend Service Definition)
backend:
  image: ${ECR_REGISTRY:-localhost}/${ECR_REPOSITORY_BACKEND:-vqa-system-api}:${IMAGE_TAG:-latest}
  ports:
    - '8080:8080'
  environment:
    - DATABASE_URL=postgresql+asyncpg://vqa_user:vqa_pass@postgres:5432/vqa_db
    - REDIS_URL=redis://redis:6379/0
    - MINIO_ENDPOINT=minio:9000
  env_file:
    - .env
  volumes:
    - /home/ubuntu/models:/app/models
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
    minio:
      condition: service_healthy
```

---

### 🎨 Phiên bản 1: Minimalist UI

> Phong cách **tối giản cao cấp** — bảng màu monochrome ấm áp, border mỏng tinh tế, accent pastel nhẹ nhàng.

```mermaid
graph TB
    subgraph External[" "]
        Frontend("Frontend Client")
    end

    subgraph Docker_Network["Docker Internal Network"]
        direction TB
        Backend["FastAPI Backend :8080"]

        subgraph Data_Stores[" "]
            direction TB
            PostgreSQL["PostgreSQL 16 :5432"]
            Redis["Redis :6379"]
            MinIO["MinIO S3 :9000"]
        end
    end

    Frontend -->|HTTP API| Backend
    Backend -->|asyncpg :5432| PostgreSQL
    Backend -->|redis :6379| Redis
    Backend -->|S3 :9000| MinIO

    style Frontend fill:#FFFFFF,stroke:#EAEAEA,stroke-width:1px,color:#2F3437
    style Backend fill:#F9F9F8,stroke:#EAEAEA,stroke-width:1px,color:#2F3437
    style PostgreSQL fill:#EDF3EC,stroke:#346538,stroke-width:1px,color:#2F3437
    style Redis fill:#FDEBEC,stroke:#9F2F2D,stroke-width:1px,color:#2F3437
    style MinIO fill:#E1F3FE,stroke:#1F6C9F,stroke-width:1px,color:#2F3437
    style External fill:#F7F6F3,stroke:#EAEAEA,stroke-width:1px,color:#787774
    style Docker_Network fill:#FFFFFF,stroke:#EAEAEA,stroke-width:1px,color:#787774
    style Data_Stores fill:#FBFBFA,stroke:#EAEAEA,stroke-dasharray:4 4,color:#787774
    linkStyle default stroke:#EAEAEA,stroke-width:1px
```

> **Hình 3.3a: Docker Container Topology — Minimalist UI Edition**

---

### 🎨 Phiên bản 2: High-End Visual Design

> Phong cách **Ethereal Glass** — nền tối sâu, hiệu ứng kính mờ, double-bezel nesting, đường nét siêu mảnh.

```mermaid
graph TB
    subgraph Outer[" "]
        subgraph Inner[" "]
            Frontend["Frontend<br/>Client"]
        end
    end

    subgraph Outer2[" "]
        subgraph Inner2[" "]
            Backend["FastAPI<br/>Backend<br/>:8080"]
        end
    end

    subgraph Outer3[" "]
        subgraph Inner3[" "]
            PostgreSQL["PostgreSQL 16<br/>:5432"]
            Redis["Redis<br/>:6379"]
            MinIO["MinIO S3<br/>:9000"]
        end
    end

    Frontend -->|HTTP API| Backend
    Backend -->|asyncpg| PostgreSQL
    Backend -->|redis| Redis
    Backend -->|S3| MinIO

    style Frontend fill:rgba(255,255,255,0.08),stroke:rgba(255,255,255,0.2),stroke-width:0.5px,color:#FFFFFF
    style Backend fill:rgba(255,255,255,0.12),stroke:rgba(255,255,255,0.3),stroke-width:0.5px,color:#FFFFFF
    style PostgreSQL fill:rgba(255,255,255,0.06),stroke:rgba(255,255,255,0.15),stroke-width:0.5px,color:#FFFFFF
    style Redis fill:rgba(255,255,255,0.06),stroke:rgba(255,255,255,0.15),stroke-width:0.5px,color:#FFFFFF
    style MinIO fill:rgba(255,255,255,0.06),stroke:rgba(255,255,255,0.15),stroke-width:0.5px,color:#FFFFFF
    style Outer fill:rgba(0,0,0,0.03),stroke:rgba(255,255,255,0.05),stroke-width:1px
    style Inner fill:rgba(10,10,10,0.95),stroke:rgba(255,255,255,0.08),stroke-width:0.5px
    style Outer2 fill:rgba(0,0,0,0.03),stroke:rgba(255,255,255,0.05),stroke-width:1px
    style Inner2 fill:rgba(10,10,10,0.95),stroke:rgba(255,255,255,0.1),stroke-width:0.5px
    style Outer3 fill:rgba(0,0,0,0.03),stroke:rgba(255,255,255,0.05),stroke-width:1px
    style Inner3 fill:rgba(10,10,10,0.95),stroke:rgba(255,255,255,0.08),stroke-width:0.5px
    linkStyle default stroke:rgba(255,255,255,0.2),stroke-width:0.5px
```

> **Hình 3.3b: Docker Container Topology — High-End Visual Design Edition**

---

### 🎨 Phiên bản 3: Industrial Brutalist

> Phong cách **Swiss Industrial Print** — giấy báo `#F4F4F0`, mực carbon `#050505`, góc vuông sắc cạnh, accent đỏ hàng không.

```mermaid
graph TB
    subgraph EXTERNAL["EXTERNAL"]
        FRONTEND["FRONTEND CLIENT"]
    end

    subgraph DOCKER["DOCKER INTERNAL NETWORK"]
        BACKEND["FASTAPI BACKEND :8080"]

        subgraph STORES["DATA STORES"]
            PG["POSTGRESQL 16 :5432"]
            RD["REDIS :6379"]
            MIO["MINIO S3 :9000"]
        end
    end

    FRONTEND -->|HTTP API| BACKEND
    BACKEND -->|ASYNCPG :5432| PG
    BACKEND -->|REDIS :6379| RD
    BACKEND -->|S3 :9000| MIO

    style FRONTEND fill:#F4F4F0,stroke:#E61919,stroke-width:2px,color:#050505
    style BACKEND fill:#F4F4F0,stroke:#050505,stroke-width:2px,color:#050505
    style PG fill:#F4F4F0,stroke:#050505,stroke-width:2px,color:#050505
    style RD fill:#F4F4F0,stroke:#050505,stroke-width:2px,color:#050505
    style MIO fill:#F4F4F0,stroke:#050505,stroke-width:2px,color:#050505
    style EXTERNAL fill:#F4F4F0,stroke:#050505,stroke-width:2px,color:#050505
    style DOCKER fill:#EAE8E3,stroke:#050505,stroke-width:3px,color:#050505
    style STORES fill:#EAE8E3,stroke:#050505,stroke-dasharray:2 2,color:#050505
    linkStyle default stroke:#050505,stroke-width:2px
```

> **Hình 3.3c: Docker Container Topology — Industrial Brutalist Edition**

---

### 🎨 Phiên bản 4: GPT Taste

> Phong cách **cinematic premium** — layout bất đối xứng, typography track-tight, bento-grid inspired, tương phản mạnh.

```mermaid
graph TB
    subgraph Network["Docker Internal Network"]
        direction TB
        
        FRONTEND("Frontend<br/>Client")
        FRONTEND -->|HTTP API| BACKEND
        
        BACKEND["FastAPI<br/>Backend<br/>:8080"]
        
        subgraph Storage["Data Layer"]
            direction LR
            PG["PostgreSQL 16<br/>:5432"]
            RD["Redis<br/>:6379"]
            MIO["MinIO S3<br/>:9000"]
        end
        
        BACKEND -->|asyncpg| PG
        BACKEND -->|redis| RD
        BACKEND -->|S3| MIO
    end

    style FRONTEND fill:#0A0A0A,stroke:#FFFFFF,stroke-width:1px,color:#FFFFFF
    style BACKEND fill:#FFFFFF,stroke:#0A0A0A,stroke-width:2px,color:#0A0A0A
    style PG fill:#FFFFFF,stroke:#0A0A0A,stroke-width:1px,color:#0A0A0A
    style RD fill:#FFFFFF,stroke:#0A0A0A,stroke-width:1px,color:#0A0A0A
    style MIO fill:#FFFFFF,stroke:#0A0A0A,stroke-width:1px,color:#0A0A0A
    style Network fill:transparent,stroke:#0A0A0A,stroke-width:2px
    style Storage fill:transparent,stroke:rgba(0,0,0,0.15),stroke-dasharray:6 3
    linkStyle 0 stroke:#0A0A0A,stroke-width:2px
    linkStyle 1 stroke:#0A0A0A,stroke-width:1px
    linkStyle 2 stroke:#0A0A0A,stroke-width:1px
    linkStyle 3 stroke:#0A0A0A,stroke-width:1px
```

> **Hình 3.3d: Docker Container Topology — GPT Taste Edition**

---

### 🎨 Phiên bản 5: Stitch Design Taste

> Phong cách **semantic design system** — spatial zones phân tách rõ ràng, không overlapping, color-calibrated, spring-physics feel.

```mermaid
graph TB
    subgraph Zone1["Frontend Zone"]
        Client["Client Application"]
    end

    subgraph Zone2["API Gateway Zone"]
        API["FastAPI Backend<br/>Port :8080"]
    end

    subgraph Zone3["Data Infrastructure Zone"]
        DB1["PostgreSQL 16<br/>OLTP :5432"]
        DB2["Redis<br/>Cache :6379"]
        DB3["MinIO S3<br/>Storage :9000"]
    end

    Client -->|"HTTP API"| API
    API -->|"asyncpg"| DB1
    API -->|"redis-py"| DB2
    API -->|"S3 SDK"| DB3

    style Client fill:#FAFAFA,stroke:#D4D4D8,stroke-width:1px,color:#18181B
    style API fill:#FAFAFA,stroke:#18181B,stroke-width:2px,color:#18181B
    style DB1 fill:#FAFAFA,stroke:#D4D4D8,stroke-width:1px,color:#18181B
    style DB2 fill:#FAFAFA,stroke:#D4D4D8,stroke-width:1px,color:#18181B
    style DB3 fill:#FAFAFA,stroke:#D4D4D8,stroke-width:1px,color:#18181B
    style Zone1 fill:transparent,stroke:#D4D4D8,stroke-width:2px,color:#71717A
    style Zone2 fill:transparent,stroke:#18181B,stroke-width:2px,color:#71717A
    style Zone3 fill:transparent,stroke:#D4D4D8,stroke-width:2px,color:#71717A
    linkStyle 0 stroke:#18181B,stroke-width:2px
    linkStyle 1 stroke:#52525B,stroke-width:1px,stroke-dasharray:4 2
    linkStyle 2 stroke:#52525B,stroke-width:1px,stroke-dasharray:4 2
    linkStyle 3 stroke:#52525B,stroke-width:1px,stroke-dasharray:4 2
```

> **Hình 3.3e: Docker Container Topology — Stitch Design Taste Edition**

### 3.4.2 Tối ưu hóa Multi-stage Build và Cloud-readiness

`deployment/Dockerfile` được thiết kế theo kiến trúc **Multi-stage build**:

- **Stage 1 (builder)**: Cài đặt GCC, build các thư viện hệ thống và tải các gói Pip dependencies vào một thư mục `.local`.
- **Stage 2 (production)**: Sử dụng image `python:3.10-slim`, chỉ sao chép thư mục `.local` đã build và source code gốc. Khởi tạo một User `appuser` (non-root) để ngăn chặn rủi ro leo thang đặc quyền (Privilege Escalation).

```dockerfile
# deployment/Dockerfile:18-36 (Trích xuất: Production Stage)
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/appuser/.local/bin:$PATH"

# Khởi tạo Non-root User
RUN useradd --create-home appuser
USER appuser
WORKDIR /app

# Sao chép dependencies từ Builder stage
COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local

# Sao chép Source Code
COPY --chown=appuser:appuser ./app /app/app
COPY --chown=appuser:appuser ./models /app/models
```

**Tối ưu chi phí Compute (CPU-First)**: Một điểm sáng trong kiến trúc là tệp `requirements.prod.txt` ép tải thư viện PyTorch phiên bản CPU (`--extra-index-url https://download.pytorch.org/whl/cpu`). Phương án này giảm dung lượng image hơn 2GB, tối ưu chi phí cực lớn vì có thể triển khai hệ thống AI Y tế này trên những hạ tầng Cloud giá rẻ (EC2/ECS thông thường) không có NVIDIA GPU, trong khi mô hình ViT-PubMedBERT vẫn đạt tốc độ nội suy thời gian thực ở mức chấp nhận được.

### 3.4.3 Bảo vệ hạ tầng và Observability (Khả năng quan sát)

- **Rate Limiting**: Để tránh DDoS làm quá tải tài nguyên máy chủ LLM (tiêu tốn chi phí API Key), framework `slowapi` được nhúng như một ASGI middleware (`app/middleware/rate_limit.py`), theo dõi tần suất gọi API qua địa chỉ IP của Client.
- **Observability**: Prometheus middleware (thư viện `prometheus-fastapi-instrumentator`) tự động bọc các endpoint để đẩy metrics theo dõi số lượng requests, độ trễ và tỷ lệ lỗi tại endpoint `/metrics`, sẵn sàng phục vụ biểu đồ giám sát Grafana ở tầm hệ thống (System level observability).
