# Plan: Right Sidebar — Danh sách câu hỏi

## Objective
Thêm Right Sidebar vào chat page, hiển thị danh sách câu hỏi user đã gửi trong session. Click → scroll đến message đó.

## Files to Create
- `frontend/src/components/chat/RightSidebar.tsx` — Component Right Sidebar

## Files to Modify
- `frontend/src/components/chat/ChatWindow.tsx` — Thêm `data-message-id` vào wrapper mỗi message
- `frontend/src/pages/chat/ChatPage.tsx` — Thêm RightSidebar, truyền messages

## Implementation Steps
1. Tạo `RightSidebar.tsx`: nhận `messages`, lọc `role === 'user'`, render list. Click → `scrollIntoView` bằng `data-message-id`
2. Sửa `ChatWindow.tsx`: bọc mỗi `ChatMessage` trong `<div data-message-id={message.id}>`
3. Sửa `ChatPage.tsx`: import RightSidebar, render bên cạnh ChatWindow trong flex container

## Test Plan
- [ ] Right Sidebar hiển thị danh sách user messages
- [ ] Click → scroll đến đúng message
- [ ] Responsive: ẩn/hiện trên mobile
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npm run build` — success

## Risks
- Message ID có thể undefined (dùng fallback index)
- ChatWindow layout thay đổi cần đảm bảo không break