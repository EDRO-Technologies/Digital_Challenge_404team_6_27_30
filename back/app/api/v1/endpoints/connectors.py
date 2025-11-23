from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.core.database import get_db_session
from app.api.v1.dependencies import get_current_hr
from app import schemas, models

router = APIRouter()

@router.post(
    "/{track_id}/connectors",
    response_model=schemas.ConnectorPublic,
    status_code=status.HTTP_201_CREATED
)
async def create_connector(
        track_id: UUID,
        connector_in: schemas.ConnectorCreate,
        db: AsyncSession = Depends(get_db_session),
        hr_user: models.User = Depends(get_current_hr)
):
    """
    Добавление "Коннектора" (Confluence, Google Drive) к треку.
    """
    # 1. Зашифровать auth_details (заглушка)
    encrypted_auth = connector_in.auth_details # В продакшене здесь должно быть шифрование

    # 2. Сохранить в БД
    db_connector = models.Connector(
        track_id=track_id,
        type=connector_in.type,
        display_name=connector_in.display_name,
        auth_details=encrypted_auth,
        sync_schedule=connector_in.sync_schedule,
        status="active"
    )
    db.add(db_connector)
    await db.commit()
    await db.refresh(db_connector)

    return db_connector


@router.post(
    "/{track_id}/connectors/{connector_id}/sync",
    response_model=schemas.SyncResponse
)
async def sync_connector(
        track_id: UUID,
        connector_id: UUID,
        db: AsyncSession = Depends(get_db_session),
        hr_user: models.User = Depends(get_current_hr)
):
    """
    Принудительный запуск синхронизации коннектора.
    """
    # 1. Найти коннектор
    result = await db.execute(select(models.Connector).where(models.Connector.id == connector_id,
                                                             models.Connector.track_id == track_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Connector not found")

    # 2. Запустить фоновую задачу синхронизации (STUB)
    print(f"TODO: Start background sync for connector {connector_id}")

    return schemas.SyncResponse(
        status="SYNC_STARTED",
        message="Синхронизация успешно запущена."
    )


@router.get(
    "/{track_id}/connectors",
    response_model=List[schemas.ConnectorPublic]
)
async def get_connectors(
        track_id: UUID,
        db: AsyncSession = Depends(get_db_session),
        hr_user: models.User = Depends(get_current_hr)
):
    """
    Список всех коннекторов в треке.
    """
    query = select(models.Connector).where(models.Connector.track_id == track_id)
    result = await db.execute(query)
    connectors = result.scalars().all()

    return connectors


@router.delete(
    "/{track_id}/connectors/{connector_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_connector(
        track_id: UUID,
        connector_id: UUID,
        db: AsyncSession = Depends(get_db_session),
        hr_user: models.User = Depends(get_current_hr)
):
    """
    Удаление коннектора.
    """
    # 1. Найти коннектор
    result = await db.execute(select(models.Connector).where(models.Connector.id == connector_id,
                                                             models.Connector.track_id == track_id))
    db_connector = result.scalar_one_or_none()

    if not db_connector:
        raise HTTPException(status_code=404, detail="Connector not found")

    # 3. Удалить сам коннектор
    await db.delete(db_connector)
    await db.commit()

    return None