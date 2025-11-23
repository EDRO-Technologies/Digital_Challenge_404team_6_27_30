from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Any
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db_session
from app.api.v1.dependencies import get_current_user
from app import models, schemas

router = APIRouter()

# --- Schemas ---
class MentorAssignRequest(BaseModel):
    mentee_id: UUID
    mentor_id: UUID

# --- Endpoints ---

@router.get("/employees", response_model=List[schemas.User])
async def get_all_employees_for_hr(
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(get_current_user)
):
    """
    Получение списка всех пользователей для HR.
    """
    if current_user.role not in [models.UserRoleEnum.HR, models.UserRoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Возвращаем всех, HR на фронте сам отфильтрует кого показывать
    result = await db.execute(select(models.User))
    return result.scalars().all()

@router.post("/assign-mentor")
async def assign_mentor(
    payload: MentorAssignRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(get_current_user)
):
    """
    Назначение ментора сотруднику.
    """
    if current_user.role not in [models.UserRoleEnum.HR, models.UserRoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    mentee = await db.get(models.User, payload.mentee_id)
    mentor = await db.get(models.User, payload.mentor_id)

    if not mentee or not mentor:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Проверка, что ментор действительно имеет роль ментора (опционально, но полезно)
    if mentor.role != models.UserRoleEnum.MENTOR:
        raise HTTPException(status_code=400, detail="Selected user is not a mentor")

    mentee.mentor_id = mentor.id
    await db.commit()
    
    return {"status": "success", "detail": f"Mentor {mentor.full_name} assigned to {mentee.full_name}"}