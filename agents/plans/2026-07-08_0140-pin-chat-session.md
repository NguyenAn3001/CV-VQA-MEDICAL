# Plan: Bookmark/Pin cuộc trò chuyện

## Objective
Cho phép người dùng đánh dấu (pin/bookmark) các phiên trò chuyện quan trọng.

## Files to Modify

### Backend
- `app/db/models.py`
  - Thêm `is_pinned = Column(Boolean, default=False)` vào class `ChatSession`
- `app/schemas/chat.py`
  - Thêm `is_pinned: bool = False` vào `ChatSessionResponse` và `AdminChatSessionResponse`
- `app/services/chat_service.py`
  - Order `get_user_sessions` by `is_pinned` (desc) then `updated_at` (desc)
  - Thêm function `toggle_pin_session(db, session_id, user_id, is_pinned)`
- `app/api/chat.py`
  - Thêm endpoint `PATCH /sessions/{session_id}/pin` nhận `{ "is_pinned": bool }` (tạo `ChatSessionPinUpdate` schema nếu cần, hoặc body/Query)

### Frontend
- `frontend/src/types/models.d.ts` (or `api.d.ts`)
  - Thêm `is_pinned: boolean` vào `ChatSession`
- `frontend/src/store/chatStore.ts`
  - Thêm action `togglePin(sessionId: string, isPinned: boolean)` gọi api patch
  - Thay đổi state array? (Cập nhật element trong `sessions` array)
- `frontend/src/components/layout/Sidebar.tsx`
  - Hiển thị tab "All" và "Pinned", hoặc split section
  - Thêm nút pin/unpin icon vào mỗi session item.

## Files to Create
- `alembic/versions/<revision>_add_is_pinned_to_chatsession.py` (tạo bằng lệnh `alembic revision --autogenerate`)
- test file (tùy chọn trong `tests/integration/`)

## Implementation Steps
1. Sửa `models.py`
2. Tạo alembic migration `venv/Scripts/python -m alembic revision --autogenerate -m "add is_pinned to chat_sessions"`
3. Sửa `schemas/chat.py`
4. Sửa `services/chat_service.py` và `api/chat.py`
5. Test backend (`pytest tests/integration/`)
6. Frontend: Sửa type, update Store, update Component `Sidebar.tsx` (dùng lucide-react Pin icon)
7. Build frontend.

## Test Plan
- Toggle pin thay đổi DB.
- User ko tự pin session user khác.
- Pinned sessions lên đầu hoặc có tab riêng bên UI.