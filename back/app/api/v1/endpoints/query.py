from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
# --- ВАЖНО: Этот импорт необходим для работы Optional[UUID] ---
from typing import Optional 

from app.core.database import get_db_session
from app.api.v1.dependencies import get_current_user
from app.services.ai_client import ai_client
from app import schemas, models

router = APIRouter()

async def get_or_create_session(db: AsyncSession, user_id: Optional[UUID], session_id: UUID) -> models.ChatSession:
    """Находит или создает сессию чата."""
    result = await db.execute(
        select(models.ChatSession)
        .where(models.ChatSession.id == session_id)
    )
    session = result.scalar_one_or_none()

    if not session:
        # Создаем сессию (user_id может быть None для публичных чатов)
        session = models.ChatSession(id=session_id, user_id=user_id)
        db.add(session)
        await db.commit()
        await db.refresh(session)
    return session

@router.post(
    "/workspaces/{track_id}/query",
    response_model=schemas.QueryResponse,
    tags=["4. RAG Query"]
)
async def query_track(
        track_id: UUID,
        query_in: schemas.QueryRequest,
        db: AsyncSession = Depends(get_db_session),
        current_user: models.User = Depends(get_current_user)
):
    # 1. Сессия
    session = await get_or_create_session(db, current_user.id, query_in.session_id)

    # 2. RAG запрос (ищем в коллекции track_id)
    try:
        answer, sources = await ai_client.answer_query(
            workspace_id=track_id, # Используем track_id как имя коллекции
            question=query_in.question,
            session_id=query_in.session_id
        )
    except HTTPException as e:
        raise e

    # 3. Сохраняем сообщение
    db_message = models.ChatMessage(
        session_id=session.id,
        question=query_in.question,
        answer=answer,
        sources=[s.model_dump() for s in sources]
    )
    db.add(db_message)
    await db.commit()

    return schemas.QueryResponse(
        answer=answer,
        sources=sources
    )

# --- Функция для публичного API (public.py) ---
async def public_query(
    query_in: schemas.PublicQueryRequest,
    db: AsyncSession
) -> schemas.QueryResponse:
    """
    Логика для публичного запроса (используется в endpoints/public.py).
    """
    # 1. Сессия (без пользователя, user_id=None)
    session = await get_or_create_session(db, None, query_in.session_id)

    # 2. RAG запрос
    try:
        answer, sources = await ai_client.answer_query(
            workspace_id=query_in.workspace_id,
            question=query_in.question,
            session_id=query_in.session_id
        )
    except Exception as e:
        print(f"Public Query Error: {e}")
        answer = "Извините, сервис временно недоступен."
        sources = []

    # 3. Сохраняем сообщение
    db_message = models.ChatMessage(
        session_id=session.id,
        question=query_in.question,
        answer=answer,
        sources=[s.model_dump() for s in sources]
    )
    db.add(db_message)
    await db.commit()

    return schemas.QueryResponse(
        answer=answer,
        sources=sources,
        ticket_id=None
    )