# Tasks sắp làm

> ## Hướng dẫn cho Agent khi bắt đầu
> 1. **Đọc `agents/AGENTS.md`** — hiểu kiến trúc project
> 2. **Đọc `agents/workflow.md`** — hiểu quy trình làm việc
> 3. **Đọc file này** — biết task cần làm
> 4. Lên plan → Thực thi → Ghi `agents/changelog.md` → Cập nhật file này

---

## Danh sách task

## 5. Hiển thị danh sách câu hỏi trước đó ở Right Sidebar của Conversation

### Mô tả
**Business**: Giúp người dùng dễ dàng theo dõi, xem nhanh và điều hướng (cuộn đến) các câu hỏi mình đã gửi trong phiên trò chuyện hiện tại thông qua danh sách hiển thị ở một sidebar bên phải.
**Approach**:
- Frontend: Thiết kế và tích hợp một Right Sidebar mới vào giao diện Conversation. Lọc các tin nhắn có `role='user'` từ danh sách tin nhắn của session hiện tại để hiển thị. Khi click vào một câu hỏi, thực hiện cuộn (scroll) vùng chat chính đến tin nhắn đó (ví dụ dùng `ref` hoặc `Element.scrollIntoView`).

### File cần sửa (Frontend)
- `frontend/src/pages/chat/` (hoặc chat layout/page component) — Tạo layout chia đôi hoặc thêm panel bên phải (Right Sidebar).
- `frontend/src/components/chat/` (hoặc file liên quan) — Code logic lọc câu hỏi (`role === 'user'`), render danh sách câu hỏi, và logic scroll-to-view khi click vào item.

### Yêu cầu kiểm thử
- [ ] Giao diện có Right Sidebar hiển thị danh sách tất cả các câu hỏi của user trong session hiện tại.
- [ ] Click vào một câu hỏi ở Right Sidebar -> Vùng chat chính tự động cuộn (scroll) đến đúng vị trí tin nhắn đó.
- [ ] Responsive tốt (ẩn/hiện sidebar trên thiết bị di động hoặc màn hình nhỏ).
- Branch:
- Plan:
- Status: Todo
- Created: 2026-07-08 10:58

## 8. Fix: Sidebar không load sessions khi ở Profile Page

### Mô tả
**Business**: Khi người dùng vào trang `/profile`, sidebar bên trái không hiển thị danh sách cuộc trò chuyện (trống).
**Root Cause**: `fetchSessions()` chỉ được gọi trong `ChatPage`, không được gọi trong `AppLayout` hoặc `Sidebar`. Vì `ProfilePage` được render bên trong `AppLayout` (có Sidebar), khi navigate đến `/profile` hoặc refresh trang, `ChatPage` unmount nên `fetchSessions()` không chạy → store rỗng → sidebar trống.
**Approach**: Chuyển lời gọi `fetchSessions()` từ `ChatPage` lên `AppLayout` component (luôn mounted), hoặc gọi trong `Sidebar` component.

### File cần sửa
- `frontend/src/pages/chat/ChatPage.tsx` — Xoá `fetchSessions` khỏi `useEffect`, chỉ giữ nếu cần refresh sau khi gửi tin nhắn
- `frontend/src/components/layout/AppLayout.tsx` — Thêm `useEffect` gọi `fetchSessions()` khi mount

### Yêu cầu kiểm thử
- [ ] Vào `/profile` → sidebar hiển thị danh sách cuộc trò chuyện
- [ ] Refresh trang ở `/profile` → sessions vẫn load được
- [ ] Chat page vẫn hoạt động bình thường
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npm run build` — success
- Branch:
- Plan:
- Status: Todo
- Created: 2026-07-08 10:58

## 6. Copy message button

### Mô tả
**Business**: Cho phép người dùng copy nội dung của từng tin nhắn assistant để dễ dàng sao chép kết quả chẩn đoán, phân tích sang nơi khác.

**Approach**: Frontend-only. Thêm icon `Copy` từ lucide-react vào component `AssistantMessage`. Click -> gọi `navigator.clipboard.writeText()` -> hiển thị icon `Check` trong 2 giây.

### File cần sửa
- `frontend/src/components/chat/message/AssistantMessage.tsx` — Thêm button Copy bên dưới nội dung message, state copied/saved

### Yêu cầu kiểm thử
- [ ] Click Copy -> nội dung message được copy vào clipboard
- [ ] Icon chuyển thành Check trong 2s rồi quay lại Copy
- [ ] Không copy phần tool calls, chỉ copy nội dung markdown clean
- Branch:
- Plan:
- Status: Todo
- Created: 2026-07-08 10:58

## 7. Tìm kiếm chat sessions trong Sidebar

### Mô tả
**Business**: Khi người dùng có nhiều phiên trò chuyện, cần thanh tìm kiếm để filter sessions theo title giúp tìm nhanh cuộc trò chuyện cũ.

**Approach**: Frontend-only. Thêm `searchQuery` state vào store, render input Search ở đầu danh sách session trong Sidebar. Filter cục bộ bằng `String.includes()`. Debounce 300ms.

### File cần sửa
- `frontend/src/store/chatStore.ts` — Thêm `searchQuery: string` + `setSearchQuery(query: string)`
- `frontend/src/components/layout/Sidebar.tsx` — Thêm input search, filter sessions list, clear button

### Yêu cầu kiểm thử
- [ ] Input search hiển thị ở đầu danh sách session
- [ ] Gõ text -> danh sách filter theo title (case-insensitive)
- [ ] Clear button xoá searchQuery và hiện lại full list
- Branch:
- Plan:
- Status: Todo
- Created: 2026-07-08 10:58

---

## ✅ Đã hoàn thành

<!-- Task sau khi hoàn thành được chuyển xuống đây để giữ lịch sử -->

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

---
