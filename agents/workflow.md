# Workflow: Task-Driven Development

> Mục tiêu: Mọi thay đổi trong project phải được quản lý thông qua task, plan và changelog để đảm bảo có thể theo dõi, review và tiếp tục ở bất kỳ thời điểm nào.

---

# Lessons Learned (không lặp lại)

| Lỗi | Hậu quả | Cách fix |
|------|----------|----------|
| Code trước rồi mới tạo plan | Mất traceability | Luôn lưu plan vào `agents/plans/` **trước khi code** |
| Timestamp làm tròn (`02:00`) | Không biết chính xác khi nào | Dùng timestamp thực tế, format `YYYY-MM-DD_HHmm` |
| Task xong không chuyển xuống ✅ | File nhiễu, không biết task nào chưa làm | Chuyển xuống `✅ Đã hoàn thành` ngay sau khi xong |
| Chạy test không dùng venv | Sai Python environment, test fail oan | Kiểm tra `venv/` hoặc `.venv/` trước, fallback `python` |
| Hỏi user khi chưa đọc codebase | Hỏi lung tung, mất thời gian | Đọc AGENTS.md + scan codebase **trước** khi hỏi |
| Tự động chạy `git commit` | Commit bừa, user mất kiểm soát | Skills `write-commit` chỉ output message, không chạy git |
| Tự ý mở rộng scope ngoài task | Làm việc không đúng yêu cầu | Dừng lại, đề xuất tạo task mới |

---

# Cấu trúc thư mục

```
agents/
├── AGENTS.md           # Kiến trúc project (backend + frontend)
├── workflow.md         # File này
├── tasks.md            # Task sắp làm + ✅ đã hoàn thành
├── changelog.md        # Lịch sử thay đổi
└── plans/              # Plan chi tiết cho từng feature

.agents/
└── skills/             # OpenCode skills (auto-discover)
    ├── add-task/SKILL.md      # Phân tích yêu cầu → task kỹ thuật
    ├── start-task/SKILL.md    # Tự động chạy 1 task từ đầu đến cuối
    ├── write-commit/SKILL.md  # Tạo commit message từ changelog
    ├── review-code/SKILL.md   # Review code changes
    ├── run-tests/SKILL.md     # Chạy test suite tự động
    ├── fix-migration/SKILL.md # Tạo + clean Alembic migration
    └── update-agents/SKILL.md # Quét API mới → cập nhật AGENTS.md

frontend/               # React SPA (Vite + TypeScript + shadcn/ui)
├── src/
│   ├── types/          # models.d.ts + api.d.ts
│   ├── store/          # Zustand stores (auth, chat, settings, ...)
│   ├── hooks/          # Custom hooks (useProfile, useSSEChat)
│   ├── lib/            # Axios instance, utilities
│   ├── components/     # UI primitives + feature components
│   ├── pages/          # Route pages (auth, chat, profile, admin)
│   └── constants/      # Route/endpoint constants
└── package.json

app/                    # FastAPI backend
├── api/               # Route handlers
├── services/          # Business logic
├── db/                # SQLAlchemy models + migrations
├── schemas/           # Pydantic schemas
├── ml/                # ML inference pipeline
├── core/              # Config, security, redis
└── utils/             # Image utils
```

---

# 7 bước bắt buộc

Mỗi task phải đi qua đủ 7 bước sau. Không bỏ qua bước nào.

| # | Bước | Mô tả |
|---|------|-------|
| 1 | Đọc tài liệu | AGENTS.md → workflow.md → tasks.md |
| 2 | Phân tích yêu cầu | Làm rõ business → map kỹ thuật |
| 3 | Lập kế hoạch | Xác định file, thứ tự, test → lưu plan |
| 4 | Thực hiện | Code theo plan, không mở rộng scope |
| 5 | Kiểm thử | pytest trong venv, build frontend nếu có |
| 6 | Cập nhật tài liệu | Ghi changelog, cập nhật AGENTS.md nếu cần |
| 7 | Đánh dấu hoàn thành | Chuyển task xuống ✅ |

---

## Bước 1 — Đọc tài liệu

Trước khi làm bất kỳ thay đổi nào, **bắt buộc** đọc:

1. `agents/AGENTS.md` — kiến trúc project, endpoints, patterns
2. `agents/workflow.md` — workflow này
3. `agents/tasks.md` — xác định task cần làm

Mục tiêu: hiểu codebase trước, tránh hỏi user những thứ đã có sẵn.

---

## Bước 2 — Phân tích yêu cầu

Khi nhận yêu cầu từ user, **không được ghi nguyên văn** vào `tasks.md`.

Thay vào đó:

1. **Đọc codebase trước** — AGENTS.md, scan `app/api/`, `app/services/`, `app/db/models.py`, `frontend/src/`
2. **Hỏi tối đa 2-3 câu** — chỉ hỏi những gì codebase không trả lời được
3. **Map kỹ thuật** — model/schema/endpoint/service/frontend nào cần thay đổi
4. **Chia subtask** nếu feature có 3+ files hoặc span cả BE + FE

**Ví dụ:**

❌ Không ghi nguyên văn:
```
- [ ] lưu cuộc trò chuyện
```

