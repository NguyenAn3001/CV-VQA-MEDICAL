import uuid
from datetime import datetime

from app.api import analytics as analytics_api
from app.api import health as health_api
from app.api.deps import get_current_user, get_db
from app.db.models import User
from app.main import app
from app.schemas.analytics import AnalyticsOverviewResponse, DailySessionStat, OverviewStats, TopUser


def _admin_user() -> User:
    now = datetime.utcnow()
    return User(
        id=uuid.uuid4(),
        username="admin-user",
        email="admin@vqa.com",
        role="admin",
        is_active=True,
        must_change_password=False,
        full_name="Admin User",
        created_at=now,
        updated_at=now,
    )


def test_health_endpoint_reports_version(test_client):
    response = test_client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"
    assert payload["version"]


def test_ready_endpoint_reports_loaded_models(test_client):
    response = test_client.get("/ready")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["models_loaded"] is True
    assert payload["vqa_enabled"] is True
    assert payload["captioning_enabled"] is True
    assert payload["device"] in {"cpu", "cuda"}


def test_ready_endpoint_returns_503_when_pipeline_not_ready(test_client, mocker):
    ready_mock = mocker.patch.object(health_api.ai_pipeline, "is_ready", return_value=False)

    response = test_client.get("/ready")

    assert response.status_code == 503
    assert response.text
    ready_mock.assert_called_once()


def test_metrics_endpoint_exposes_prometheus_metrics(test_client):
    response = test_client.get("/metrics")

    assert response.status_code == 200
    text = response.text
    assert "python_info" in text or "process_cpu_seconds_total" in text


def test_admin_analytics_overview_is_accessible_with_admin_role(test_client, mocker):
    admin_user = _admin_user()
    overview = AnalyticsOverviewResponse(
        overview=OverviewStats(
            total_users=3,
            active_users=2,
            total_sessions=5,
            total_messages=14,
            total_predictions=4,
            new_users_today=1,
            new_sessions_today=2,
        ),
        sessions_over_time=[
            DailySessionStat(date="2026-07-10", sessions=2, messages=7),
            DailySessionStat(date="2026-07-09", sessions=3, messages=7),
        ],
        top_users=[TopUser(user_id=str(admin_user.id), username=admin_user.username, session_count=5, message_count=14)],
    )

    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[get_db] = lambda: object()
    overview_mock = mocker.patch.object(analytics_api.analytics_service, "get_overview", return_value=overview)

    try:
        response = test_client.get("/api/v1/admin/analytics/overview?days=7")
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    payload = response.json()
    assert payload["overview"]["total_predictions"] == 4
    assert len(payload["sessions_over_time"]) == 2
    assert payload["top_users"][0]["username"] == "admin-user"
    overview_mock.assert_called_once()