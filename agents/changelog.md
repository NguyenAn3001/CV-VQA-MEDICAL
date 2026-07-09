# Changelog

> File này ghi lại toàn bộ thay đổi trong quá trình phát triển.
> Mỗi entry gồm: ngày giờ, task, danh sách file thêm/sửa/xóa kèm mô tả ngắn.

---

## 2026-07-08 00:59 — Triển khai Profile API

### Thêm mới
- `app/api/profile.py` — Router với 3 endpoints: GET/PUT /api/v1/profile, POST /api/v1/profile/avatar
- `tests/integration/test_profile_api.py` — 7 test cases cho profile API
- `plans/profile_implementation.md` — Plan chi tiết trước khi implement
- `plans/workflow.md` — Workflow hướng dẫn AI agent

### Sửa đổi
- `app/db/models.py` — Thêm 4 cột nullable vào User: full_name, avatar_url, bio, specialty
- `app/schemas/user.py` — Thêm UserProfileResponse (12 fields) + UserProfileUpdate (3 fields optional)
- `app/services/user_service.py` — Thêm 3 methods: get_profile, update_profile, update_avatar (MinIO upload)
- `app/main.py` — Import + include profile_router với prefix /api/v1/profile
- `AGENTS.md` — Cập nhật kiến trúc đầy đủ (tree thư mục, endpoints, service pattern, MinIO)
- `tests/conftest.py` — Mở rộng dummy user (thêm profile fields) + mock ML pipeline để chạy test không cần torch

### Xóa
- *(không có)*

### Kết quả kiểm thử
- `test_profile_api.py`: 7/7 passed ✅
- `test_api_endpoints.py`: 7/8 passed (1 pre-existing lỗi metrics trên Windows)

---

## 2026-07-08 01:36 — Kết nối React ProfilePage với Profile API

### Thêm mới
- `frontend/src/hooks/useProfile.ts` — Hook React: fetchProfile, updateProfile, uploadAvatar (gọi 3 endpoints backend)

### Sửa đổi
- `frontend/src/types/models.d.ts` — Thêm 7 field vào interface User: full_name, avatar_url, bio, specialty, must_change_password, created_at, updated_at
- `frontend/src/types/api.d.ts` — Thêm ProfileResponse (12 fields) + ProfileUpdate (3 fields optional)
- `frontend/src/pages/profile/ProfilePage.tsx` — Rewrite: fetch real profile data on mount, edit dialog (Dialog + Input từ shadcn), avatar upload via click (Camera icon overlay), hiển thị avatar img, bio, specialty, member since date

### Kết quả kiểm thử
- `npx tsc --noEmit` — 0 errors
- `npm run build` — success

### Ghi chú
- Plan lẽ ra phải được tạo trước khi code theo workflow, nhưng bị bỏ qua. Đã tạo bù: `agents/plans/2026-07-08_0136-frontend-connect-profile-api.md`
- Workflow đã được cập nhật: bước "Lên plan" giờ bắt buộc phải **lưu plan ra file**

---

## 2026-07-08 01:50 — Fix workflow: bổ sung các quy tắc còn thiếu

### Vấn đề phát hiện
1. **Thiếu bước lưu plan**: Workflow cũ chỉ nói "lên plan" nhưng không yêu cầu lưu ra file → task frontend profile bị code trước khi có plan
2. **Timestamp làm tròn**: Plan filename và changelog dùng giờ làm tròn (`02:00`) thay vì giờ chính xác (`01:36`)
3. **Không xoá task cũ**: Task đã hoàn thành vẫn nằm trong `tasks.md` gây nhiễu

### Sửa đổi
- `agents/workflow.md` — Bổ sung:
  - Bước "Lên plan" → bắt buộc **lưu plan ra file** (`agents/plans/YYYY-MM-DD_HHMM-ten-task.md`)
  - Bước "Thực thi" → phải **làm theo plan** đã lưu
  - Bước "Xoá task hoàn thành" → xoá hẳn hoặc chuyển xuống mục ✅
  - Test command → ưu tiên dùng venv nếu có
- `agents/plans/*.md` — Rename: thêm timestamp chính xác (dùng `CreationTime` thực tế)
- `agents/changelog.md` — Sửa timestamp từ `01:00`/`02:00` → `00:59`/`01:36` (giờ thực tế)
- `agents/tasks.md` — Xoá task frontend profile đã hoàn thành

### Kết quả
- Workflow giờ đã đầy đủ: Plan → Lưu file → Code theo plan → Test → Ghi changelog → Xoá task
- Tất cả timestamp dùng giờ chính xác, không làm tròn
- `agents/tasks.md` chỉ chứa task chưa làm

