# Chương 4: Kiến trúc Logic & AI - Dự án CV VQA Medical

Chương này phân tích chi tiết về phần cốt lõi của dự án **CV-VQA-MEDICAL**, tập trung vào ba thành phần chính: Kiến trúc Pipeline Machine Learning (ML), Điều phối LLM (LLM Orchestration) và Logic Chat (Chat Logic).

---

## 4.1 Kiến trúc ML Pipeline (ML Pipeline Architecture)

Kiến trúc ML được thiết kế theo pattern **Singleton** (thông qua lớp `MedicalAIPipeline` trong `app/ml/inference.py`), đảm bảo các mô hình học sâu nặng (heavy models) chỉ được load vào RAM/VRAM một lần duy nhất khi khởi động ứng dụng, giúp tối ưu tài nguyên và tăng tốc độ suy luận.

Hệ thống hỗ trợ hai tác vụ chính dùng chung một bộ trích xuất đặc trưng hình ảnh (Shared ViT Model):

### 4.1.1 Visual Question Answering (VQA)
- **Mô hình nền tảng**: Sử dụng **ViT (Vision Transformer)** để trích xuất đặc trưng ảnh và **PubMedBERT** (chuyên ngành y tế) để mã hóa câu hỏi văn bản.
- **Kiến trúc dung hợp (`ViT_PubMedBERT_VQA` trong `architecture.py`)**: 
  - Backbone của ViT và PubMedBERT được đóng băng (frozen) trong quá trình suy luận.
  - Lấy token `[CLS]` từ cả hai mô hình, nối (concatenate) lại với nhau.
  - Đưa qua một khối MLP (Multi-Layer Perceptron) bao gồm các lớp `Linear`, `LayerNorm`, `GELU`, và `Dropout` để dự đoán xác suất của danh sách các câu trả lời y tế đã định nghĩa trước.
- **Quy trình suy luận**: 
  - Ảnh được xử lý qua `AutoImageProcessor`.
  - Văn bản được tokenized bởi `AutoTokenizer`.
  - Chạy mô hình và mapping chỉ mục đầu ra (index) với câu trả lời thực tế thông qua dictionary `idx2answer`.

### 4.1.2 Medical Image Captioning (Mô tả ảnh y tế)
- **Mô hình nền tảng**: Kết hợp **ViT** và **GPT-2**.
- **Kiến trúc dung hợp (`ViT_GPT2_Captioning`)**:
  - Dùng **Cross-Attention Fusion** (`CrossAttentionFusion`): Thay vì pooling thông thường, mô hình học các *visual queries* (truy vấn hình ảnh) để trích xuất thông tin trọng tâm từ tất cả các patch của ViT thông qua cơ chế Cross-Attention.
  - Các visual tokens sau đó được nối vào phía trước các token của câu văn (text embeddings) và đưa vào GPT-2.
- **Quy trình sinh chuỗi (Autoregressive)**:
  - Sinh từng từ một cho đến khi gặp token `<eos>` (end of sequence) hoặc đạt giới hạn `max_new_tokens`.

---

## 4.2 Điều phối LLM (LLM Orchestration)

Thành phần `LLMOrchestrator` (`app/services/llm_orchestrator.py`) đóng vai trò như "bộ não" trung tâm, kết nối cuộc hội thoại tự nhiên của người dùng với các mô hình AI Y tế chuyên dụng.

- **Quản lý hội thoại & Prompt**: Nhận lịch sử chat từ cơ sở dữ liệu và format lại để truyền cho LLM. Tích hợp sẵn `SYSTEM_PROMPT` và các logic về `fallback_prompts` trong trường hợp sử dụng các LLM không hỗ trợ Function Calling (Tool calls) trực tiếp.
- **Tích hợp Công cụ (Tools)**: 
  - Hệ thống định nghĩa 2 tools chính: `VQA_TOOL_NAME` và `CAPTION_TOOL_NAME`.
  - Khi người dùng hỏi (ví dụ: "Có vấn đề gì trong ảnh X-quang này?"), LLM sẽ nhận diện và "gọi" công cụ VQA.
  - `LLMOrchestrator` chặn cuộc gọi này, kích hoạt `ai_pipeline.predict` hoặc `ai_pipeline.generate_caption` với ảnh hiện tại.
  - Kết quả từ ML model được đưa ngược lại cho LLM để nó tổng hợp thành một câu trả lời tự nhiên, thân thiện với người dùng.
- **Cơ chế Caching**: Tích hợp **Redis cache** (thông qua `redis_client`). Hàm băm của ảnh (SHA256) và câu hỏi được dùng làm khóa (key). Nếu một câu hỏi trên cùng một ảnh lặp lại, hệ thống sẽ lấy kết quả từ Cache thay vì chạy lại mô hình AI, giảm thiểu đáng kể thời gian phản hồi.
- **Tự động đặt tên**: Dùng LLM đẻ tự động sinh tiêu đề (title) ngắn gọn (tối đa 5 từ) dựa trên tin nhắn đầu tiên của người dùng.

---

## 4.3 Logic Chat (Chat Logic)

Lớp `ChatService` (`app/services/chat_service.py`) phụ trách quản lý luồng dữ liệu (data flow), lưu trữ và giao tiếp với frontend qua Server-Sent Events (SSE).

- **Quản lý Phiên & Tin nhắn (Session & Message)**:
  - Cho phép tạo, truy vấn, ghim (pin) và xóa chat session.
  - Tự động duy trì ngữ cảnh giới hạn (`MAX_CONVERSATION_HISTORY`) để tránh vượt quá token limit của LLM.
- **Xử lý Hình ảnh đa phương tiện (Multimodal)**:
  - Hàm `prepare_message_and_context` kiểm tra, xác thực và lưu hình ảnh tải lên vào **MinIO** (Object Storage).
  - Khéo léo giữ trạng thái ngữ cảnh: Nếu người dùng gửi câu hỏi mới nhưng không đính kèm ảnh, hệ thống sẽ tự động truy xuất ảnh gần nhất được gửi trong Session (qua hàm `get_latest_session_image`) để làm bối cảnh cho các câu lệnh VQA.
- **Luồng dữ liệu thời gian thực (Streaming SSE)**:
  - Sử dụng generator `get_sse_stream` để truyền từng mảnh dữ liệu (chunk) từ `LLMOrchestrator` về cho người dùng ngay lập tức, tạo cảm giác phản hồi mượt mà.
  - Nó phát các sự kiện (events) đa dạng: `title_changed` (cập nhật tên chat), `tool_call` (báo cho frontend biết AI đang phân tích ảnh), và `message` (nội dung text).
  - Lưu kết quả trả lời của trợ lý (bao gồm cả các công cụ đã sử dụng) vào Database ở chế độ chạy nền (background) sau khi stream kết thúc.

---

### Tổng kết kiến trúc
Dự án áp dụng mô hình **Agentic LLM / Tool-use**. Thay vì đào tạo một mô hình VLM (Vision Language Model) khổng lồ, dự án sử dụng một mô hình LLM mạnh (như GPT-4o, Gemini) làm tác nhân (Agent). Tác nhân này được trang bị các "công cụ" là các mô hình AI Y tế chuyên biệt, kích thước gọn nhẹ hơn (`ViT`, `PubMedBERT`) để xử lý các tác vụ về thị giác máy tính trong y khoa. Kiến trúc này mang lại sự linh hoạt, dễ mở rộng và tiết kiệm chi phí tính toán.
