from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.core.database import get_db_session
from app.api.v1.dependencies import get_current_admin
from app.core import security
from app import schemas, models

router = APIRouter()

# --- ТИКЕТЫ (ЗАЯВКИ) ---

@router.get("/requests", response_model=List[schemas.TicketPublic])
async def get_registration_requests(
    db: AsyncSession = Depends(get_db_session),
    admin: models.User = Depends(get_current_admin)
):
    """Получить список открытых заявок."""
    query = select(models.Ticket).where(
        models.Ticket.status == models.TicketStatusEnum.OPEN
    ).order_by(models.Ticket.created_at.desc())
    
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/approve-user/{user_id}", response_model=schemas.UserPublic)
async def approve_user_registration(
    user_id: UUID,
    role: models.UserRoleEnum,
    db: AsyncSession = Depends(get_db_session),
    admin: models.User = Depends(get_current_admin)
):
    """Одобрить пользователя: назначить роль и закрыть тикеты."""
    user = await db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role
    
    tickets_q = select(models.Ticket).where(
        models.Ticket.user_id == user_id,
        models.Ticket.status == models.TicketStatusEnum.OPEN
    )
    tickets_res = await db.execute(tickets_q)
    tickets = tickets_res.scalars().all()
    
    for ticket in tickets:
        ticket.status = models.TicketStatusEnum.RESOLVED
        ticket.answer = f"Approved by {admin.full_name}. Role: {role}"
    
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/requests/{ticket_id}/reject", status_code=status.HTTP_200_OK)
async def reject_registration_request(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    admin: models.User = Depends(get_current_admin)
):
    """Отклонить заявку (закрывает тикет без изменения роли)."""
    ticket = await db.get(models.Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.status = models.TicketStatusEnum.RESOLVED
    ticket.answer = f"Rejected by {admin.full_name}. Please contact HR."
    
    await db.commit()
    return {"status": "rejected", "ticket_id": ticket_id}

# --- УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ---

@router.post("/users", response_model=schemas.UserPublic, status_code=status.HTTP_201_CREATED)
async def create_user_by_admin(
    user_in: schemas.AdminUserCreate,
    db: AsyncSession = Depends(get_db_session),
    admin: models.User = Depends(get_current_admin)
):
    """Создать пользователя вручную (сразу с ролью)."""
    # Проверка email
    exists = await db.execute(select(models.User).where(models.User.email == user_in.email))
    if exists.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    # Получаем организацию админа
    org_id = admin.organization_id

    hashed_password = security.get_password_hash(user_in.password)
    db_user = models.User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hashed_password,
        organization_id=org_id,
        role=user_in.role
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    admin: models.User = Depends(get_current_admin)
):
    """Удалить пользователя."""
    if user_id == admin.id:
        raise HTTPException(400, "Cannot delete yourself")

    user = await db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    
    # Удаляем (cascade delete сработает для связанных сущностей, если настроено в моделях)
    await db.delete(user)
    await db.commit()
    return None