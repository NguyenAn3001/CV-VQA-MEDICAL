"""
Centralized API client for the VQA Medical Chatbot backend.
Handles auth, chat sessions, SSE streaming, and admin operations.
"""

import json
import requests
import streamlit as st
from typing import Optional, Iterator


BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _headers(content_type: Optional[str] = None) -> dict:
    """Build Authorization headers. Falls back gracefully if not logged in."""
    h = {}
    token = st.session_state.get("access_token")
    if token:
        h["Authorization"] = f"Bearer {token}"
    if content_type:
        h["Content-Type"] = content_type
    return h


def _try_refresh() -> bool:
    """
    Attempt to refresh the access token using the stored refresh token.
    Returns True on success, False if the user must re-login.
    """
    refresh_token = st.session_state.get("refresh_token")
    if not refresh_token:
        return False
    try:
        r = requests.post(
            f"{API_V1}/auth/refresh",
            json={"refresh_token": refresh_token},
            timeout=10,
        )
        if r.status_code == 200:
            data = r.json()
            st.session_state["access_token"] = data["access_token"]
            st.session_state["refresh_token"] = data["refresh_token"]
            st.session_state["must_change_password"] = data.get("must_change_password", False)
            return True
    except Exception:
        pass
    return False


def _request(method: str, path: str, retry: bool = True, **kwargs):
    """
    Generic request with automatic 401 → token refresh → retry logic.
    Raises requests.HTTPError on non-2xx after retry.
    """
    url = path if path.startswith("http") else f"{API_V1}{path}"
    kwargs.setdefault("headers", {}).update(_headers())
    kwargs.setdefault("timeout", 30)

    r = requests.request(method, url, **kwargs)

    if r.status_code == 401 and retry:
        if _try_refresh():
            kwargs["headers"].update(_headers())
            r = requests.request(method, url, **kwargs)

    if not r.ok:
        try:
            detail = r.json().get("detail", r.text)
        except Exception:
            detail = r.text
        raise requests.HTTPError(f"{r.status_code}: {detail}", response=r)

    return r


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def health_check() -> dict:
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        return r.json()
    except Exception:
        return {"status": "unreachable"}


def ready_check() -> dict:
    try:
        r = requests.get(f"{BASE_URL}/ready", timeout=5)
        if r.status_code == 200:
            return r.json()
        return {"status": "not_ready"}
    except Exception:
        return {"status": "unreachable"}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def login(username: str, password: str) -> dict:
    r = requests.post(
        f"{API_V1}/auth/login",
        json={"username": username, "password": password},
        timeout=10,
    )
    if not r.ok:
        try:
            detail = r.json().get("detail", r.text)
        except Exception:
            detail = r.text
        raise requests.HTTPError(f"{r.status_code}: {detail}", response=r)
    return r.json()


def register(username: str, email: str, password: str) -> dict:
    r = requests.post(
        f"{API_V1}/auth/register",
        json={"username": username, "email": email, "password": password},
        timeout=10,
    )
    if not r.ok:
        try:
            detail = r.json().get("detail", r.text)
        except Exception:
            detail = r.text
        raise requests.HTTPError(f"{r.status_code}: {detail}", response=r)
    return r.json()


def logout() -> None:
    try:
        _request("POST", "/auth/logout", retry=False)
    except Exception:
        pass  # Logout best-effort; clear local state regardless


def change_password(old_password: str, new_password: str) -> dict:
    r = _request(
        "PUT",
        "/auth/change-password",
        json={"old_password": old_password, "new_password": new_password},
    )
    return r.json()


# ---------------------------------------------------------------------------
# Chat Sessions
# ---------------------------------------------------------------------------

def create_session() -> dict:
    r = _request("POST", "/chat/sessions")
    return r.json()


def list_sessions(skip: int = 0, limit: int = 50) -> list:
    r = _request("GET", "/chat/sessions", params={"skip": skip, "limit": limit})
    return r.json()


def get_session(session_id: str) -> dict:
    r = _request("GET", f"/chat/sessions/{session_id}")
    return r.json()


def delete_session(session_id: str) -> None:
    _request("DELETE", f"/chat/sessions/{session_id}")


# ---------------------------------------------------------------------------
# Chat Streaming
# ---------------------------------------------------------------------------

def send_message_stream(
    session_id: str,
    message: str,
    image_bytes: Optional[bytes] = None,
    image_name: str = "image.jpg",
    image_type: str = "image/jpeg",
) -> Iterator[dict]:
    """
    POST a message to the chat endpoint and yield SSE events as dicts.
    Each dict has keys: 'event' and 'data' (already json-parsed if applicable).

    Yields:
        {"event": "message", "data": {"content": "..."}}
        {"event": "tool_call", "data": {"tools": [...]}}
        {"event": "done",    "data": {"status": "completed"}}
        {"event": "error",   "data": {"detail": "..."}}
    """
    url = f"{API_V1}/chat/sessions/{session_id}/messages"
    headers = _headers()  # No Content-Type — requests sets multipart boundary

    files = None
    if image_bytes:
        files = {"image": (image_name, image_bytes, image_type)}

    data = {"message": message}

    try:
        resp = requests.post(
            url,
            headers=headers,
            data=data,
            files=files,
            stream=True,
            timeout=120,
        )

        if resp.status_code == 401:
            if _try_refresh():
                headers = _headers()
                resp = requests.post(
                    url,
                    headers=headers,
                    data=data,
                    files=files,
                    stream=True,
                    timeout=120,
                )

        if not resp.ok:
            try:
                detail = resp.json().get("detail", resp.text)
            except Exception:
                detail = resp.text
            yield {"event": "error", "data": {"detail": f"{resp.status_code}: {detail}"}}
            return

        # Parse SSE manually (compatible with sse-starlette output)
        event_type = "message"
        for raw_line in resp.iter_lines(decode_unicode=True):
            if not raw_line:
                continue
            if raw_line.startswith("event:"):
                event_type = raw_line[len("event:"):].strip()
            elif raw_line.startswith("data:"):
                raw_data = raw_line[len("data:"):].strip()
                try:
                    parsed = json.loads(raw_data)
                except json.JSONDecodeError:
                    parsed = {"content": raw_data}
                yield {"event": event_type, "data": parsed}
                event_type = "message"  # reset

    except requests.RequestException as e:
        yield {"event": "error", "data": {"detail": str(e)}}


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------

def list_users(skip: int = 0, limit: int = 100) -> list:
    r = _request("GET", "/admin/users/", params={"skip": skip, "limit": limit})
    return r.json()


def get_user(user_id: str) -> dict:
    r = _request("GET", f"/admin/users/{user_id}")
    return r.json()


def reset_user_password(user_id: str, new_password: Optional[str] = None) -> dict:
    r = _request(
        "PUT",
        f"/admin/users/{user_id}/reset-password",
        json={"new_password": new_password},
    )
    return r.json()


def deactivate_user(user_id: str) -> dict:
    r = _request("PUT", f"/admin/users/{user_id}/deactivate")
    return r.json()


def activate_user(user_id: str) -> dict:
    r = _request("PUT", f"/admin/users/{user_id}/activate")
    return r.json()
