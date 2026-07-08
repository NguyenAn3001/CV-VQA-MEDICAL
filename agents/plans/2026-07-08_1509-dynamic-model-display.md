# Plan: Hiển thị model đang dùng động thay hardcode

## Execution Order

### 1. BE: Schema — thêm model field
- File: `app/schemas/chat.py`
- Thêm `model: Optional[str] = None` vào `ChatSessionDetailResponse`

### 2. BE: Service — populate model từ DB
- File: `app/services/chat_service.py`
- Trong `get_session_detail()`:
  - Import `ModelProvider`, `SystemSetting`
  - Query default provider (`isDefault == True` → fallback first enabled)
  - Query `SystemSetting` với key `general.defaultModel`
  - Model name = setting value hoặc provider.chatModel hoặc fallback `"gpt-4o-mini"`
  - Gán vào `response_data.model`

### 3. FE: Type — thêm model field
- File: `frontend/src/types/models.d.ts`
- Thêm `model?: string` vào `ChatSession`

### 4. FE: Navbar ChatPage
- File: `frontend/src/pages/chat/ChatPage.tsx` (line 142)
- `subtitle` dùng `activeSession?.model ?? 'GPT-4o + Medical'`

### 5. FE: RightSidebar model
- File: `frontend/src/components/chat/RightSidebar.tsx` (line 149)
- `sessionDetail.model ?? 'GPT-4o + Medical'`

### 6. FE: SessionDetailModal model
- File: `frontend/src/components/chat/SessionDetailModal.tsx` (line 125)
- `detail.model ?? 'GPT-4o + Medical'`

## Liên quan
- `app/db/models.py` — ModelProvider, SystemSetting (đã có, không cần sửa)
- `app/llm/factory.py` — Logic tham khảo `get_llm_provider()`

## Test
- `npx tsc --noEmit` — 0 errors
- `npm run build` — success
