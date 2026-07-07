# Changelog

> File này ghi lại toàn bộ thay đổi trong quá trình phát triển.
> Mỗi entry gồm: ngày giờ, task, danh sách file thêm/sửa/xóa kèm mô tả ngắn.

---

## 2026-07-08 00:59 — Triển khai Profile API

### Thêm mới
- `app/api/profile.py` — Router với 3 endpoints: GET/PUT /api/v1/profile, POST /api/v1/profile/avatar
- `tests/integration/test_profile_api.py` — 7 test cases cho profile API
- `plans/profile_implementation.md` — Plan chi tiết trước khi implement
- `plans/workflow.md` — Workflow hướng dẫn AI agent

### Sửa đổi
- `app/db/models.py` — Thêm 4 cột nullable vào User: full_name, avatar_url, bio, specialty
- `app/schemas/user.py` — Thêm UserProfileResponse (12 fields) + UserProfileUpdate (3 fields optional)
- `app/services/user_service.py` — Thêm 3 methods: get_profile, update_profile, update_avatar (MinIO upload)
- `app/main.py` — Import + include profile_router với prefix /api/v1/profile
- `AGENTS.md` — Cập nhật kiến trúc đầy đủ (tree thư mục, endpoints, service pattern, MinIO)
- `tests/conftest.py` — Mở rộng dummy user (thêm profile fields) + mock ML pipeline để chạy test không cần torch

### Xóa
- *(không có)*

### Kết quả kiểm thử
- `test_profile_api.py`: 7/7 passed ✅
- `test_api_endpoints.py`: 7/8 passed (1 pre-existing lỗi metrics trên Windows)

---

## 2026-07-08 01:36 — Kết nối React ProfilePage với Profile API

### Thêm mới
- `frontend/src/hooks/useProfile.ts` — Hook React: fetchProfile, updateProfile, uploadAvatar (gọi 3 endpoints backend)

### Sửa đổi
- `frontend/src/types/models.d.ts` — Thêm 7 field vào interface User: full_name, avatar_url, bio, specialty, must_change_password, created_at, updated_at
- `frontend/src/types/api.d.ts` — Thêm ProfileResponse (12 fields) + ProfileUpdate (3 fields optional)
- `frontend/src/pages/profile/ProfilePage.tsx` — Rewrite: fetch real profile data on mount, edit dialog (Dialog + Input từ shadcn), avatar upload via click (Camera icon overlay), hiển thị avatar img, bio, specialty, member since date

### Kết quả kiểm thử
- `npx tsc --noEmit` — 0 errors
- `npm run build` — success

### Ghi chú
- Plan lẽ ra phải được tạo trước khi code theo workflow, nhưng bị bỏ qua. Đã tạo bù: `agents/plans/2026-07-08_0136-frontend-connect-profile-api.md`
- Workflow đã được cập nhật: bước "Lên plan" giờ bắt buộc phải **lưu plan ra file**

---

## 2026-07-08 01:50 — Fix workflow: bổ sung các quy tắc còn thiếu

### Vấn đề phát hiện
1. **Thiếu bước lưu plan**: Workflow cũ chỉ nói "lên plan" nhưng không yêu cầu lưu ra file → task frontend profile bị code trước khi có plan
2. **Timestamp làm tròn**: Plan filename và changelog dùng giờ làm tròn (`02:00`) thay vì giờ chính xác (`01:36`)
3. **Không xoá task cũ**: Task đã hoàn thành vẫn nằm trong `tasks.md` gây nhiễu

### Sửa đổi
- `agents/workflow.md` — Bổ sung:
  - Bước "Lên plan" → bắt buộc **lưu plan ra file** (`agents/plans/YYYY-MM-DD_HHMM-ten-task.md`)
  - Bước "Thực thi" → phải **làm theo plan** đã lưu
  - Bước "Xoá task hoàn thành" → xoá hẳn hoặc chuyển xuống mục ✅
  - Test command → ưu tiên dùng venv nếu có
- `agents/plans/*.md` — Rename: thêm timestamp chính xác (dùng `CreationTime` thực tế)
- `agents/changelog.md` — Sửa timestamp từ `01:00`/`02:00` → `00:59`/`01:36` (giờ thực tế)
- `agents/tasks.md` — Xoá task frontend profile đã hoàn thành

### Kết quả
- Workflow giờ đã đầy đủ: Plan → Lưu file → Code theo plan → Test → Ghi changelog → Xoá task
- Tất cả timestamp dùng giờ chính xác, không làm tròn
- `agents/tasks.md` chỉ chứa task chưa làm

---

## 2026-07-08 01:59 — Tạo 7 OpenCode skills

### Thêm mới
- `.agents/skills/add-task/SKILL.md` — Thêm task mới vào agents/tasks.md
- `.agents/skills/start-task/SKILL.md` — Lấy task đầu → plan → code → test → changelog → ✅
- `.agents/skills/write-commit/SKILL.md` — Tạo commit message tiếng Việt từ changelog
- `.agents/skills/review-code/SKILL.md` — Review code changes, kiểm tra pattern/import
- `.agents/skills/run-tests/SKILL.md` — Auto-detect venv + pytest + phân tích kết quả
- `.agents/skills/fix-migration/SKILL.md` — Auto-generate + clean Alembic migration
- `.agents/skills/update-agents/SKILL.md` — Quét API mới → cập nhật AGENTS.md

---

## 2026-07-08 02:02 — Nâng cấp skill add-task thành Tech Lead

### Sửa đổi
- `.agents/skills/add-task/SKILL.md` — Rewrite toàn bộ: đọc codebase trước → hỏi 2-3 câu → phân tích → ghi task; template mới Business/Approach/Ghi chú

---

## 2026-07-08 02:03 — Sửa skill write-commit: chỉ đưa ra message, không tự commit

### Sửa đổi
- `.agents/skills/write-commit/SKILL.md` — Thêm HARD RULES cấm tuyệt đối mọi shell command, chỉ output message

---

## 2026-07-08 02:37 — Fix migration: thêm bảng system_settings và model_providers

### Thêm mới
- `alembic/versions/1e451916435f_add_system_settings_and_model_providers_.py` — Migration tạo 2 bảng còn thiếu

### Kết quả
- Server startup không còn lỗi `UndefinedTableError`
- `init_db` chạy thành công: system settings initialized, default provider created

---

## 2026-07-08 02:10 — Thêm frontend vào AGENTS.md + cập nhật workflow.md

### Sửa đổi
- `agents/AGENTS.md` — Thêm mục Frontend Overview: tech stack, directory tree, routing, state management, API client, types, hooks pattern
- `agents/workflow.md` — Cập nhật cấu trúc thư mục gồm cả `frontend/` và `app/` backend chi tiết
