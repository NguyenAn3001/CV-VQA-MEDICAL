from datetime import datetime, timedelta, date
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc

from app.db.models import User, ChatSession, ChatMessage
from app.schemas.analytics import (
    OverviewStats,
    DailySessionStat,
    TopUser,
    AnalyticsOverviewResponse,
)


class AnalyticsService:

    async def get_overview(self, db: AsyncSession, days: int = 30) -> AnalyticsOverviewResponse:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        # --- Aggregate counts ---
        total_users = (await db.execute(select(func.count()).select_from(User))).scalar_one()
        active_users = (
            await db.execute(
                select(func.count()).select_from(User).where(User.is_active == True)
            )
        ).scalar_one()
        total_sessions = (
            await db.execute(select(func.count()).select_from(ChatSession))
        ).scalar_one()
        total_messages = (
            await db.execute(select(func.count()).select_from(ChatMessage))
        ).scalar_one()

        # predictions = assistant messages that contain tool_calls (VQA calls)
        total_predictions = (
            await db.execute(
                select(func.count())
                .select_from(ChatMessage)
                .where(ChatMessage.role == "assistant")
                .where(ChatMessage.tool_calls != None)
            )
        ).scalar_one()

        new_users_today = (
            await db.execute(
                select(func.count())
                .select_from(User)
                .where(User.created_at >= today_start)
            )
        ).scalar_one()

        new_sessions_today = (
            await db.execute(
                select(func.count())
                .select_from(ChatSession)
                .where(ChatSession.created_at >= today_start)
            )
        ).scalar_one()

        overview = OverviewStats(
            total_users=total_users,
            active_users=active_users,
            total_sessions=total_sessions,
            total_messages=total_messages,
            total_predictions=total_predictions,
            new_users_today=new_users_today,
            new_sessions_today=new_sessions_today,
        )

        # --- Sessions & messages over time (daily buckets) ---
        since = datetime.utcnow() - timedelta(days=days)

        # Sessions per day
        sessions_by_day_result = await db.execute(
            select(
                func.date(ChatSession.created_at).label("day"),
                func.count().label("cnt"),
            )
            .where(ChatSession.created_at >= since)
            .group_by(func.date(ChatSession.created_at))
            .order_by(func.date(ChatSession.created_at))
        )
        sessions_by_day = {str(r.day): r.cnt for r in sessions_by_day_result.all()}

        # Messages per day
        messages_by_day_result = await db.execute(
            select(
                func.date(ChatMessage.created_at).label("day"),
                func.count().label("cnt"),
            )
            .where(ChatMessage.created_at >= since)
            .group_by(func.date(ChatMessage.created_at))
            .order_by(func.date(ChatMessage.created_at))
        )
        messages_by_day = {str(r.day): r.cnt for r in messages_by_day_result.all()}

        # Build continuous date range (fill zeros for missing days)
        sessions_over_time: List[DailySessionStat] = []
        for i in range(days):
            d = (datetime.utcnow() - timedelta(days=days - 1 - i)).date()
            day_str = str(d)
            sessions_over_time.append(
                DailySessionStat(
                    date=day_str,
                    sessions=sessions_by_day.get(day_str, 0),
                    messages=messages_by_day.get(day_str, 0),
                )
            )

        # --- Top users by session count ---
        top_users_result = await db.execute(
            select(
                User.id,
                User.username,
                func.count(ChatSession.id).label("session_count"),
                func.sum(ChatSession.message_count).label("message_count"),
            )
            .join(ChatSession, ChatSession.user_id == User.id, isouter=True)
            .group_by(User.id, User.username)
            .order_by(desc("session_count"))
            .limit(10)
        )

        top_users: List[TopUser] = [
            TopUser(
                user_id=str(r.id),
                username=r.username,
                session_count=r.session_count or 0,
                message_count=int(r.message_count or 0),
            )
            for r in top_users_result.all()
        ]

        return AnalyticsOverviewResponse(
            overview=overview,
            sessions_over_time=sessions_over_time,
            top_users=top_users,
        )


analytics_service = AnalyticsService()
