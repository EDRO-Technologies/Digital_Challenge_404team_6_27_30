from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Any
from uuid import UUID
import json
from datetime import datetime

from app.core.database import get_db_session
from app.api.v1.dependencies import get_current_user, get_current_hr
from app.services.ai_client import ai_client
from app import schemas, models

router = APIRouter()

@router.post("/", response_model=schemas.QuizPublic, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz_in: schemas.QuizCreate,
    db: AsyncSession = Depends(get_db_session),
    hr_user: models.User = Depends(get_current_hr)
):
    db_quiz = models.Quiz(title=quiz_in.title, description=quiz_in.description, pass_threshold=quiz_in.pass_threshold)
    db.add(db_quiz)
    await db.flush()
    for q_in in quiz_in.questions:
        options_json = [opt.model_dump() for opt in q_in.options]
        db_question = models.QuizQuestion(quiz_id=db_quiz.id, text=q_in.text, order=q_in.order, options=options_json)
        db.add(db_question)
    await db.commit()
    query = select(models.Quiz).where(models.Quiz.id == db_quiz.id).options(selectinload(models.Quiz.questions))
    result = await db.execute(query)
    return result.scalar_one()

@router.get("/{quiz_id}", response_model=schemas.QuizPublic)
async def get_quiz(quiz_id: UUID, db: AsyncSession = Depends(get_db_session), current_user: models.User = Depends(get_current_user)):
    query = select(models.Quiz).where(models.Quiz.id == quiz_id).options(selectinload(models.Quiz.questions))
    result = await db.execute(query)
    quiz = result.scalar_one_or_none()
    if not quiz: raise HTTPException(404, "Quiz not found")
    return quiz

@router.post("/{quiz_id}/submit", response_model=schemas.QuizAttemptResult)
async def submit_quiz(quiz_id: UUID, submission: schemas.QuizSubmission, db: AsyncSession = Depends(get_db_session), current_user: models.User = Depends(get_current_user)):
    query = select(models.Quiz).where(models.Quiz.id == quiz_id).options(selectinload(models.Quiz.questions))
    result = await db.execute(query)
    quiz = result.scalar_one_or_none()
    if not quiz: raise HTTPException(status_code=404, detail="Quiz not found")

    correct_count = 0
    total_questions = len(quiz.questions)
    if total_questions == 0: raise HTTPException(status_code=400, detail="Quiz has no questions")

    correct_map = {}
    for q in quiz.questions:
        for opt in q.options:
            if opt.get("is_correct"):
                correct_map[q.id] = opt.get("id")
                break
    
    for ans in submission.answers:
        if ans.question_id in correct_map:
            if correct_map[ans.question_id] == ans.selected_option_id:
                correct_count += 1
    
    score = correct_count / total_questions
    passed = score >= quiz.pass_threshold
    
    attempt = models.UserQuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz_id,
        score=score,
        passed=passed
    )
    db.add(attempt)
    
    xp_earned = 0
    message = "Тест не сдан. Попробуйте снова."
    
    if passed:
        task_query = select(models.Task).where(models.Task.quiz_id == quiz_id).limit(1)
        task_result = await db.execute(task_query)
        task = task_result.scalar_one_or_none()
        
        if task:
            prog_query = select(models.UserProgress).where(
                models.UserProgress.user_id == current_user.id,
                models.UserProgress.task_id == task.id
            )
            prog_result = await db.execute(prog_query)
            progress = prog_result.scalar_one_or_none()
            
            if not progress or progress.status != models.TaskStatusEnum.COMPLETED:
                xp_earned = task.reward_xp
                current_user.xp_points += xp_earned
                if not progress:
                    progress = models.UserProgress(user_id=current_user.id, task_id=task.id, status=models.TaskStatusEnum.COMPLETED, completed_at=datetime.now())
                    db.add(progress)
                else:
                    progress.status = models.TaskStatusEnum.COMPLETED
                    progress.completed_at = datetime.now()
            message = f"Поздравляем! Тест сдан. Вы заработали {xp_earned} XP."
        else:
            message = "Тест сдан (вне квеста)."

    await db.commit()
    return schemas.QuizAttemptResult(attempt_id=attempt.id, score=score, passed=passed, xp_earned=xp_earned, message=message)

# --- ГЕНЕРАЦИЯ ---

class GenerateQuizRequest(schemas.BaseModel):
    source_id: UUID 
    title: str = "Авто-тест"

@router.post("/generate", response_model=schemas.QuizPublic)
async def generate_quiz_from_source(
    req: GenerateQuizRequest,
    db: AsyncSession = Depends(get_db_session),
    hr_user: models.User = Depends(get_current_hr)
):
    source = await db.get(models.KnowledgeSource, req.source_id)
    if not source: raise HTTPException(404, "Source not found")
    
    text_content = ""
    if source.type == models.KnowledgeSourceTypeEnum.QNA:
        text_content = f"Вопрос: {source.content['question']}\nОтвет: {source.content['answer']}"
    elif source.type == models.KnowledgeSourceTypeEnum.ARTICLE:
        text_content = source.content.get("content", "")
    elif source.type == models.KnowledgeSourceTypeEnum.FILE:
        raise HTTPException(400, "Generation from FILE not supported in MVP (use Articles)")

    if len(text_content) < 50: raise HTTPException(400, "Source content too short")

    # --- ВЫЗОВ НОВОГО МЕТОДА V2 ---
    # Также добавили отладочный принт
    print(f"DEBUG: Calling ai_client.generate_quiz_v2 for source {req.source_id}")
    ai_questions = await ai_client.generate_quiz_v2(text_content)
    
    if not ai_questions: raise HTTPException(500, "AI failed to generate questions (empty result)")

    db_quiz = models.Quiz(title=req.title, description=f"Сгенерировано по источнику {source.name}", pass_threshold=0.7)
    db.add(db_quiz)
    await db.flush()

    for i, q_data in enumerate(ai_questions):
        options_with_ids = []
        for idx, opt in enumerate(q_data['options']):
            options_with_ids.append({"id": idx + 1, "text": opt['text'], "is_correct": opt['is_correct']})
        db_q = models.QuizQuestion(quiz_id=db_quiz.id, text=q_data['question_text'], order=i + 1, options=options_with_ids)
        db.add(db_q)

    await db.commit()
    await db.refresh(db_quiz)
    
    query = select(models.Quiz).where(models.Quiz.id == db_quiz.id).options(selectinload(models.Quiz.questions))
    result = await db.execute(query)
    return result.scalar_one()