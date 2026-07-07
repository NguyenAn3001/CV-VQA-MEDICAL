# Kế hoạch triển khai Profile API

## Mục tiêu
Bổ sung API cho người dùng tự quản lý thông tin cá nhân (profile), bao gồm xem, cập nhật thông tin và upload avatar.

---

## 1. Database - `app/db/models.py`

Thêm các cột nullable vào model `User`:

| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| `full_name` | `String(100), nullable=True` | Họ tên đầy đủ |
| `avatar_url` | `String, nullable=True` | Đường dẫn ảnh đại diện (MinIO presigned URL) |
| `bio` | `String, nullable=True` | Giới thiệu ngắn |
| `specialty` | `String(100), nullable=True` | Chuyên khoa (y tế) |

> Các cột mới đều nullable → không ảnh hưởng dữ liệu cũ.

---

## 2. Schemas - `app/schemas/user.py`

### UserProfileResponse (mới)
```python
class UserProfileResponse(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    role: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    specialty: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

### UserProfileUpdate (mới)
```python
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    specialty: Optional[str] = None
```

> `username`, `email` không cho phép tự sửa qua profile (chỉ admin) để tránh conflict.

---

## 3. Service - `app/services/user_service.py`

Thêm vào class `UserService`:

| Method | Input | Output | Mô tả |
|--------|-------|--------|-------|
| `get_profile(db, user)` | session, User object | User | Trả về user hiện tại |
| `update_profile(db, user, data)` | session, User, UserProfileUpdate | User | Cập nhật full_name, bio, specialty |
| `update_avatar(db, user, file)` | session, User, UploadFile | User | Upload lên MinIO, lưu avatar_url |

---

## 4. API Router - `app/api/profile.py` (tạo mới)

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| `GET` | `/api/v1/profile` | `get_current_user` | - | `UserProfileResponse` |
| `PUT` | `/api/v1/profile` | `get_current_user` | `UserProfileUpdate` | `UserProfileResponse` |
| `POST` | `/api/v1/profile/avatar` | `get_current_user` | `UploadFile` (form) | `{"avatar_url": str}` |

### Validation avatar:
- Chỉ chấp nhận: `image/jpeg`, `image/png`, `image/webp`
- Max size: 5MB

### Đăng ký router - `app/main.py`
```python
from app.api.profile import router as profile_router
# ...
app.include_router(profile_router, prefix=f"{settings.API_V1_STR}/profile", tags=["Profile"])
```

---

## 5. Tests - `tests/integration/test_profile_api.py` (tạo mới)

Dựa trên pattern `conftest.py` hiện tại (override auth với dummy user).

### Danh sách test case:

| STT | Test | Expect |
|-----|------|--------|
| 1 | `GET /api/v1/profile` không token | 401 |
| 2 | `GET /api/v1/profile` có token | 200 + đúng thông tin user |
| 3 | `PUT /api/v1/profile` cập nhật full_name | 200 + full_name thay đổi |
| 4 | `PUT /api/v1/profile` body rỗng | 200 (không thay đổi gì) |
| 5 | `POST /api/v1/profile/avatar` file không phải ảnh | 400 |
| 6 | `POST /api/v1/profile/avatar` file quá lớn | 400 |
| 7 | `POST /api/v1/profile/avatar` upload thành công (mock MinIO) | 200 + avatar_url |

---

## 6. Thứ tự thực thi

1. DB models → 2. Schemas → 3. Service → 4. API router → 5. main.py → 6. Tests
