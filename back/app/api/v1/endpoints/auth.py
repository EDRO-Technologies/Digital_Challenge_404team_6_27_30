from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db_session
from app.core import security
from app.core.config import settings
from app.api.v1.dependencies import get_current_user, get_current_admin 
from app import schemas, models

router = APIRouter()

def get_hardcoded_admin(email: str) -> Optional[dict]:
    for admin in settings.INITIAL_ADMINS:
        if admin["email"] == email:
            return admin
    return None

@router.post("/register", response_model=schemas.RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
        user_in: schemas.UserCreate,
        db: AsyncSession = Depends(get_db_session)
):
    """
    Регистрация. Присваивается роль UNCONFIRMED. Создается тикет для админа.
    """
    if get_hardcoded_admin(user_in.email):
        raise HTTPException(status_code=400, detail="Этот email зарезервирован.")

    result = await db.execute(select(models.User).where(models.User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Пользователь уже существует")

    result = await db.execute(select(models.Organization).limit(1))
    db_org = result.scalar_one_or_none()
    if not db_org:
        db_org = models.Organization(name=user_in.organization_name)
        db.add(db_org)
        await db.flush()

    hashed_password = security.get_password_hash(user_in.password)
    
    # ВСЕГДА UNCONFIRMED ПРИ РЕГИСТРАЦИИ
    db_user = models.User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hashed_password,
        organization_id=db_org.id,
        role=models.UserRoleEnum.UNCONFIRMED 
    )
    db.add(db_user)
    await db.flush() 

    # Тикет для админа
    new_ticket = models.Ticket(
        user_id=db_user.id,
        question=f"Новая регистрация: {db_user.full_name} ({db_user.email}). Требуется подтверждение.",
        status=models.TicketStatusEnum.OPEN
    )
    db.add(new_ticket)

    await db.commit()
    await db.refresh(db_user)

    access_token = security.create_access_token(data={"sub": str(db_user.id)})
    refresh_token = security.create_refresh_token(data={"sub": str(db_user.id)})

    return schemas.RegisterResponse(
        user=schemas.UserPublic.model_validate(db_user),
        organization=schemas.OrganizationPublic.model_validate(db_org),
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/login", response_model=schemas.LoginResponse)
async def login_user(
        form_data: schemas.UserLogin,
        db: AsyncSession = Depends(get_db_session)
):
    hardcoded_admin = get_hardcoded_admin(form_data.email)
    
    if hardcoded_admin:
        if form_data.password == hardcoded_admin["password"]:
            org_res = await db.execute(select(models.Organization).limit(1))
            db_org = org_res.scalar_one_or_none()
            if not db_org:
                db_org = models.Organization(name="Default Org")
                db.add(db_org)
                await db.flush()

            user_res = await db.execute(select(models.User).where(models.User.email == form_data.email))
            db_user = user_res.scalar_one_or_none()

            if not db_user:
                print(f"Auto-creating Super Admin: {form_data.email}")
                db_user = models.User(
                    full_name=hardcoded_admin.get("full_name", "Super Admin"),
                    email=form_data.email,
                    hashed_password=security.get_password_hash(form_data.password),
                    organization_id=db_org.id,
                    role=models.UserRoleEnum.ADMIN
                )
                db.add(db_user)
                await db.commit()
                await db.refresh(db_user)
            else:
                if db_user.role != models.UserRoleEnum.ADMIN:
                    db_user.role = models.UserRoleEnum.ADMIN
                    await db.commit()
            
            access_token = security.create_access_token(data={"sub": str(db_user.id)})
            refresh_token = security.create_refresh_token(data={"sub": str(db_user.id)})
            
            return schemas.LoginResponse(
                user=schemas.UserPublic.model_validate(db_user),
                access_token=access_token,
                refresh_token=refresh_token
            )
        else:
            raise HTTPException(status_code=400, detail="Incorrect password")

    result = await db.execute(select(models.User).where(models.User.email == form_data.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    if not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")

    access_token = security.create_access_token(data={"sub": str(user.id)})
    refresh_token = security.create_refresh_token(data={"sub": str(user.id)})

    return schemas.LoginResponse(
        user=schemas.UserPublic.model_validate(user),
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.get("/me", response_model=schemas.UserPublic)
async def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/users", response_model=List[schemas.UserPublic])
async def get_all_users(
    db: AsyncSession = Depends(get_db_session),
    admin: models.User = Depends(get_current_admin)
):
    result = await db.execute(select(models.User))
    return result.scalars().all()