# Plan: Tự động đặt tiêu đề Chat dựa trên tin nhắn đầu tiên

## Mục tiêu
Đẩy tiêu đề đã sinh về frontend real-time qua SSE để sidebar cập nhật ngay lập tức mà không cần reload trang. Thêm fallback trích xuất từ khi LLM thất bại.

## Các file cần sửa
- `app/services/chat_service.py` — Truyền new_title từ prepare lên SSE generator; yield sự kiện `title_changed`; fallback extract 8 từ
- `app/api/chat.py` — Pipe tham số new_title từ prepare_message_and_context sang get_sse_stream
- `frontend/src/store/chatStore.ts` — Thêm action `updateSessionTitleLocally(id, title)`
- `frontend/src/hooks/useSSEChat.ts` — Parse sự kiện `title_changed`, gọi updateSessionTitleLocally

## Các bước triển khai
1. **BE: chat_service.py** — Đổi kiểu trả về của `prepare_message_and_context` thành `Tuple[Optional[Image.Image], List[ChatMessage], Optional[str]]`; thêm fallback extract 8 từ trong block sinh title
2. **BE: chat_service.py** — Thêm param `new_title` optional vào `get_sse_stream`; yield sự kiện `title_changed` ở đầu SSE nếu có
3. **BE: api/chat.py** — Destructure new_title từ prepare_message_and_context, truyền vào get_sse_stream
4. **FE: chatStore.ts** — Thêm `updateSessionTitleLocally(id, title)` cập nhật sessions array + sessionDetailsById mà không gọi API
5. **FE: useSSEChat.ts** — Thêm import useChatStore; xử lý sự kiện `title_changed` bằng cách gọi `useChatStore.getState().updateSessionTitleLocally(sessionId, title)`

## Kế hoạch kiểm thử
- [ ] Gửi tin nhắn đầu tiên → title trong sidebar cập nhật ngay (không cần reload)
- [ ] Title là tiếng Việt có dấu, ≤ 5 từ
- [ ] Nếu LLM thất bại → fallback extract 8 từ từ tin nhắn đầu tiên
- [ ] Session đã rename thủ công → không bị ghi đè (logic hiện tại đã check `session.title == "New Session"`)

## Rủi ro
- SSE generator chạy trong background task sau khi DB commit; title phải được capture trước khi SSE bắt đầu
- Task 12 (RightSidebar mobile) đã hoàn thành → không conflict
