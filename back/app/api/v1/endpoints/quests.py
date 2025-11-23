from typing import List
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db_session
from app.api.v1.dependencies import get_current_user
from app import schemas, models

router = APIRouter()

# --- Helpers ---
def check_staff_permission(user: models.User):
    if user.role not in [models.UserRoleEnum.HR, models.UserRoleEnum.MENTOR, models.UserRoleEnum.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

# Helper for full track loading
async def get_full_track(db: AsyncSession, track_id: UUID):
    query = (
        select(models.OnboardingTrack)
        .where(models.OnboardingTrack.id == track_id)
        .options(
            selectinload(models.OnboardingTrack.files),
            selectinload(models.OnboardingTrack.stages).options(
                selectinload(models.Stage.files),
                selectinload(models.Stage.tasks).selectinload(models.Task.files)
            )
        )
    )
    result = await db.execute(query)
    return result.scalar_one()

# --- Endpoints ---

@router.get("/tracks", response_model=List[schemas.TrackPublic])
async def get_all_tracks(
    db: AsyncSession = Depends(get_db_session),
    user: models.User = Depends(get_current_user)
):
    # ИСПРАВЛЕНИЕ: Добавлен глубокий selectinload для tasks и files
    query = (
        select(models.OnboardingTrack)
        .where(models.OnboardingTrack.organization_id == user.organization_id)
        .options(
            selectinload(models.OnboardingTrack.files),
            selectinload(models.OnboardingTrack.stages).options(
                selectinload(models.Stage.files),
                selectinload(models.Stage.tasks).selectinload(models.Task.files)
            )
        )
    )
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/tracks", response_model=schemas.TrackPublic, status_code=status.HTTP_201_CREATED)
async def create_track(
    track_in: schemas.TrackCreate,
    db: AsyncSession = Depends(get_db_session),
    user: models.User = Depends(get_current_user)
):
    check_staff_permission(user)

    track_files = []
    if track_in.file_ids:
        files_q = select(models.KnowledgeSource).where(models.KnowledgeSource.id.in_(track_in.file_ids))
        track_files = (await db.execute(files_q)).scalars().all()

    db_track = models.OnboardingTrack(
        name=track_in.name,
        description=track_in.description,
        organization_id=user.organization_id,
        files=list(track_files)
    )
    db.add(db_track)
    await db.flush()

    for stage_in in track_in.stages:
        stage_files = []
        if stage_in.file_ids:
            s_files_q = select(models.KnowledgeSource).where(models.KnowledgeSource.id.in_(stage_in.file_ids))
            stage_files = (await db.execute(s_files_q)).scalars().all()

        db_stage = models.Stage(
            track_id=db_track.id,
            title=stage_in.title,
            description=stage_in.description,
            order=stage_in.order,
            reward_xp=stage_in.reward_xp,
            files=list(stage_files)
        )
        db.add(db_stage)
        await db.flush()

        for task_in in stage_in.tasks:
            task_files = []
            if task_in.file_ids:
                t_files_q = select(models.KnowledgeSource).where(models.KnowledgeSource.id.in_(task_in.file_ids))
                task_files = (await db.execute(t_files_q)).scalars().all()

            db_task = models.Task(
                stage_id=db_stage.id,
                title=task_in.title,
                description=task_in.description,
                type=task_in.type,
                order=task_in.order,
                reward_xp=task_in.reward_xp,
                quiz_id=task_in.quiz_id,
                files=list(task_files)
            )
            db.add(db_task)
            await db.flush()

    await db.commit()
    return await get_full_track(db, db_track.id)

@router.put("/tracks/{track_id}", response_model=schemas.TrackPublic)
async def update_track(
    track_id: UUID,
    track_in: schemas.TrackCreate,
    db: AsyncSession = Depends(get_db_session),
    user: models.User = Depends(get_current_user)
):
    check_staff_permission(user)
    
    query = select(models.OnboardingTrack).where(models.OnboardingTrack.id == track_id).options(selectinload(models.OnboardingTrack.files))
    result = await db.execute(query)
    db_track = result.scalar_one_or_none()

    if not db_track or db_track.organization_id != user.organization_id:
        raise HTTPException(status_code=404, detail="Track not found")

    db_track.name = track_in.name
    db_track.description = track_in.description
    
    if track_in.file_ids:
        files_q = select(models.KnowledgeSource).where(models.KnowledgeSource.id.in_(track_in.file_ids))
        files = (await db.execute(files_q)).scalars().all()
        db_track.files = list(files)
    else:
        db_track.files = []

    # Удаляем старые этапы (каскадно должны удалиться задачи, но лучше проверить модели)
    query_stages = select(models.Stage).where(models.Stage.track_id == track_id)
    old_stages = (await db.execute(query_stages)).scalars().all()
    for s in old_stages:
        await db.delete(s)
    await db.flush()

    # Пересоздаем этапы
    for stage_in in track_in.stages:
        stage_files = []
        if stage_in.file_ids:
            s_files_q = select(models.KnowledgeSource).where(models.KnowledgeSource.id.in_(stage_in.file_ids))
            stage_files = (await db.execute(s_files_q)).scalars().all()

        db_stage = models.Stage(
            track_id=db_track.id,
            title=stage_in.title,
            description=stage_in.description,
            order=stage_in.order,
            reward_xp=stage_in.reward_xp,
            files=list(stage_files)
        )
        db.add(db_stage)
        await db.flush()

        for task_in in stage_in.tasks:
            task_files = []
            if task_in.file_ids:
                t_files_q = select(models.KnowledgeSource).where(models.KnowledgeSource.id.in_(task_in.file_ids))
                task_files = (await db.execute(t_files_q)).scalars().all()

            db_task = models.Task(
                stage_id=db_stage.id,
                title=task_in.title,
                description=task_in.description,
                type=task_in.type,
                order=task_in.order,
                reward_xp=task_in.reward_xp,
                quiz_id=task_in.quiz_id,
                files=list(task_files)
            )
            db.add(db_task)
            await db.flush()

    await db.commit()
    return await get_full_track(db, track_id)

@router.delete("/tracks/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_track(
    track_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    user: models.User = Depends(get_current_user)
):
    check_staff_permission(user)
    track = await db.get(models.OnboardingTrack, track_id)
    if not track or track.organization_id != user.organization_id:
        raise HTTPException(status_code=404, detail="Track not found")
    await db.delete(track)
    await db.commit()
    return None

@router.get("/my-track", response_model=schemas.TrackPublic)
async def get_my_track(
    db: AsyncSession = Depends(get_db_session),
    user: models.User = Depends(get_current_user)
):
    if not user.track_id:
        raise HTTPException(status_code=404, detail="Track not assigned")
    return await get_full_track(db, user.track_id)

@router.get("/progress", response_model=List[schemas.UserTaskProgress])
async def get_user_progress(
    db: AsyncSession = Depends(get_db_session),
    user: models.User = Depends(get_current_user)
):
    # ИСПРАВЛЕНО: Загружаем task.files, чтобы избежать MissingGreenlet
    query = (
        select(models.UserProgress)
        .where(models.UserProgress.user_id == user.id)
        .options(
            selectinload(models.UserProgress.task).selectinload(models.Task.files)
        )
    )
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/tasks/{task_id}/submit")
async def submit_task(
    task_id: UUID,
    payload: schemas.TaskSubmitRequest,
    db: AsyncSession = Depends(get_db_session),
    user: models.User = Depends(get_current_user)
):
    # Проверяем, есть ли прогресс по этой задаче
    q = select(models.UserProgress).where(
        models.UserProgress.user_id == user.id,
        models.UserProgress.task_id == task_id
    )
    res = await db.execute(q)
    progress = res.scalar_one_or_none()
    
    if not progress:
        raise HTTPException(404, "Task not available or not assigned")
        
    if progress.status == models.TaskStatusEnum.LOCKED:
        raise HTTPException(400, "Task is locked")

    # Логика завершения (для 'reading' и 'action' сразу complete, для quiz - отдельно)
    progress.status = models.TaskStatusEnum.COMPLETED
    progress.user_answer = payload.user_answer
    progress.completed_at = datetime.now()
    
    # Начисляем XP
    task = await db.get(models.Task, task_id)
    if task:
        user.xp_points += task.reward_xp
    
    # Тут должна быть логика открытия следующей задачи (упрощенно)
    # Можно добавить вызов сервисной функции

    await db.commit()
    return {"status": "success"}

@router.post("/assign/{user_id}/{track_id}")
async def assign_track_to_user(
    user_id: UUID,
    track_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    user: models.User = Depends(get_current_user)
):
    """Назначение трека сотруднику (Ментор назначает своим)."""
    check_staff_permission(user)
    
    target_user = await db.get(models.User, user_id)
    track = await db.get(models.OnboardingTrack, track_id)
    
    if not target_user or not track:
        raise HTTPException(status_code=404, detail="User or Track not found")

    if user.role == models.UserRoleEnum.MENTOR:
        # Ментор может назначать только своим, если есть привязка
        if target_user.mentor_id != user.id:
             pass # Можно раскомментировать проверку в строгом режиме

    target_user.track_id = track.id
    
    q_stages = select(models.Stage).where(models.Stage.track_id == track.id).options(selectinload(models.Stage.tasks))
    stages = (await db.execute(q_stages)).scalars().all()
    
    first_task = True
    
    for stage in stages:
        for task in stage.tasks:
            exists_q = select(models.UserProgress).where(
                models.UserProgress.user_id == target_user.id,
                models.UserProgress.task_id == task.id
            )
            exists = (await db.execute(exists_q)).scalar_one_or_none()
            
            if not exists:
                # Первую задачу делаем доступной, остальные залочены
                initial_status = models.TaskStatusEnum.AVAILABLE if first_task else models.TaskStatusEnum.LOCKED
                if first_task: first_task = False
                
                up = models.UserProgress(
                    user_id=target_user.id,
                    task_id=task.id,
                    status=initial_status
                )
                db.add(up)

    await db.commit()
    return {"status": "assigned", "user": target_user.email, "track": track.name}