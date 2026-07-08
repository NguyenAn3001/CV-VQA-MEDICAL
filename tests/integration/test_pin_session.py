import pytest
import uuid
from datetime import datetime

from app.main import app
from app.api.deps import get_current_user
from app.db.models import ChatSession
from app.schemas.chat import ChatSessionResponse
from app.services.chat_service import chat_service

PIN_URL_PREFIX = "/api/v1/chat/sessions"


def test_toggle_pin_success(test_client, mocker):
    """Test PATCH /sessions/{id}/pin toggles is_pinned to true."""
    now = datetime.utcnow()
    session = ChatSession(
        id=uuid.uuid4(),
        user_id=app.dependency_overrides[get_current_user]().id,
        title="Test Session",
        message_count=5,
        is_pinned=True,
        created_at=now,
        updated_at=now
    )
    mock_toggle = mocker.patch.object(chat_service, "toggle_pin_session", return_value=session)

    response = test_client.patch(
        f"{PIN_URL_PREFIX}/{session.id}/pin",
        json={"is_pinned": True}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_pinned"] is True
    assert data["id"] == str(session.id)
    mock_toggle.assert_called_once()


def test_toggle_pin_unpin(test_client, mocker):
    """Test PATCH /sessions/{id}/pin toggles is_pinned to false."""
    now = datetime.utcnow()
    session = ChatSession(
        id=uuid.uuid4(),
        user_id=app.dependency_overrides[get_current_user]().id,
        title="Test Session",
        message_count=3,
        is_pinned=False,
        created_at=now,
        updated_at=now
    )
    mock_toggle = mocker.patch.object(chat_service, "toggle_pin_session", return_value=session)

    response = test_client.patch(
        f"{PIN_URL_PREFIX}/{session.id}/pin",
        json={"is_pinned": False}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_pinned"] is False
    mock_toggle.assert_called_once()


def test_toggle_pin_unauthorized(test_client, mocker):
    """Test unauthorized user cannot toggle pin."""
    app.dependency_overrides.pop(get_current_user, None)
    response = test_client.patch(
        f"{PIN_URL_PREFIX}/{uuid.uuid4()}/pin",
        json={"is_pinned": True}
    )
    assert response.status_code == 403


def test_toggle_pin_session_not_found(test_client, mocker):
    """Test pin toggle on non-existent session returns 404."""
    from fastapi import HTTPException
    mock_toggle = mocker.patch.object(
        chat_service, "toggle_pin_session",
        side_effect=HTTPException(status_code=404, detail="Chat session not found")
    )

    response = test_client.patch(
        f"{PIN_URL_PREFIX}/{uuid.uuid4()}/pin",
        json={"is_pinned": True}
    )

    assert response.status_code == 404


def test_sessions_list_includes_pinned_field(test_client, mocker):
    """Test GET /sessions returns is_pinned in response."""
    now = datetime.utcnow()
    sessions = [
        ChatSession(
            id=uuid.uuid4(),
            user_id=app.dependency_overrides[get_current_user]().id,
            title=f"Session {i}",
            message_count=i,
            is_pinned=(i == 0),
            created_at=now,
            updated_at=now
        ) for i in range(3)
    ]
    mock_list = mocker.patch.object(chat_service, "get_user_sessions", return_value=sessions)

    response = test_client.get("/api/v1/chat/sessions")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    for s in data:
        assert "is_pinned" in s
    assert data[0]["is_pinned"] is True
    assert data[1]["is_pinned"] is False
