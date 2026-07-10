# Tasks đã hoàn thành

> **Template cho mỗi task** (ghi chính xác format này khi thêm task mới vào cuối file):
>
> ```markdown
> ### N. Tên Task
> 
> Mô tả: Mục đích của task
> 
> - `path/to/file` — Mô tả thay đổi
> - Branch: feat/xxx
> - Plan: agents/plans/YYYY-MM-DD_HHMM-task-name.md
> - Status: Done
> - Created: YYYY-MM-DD
> - Completed: YYYY-MM-DD
> ```
>
> **Quy tắc:**
> - Luôn **append** task mới hoàn thành vào **cuối file**, không chèn giữa
> - Số thứ tự (N) theo đúng thứ tự tạo, không cần re-sort
> - Cách 1 dòng trống giữa các task

---

### 1. Kết nối ProfilePage với Profile API

Mô tả: Kết nối trang profile frontend với backend API để user có thể xem và chỉnh sửa thông tin cá nhân

- `frontend/src/hooks/useProfile.ts` — Hook mới
- `frontend/src/types/models.d.ts` — Thêm profile fields
- `frontend/src/types/api.d.ts` — Thêm ProfileResponse, ProfileUpdate
- `frontend/src/pages/profile/ProfilePage.tsx` — Fetch API, edit dialog, avatar upload
- Branch: feat/connect-profile-api
- Plan: agents/plans/2026-07-08_0136-frontend-connect-profile-api.md
- Status: Done
- Created: 2026-07-08 01:36
- Completed: 2026-07-08 01:50

### 2. Triển khai Profile API (Backend)

Mô tả: Xây dựng backend endpoints GET/PUT profile và upload avatar, thêm cột full_name, avatar_url, bio, specialty vào User model

- `app/api/profile.py` — 3 endpoints GET/PUT /api/v1/profile + POST /api/v1/profile/avatar
- `tests/integration/test_profile_api.py` — 7 tests ✅
- `app/db/models.py` — Thêm 4 cột: full_name, avatar_url, bio, specialty
- `app/schemas/user.py` — UserProfileResponse, UserProfileUpdate
- `app/services/user_service.py` — get_profile, update_profile, update_avatar
- `alembic/versions/a084f72eb1f0` — Migration thêm 4 cột
- Branch: main (direct)
- Plan: agents/plans/2026-07-08_0059-profile_implementation.md
- Status: Done
- Created: 2026-07-08 00:59
- Completed: 2026-07-08 01:36

### 3. Tạo 7 OpenCode skills

Mô tả: Tạo bộ skills cho OpenCode agent: add-task, start-task, write-commit, review-code, run-tests, fix-migration, update-agents

- `.agents/skills/add-task/SKILL.md`
- `.agents/skills/start-task/SKILL.md`
- `.agents/skills/write-commit/SKILL.md`
- `.agents/skills/review-code/SKILL.md`
- `.agents/skills/run-tests/SKILL.md`
- `.agents/skills/fix-migration/SKILL.md`
- `.agents/skills/update-agents/SKILL.md`
- Branch: main (direct)
- Status: Done
- Created: 2026-07-08 01:59
- Completed: 2026-07-08 02:02

### 4. Fix migration: thêm bảng system_settings và model_providers

Mô tả: Tạo Alembic migration để thêm 2 bảng SystemSetting và ModelProvider, fix lỗi UndefinedTableError khi start server

- `alembic/versions/1e451916435f_add_system_settings_and_model_providers_.py` — Migration mới
- Server startup không còn lỗi `UndefinedTableError`
- Branch: main (direct)
- Status: Done
- Created: 2026-07-08 02:37
- Completed: 2026-07-08 02:40

### 5. Đánh dấu (Bookmark/Pin) cuộc trò chuyện

Mô tả: Cho phép user ghim/pin cuộc trò chuyện lên đầu danh sách, hiển thị pinned section riêng trong sidebar

- `app/db/models.py` — Thêm is_pinned column vào ChatSession
- `alembic/versions/8b469f808fd1_add_is_pinned_to_chat_sessions.py` — Migration
- `app/schemas/chat.py` — Thêm is_pinned vào response schemas + PinSessionRequest
- `app/services/chat_service.py` — toggle_pin_session + pin-first ordering
- `app/api/chat.py` — PATCH /sessions/{session_id}/pin endpoint
- `tests/integration/test_pin_session.py` — 5 tests ✅
- `frontend/src/types/models.d.ts` — Thêm is_pinned vào ChatSession
- `frontend/src/types/api.d.ts` — Thêm PinSessionRequest
- `frontend/src/store/chatStore.ts` — togglePin action
- `frontend/src/components/layout/Sidebar.tsx` — Pinned section + pin/unpin buttons
- Branch: main (direct)
- Plan: agents/plans/2026-07-08_0140-pin-chat-session.md
- Status: Done
- Created: 2026-07-08 10:58
- Completed: 2026-07-08 11:30

### 6. Right Sidebar: Danh sách câu hỏi trong Conversation

Mô tả: Thêm Right Sidebar hiển thị danh sách câu hỏi của user trong conversation, click để scroll tới message tương ứng

- `frontend/src/components/chat/RightSidebar.tsx` — Component Right Sidebar: lọc user messages, click scrollIntoView, responsive
- `frontend/src/components/chat/ChatWindow.tsx` — Thêm data-message-id wrapper
- `frontend/src/pages/chat/ChatPage.tsx` — Tích hợp RightSidebar, flex layout
- Branch: feat/right-sidebar-question-history
- Plan: agents/plans/2026-07-08_1406-right-sidebar-question-list.md
- Status: Done
- Created: 2026-07-08 10:58
- Completed: 2026-07-08 14:06

