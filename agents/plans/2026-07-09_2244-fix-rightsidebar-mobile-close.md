# Plan: Fix RightSidebar Mobile — không đóng được

## Objective
RightSidebar trên mobile không thể đóng vì `isVisible = isOpen || isMobileOpen` với `isOpen` persist `true` trong localStorage. Nút X và backdrop chỉ set `isMobileOpen = false` → `isVisible` luôn `true`.

## Root Cause
- `isRightSidebarOpen` (store) default `true`, persisted
- `isVisible` (RightSidebar.tsx:69) = `isOpen || isMobileOpen`
- Close button + backdrop chỉ gọi `setIsMobileOpen(false)` → `isOpen` vẫn `true` → `isVisible` vẫn `true`

## Files to Modify
- `frontend/src/store/chatStore.ts` — Thêm action `setRightSidebarOpen(open: boolean)`
- `frontend/src/components/chat/RightSidebar.tsx` — Fix close logic, simplify `isVisible`

## Implementation Steps
1. **chatStore.ts**: Add `setRightSidebarOpen` to interface + implement in store
2. **RightSidebar.tsx**:
   - Import `setRightSidebarOpen` from store
   - Resize handler (line 29): khi < 1024px, gọi `setRightSidebarOpen(false)`
   - Floating button: gọi `setRightSidebarOpen(true)` thay vì `setIsMobileOpen(true)`
   - `isVisible` = `isOpen` (bỏ `|| isMobileOpen`)
   - Floating button visibility: `isMobile && !isOpen` (thay vì `!isMobileOpen`)
   - Nút X: gọi `setRightSidebarOpen(false)` + `setIsMobileOpen(false)`
   - Backdrop: gọi `setRightSidebarOpen(false)` + `setIsMobileOpen(false)`
   - Backdrop visibility: `isMobile && isOpen` (thay vì `isMobileOpen`)

## Test Plan
- [ ] `npx tsc --noEmit`: 0 errors
- [ ] `npm run build`: success
- [ ] Manual: Mở sidebar desktop → resize mobile → sidebar tự đóng, `isRightSidebarOpen = false`
- [ ] Manual: Floating button → nhấn X → sidebar đóng
- [ ] Manual: Floating button → tap backdrop → sidebar đóng
- [ ] Manual: Refresh mobile → sidebar không tự mở
