# Workflow: Task-Driven Development

## ⚠️ Lỗi đã fix — tránh lặp lại

| Lỗi | Hậu quả | Cách fix |
|------|----------|----------|
| Lên plan nhưng **không lưu ra file** | Code xong rồi mới tạo plan bù, mất traceability | Luôn lưu plan vào `agents/plans/` **trước khi code** |
| Timestamp **làm tròn** (`02:00`) | Không biết chính xác khi nào làm | Dùng giờ thực tế từ file CreationTime, format `YYYY-MM-DD_HHmm` |
| Task xong **không chuyển xuống ✅** | File nhiễu, không biết task nào chưa làm | Chuyển xuống mục `✅ Đã hoàn thành` ngay sau khi xong |
| Chạy test **không dùng venv** | Sai Python environment, test fail oan | Kiểm tra `venv/` hoặc `.venv/` trước, fallback về `python` |

## Bước 0 — Đọc AGENTS.md (bắt buộc)

**Trước khi làm bất kỳ task nào, agent PHẢI đọc `agents/AGENTS.md`** để hiểu:
- Kiến trúc project (cây thư mục, chức năng từng module)
- Các API endpoints hiện có (tránh tạo trùng lặp)
- Pattern code (service layer, auth flow, MinIO, test pattern)
- Các quy tắc (không import FastAPI trong service, không load model mỗi request, ...)

## Nguyên tắc

Mỗi tính năng mới hoặc sửa lỗi được triển khai theo quy trình sau:

1. **Agent đọc `agents/AGENTS.md`** — hiểu kiến trúc tổng quan
2. **Agent đọc `agents/tasks.md`** — biết task cần làm
3. **Agent tự lên plan chi tiết** (các file cần sửa/tạo, thứ tự thực hiện)
4. **Agent thực thi từng bước**, mỗi bước:
   - Code xong → chạy test
   - Ghi log vào `agents/changelog.md`
   - Cập nhật `agents/tasks.md` (chuyển task xuống `✅ Đã hoàn thành`)
5. **Kết thúc**: tất cả task trong `✅ Đã hoàn thành`, changelog đầy đủ

---

## Cấu trúc thư mục `agents/`

```
agents/
├── AGENTS.md           # Kiến trúc project (đọc trước khi làm)
├── workflow.md         # File này - hướng dẫn workflow
├── tasks.md            # Task sắp làm (AI đọc và thực thi)
├── changelog.md        # Lịch sử thay đổi (ghi sau mỗi task)
└── plans/              # Plan chi tiết cho từng feature (lưu trữ)
```

---

## Quy tắc cho Agent

### 1. Đọc AGENTS.md + tasks.md

- **Luôn đọc `agents/AGENTS.md` đầu tiên** để nắm kiến trúc
- Sau đó đọc `agents/tasks.md` để biết task cần làm
- Mỗi task trong tasks.md có cấu trúc:

```markdown
## [STT]. [Tên Task]

### Mô tả
- [ ] Chi tiết công việc

### File cần sửa
- `path/to/file.py` — Mô tả ngắn

### File cần tạo mới
- `path/to/new.py` — Mô tả ngắn

### Yêu cầu kiểm thử
- [ ] Test case
```

### 2. Lên plan — và lưu lại

Trước khi code, agent phải:

- Đọc các file liên quan trong codebase
- Xác định chính xác file cần sửa/tạo
- Liệt kê thứ tự thực hiện
- Xác định test cần viết
- **Lưu plan vào `agents/plans/[YYYY-MM-DD_HHMM]-[tên-task].md`** — có timestamp chính xác (VD: `2026-07-08_0136-frontend-connect-profile-api.md`)

Cấu trúc file plan:

```markdown
# Plan: [Tên Task]

## Mục tiêu
Mô tả ngắn

## File cần sửa
- `path/to/file.py` — Sửa cái gì

## File cần tạo mới
- `path/to/new.py` — Tạo cái gì

## Thứ tự thực hiện
1. Bước 1
2. Bước 2
3. ...

## Kiểm thử
- [ ] Test case
```

### 3. Thực thi (theo plan)

Mỗi bước phải:

- **Làm theo plan** đã lưu ở bước 2
- **Code xong → chạy test ngay** (không bỏ qua)
- Nếu test fail → sửa → chạy lại
- **Ghi changelog** sau mỗi file sửa
- **Cập nhật tasks.md** (chuyển task xuống `✅ Đã hoàn thành`)

### 4. Ghi changelog

Mỗi lần sửa file phải ghi vào `changelog.md`:

```markdown
## YYYY-MM-DD HH:MM - [Tên Task]

### Thêm mới
- `path/file.py` — Mô tả ngắn

### Sửa đổi
- `path/file.py` — Mô tả thay đổi

### Xóa
- `path/file.py` — Lý do
```

### 5. Chuyển task đã hoàn thành xuống ✅

Khi một task hoàn thành, agent **chuyển task đó xuống mục `✅ Đã hoàn thành`** ở cuối `agents/tasks.md`.

Không xoá hẳn — giữ lại để:
- Trace được tiến độ
- Người dùng biết đã làm gì
- AI agent sau có thể tham khảo

### 6. Kiểm tra cuối

Trước khi kết thúc, agent chạy test. Ưu tiên dùng venv nếu có:

```bash
# Nếu có venv, dùng python từ venv
if (Test-Path "venv/Scripts/python.exe") { venv/Scripts/python -m pytest tests/ -v }
elseif (Test-Path ".venv/Scripts/python.exe") { .venv/Scripts/python -m pytest tests/ -v }
else { python -m pytest tests/ -v }
```

Đảm bảo:
- Test mới pass 100%
- Test cũ không bị hỏng
- Không có code thừa (import chết, biến không dùng)
