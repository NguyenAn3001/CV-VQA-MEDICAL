# Chương 5: Triển khai (Implement)

Quá trình triển khai dự án CV-VQA-MEDICAL được thực hiện theo nguyên tắc mô-đun hóa cao, phân tách rõ ràng giữa cấu trúc hạ tầng, logic xử lý cốt lõi (Backend) và giao diện người dùng (Frontend). Dưới đây là các bước triển khai chi tiết:

## 5.0 Tổng quan kiến trúc triển khai

Hệ thống được triển khai theo mô hình Client - Server, trong đó Frontend React giao tiếp với Backend FastAPI thông qua REST API và SSE Streaming. Backend chịu trách nhiệm xác thực, quản lý dữ liệu, xử lý ảnh, gọi mô hình AI và trả kết quả về cho người dùng.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                          Người dùng                                  │
│              Bác sĩ / Sinh viên / Admin hệ thống                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend React                               │
│  - Login/Register                                                    │
│  - Chat UI                                                           │
│  - Upload ảnh y tế                                                   │
│  - Admin Dashboard                                                   │
│  - Nhận phản hồi SSE theo thời gian thực                             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ REST API / SSE
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Backend FastAPI                              │
│  - Auth Service                                                      │
│  - Chat Service                                                      │
│  - Prediction Service                                                │
│  - MinIO Service                                                     │
│  - ML Inference Pipeline                                             │
└───────────────┬───────────────┬────────────────┬───────────────────┘
                │               │                │
                ▼               ▼                ▼
        ┌─────────────┐ ┌─────────────┐ ┌──────────────────────┐
        │ PostgreSQL  │ │    Redis    │ │        MinIO          │
        │ Users       │ │ Cache       │ │ Medical Images        │
        │ Sessions    │ │ Token block │ │ Presigned URLs        │
        │ Messages    │ │             │ │                      │
        └─────────────┘ └─────────────┘ └──────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         AI Models                                    │
│  Shared ViT Backbone + PubMedBERT cho VQA                            │
│  Shared ViT Backbone + GPT-2 Decoder cho Captioning                  │
└─────────────────────────────────────────────────────────────────────┘
```

## 5.1 Các bước triển khai Backend (Backend Implementation Steps)

Phần Backend đóng vai trò là "bộ não" của hệ thống, xử lý các tác vụ nặng về AI và quản lý dữ liệu.

```text
┌──────────────────────────┐
│       FastAPI App        │
└────────────┬─────────────┘
             │ Startup lifespan
             ▼
