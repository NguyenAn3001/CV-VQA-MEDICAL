# Tasks sắp làm

> ## Hướng dẫn cho Agent khi bắt đầu
>
> 1. **Đọc** `agents/AGENTS.md` — hiểu kiến trúc project
> 2. **Đọc** `agents/workflow.md` — hiểu quy trình làm việc
> 3. **Đọc file này** — biết task cần làm
> 4. Lên plan → Thực thi → Ghi `agents/changelog.md` → Cập nhật file này

---

## Danh sách task

### 10. Tự động đặt tên cuộc trò chuyện dựa trên tin nhắn đầu tiên

### Mô tả

**Business**: Hiện tại session mới luôn có title "New Session"/"New Chat", gây khó khăn khi tìm lại cuộc trò chuyện cũ.

**Approach**: Backend đã có title generation khi gửi message đầu tiên (`chat_service.py:193-197` gọi `llm_orchestrator.generate_title()`). Việc cần làm:

1. **BE**: Đưa title mới vào SSE stream dưới dạng event riêng (`event: title_changed`) để FE cập nhật real-time
2. **FE**: Parse event `title_changed` trong `useSSEChat.ts`, update session title trong `chatStore`
3. **Tối ưu**: Nếu LLM fail, fallback về extract N từ đầu message (không để title "New Session" mãi)

### File cần sửa

- `app/services/chat_service.py` — Sau khi `generate_title()` thành công, yield SSE event `title_changed` với data = `{session_id, title}`
- `frontend/src/hooks/useSSEChat.ts` — Parse event `title_changed`, gọi `updateSessionTitleLocally(sessionId, title)` 
- `frontend/src/store/chatStore.ts` — Thêm action `updateSessionTitleLocally(id, title)` chỉ update store không gọi API

### File cần tạo mới

- *(không có)*

### Yêu cầu kiểm thử

- [ ] Gửi tin nhắn đầu tiên → title trong sidebar cập nhật ngay (không cần reload)
- [ ] Title là tiếng Việt có dấu, ≤ 5 từ
- [ ] Nếu LLM fail → fallback extract 8 từ đầu message
- [ ] Session đã rename thủ công → không bị ghi đè

### Ghi chú
- LLM generate_title đã có sẵn ở `llm_orchestrator.py:50-62`
- Trigger hiện tại: `chat_service.py:193-197` (sau save_message đầu tiên)
- Cần trả title về FE real-time vì fetchSessions() chỉ gọi khi mount hoặc gửi tin nhắn mới
- Pre-requisite: task này phải làm sau task 12 (Fix RightSidebar mobile) để tránh conflict

- Branch:
- Plan:
- Status: Todo
- Created: 2026-07-08

### 11. Tìm kiếm chat sessions trong Sidebar

### Mô tả

**Business**: Khi người dùng có nhiều phiên trò chuyện, cần thanh tìm kiếm để filter sessions theo title giúp tìm nhanh cuộc trò chuyện cũ.

**Approach**: Frontend-only. Thêm `searchQuery` state vào store, render input Search ở đầu danh sách session trong Sidebar. Filter cục bộ bằng `String.includes()`. Debounce 300ms.

### File cần sửa

- `frontend/src/store/chatStore.ts` — Thêm `searchQuery: string` + `setSearchQuery(query: string)`
- `frontend/src/components/layout/Sidebar.tsx` — Thêm input search, filters session list, clear button

### Yêu cầu kiểm thử

- [ ] Input search hiển thị ở đầu danh sách session

- [ ] Gõ text -&gt; danh sách filter theo title (case-insensitive)

- [ ] Clear button xoá searchQuery và hiện lại full list

- Branch:
- Plan:
- Status: Todo
- Created: 2026-07-08 10:58

### 12. Fix RightSidebar mobile — không đóng được

### Mô tả

**Business**: RightSidebar trên mobile không thể đóng vì `isRightSidebarOpen` (store, persisted) default `true` và nút X/backdrop chỉ set local `isMobileOpen = false`, không reset store → `isVisible = isOpen || isMobileOpen` luôn `true`.

