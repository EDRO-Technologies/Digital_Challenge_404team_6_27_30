from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db_session
from app.api.v1.dependencies import get_current_user
from app import schemas, models

router = APIRouter()

@router.get("/mentees", response_model=List[schemas.UserPublic])
async def get_my_mentees(
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(get_current_user)
):
    """Получить список подопечных текущего ментора."""
    query = select(models.User).where(
        models.User.mentor_id == current_user.id
    )
    result = await db.execute(query)
    return result.scalars().all()