┌──────────────────────────┐
│ 1. Khởi tạo Database     │
│    - Alembic migrations  │
│    - Seed admin account  │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ 2. Kết nối Redis         │
│    - Cache inference     │
│    - Token blacklist     │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ 3. Khởi tạo MinIO        │
│    - Tạo bucket nếu thiếu│
│    - Chuẩn bị upload     │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ 4. Load AI Models        │
│    - ViT                 │
│    - PubMedBERT          │
│    - GPT-2 Captioning    │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Backend sẵn sàng phục vụ │
└──────────────────────────┘
```

1.  **Thiết lập Môi trường & Khởi tạo Cơ sở dữ liệu (Environment Setup & DB Init):**
    *   **Cơ sở hạ tầng:** Sử dụng `docker-compose.yml` để thiết lập và chạy đồng thời các dịch vụ nền tảng: PostgreSQL (Database), Redis (Caching) và MinIO (Object Storage) trong các container độc lập.
    *   **Khởi tạo DB:** Khi ứng dụng khởi động, Alembic (công cụ migration) sẽ tự động chạy để tạo cấu trúc bảng trong PostgreSQL. Đồng thời, một script khởi tạo sẽ chèn (seed) tài khoản Admin mặc định vào hệ thống để bắt đầu sử dụng.

2.  **Tải mô hình Học máy vào Bộ nhớ (ML Model Loading):**
    *   Các tệp trọng số (`.pth`) có dung lượng lớn của các mô hình học sâu: Vision Transformer (ViT), PubMedBERT (cho VQA) và GPT-2 (cho Captioning) cần được tải sẵn.
    *   Việc tải mô hình này diễn ra *ngay trong quá trình khởi động* của FastAPI, thông qua sự kiện `lifespan`. Điều này cực kỳ quan trọng để đảm bảo khi hệ thống báo trạng thái "sẵn sàng", các API inference có thể phản hồi ngay lập tức mà không gây ra lỗi timeout cho những request đầu tiên.

3.  **Triển khai Dịch vụ Xác thực & Xử lý Ảnh (Auth & Image Services):**
    *   **Xác thực (Auth Service):** Xây dựng luồng đăng nhập tạo Access Token và Refresh Token dựa trên JWT. Đặc biệt, triển khai cơ chế đưa token vào "danh sách đen" (blacklisting) thông qua Redis khi người dùng thao tác đăng xuất, đảm bảo token đó không thể bị lạm dụng lại.
    *   **Xử lý Ảnh (MinIO Service):** Viết service tương tác với MinIO S3 API để tải ảnh y tế từ luồng upload, lưu trữ an toàn và tạo các "Presigned URL" trả về cho Frontend hiển thị.

4.  **Thực thi Suy luận & Streaming dữ liệu (Inference & Chat Streaming):**
    *   **Cơ chế Caching:** Trước khi gọi mô hình ML, Backend tạo mã băm SHA-256 từ byte của hình ảnh (và text câu hỏi). Hệ thống kiểm tra mã băm này trong Redis. Nếu có (cache hit), trả về kết quả ngay.
    *   **Suy luận PyTorch:** Nếu không có trong cache (cache miss), hình ảnh được đưa qua mô hình PyTorch để xử lý (chạy trên GPU hoặc CPU).
    *   **Streaming (SSE):** Dữ liệu văn bản từ mô hình (đặc biệt là trong luồng chat) được đóng gói và trả về liên tục thông qua đối tượng `StreamingResponse` của FastAPI, tuân thủ giao thức Server-Sent Events (SSE).

### 5.1.1 Luồng suy luận AI và cache

Sơ đồ dưới đây mô tả cách Backend xử lý một yêu cầu phân tích ảnh y tế. Mục tiêu chính là tránh chạy lại mô hình AI nếu kết quả đã tồn tại trong Redis cache.

```text
┌──────────────────────────┐
│ User gửi ảnh + câu hỏi   │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ FastAPI nhận request     │
│ Validate file/question   │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Tạo SHA-256 hash         │
│ từ ảnh + câu hỏi         │
└────────────┬─────────────┘
             ▼
      ┌──────────────┐
      │ Redis Cache? │
      └──────┬───────┘
             │
     ┌───────┴────────┐
     │                │
     ▼                ▼
┌──────────┐    ┌─────────────────────┐
│ Cache hit│    │ Cache miss          │
│ Trả ngay │    │ Chạy AI Inference   │
└────┬─────┘    └──────────┬──────────┘
     │                     ▼
     │          ┌─────────────────────┐
     │          │ Lưu kết quả vào     │
     │          │ Redis với TTL       │
     │          └──────────┬──────────┘
     │                     │
     └──────────┬──────────┘
                ▼
