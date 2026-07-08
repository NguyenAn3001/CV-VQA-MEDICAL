# Tasks sắp làm

> ## Hướng dẫn cho Agent khi bắt đầu
>
> 1. **Đọc** `agents/AGENTS.md` — hiểu kiến trúc project
> 2. **Đọc** `agents/workflow.md` — hiểu quy trình làm việc
> 3. **Đọc file này** — biết task cần làm
> 4. Lên plan → Thực thi → Ghi `agents/changelog.md` → Cập nhật file này

---

## Danh sách task

### 9. Copy message button

### Mô tả

**Business**: Cho phép người dùng copy nội dung của từng tin nhắn assistant để dễ dàng sao chép kết quả chẩn đoán, phân tích sang nơi khác.

**Approach**: Frontend-only. Thêm icon `Copy` từ lucide-react vào component `AssistantMessage`. Click -&gt; gọi `navigator.clipboard.writeText()` -&gt; hiển thị icon `Check` trong 2 giây.

### File cần sửa

- `frontend/src/components/chat/message/AssistantMessage.tsx` — Thêm button Copy bên dưới nội dung message, state copied/saved

### Yêu cầu kiểm thử

- [ ] Click Copy -&gt; nội dung message được copy vào clipboard

- [ ] Icon chuyển thành Check trong 2s rồi quay lại Copy

- [ ] Không copy phần tool calls, chỉ copy nội dung markdown clean

- Branch:
- Plan:
- Status: Todo
- Created: 2026-07-08 10:58

### 10. Tìm kiếm chat sessions trong Sidebar

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

### 11. Fix RightSidebar mobile — không đóng được

### Mô tả

**Business**: Trên mobile, RightSidebar không thể đóng bằng nút X hoặc tap backdrop vì `isVisible = isOpen || isMobileOpen`, trong đó `isOpen` (`isRightSidebarOpen`) được persist trong localStorage và không được reset khi đóng mobile.

**Approach**: Frontend-only.

- Nút X + backdrop click: gọi thêm `toggleRightSidebar()` để set `isRightSidebarOpen = false`
- Khi resize từ desktop → mobile: tự động set `isRightSidebarOpen = false`

### File cần sửa

- `frontend/src/components/chat/RightSidebar.tsx` — Mobile close button + backdrop: thêm `toggleRightSidebar()`; resize handler: set `isRightSidebarOpen = false`

### Yêu cầu kiểm thử

- [ ] Mở sidebar trên desktop → resize xuống mobile → sidebar tự đóng
- [ ] Mở sidebar trên mobile → nhấn X hoặc tap backdrop → sidebar đóng hẳn
- [ ] `isRightSidebarOpen` trong store = false sau khi đóng trên mobile

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

---
