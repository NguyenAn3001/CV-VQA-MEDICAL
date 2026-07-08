# Plan: Fix Sidebar không load sessions ở Profile Page

## Objective
Chuyển `fetchSessions()` từ `ChatPage` lên `AppLayout` để sidebar luôn load sessions dù ở page nào (chat, profile, ...).

## Files to Modify
- `frontend/src/pages/chat/ChatPage.tsx` — Xoá `fetchSessions()` khỏi mount `useEffect` (giữ trong `handleSend`)
- `frontend/src/components/layout/AppLayout.tsx` — Thêm `useEffect` gọi `fetchSessions()` khi mount

## Implementation Steps
1. **ChatPage.tsx**: Xoá `useEffect` block lines 31-33 (`fetchSessions()` gọi khi mount). Giữ `fetchSessions` trong `handleSend` (line 126) để refresh sau gửi tin nhắn.
2. **AppLayout.tsx**: Import `useChatStore`, thêm `useEffect` mount gọi `fetchSessions()`

## Test Plan
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npm run build` — success
- [ ] Vào `/profile` → sidebar hiển thị danh sách cuộc trò chuyện
- [ ] Refresh trang ở `/profile` → sessions vẫn load được
- [ ] Chat page vẫn hoạt động bình thường (gửi tin nhắn, sessions vẫn refresh)

## Risks
- Không có rủi ro — chỉ move side-effect, không thay đổi logic