┌──────────────────────────┐
│ Trả kết quả về Frontend  │
└──────────────────────────┘
```

### 5.1.2 Luồng chat streaming bằng SSE

Khi người dùng chat với hệ thống, Backend không chờ toàn bộ câu trả lời được sinh xong rồi mới trả về. Thay vào đó, phản hồi được gửi từng phần qua SSE để Frontend hiển thị giống hiệu ứng AI đang gõ.

```text
┌──────────────┐        POST multipart/form-data        ┌──────────────┐
│ React Chat UI│ ─────────────────────────────────────▶ │ FastAPI Chat │
└──────┬───────┘                                         └──────┬───────┘
       │                                                        │
       │                                                        ▼
       │                                             ┌────────────────────┐
       │                                             │ Lưu ảnh vào MinIO  │
       │                                             │ Lưu message vào DB │
       │                                             └─────────┬──────────┘
       │                                                       ▼
       │                                             ┌────────────────────┐
       │                                             │ LLM Orchestrator   │
       │                                             │ gọi tool nếu cần   │
       │                                             └─────────┬──────────┘
       │                                                       ▼
       │                                             ┌────────────────────┐
       │                                             │ VQA / Captioning   │
       │                                             │ AI Pipeline        │
       │                                             └─────────┬──────────┘
       │                                                       │
       │ event: tool_call                                      │
       │ ◀─────────────────────────────────────────────────────┤
       │ event: message                                        │
       │ ◀─────────────────────────────────────────────────────┤
       │ event: message                                        │
       │ ◀─────────────────────────────────────────────────────┤
       │ event: done                                           │
       │ ◀─────────────────────────────────────────────────────┘
       ▼
