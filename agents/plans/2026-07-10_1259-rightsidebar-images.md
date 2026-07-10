# Plan: Cải thiện Images section trong RightSidebar

## Mục đích
Click ảnh trong RightSidebar mở modal xem ảnh (giống MessageImage.tsx), thêm eye icon để scroll tới message chứa ảnh, giữ nguyên download button

## Files thay đổi
1. `frontend/src/components/chat/RightSidebar.tsx`
   - Sửa `attachedImages` thành mảng `{ image_url, messageId }`
   - Thêm state `expandedImageUrl` cho modal xem ảnh
   - Thêm modal (reuse pattern từ MessageImage.tsx)
   - Thêm eye icon bên cạnh download button

## Test
- `npx tsc --noEmit`: 0 errors
- `npm run build`: success
