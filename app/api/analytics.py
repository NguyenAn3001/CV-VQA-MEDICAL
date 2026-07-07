from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.db.models import User
from app.schemas.analytics import AnalyticsOverviewResponse
from app.services.analytics_service import analytics_service

router = APIRouter()


@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(
    days: int = Query(30, ge=7, le=90, description="Number of days for time-series data (7–90)"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """
    [Admin] Returns a full analytics snapshot:
    - Overview stats (users, sessions, messages, predictions, today's counts)
    - Daily sessions & messages over the last N days
    - Top 10 most active users
    """
    return await analytics_service.get_overview(db, days=days)
