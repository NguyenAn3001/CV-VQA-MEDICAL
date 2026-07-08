# Plan: Copy message button

## Task
Thêm button Copy vào AssistantMessage để copy nội dung markdown (không copy tool calls).

## Files
- `frontend/src/components/chat/message/AssistantMessage.tsx` — Thêm Copy button

## Execution
1. Import `Copy`, `Check` từ lucide-react (đã có `Bot` từ lucide-react)
2. Thêm `copied` state (`useState<boolean>`)
3. Thêm `handleCopy` fn: gọi `navigator.clipboard.writeText(cleanText)`, set `copied=true`, setTimeout 2s reset
4. Render button dưới nội dung message, bên cạnh avatar area
5. Button icon: `Copy` (mặc định) / `Check` (khi copied) + text "Copied!"

## Test
- `npx tsc --noEmit` — 0 errors
- `npm run build` — success
