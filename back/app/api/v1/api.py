from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    quests,
    quizzes,
    knowledge,
    mentor,
    hr,
    admin,
    analytics,
    query,
    public,
    connectors,
    tools
)

api_router = APIRouter()

# 1. Auth
api_router.include_router(auth.router, prefix="/auth", tags=["1. Authentication"])

# 2. Основной функционал (Квесты, Тесты)
api_router.include_router(quests.router, prefix="/quests", tags=["2. Quests & Tracks"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["2.1 Quizzes"])

# 3. Ролевые панели
api_router.include_router(mentor.router, prefix="/mentor", tags=["2.2 Mentor Dashboard"])
api_router.include_router(admin.router, prefix="/admin", tags=["2.3 Admin Dashboard"])
api_router.include_router(hr.router, prefix="/hr", tags=["2.4 HR Dashboard"])

# 4. База Знаний (ИСПРАВЛЕНО: Вынесли из /workspaces в корень /knowledge для простоты)
api_router.include_router(knowledge.router, prefix="/knowledge", tags=["3. Knowledge Base"])

# 5. AI и Аналитика
api_router.include_router(query.router, tags=["4. RAG Query"]) # Можно оставить как есть или перенести
api_router.include_router(public.router, tags=["5. RAG Query (Public Widget)"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["6. Analytics"]) # Тоже упростили путь

# 6. Интеграции (Пока оставим, но можно скрыть)
api_router.include_router(connectors.router, prefix="/connectors", tags=["7. Connectors"])
api_router.include_router(tools.router, prefix="/tools", tags=["8. Agent Tools"])