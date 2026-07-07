# Plan: Kết nối React ProfilePage với Profile API

## Mục tiêu
Cập nhật frontend React để gọi API profile thật thay vì dùng dữ liệu tĩnh từ JWT token.

## File cần sửa
- `frontend/src/types/models.d.ts` — Thêm field profile vào interface User
- `frontend/src/types/api.d.ts` — Thêm ProfileResponse, ProfileUpdate
- `frontend/src/pages/profile/ProfilePage.tsx` — Fetch API thật, edit dialog, avatar upload

## File cần tạo mới
- `frontend/src/hooks/useProfile.ts` — Hook React call API profile

## Thứ tự thực hiện
1. Cập nhật types/models.d.ts — thêm 7 field cho User
2. Cập nhật types/api.d.ts — thêm ProfileResponse + ProfileUpdate
3. Tạo hooks/useProfile.ts — fetch, update, uploadAvatar
4. Cập nhật ProfilePage.tsx — gọi hook, edit dialog, avatar upload
5. Kiểm tra build: `npx tsc --noEmit` + `npm run build`

## Kiểm thử
- [x] TypeScript compile: 0 errors
- [x] Build production: thành công