**Approach**: Frontend-only.

- **Root cause**: `isVisible` (RightSidebar.tsx:69) = `isOpen || isMobileOpen`. `isOpen` (`isRightSidebarOpen`) persist trong localStorage, default `true`. Nút X + backdrop chỉ `setIsMobileOpen(false)` → `isVisible` vẫn `true`.
- Thiếu action `setRightSidebarOpen(value)` trong store (chỉ có `toggleRightSidebar`)
- Khi resize desktop→mobile, không reset `isRightSidebarOpen`

### File cần sửa

- `frontend/src/store/chatStore.ts` — Thêm action `setRightSidebarOpen: (open: boolean) => void`
- `frontend/src/components/chat/RightSidebar.tsx`
  - Nút X (mobile): gọi `setRightSidebarOpen(false)` + `setIsMobileOpen(false)`
  - Backdrop click: gọi `setRightSidebarOpen(false)` + `setIsMobileOpen(false)`
  - Resize handler (line 29): khi `window.innerWidth < 1024`, gọi `setRightSidebarOpen(false)`
  - Đơn giản hoá: `isVisible` = `isOpen` (không cần `|| isMobileOpen` nữa)

### File cần tạo mới

- *(không có)*

### Yêu cầu kiểm thử

- [ ] Mở sidebar trên desktop → resize xuống mobile → sidebar tự đóng, `isRightSidebarOpen = false`
- [ ] Mở sidebar trên mobile (qua floating button) → nhấn X → sidebar đóng, `isRightSidebarOpen = false`
- [ ] Mở sidebar trên mobile → tap backdrop → sidebar đóng, `isRightSidebarOpen = false`
- [ ] Refresh trang ở mobile → sidebar không tự mở lại
- [ ] Desktop: toggle Navbar button vẫn hoạt động bình thường

### Ghi chú
- `isRightSidebarOpen` persist cùng với `isSidebarCollapsed` (chatStore.ts:187)
- Chỉ có `toggleRightSidebar` hiện tại → cần thêm `setRightSidebarOpen` để imperative close
- Không ảnh hưởng đến desktop flow (Navbar toggle vẫn dùng `toggleRightSidebar`)

- Branch:
- Plan:
- Status: Todo
- Created: 2026-07-08

---

## ✅ Đã hoàn thành

### 1. Kết nối ProfilePage với Profile API

- `frontend/src/hooks/useProfile.ts` — Hook mới
- `frontend/src/types/models.d.ts` — Thêm profile fields
- `frontend/src/types/api.d.ts` — Thêm ProfileResponse, ProfileUpdate
- `frontend/src/pages/profile/ProfilePage.tsx` — Fetch API, edit dialog, avatar upload
- Build: ✅ `npx tsc --noEmit` + `npm run build`
- Branch: feat/connect-profile-api
- Plan: `agents/plans/2026-07-08_0136-frontend-connect-profile-api.md`
- Status: Done
- Created: 2026-07-08 01:36
- Completed: 2026-07-08 01:50

### 2. Triển khai Profile API (Backend)

- `app/api/profile.py` — 3 endpoints GET/PUT /api/v1/profile + POST /api/v1/profile/avatar
- `tests/integration/test_profile_api.py` — 7 tests ✅
- `app/db/models.py` — Thêm 4 cột: full_name, avatar_url, bio, specialty
- `app/schemas/user.py` — UserProfileResponse, UserProfileUpdate
- `app/services/user_service.py` — get_profile, update_profile, update_avatar
- `alembic/versions/a084f72eb1f0` — Migration thêm 4 cột
- Branch: main (direct)
- Plan: `agents/plans/2026-07-08_0059-profile_implementation.md`
- Status: Done
- Created: 2026-07-08 00:59
- Completed: 2026-07-08 01:36

### 3. Tạo 7 OpenCode skills

