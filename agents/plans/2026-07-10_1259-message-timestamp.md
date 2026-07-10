# Plan: Hiển thị thời gian tin nhắn

## Mục đích
Hiển thị thời gian gửi (created_at) cho mỗi tin nhắn user và assistant trong chat.

## Files thay đổi

1. `frontend/src/lib/format.ts`
   - Thêm `formatTimestamp(iso: string): string` dùng date-fns format "HH:mm"
   - Thêm `formatTimestampFull(iso: string): string` format "yyyy-MM-dd HH:mm:ss" cho tooltip

2. `frontend/src/hooks/useSSEChat.ts`
   - Gán `created_at: new Date().toISOString()` vào cả `userMessage` và `assistantMessage`

3. `frontend/src/components/chat/message/ChatMessage.tsx`
   - Truyền `message.created_at` xuống `UserMessage` và `AssistantMessage`

4. `frontend/src/components/chat/message/UserMessage.tsx`
   - Hiển thị timestamp (HH:mm) dưới bubble, căn phải, text-xs text-slate-400
   - Tooltip full datetime

5. `frontend/src/components/chat/message/AssistantMessage.tsx`
   - Nhận prop `createdAt`
   - Hiển thị timestamp dưới content, căn trái, text-xs text-slate-400
   - Tooltip full datetime

## Test
- `npx tsc --noEmit`: 0 errors
- `npm run build`: success
