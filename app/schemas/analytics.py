from pydantic import BaseModel
from typing import List
from datetime import datetime


class OverviewStats(BaseModel):
    total_users: int
    active_users: int
    total_sessions: int
    total_messages: int
    total_predictions: int
    new_users_today: int
    new_sessions_today: int


class DailySessionStat(BaseModel):
    date: str          # "YYYY-MM-DD"
    sessions: int
    messages: int


class TopUser(BaseModel):
    user_id: str
    username: str
    session_count: int
    message_count: int


class AnalyticsOverviewResponse(BaseModel):
    overview: OverviewStats
    sessions_over_time: List[DailySessionStat]
    top_users: List[TopUser]
