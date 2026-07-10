# Tasks sắp làm

> ## Hướng dẫn cho Agent khi bắt đầu
>
> 1. **Đọc** `agents/AGENTS.md` — hiểu kiến trúc project
> 2. **Đọc** `agents/workflow.md` — hiểu quy trình làm việc
> 3. **Đọc file này** — biết task cần làm
> 4. Lên plan → Thực thi → Ghi `agents/changelog.md` → Cập nhật file này
>
> **Template cho mỗi task:**
>
> ```markdown
> ### N. Tên Task
>
> Mô tả: Mục đích của task
>
> - `path/to/file` — Mô tả thay đổi
> - Branch: feat/xxx
> - Plan: agents/plans/YYYY-MM-DD_HHMM-task-name.md
> - Status: Pending
> - Created: YYYY-MM-DD
> ```
>
> Khi task hoàn thành → xoá khỏi file này → append vào cuối `agents/tasks-done.md`.

---

## Danh sách task

### 13. Hiển thị thời gian tin nhắn

Mô tả: Hiển thị thời gian gửi (created_at) cho mỗi tin nhắn user và assistant trong chat, format HH:mm, tooltip full datetime

- `frontend/src/lib/format.ts` — Thêm `formatTimestamp(iso: string): string` dùng `date-fns` format "HH:mm" (tooltip full datetime)
- `frontend/src/hooks/useSSEChat.ts` — Gán `created_at: new Date().toISOString()` vào `assistantMessage` khi stream hoàn tất
- `frontend/src/components/chat/message/ChatMessage.tsx` — Truyền `message.created_at` xuống `UserMessage` / `AssistantMessage`
- `frontend/src/components/chat/message/UserMessage.tsx` — Hiển thị timestamp dưới bubble, căn phải, text-xs text-muted
- `frontend/src/components/chat/message/AssistantMessage.tsx` — Hiển thị timestamp dưới content, căn trái, text-xs text-muted
- Branch: feat/message-timestamp
- Plan: agents/plans/2026-07-10_<time>-message-timestamp.md
- Status: Pending
- Created: 2026-07-10

### 14. Cải thiện Images section trong RightSidebar

Mô tả: Click ảnh trong RightSidebar mở modal xem ảnh (giống MessageImage.tsx), thêm eye icon để scroll tới message chứa ảnh đó, giữ nguyên download button

- `frontend/src/components/chat/RightSidebar.tsx` — Sửa `attachedImages` thành mảng `{ image_url, messageId }` để biết message gốc; thêm modal xem ảnh (reuse pattern từ MessageImage.tsx); thêm eye icon gọi scrollIntoView cho message chứa ảnh
- Branch: feat/rightsidebar-images
- Plan: agents/plans/2026-07-10_<time>-rightsidebar-images.md
- Status: Pending
- Created: 2026-07-10