### 7. Fix: Sidebar không load sessions khi ở Profile Page

Mô tả: Fix bug sidebar không load danh sách chat sessions khi user ở Profile Page, chuyển fetchSessions lên AppLayout

- `frontend/src/pages/chat/ChatPage.tsx` — Xoá `fetchSessions` khỏi `useEffect` mount (giữ trong `handleSend`)
- `frontend/src/components/layout/AppLayout.tsx` — Thêm `useEffect` gọi `fetchSessions()` khi mount
- Branch: fix/sidebar-sessions-profile-page
- Plan: agents/plans/2026-07-08_1444-fix-sidebar-sessions-profile-page.md
- Status: Done
- Created: 2026-07-08 10:58
- Completed: 2026-07-08 14:44

### 8. Hiển thị model đang dùng động thay vì hardcode "GPT-4o + Medical"

Mô tả: Lấy model name từ DB (ModelProvider.default) thay vì hardcode, hiển thị động trên Navbar, RightSidebar, SessionDetailModal

- `app/schemas/chat.py` — Thêm `model: Optional[str]` vào `ChatSessionDetailResponse`
- `app/services/chat_service.py` — `get_session_detail()` fetch default provider model từ DB
- `frontend/src/types/models.d.ts` — Thêm `model?: string` vào `ChatSession`
- `frontend/src/pages/chat/ChatPage.tsx` — Navbar subtitle dùng `activeSession.model`
- `frontend/src/components/chat/RightSidebar.tsx` — Model hiển thị từ `sessionDetail.model`
- `frontend/src/components/chat/SessionDetailModal.tsx` — Model hiển thị từ `detail.model`
- Branch: feat/dynamic-model-display
- Plan: agents/plans/2026-07-08_1509-dynamic-model-display.md
- Status: Done
- Created: 2026-07-08 10:58
- Completed: 2026-07-08 15:15

### 9. Copy message button

Mô tả: Thêm nút Copy cho tin nhắn assistant, copy nội dung markdown vào clipboard, hiển thị Check icon trong 2s

- `frontend/src/components/chat/message/AssistantMessage.tsx` — Thêm Copy button với clipboard API, Check icon 2s
- Branch: feat/copy-message-button
- Plan: agents/plans/2026-07-08_1700-copy-message-button.md
- Status: Done
- Created: 2026-07-08 10:58
- Completed: 2026-07-08 17:01

### 10. Tự động đặt tên cuộc trò chuyện dựa trên tin nhắn đầu tiên

Mô tả: Dùng LLM để tự động sinh title cho cuộc trò chuyện từ tin nhắn đầu tiên, tránh cuộc trò chuyện không tên

- Branch: feat/auto-chat-title
- Plan: agents/plans/2026-07-09_2334-auto-chat-title.md
- Status: Done
- Created: 2026-07-08
- Completed: 2026-07-09 23:34

### 11. Tìm kiếm chat sessions trong Sidebar

Mô tả: Thêm ô tìm kiếm trong sidebar để filter chat sessions theo tên, debounce 300ms, ẩn pin button và message count khi search

- `frontend/src/store/chatStore.ts` — Thêm `searchQuery: string` + `setSearchQuery(query: string)`
- `frontend/src/components/layout/Sidebar.tsx` — Search input debounce 300ms, filter sessions, clear button; msg count + pin button `hidden` thay `opacity-0`; redesign theo design-taste-frontend
- Branch: feat/search-chat-sessions
- Plan: agents/plans/2026-07-10_1126-search-chat-sessions.md
- Status: Done
- Created: 2026-07-08 10:58
- Completed: 2026-07-10

### 12. Fix RightSidebar mobile — không đóng được

Mô tả: Fix lỗi RightSidebar không đóng được trên mobile, sửa logic visibility, thêm backdrop + floating button, resize handler

- `frontend/src/store/chatStore.ts` — Thêm action `setRightSidebarOpen(open: boolean)`
- `frontend/src/components/chat/RightSidebar.tsx` — `isVisible = isOpen` (bỏ `|| isMobileOpen`); resize < 1024px gọi `setRightSidebarOpen(false)`; nút X + backdrop + floating button dùng `setRightSidebarOpen`
- Branch: fix/rightsidebar-mobile-close
- Plan: agents/plans/2026-07-09_2244-fix-rightsidebar-mobile-close.md
- Status: Done
- Created: 2026-07-08
- Completed: 2026-07-09 22:44

### 13. Hiển thị thời gian tin nhắn

Mô tả: Hiển thị thời gian gửi (created_at) cho mỗi tin nhắn user và assistant trong chat, format HH:mm, tooltip full datetime

- `frontend/src/lib/format.ts` — Thêm `formatTimestamp(iso: string): string` dùng `date-fns` format "HH:mm" (tooltip full datetime)
- `frontend/src/hooks/useSSEChat.ts` — Gán `created_at: new Date().toISOString()` vào userMessage và assistantMessage
- `frontend/src/components/chat/message/ChatMessage.tsx` — Truyền `message.created_at` xuống `UserMessage` / `AssistantMessage`
- `frontend/src/components/chat/message/UserMessage.tsx` — Hiển thị timestamp dưới bubble, căn phải, text-xs text-slate-400
- `frontend/src/components/chat/message/AssistantMessage.tsx` — Hiển thị timestamp dưới content, căn trái, text-xs text-slate-400
- Branch: feat/message-timestamp
- Plan: agents/plans/2026-07-10_1259-message-timestamp.md
- Status: Done
- Created: 2026-07-10
- Completed: 2026-07-10