---

## 2026-07-08 01:59 — Tạo 7 OpenCode skills

### Thêm mới
- `.agents/skills/add-task/SKILL.md` — Thêm task mới vào agents/tasks.md
- `.agents/skills/start-task/SKILL.md` — Lấy task đầu → plan → code → test → changelog → ✅
- `.agents/skills/write-commit/SKILL.md` — Tạo commit message tiếng Việt từ changelog
- `.agents/skills/review-code/SKILL.md` — Review code changes, kiểm tra pattern/import
- `.agents/skills/run-tests/SKILL.md` — Auto-detect venv + pytest + phân tích kết quả
- `.agents/skills/fix-migration/SKILL.md` — Auto-generate + clean Alembic migration
- `.agents/skills/update-agents/SKILL.md` — Quét API mới → cập nhật AGENTS.md

---

## 2026-07-08 02:02 — Nâng cấp skill add-task thành Tech Lead

### Sửa đổi
- `.agents/skills/add-task/SKILL.md` — Rewrite toàn bộ: đọc codebase trước → hỏi 2-3 câu → phân tích → ghi task; template mới Business/Approach/Ghi chú

---

## 2026-07-08 02:03 — Sửa skill write-commit: chỉ đưa ra message, không tự commit

### Sửa đổi
- `.agents/skills/write-commit/SKILL.md` — Thêm HARD RULES cấm tuyệt đối mọi shell command, chỉ output message

---

## 2026-07-08 02:37 — Fix migration: thêm bảng system_settings và model_providers

### Thêm mới
- `alembic/versions/1e451916435f_add_system_settings_and_model_providers_.py` — Migration tạo 2 bảng còn thiếu

### Kết quả
- Server startup không còn lỗi `UndefinedTableError`
- `init_db` chạy thành công: system settings initialized, default provider created

---

## 2026-07-08 02:10 — Thêm frontend vào AGENTS.md + cập nhật workflow.md

### Sửa đổi
- `agents/AGENTS.md` — Thêm mục Frontend Overview: tech stack, directory tree, routing, state management, API client, types, hooks pattern
- `agents/workflow.md` — Cập nhật cấu trúc thư mục gồm cả `frontend/` và `app/` backend chi tiết

---

## 2026-07-08 10:58 — Bookmark/Pin chat sessions

### Thêm mới
- `alembic/versions/8b469f808fd1_add_is_pinned_to_chat_sessions.py` — Migration thêm column is_pinned vào chat_sessions
- `tests/integration/test_pin_session.py` — 5 test cases cho pin/unpin API
- `frontend/src/types/api.d.ts` — Thêm PinSessionRequest type

### Sửa đổi
- `app/db/models.py` — Thêm is_pinned (Boolean, default=False) vào ChatSession model
- `app/schemas/chat.py` — Thêm is_pinned vào ChatSessionResponse, AdminChatSessionResponse; thêm PinSessionRequest schema
- `app/services/chat_service.py` — Thêm toggle_pin_session method; get_user_sessions order by is_pinned DESC
- `app/api/chat.py` — Thêm PATCH /sessions/{session_id}/pin endpoint
- `frontend/src/types/models.d.ts` — Thêm is_pinned field vào ChatSession interface
- `frontend/src/store/chatStore.ts` — Thêm togglePin action + PinSessionRequest import
- `frontend/src/components/layout/Sidebar.tsx` — Thêm Pinned section riêng, pin/unpin button mỗi session

### Kết quả kiểm thử
- Backend: 5/5 pin tests passed ✅ (27 tests total: 24 passed, 3 pre-existing failures)
- Frontend: `npx tsc --noEmit` — 0 errors ✅
- Frontend: `npm run build` — success ✅

---

## 2026-07-08 13:34 — Overhaul start-task: thêm Git branch & PR workflow

### Thêm mới
- `.agents/skills/start-task/SKILL.md` — Rewrite: 11-step workflow (Pre-flight → Context → Branch → Plan → Code → Test → Changelog → Commit → PR → Mark done → Report)
- `agents/plans/2026-07-08_1334-overhaul-start-task-skill.md` — Plan cho thay đổi này

### Sửa đổi
- `.agents/skills/start-task/SKILL.md` — Workflow mới:
  - Step 0: Pre-flight checks (git status, branch, gh CLI)
  - Step 1: Read context (xác định task)
  - Step 2: Create branch từ main (git pull --ff-only, infer prefix)
  - Step 3-6: Plan → Code → Test → Changelog
  - Step 7: Commit & Push (git add -A, write-commit, git push -u origin HEAD)
  - Step 8: Create PR (conditional, chỉ khi gh available)
  - Step 9: Update tasks.md metadata
  - Step 10: Hỏi checkout main
  - Step 11: Report
  - Git guards: kiểm tra branch trước mọi git command
