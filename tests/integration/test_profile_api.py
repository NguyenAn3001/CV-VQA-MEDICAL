import pytest
import io
import uuid
from datetime import datetime

from app.main import app
from app.api.deps import get_current_user
from app.db.models import User
from app.services.user_service import user_service
from app.schemas.user import UserProfileUpdate

PROFILE_URL = "/api/v1/profile"


def test_get_profile_no_token(test_client):
    """Test GET /profile without authentication returns 403 from HTTPBearer."""
    app.dependency_overrides.pop(get_current_user, None)
    response = test_client.get(PROFILE_URL)
    assert response.status_code in [401, 403]


def test_get_profile_success(test_client):
    """Test GET /profile returns current user info."""
    response = test_client.get(PROFILE_URL)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@vqa.com"
    assert data["role"] == "user"
    assert data["full_name"] == "Test User"
    assert data["bio"] == "A test user"
    assert data["specialty"] == "Radiology"
    assert data["is_active"] is True
    assert data["must_change_password"] is False
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_update_profile_success(test_client, mocker):
    """Test PUT /profile updates user fields."""
    now = datetime.utcnow()
    updated_user = User(
        id=uuid.uuid4(),
        username="testuser",
        email="test@vqa.com",
        role="user",
        is_active=True,
        must_change_password=False,
        full_name="New Name",
        bio="Updated bio",
        specialty="Cardiology",
        created_at=now,
        updated_at=now
    )
    mock_update = mocker.patch.object(user_service, "update_profile", return_value=updated_user)

    response = test_client.put(PROFILE_URL, json={
        "full_name": "New Name",
        "bio": "Updated bio",
        "specialty": "Cardiology"
    })

    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "New Name"
    assert data["bio"] == "Updated bio"
    assert data["specialty"] == "Cardiology"
    mock_update.assert_called_once()


def test_update_profile_empty_body(test_client, mocker):
    """Test PUT /profile with empty body returns current user unchanged."""
    now = datetime.utcnow()
    original_user = app.dependency_overrides[get_current_user]()
    mock_update = mocker.patch.object(user_service, "update_profile", return_value=original_user)

    response = test_client.put(PROFILE_URL, json={})

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == original_user.username
    mock_update.assert_called_once()


def test_upload_avatar_wrong_format(test_client):
    """Test POST /profile/avatar with non-image file returns 400."""
    response = test_client.post(
        f"{PROFILE_URL}/avatar",
        files={"file": ("test.txt", b"not an image", "text/plain")}
    )
    assert response.status_code == 400
    assert "Invalid image type" in response.json()["detail"]


def test_upload_avatar_too_large(test_client):
    """Test POST /profile/avatar with file > 5MB returns 400."""
    large_data = b"x" * (5 * 1024 * 1024 + 1)
    response = test_client.post(
        f"{PROFILE_URL}/avatar",
        files={"file": ("large.jpg", large_data, "image/jpeg")}
    )
    assert response.status_code == 400
    assert "too large" in response.json()["detail"].lower()


def test_upload_avatar_success(test_client, mocker):
    """Test POST /profile/avatar upload succeeds."""
    updated_user = User(
        id=uuid.uuid4(),
        username="testuser",
        email="test@vqa.com",
        role="user",
        is_active=True,
        must_change_password=False,
        avatar_url="http://minio/presigned/avatar.jpg",
        updated_at=datetime.utcnow()
    )
    mock_upload = mocker.patch.object(user_service, "update_avatar", return_value=updated_user)

    response = test_client.post(
        f"{PROFILE_URL}/avatar",
        files={"file": ("avatar.jpg", b"fake-image-data", "image/jpeg")}
    )

    assert response.status_code == 200
    data = response.json()
    assert "avatar_url" in data
    assert data["avatar_url"] == "http://minio/presigned/avatar.jpg"
    mock_upload.assert_called_once()