✅ Phân tích thành:
```
### Mô tả
**Business**: Lưu lịch sử chat để user xem lại sau
**Approach**: ChatSession + ChatMessage models, CRUD endpoints
- [ ] Thiết kế schema ChatSession và ChatMessage
- [ ] Xây dựng API CRUD sessions + messages
- [ ] Frontend: hiển thị danh sách session, load messages
- [ ] Kiểm thử integration
```

**Dùng skill:** nếu cần thêm task vào `tasks.md`, gọi skill `add-task`.

---

## Bước 3 — Lập kế hoạch

Trước khi code, phải:

1. Đọc source code của các file liên quan
2. Xác định chính xác: file cần sửa, file cần tạo, test cần viết
3. Xác định thứ tự thực hiện
4. **Lưu plan** vào `agents/plans/`

Tên file: `YYYY-MM-DD_HHMM-[task-name].md`

Ví dụ: `2026-07-08_0136-profile-api.md`

Cấu trúc plan tối thiểu:

```markdown
# Plan: [Tên Task]

## Objective
Mô tả ngắn

## Files to Modify
- `path/to/file.py` — Sửa cái gì

## Files to Create
- `path/to/new.py` — Tạo cái gì

## Implementation Steps
1. Bước 1
2. Bước 2

## Test Plan
- [ ] Test case

## Risks
- Rủi ro / lưu ý
```

**Không được code nếu chưa có plan file.**

---

## Bước 4 — Thực hiện

Làm theo plan đã lưu. Mỗi bước:

- Code xong → chạy test liên quan
- Sửa lỗi nếu test fail
- **Không tự ý mở rộng scope** — nếu phát sinh yêu cầu mới ngoài plan, dừng lại và đề xuất tạo task mới

---

## Bước 5 — Kiểm thử

Sau khi hoàn thành code, chạy full test suite:

```powershell
if (Test-Path "venv/Scripts/python.exe") { venv/Scripts/python -m pytest tests/ -v }
elseif (Test-Path ".venv/Scripts/python.exe") { .venv/Scripts/python -m pytest tests/ -v }
else { python -m pytest tests/ -v }
```

Nếu có frontend: `npx tsc --noEmit` và `npm run build`

Nếu test thất bại:
- Sửa cho đến khi test pass
- Không đánh dấu task hoàn thành khi còn test fail

**Dùng skill:** `run-tests` để tự động detect venv và chạy.

---

## Bước 6 — Cập nhật tài liệu

### Changelog

Ghi 1 lần cho mỗi task (không ghi từng file riêng lẻ):

```markdown
## 2026-07-08 HH:MM — [Tên Task]

### Thêm mới
- `path/file.py` — Mô tả

### Sửa đổi
- `path/file.py` — Mô tả

### Xoá
- `path/file.py` — Lý do
```

### AGENTS.md (nếu cần)

Nếu thêm API endpoint mới hoặc thay đổi kiến trúc, cập nhật `agents/AGENTS.md`.

**Dùng skill:** `update-agents` để quét API mới tự động.

---

## Bước 7 — Đánh dấu hoàn thành

Chuyển task từ `## Danh sách task` xuống `## ✅ Đã hoàn thành` trong `agents/tasks.md`.

- Không xoá task — giữ lại để trace lịch sử
- Thêm link tới file plan nếu có

---

# Definition of Done

Một task chỉ được coi là hoàn thành khi **tất cả** điều kiện sau đáp ứng:

- [ ] Có plan file trong `agents/plans/`
- [ ] Code hoàn chỉnh
- [ ] Test pass 100%
- [ ] Build pass (frontend: `npm run build`)
- [ ] Lint pass (frontend: `npx tsc --noEmit`)
- [ ] Changelog đã cập nhật
- [ ] tasks.md đã cập nhật (chuyển xuống ✅)
- [ ] Không còn TODO/FIXME liên quan trong code mới
- [ ] Không còn import hoặc biến không dùng

Nếu thiếu bất kỳ điều kiện nào, task chưa hoàn thành.

---

# Quy tắc khi tiếp tục làm việc

Khi user nói "đọc workflow và làm việc", agent phải **tự động**:

1. Đọc `agents/AGENTS.md`
2. Đọc `agents/workflow.md` (file này)
3. Đọc `agents/tasks.md` — tìm task đầu tiên chưa hoàn thành
4. Nếu chưa có plan → tạo plan (Bước 3)
5. Thực hiện (Bước 4)
6. Chạy test (Bước 5)
7. Cập nhật changelog (Bước 6)
8. Cập nhật tasks.md (Bước 7)
9. Báo cáo kết quả

Không cần user nhắc lại từng bước.

---

# Skill system

Khi gặp tình huống dưới đây, gọi skill tương ứng:

| Tình huống | Gọi skill |
|------------|-----------|
| User yêu cầu tính năng mới | `add-task` — phân tích → ghi task |
| Có task trong tasks.md cần làm | `start-task` — chạy từ plan → code → ✅ |
| Cần commit message | `write-commit` — đọc changelog → output message (KHÔNG chạy git) |
| Code xong cần review | `review-code` — check dead imports, pattern violations |
| Cần chạy test | `run-tests` — auto venv + pytest |
| Model thay đổi cần migration | `fix-migration` — auto-generate + clean alembic |
| Thêm API endpoint mới | `update-agents` — quét và cập nhật AGENTS.md |

**Lưu ý:** `write-commit` chỉ output message — **không tự động chạy `git commit`**. User sẽ review và commit bằng tay.