- `agents/tasks.md` — Thêm metadata fields (Branch, Plan, Status, Created, Completed) cho tất cả tasks

### Kết quả
- start-task skill: sẵn sàng cho production workflow
- tasks.md: task registry với metadata (Branch, Plan, Status, timestamps)

---

## 2026-07-08 14:06 — Right Sidebar: Danh sách câu hỏi trong Conversation

### Thêm mới
- `frontend/src/components/chat/RightSidebar.tsx` — Component Right Sidebar: lọc user messages, click scrollIntoView, responsive (mobile toggle)

### Sửa đổi
- `frontend/src/components/chat/ChatWindow.tsx` — Bọc mỗi ChatMessage trong `<div data-message-id>` để RightSidebar scroll đến
- `frontend/src/pages/chat/ChatPage.tsx` — Thêm RightSidebar, flex layout ChatWindow + RightSidebar

### Kết quả kiểm thử
- `npx tsc --noEmit` — 0 errors ✅
- `npm run build` — success ✅

---

## 2026-07-08 14:44 — Fix: Sidebar không load sessions khi ở Profile Page

### Sửa đổi
- `frontend/src/pages/chat/ChatPage.tsx` — Xoá `useEffect` gọi `fetchSessions()` khi mount (giữ trong `handleSend`)
- `frontend/src/components/layout/AppLayout.tsx` — Thêm `useEffect` gọi `fetchSessions()` khi mount để sidebar luôn có data

### Kết quả kiểm thử
- `npx tsc --noEmit` — 0 errors ✅
- `npm run build` — success ✅

---

## 2026-07-08 15:09 — Hiển thị model đang dùng động thay hardcode

### Sửa đổi
- `app/schemas/chat.py` — Thêm `model: Optional[str]` vào `ChatSessionDetailResponse`
- `app/services/chat_service.py` — `get_session_detail()` fetch default provider model từ DB
- `frontend/src/types/models.d.ts` — Thêm `model?: string` vào `ChatSession`
- `frontend/src/pages/chat/ChatPage.tsx` — Navbar subtitle dùng `activeSession.model`
- `frontend/src/components/chat/RightSidebar.tsx` — Model hiển thị từ `sessionDetail.model`
- `frontend/src/components/chat/SessionDetailModal.tsx` — Model hiển thị từ `detail.model`

### Kết quả kiểm thử
- Backend: 24/27 passed (3 pre-existing failures)
- Frontend: `npx tsc --noEmit` — 0 errors ✅
- Frontend: `npm run build` — success ✅

---

## 2026-07-08 17:01 — Copy message button

### Sửa đổi
- `frontend/src/components/chat/message/AssistantMessage.tsx` — Thêm Copy button dùng `navigator.clipboard.writeText(cleanText)`, hiển thị Check icon 2s

### Kết quả kiểm thử
- `npx tsc --noEmit` — 0 errors ✅
- `npm run build` — success ✅

---

## 2026-07-09 23:34 — Tự động đặt tên cuộc trò chuyện dựa trên tin nhắn đầu tiên

### Sửa đổi
- `app/services/chat_service.py` — `prepare_message_and_context` returns `new_title`; `get_sse_stream` yields `title_changed` SSE event; fallback extract 8 words from message if LLM fails
- `app/api/chat.py` — Pipe `new_title` từ prepare_message_and_context sang get_sse_stream
- `frontend/src/store/chatStore.ts` — Thêm action `updateSessionTitleLocally(id, title)`
- `frontend/src/hooks/useSSEChat.ts` — Parse event `title_changed`, gọi `updateSessionTitleLocally`

### Kết quả kiểm thử
- `npx tsc --noEmit` — 0 errors ✅
- `npm run build` — success ✅

---

## 2026-07-09 22:44 — Fix RightSidebar mobile — không đóng được

### Sửa đổi
- `frontend/src/store/chatStore.ts` — Thêm action `setRightSidebarOpen(open: boolean)`
- `frontend/src/components/chat/RightSidebar.tsx` — Sửa root cause: `isVisible = isOpen` (bỏ `|| isMobileOpen`); resize < 1024px gọi `setRightSidebarOpen(false)`; nút X + backdrop + floating button dùng `setRightSidebarOpen` thay `setIsMobileOpen`

### Kết quả kiểm thử
- `npx tsc --noEmit` — 0 errors ✅
- `npm run build` — success ✅
