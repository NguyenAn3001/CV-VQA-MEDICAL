# Tasks sắp làm

> ## Hướng dẫn cho Agent khi bắt đầu
> 1. **Đọc `agents/AGENTS.md`** — hiểu kiến trúc project
> 2. **Đọc `agents/workflow.md`** — hiểu quy trình làm việc
> 3. **Đọc file này** — biết task cần làm
> 4. Lên plan → Thực thi → Ghi `agents/changelog.md` → Cập nhật file này

---

## Danh sách task

## 4. Đánh dấu (Bookmark/Pin) cuộc trò chuyện

### Mô tả
**Business**: Cho phép người dùng đánh dấu (pin/bookmark) các phiên trò chuyện quan trọng để dễ dàng tìm lại sau này ở một tab riêng biệt.
**Approach**: 
- Backend: Thêm trường `is_pinned` (boolean) vào model `ChatSession`. Tạo migration. Cập nhật API GET/PUT/PATCH session.
- Frontend: Cập nhật interface/model, thêm nút Pin/Unpin ở mỗi session trong danh sách, tạo Tab "Pinned" riêng hiển thị các session có `is_pinned=True`.

### File cần sửa (Backend)
- `app/db/models.py` — Thêm column `is_pinned` (Boolean, default False) vào `ChatSession`
- `alembic/versions/` — Tạo migration script (chạy alembic revision)
- `app/schemas/chat.py` — Thêm `is_pinned` vào schemas response/update
- `app/services/chat_service.py` — Update service logic để toggle pin state và filter by pin state nếu cần
- `app/api/chat.py` — Update/thêm endpoint toggle pin (e.g. `PATCH /api/v1/chat/sessions/{id}/pin`)

### File cần sửa (Frontend)
- `frontend/src/types/models.d.ts` hoặc api type file — Thêm `is_pinned?: boolean` vào ChatSession
- `frontend/src/pages/chat/` (hoặc component tương ứng) — Thêm UI nút Pin/Unpin
- `frontend/src/pages/chat/` (hoặc sidebar/list component) — Thêm logic Tab "Pinned" và filter danh sách.

### Yêu cầu kiểm thử
- [ ] User có thể gọi API toggle pin cho session của chính mình.
- [ ] User KHÔNG thể gọi API toggle pin cho session của user khác.
- [ ] Frontend hiển thị đúng trạng thái pin và phân loại vào Tab Pinned.

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

---

## ✅ Đã hoàn thành

<!-- Task sau khi hoàn thành được chuyển xuống đây để giữ lịch sử -->

### 1. Kết nối ProfilePage với Profile API
- `frontend/src/hooks/useProfile.ts` — Hook mới
- `frontend/src/types/models.d.ts` — Thêm profile fields
- `frontend/src/types/api.d.ts` — Thêm ProfileResponse, ProfileUpdate
- `frontend/src/pages/profile/ProfilePage.tsx` — Fetch API, edit dialog, avatar upload
- Build: ✅ `npx tsc --noEmit` + `npm run build`
- Plan: `agents/plans/2026-07-08_0136-frontend-connect-profile-api.md`

### 2. Triển khai Profile API (Backend)
- `app/api/profile.py` — 3 endpoints GET/PUT /api/v1/profile + POST /api/v1/profile/avatar
- `tests/integration/test_profile_api.py` — 7 tests ✅
- `app/db/models.py` — Thêm 4 cột: full_name, avatar_url, bio, specialty
- `app/schemas/user.py` — UserProfileResponse, UserProfileUpdate
- `app/services/user_service.py` — get_profile, update_profile, update_avatar
- `alembic/versions/a084f72eb1f0` — Migration thêm 4 cột

### 3. Tạo 7 OpenCode skills
- `.agents/skills/add-task/SKILL.md`
- `.agents/skills/start-task/SKILL.md`
- `.agents/skills/write-commit/SKILL.md`
- `.agents/skills/review-code/SKILL.md`
- `.agents/skills/run-tests/SKILL.md`
- `.agents/skills/fix-migration/SKILL.md`
- `.agents/skills/update-agents/SKILL.md`

---