┌──────────────────────┐
│ UI cập nhật real-time│
└──────────────────────┘
```

## 5.2 Các bước triển khai Frontend (Frontend Implementation Steps)

Frontend đóng vai trò hiển thị và tương tác với người dùng, yêu cầu trải nghiệm mượt mà và trực quan.

```text
┌─────────────────────────────────────────────────────────────┐
│                       Frontend React                         │
├─────────────────────────────────────────────────────────────┤
│ Pages                                                       │
│ - Login / Register                                          │
│ - Chat                                                       │
│ - Profile / Settings                                        │
│ - Admin Dashboard                                           │
├─────────────────────────────────────────────────────────────┤
│ State                                                       │
│ - Zustand auth store                                        │
│ - Chat session state                                        │
│ - Streaming state                                           │
├─────────────────────────────────────────────────────────────┤
│ API Layer                                                   │
│ - Axios client                                              │
│ - JWT request interceptor                                   │
│ - Refresh-token response interceptor                        │
│ - fetch + ReadableStream cho SSE                            │
└─────────────────────────────────────────────────────────────┘
```

1.  **Khởi tạo cấu trúc dự án (Project Scaffolding):**
    *   Thiết lập một dự án React mới sử dụng Vite (để tối ưu hóa tốc độ build và HMR) kết hợp với TypeScript (để kiểm soát kiểu dữ liệu chặt chẽ) trong thư mục `frontend/`.

2.  **Định tuyến & Bảo vệ trang (Routing & Auth Guards):**
    *   Sử dụng thư viện `React Router v7` để thiết lập các tuyến đường (routes) tĩnh và động.
    *   Xây dựng các component bọc (wrapper) `ProtectedRoute`. Các component này sẽ kiểm tra trạng thái xác thực từ Zustand store; nếu người dùng chưa đăng nhập, tự động chuyển hướng về trang `/login`. Ngoài ra, thiết lập các quyền truy cập cấp cao cho các route `/admin/*` chỉ dành riêng cho vai trò Admin.

3.  **Cấu hình API Client & Interceptors:**
    *   Khởi tạo đối tượng Axios toàn cục với Base URL trỏ về Backend.
    *   **Request Interceptor:** Tự động đính kèm `Access Token` vào header `Authorization: Bearer` của mọi request gửi đi.
    *   **Response Interceptor (Auto-refresh):** Xây dựng logic bắt lỗi `401 Unauthorized`. Khi token hết hạn, tự động tạm ngưng các request đang gọi, gửi yêu cầu `/auth/refresh` bằng Refresh Token để lấy token mới, cập nhật lại trạng thái và tự động gọi lại các request bị lỗi trước đó một cách trong suốt với người dùng.

4.  **Tích hợp Thư viện Giao diện (UI Component Library):**
    *   Cấu hình `Tailwind CSS` để tạo kiểu (styling) nhanh chóng dựa trên các utility classes.
    *   Tích hợp bộ UI primitives `Radix UI` (thông qua `shadcn/ui`) để sử dụng các component có khả năng truy cập tốt (accessible) và dễ dàng tùy biến như Buttons, Inputs, Dialogs, Dropdowns.

5.  **Phát triển Giao diện Trò chuyện & SSE Hook (Chat Interface & SSE Hook):**
    *   Xây dựng giao diện chat chính, khu vực tải lên hình ảnh và danh sách lịch sử chat.
    *   Viết một Custom React Hook (`useSSEChat`) sử dụng API `fetch` tiêu chuẩn kết hợp với `ReadableStream` để: xử lý việc upload file (sử dụng FormData), đọc luồng dữ liệu liên tục từ Backend, phân tích cú pháp các sự kiện SSE (`event: message`, `event: tool_call`, `event: done`), và cập nhật trạng thái UI theo thời gian thực để tạo hiệu ứng gõ chữ trên màn hình.

6.  **Xây dựng Trang Quản trị (Admin Dashboard):**
    *   Phát triển các màn hình dành riêng cho Admin để hiển thị dữ liệu tổng quan.
    *   Tích hợp các tính năng gọi API đến các endpoint `/admin/users` để lấy danh sách người dùng, cập nhật trạng thái hoạt động của tài khoản và thực hiện lệnh reset mật khẩu từ giao diện web.

### 5.2.1 Luồng xác thực trên Frontend

Sơ đồ sau mô tả cách Frontend xử lý đăng nhập, lưu token và tự động làm mới token khi Access Token hết hạn.

```text
┌──────────────────────────┐
│ User nhập username/pass  │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ POST /api/v1/auth/login  │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Backend trả token        │
│ - access_token           │
│ - refresh_token          │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Frontend lưu auth state  │
│ Zustand / localStorage   │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Axios tự gắn Bearer token│
│ vào mỗi request          │
└────────────┬─────────────┘
             ▼
      ┌──────────────┐
      │ API trả 401? │
      └──────┬───────┘
             │
     ┌───────┴────────┐
     │                │
     ▼                ▼
┌──────────┐    ┌─────────────────────┐
│ Không    │    │ Có                  │
│ Tiếp tục │    │ Gọi /auth/refresh   │
└──────────┘    └──────────┬──────────┘
                           ▼
                ┌─────────────────────┐
                │ Cập nhật token mới  │
                │ Gửi lại request cũ  │
                └─────────────────────┘
```

### 5.2.2 Luồng upload ảnh và hiển thị kết quả trên UI

```text
┌──────────────────────────┐
│ User chọn ảnh y tế       │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Frontend kiểm tra file   │
│ - Định dạng JPG/PNG      │
│ - Kích thước <= 5MB      │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Tạo FormData             │
│ image + message/question │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Gửi request tới Backend  │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Backend lưu ảnh vào MinIO│
│ và chạy AI inference     │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Frontend nhận kết quả    │
│ - Answer / Caption       │
│ - Streaming message      │
│ - Presigned image URL    │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Render vào Chat UI       │
└──────────────────────────┘
```

## 5.3 Tổng hợp luồng triển khai hoàn chỉnh

Sơ đồ tổng hợp dưới đây cho thấy toàn bộ quá trình từ lúc người dùng gửi yêu cầu đến khi nhận phản hồi từ hệ thống.

```text
┌────────────┐
│   User     │
└─────┬──────┘
      │
      ▼
┌────────────┐
│ React UI   │
└─────┬──────┘
      │ Validate input + attach JWT
      ▼
┌────────────┐
│ FastAPI    │
└─────┬──────┘
      │
      ├──────────────▶ PostgreSQL
      │                Lưu user/session/message
      │
      ├──────────────▶ MinIO
      │                Lưu ảnh + tạo presigned URL
      │
      ├──────────────▶ Redis
      │                Kiểm tra cache/token blacklist
      │
      ▼
┌────────────┐
│ AI Pipeline│
│ ViT + NLP  │
└─────┬──────┘
      │
      ▼
┌────────────┐
│ FastAPI    │
│ Response   │
└─────┬──────┘
      │ REST JSON hoặc SSE stream
      ▼
┌────────────┐
│ React UI   │
│ Render kết │
│ quả        │
└────────────┘
```
