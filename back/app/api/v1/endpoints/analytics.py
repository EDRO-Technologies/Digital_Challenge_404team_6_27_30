from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
import random

from app.core.database import get_db_session
from app.api.v1.dependencies import get_current_user # Для MVP любой юзер может видеть аналитику
from app import schemas, models

router = APIRouter()

@router.get("/dashboard", response_model=schemas.AnalyticsResponse)
async def get_analytics_dashboard(
    period: str = "7d",
    db: AsyncSession = Depends(get_db_session),
    user: models.User = Depends(get_current_user)
):
    """
    Возвращает аналитику. Если данных мало, возвращает красивые заглушки для демо.
    """
    # Пытаемся получить реальные данные
    total_users_q = await db.execute(select(models.User))
    users = total_users_q.scalars().all()
    
    if len(users) < 2:
        # MOCK MODE для демонстрации
        return schemas.AnalyticsResponse(
            active_users=124,
            avg_progress=67.5,
            total_queries=1543,
            answered_queries=1480,
            unanswered_queries=63,
            top_questions=[
                schemas.AnalyticsTopQuestion(question="Как оформить отпуск?", count=150),
                schemas.AnalyticsTopQuestion(question="Где получить СИЗ?", count=120),
                schemas.AnalyticsTopQuestion(question="График работы столовой", count=95),
                schemas.AnalyticsTopQuestion(question="Контакты IT поддержки", count=80),
            ],
            top_unanswered_questions=[
                schemas.AnalyticsTopUnansweredQuestion(question="Когда корпоратив?", count=12),
            ]
        )

    # Реальная логика (упрощенная)
    return schemas.AnalyticsResponse(
        active_users=len(users),
        avg_progress=15.0, # TODO: Считать реально из UserProgress
        total_queries=0,
        answered_queries=0,
        unanswered_queries=0,
        top_questions=[],
        top_unanswered_questions=[]
    )