- `.agents/skills/add-task/SKILL.md`
- `.agents/skills/start-task/SKILL.md`
- `.agents/skills/write-commit/SKILL.md`
- `.agents/skills/review-code/SKILL.md`
- `.agents/skills/run-tests/SKILL.md`
- `.agents/skills/fix-migration/SKILL.md`
- `.agents/skills/update-agents/SKILL.md`
- Branch: main (direct)
- Plan:
- Status: Done
- Created: 2026-07-08 01:59
- Completed: 2026-07-08 02:02

### 4. Fix migration: thêm bảng system_settings và model_providers

- `alembic/versions/1e451916435f_add_system_settings_and_model_providers_.py` — Migration mới
- Server startup không còn lỗi `UndefinedTableError`
- Branch: main (direct)
- Plan:
- Status: Done
- Created: 2026-07-08 02:37
- Completed: 2026-07-08 02:40

### 5. Đánh dấu (Bookmark/Pin) cuộc trò chuyện

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
- Tests: 5/5 backend ✅, tsc 0 errors ✅, npm run build ✅
- Branch: main (direct)
- Plan: `agents/plans/2026-07-08_0140-pin-chat-session.md`
- Status: Done
- Created: 2026-07-08 10:58
- Completed: 2026-07-08 11:30

### 6. Right Sidebar: Danh sách câu hỏi trong Conversation

- `frontend/src/components/chat/RightSidebar.tsx` — Component Right Sidebar: lọc user messages, click scrollIntoView, responsive
- `frontend/src/components/chat/ChatWindow.tsx` — Thêm data-message-id wrapper
- `frontend/src/pages/chat/ChatPage.tsx` — Tích hợp RightSidebar, flex layout
- Tests: tsc 0 errors ✅, npm run build ✅
- Branch: feat/right-sidebar-question-history
- Plan: `agents/plans/2026-07-08_1406-right-sidebar-question-list.md`
- Status: Done
- Created: 2026-07-08 10:58
- Completed: 2026-07-08 14:06

### 7. Fix: Sidebar không load sessions khi ở Profile Page

- `frontend/src/pages/chat/ChatPage.tsx` — Xoá `fetchSessions` khỏi `useEffect` mount (giữ trong `handleSend`)
- `frontend/src/components/layout/AppLayout.tsx` — Thêm `useEffect` gọi `fetchSessions()` khi mount
- Tests: tsc 0 errors ✅, npm run build ✅
- Branch: fix/sidebar-sessions-profile-page
- Plan: `agents/plans/2026-07-08_1444-fix-sidebar-sessions-profile-page.md`
- Status: Done
- Created: 2026-07-08 10:58
- Completed: 2026-07-08 14:44

### 8. Hiển thị model đang dùng động thay vì hardcode "GPT-4o + Medical"

- `app/schemas/chat.py` — Thêm `model: Optional[str]` vào `ChatSessionDetailResponse`
- `app/services/chat_service.py` — `get_session_detail()` fetch default provider model từ DB
- `frontend/src/types/models.d.ts` — Thêm `model?: string` vào `ChatSession`
- `frontend/src/pages/chat/ChatPage.tsx` — Navbar subtitle dùng `activeSession.model`
- `frontend/src/components/chat/RightSidebar.tsx` — Model hiển thị từ `sessionDetail.model`
- `frontend/src/components/chat/SessionDetailModal.tsx` — Model hiển thị từ `detail.model`
- Branch: feat/dynamic-model-display
- Plan: agents/plans/2026-07-08_1509-dynamic-model-display.md
- Status: Done
- Started: 2026-07-08 15:09
- Completed: 2026-07-08 15:15

### 9. Copy message button

- `frontend/src/components/chat/message/AssistantMessage.tsx` — Thêm Copy button với clipboard API, Check icon 2s
- Tests: tsc 0 errors ✅, npm run build ✅
- Branch: feat/copy-message-button
- Plan: agents/plans/2026-07-08_1700-copy-message-button.md
- Status: Done
- Created: 2026-07-08 10:58
- Completed: 2026-07-08 17:01

---
