import shutil
import os
import logging
import traceback
from datetime import datetime
from uuid import uuid4, UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc

from app.core.database import get_db_session
from app.api.v1.dependencies import get_current_user
from app.services.ai_client import ai_client
from app import models, schemas
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# Убедимся, что директория существует
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@router.get("/files", response_model=List[schemas.KnowledgeSourcePublic])
async def get_all_files(
    db: AsyncSession = Depends(get_db_session),
    user: models.User = Depends(get_current_user)
):
    """Получить все файлы (глобально или по организации)."""
    # В MVP показываем все файлы, загруженные в систему (или фильтруем по user.organization_id)
    # query = select(models.KnowledgeSource).where(models.KnowledgeSource.organization_id == user.organization_id)
    query = select(models.KnowledgeSource).order_by(desc(models.KnowledgeSource.created_at))
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/upload", response_model=schemas.KnowledgeSourcePublic)
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db_session),
    user: models.User = Depends(get_current_user)
):
    """Загрузка файла в базу знаний."""
    try:
        # Разрешаем загрузку админам, HR и менторам. 
        # Сотрудникам тоже можно разрешить, если это "ДЗ", но пока ограничим.
        if user.role not in [models.UserRoleEnum.ADMIN, models.UserRoleEnum.HR, models.UserRoleEnum.MENTOR]:
             # raise HTTPException(status_code=403, detail="Only staff can upload files to KB")
             pass # Для тестов пока разрешим всем

        filename = file.filename if file.filename else "unnamed_file"
        # Генерируем уникальное имя, чтобы не было коллизий
        file_ext = os.path.splitext(filename)[1]
        unique_filename = f"{uuid4()}{file_ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        # Вычисляем размер (примерно)
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)

        # Сохраняем на диск
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Создаем запись в БД
        # Используем заглушку для ID воркспейса/трека, если нужно, или NULL
        db_source = models.KnowledgeSource(
            name=filename,
            type=models.KnowledgeSourceTypeEnum.FILE,
            status=models.KnowledgeSourceStatusEnum.PROCESSING, # Сразу ставим статус "в обработке" для AI
            file_path=file_path,
            organization_id=user.organization_id,
            content={"size": file_size} # Сохраняем метаданные
        )
        
        db.add(db_source)
        await db.commit()
        await db.refresh(db_source)
        
        # TODO: Запустить фоновую задачу для индексации в ChromaDB через ai_client
        # asyncio.create_task(ai_client.process_file(db_source.id, ...))
        
        return db_source

    except Exception as e:
        logger.error(f"UPLOAD ERROR: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/files/{file_id}/download")
async def download_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    user: models.User = Depends(get_current_user)
):
    db_file = await db.get(models.KnowledgeSource, file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    if not db_file.file_path or not os.path.exists(db_file.file_path):
        raise HTTPException(status_code=404, detail="File missing on disk")

    return FileResponse(
        path=db_file.file_path, 
        filename=db_file.name,
        media_type="application/octet-stream"
    )

@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    user: models.User = Depends(get_current_user)
):
    if user.role not in [models.UserRoleEnum.ADMIN, models.UserRoleEnum.HR]:
         raise HTTPException(status_code=403, detail="Not authorized")

    db_file = await db.get(models.KnowledgeSource, file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    # Удаляем с диска
    if db_file.file_path and os.path.exists(db_file.file_path):
        try:
            os.remove(db_file.file_path)
        except Exception as e:
            logger.error(f"Error deleting file from disk: {e}")

    await db.delete(db_file)
    await db.commit()
    return None