from pydantic import BaseModel, EmailStr, Field, AnyHttpUrl, model_validator
from typing import Optional, List, Dict, Any, Union
from uuid import UUID
from datetime import datetime
from app.models import (
    UserRoleEnum, 
    TicketStatusEnum, 
    TaskTypeEnum, 
    TaskStatusEnum, 
    KnowledgeSourceTypeEnum, 
    KnowledgeSourceStatusEnum,
    ConnectorTypeEnum,
    ToolApiMethodEnum
)

# --- Вспомогательные схемы ---
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"

class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    email: Optional[str] = None

# --- 1. Auth & Users ---
class UserCreate(BaseModel):
    full_name: str = Field(..., example="Иван Иванов")
    email: EmailStr = Field(..., example="newbie@gazprom.ru")
    password: str = Field(..., min_length=8, example="Secret123!")
    organization_name: str = Field("Газпром трансгаз Сургут", example="Газпром трансгаз Сургут")

class AdminUserCreate(UserCreate):
    role: UserRoleEnum = UserRoleEnum.EMPLOYEE

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRoleEnum] = None
    password: Optional[str] = None
    mentor_id: Optional[UUID] = None
    track_id: Optional[UUID] = None

class UserPublic(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    role: UserRoleEnum
    xp_points: int = 0
    level: int = 1
    organization_id: UUID
    track_id: Optional[UUID] = None
    mentor_id: Optional[UUID] = None
    
    class Config:
        from_attributes = True

class OrganizationPublic(BaseModel):
    id: UUID
    name: str
    class Config:
        from_attributes = True

class RegisterResponse(BaseModel):
    user: UserPublic
    organization: OrganizationPublic
    access_token: str
    refresh_token: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    user: UserPublic
    access_token: str
    refresh_token: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: str

# --- Knowledge Base Schemas ---
class KnowledgeSourceCreateQA(BaseModel):
    question: str
    answer: str

class KnowledgeSourceCreateArticle(BaseModel):
    title: str
    content: str

class KnowledgeSourcePublic(BaseModel):
    id: UUID
    type: str
    name: str # Поле в БД называется name
    filename: Optional[str] = None # Поле на фронте называется filename
    url: Optional[str] = None
    size: Optional[int] = 0
    status: str
    created_at: datetime
    file_path: Optional[str] = None
    
    class Config:
        from_attributes = True

    # ВАЖНО: Автоматически заполняем filename из name
    @model_validator(mode='after')
    def set_filename(self):
        if self.filename is None and self.name:
            self.filename = self.name
        return self

# --- 2. Quests & Tracks ---

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: TaskTypeEnum
    order: int
    reward_xp: int = 10

class TaskCreate(TaskBase):
    quiz_id: Optional[UUID] = None
    file_ids: List[UUID] = []

class TaskPublic(TaskBase):
    id: UUID
    quiz_id: Optional[UUID] = None
    files: List[KnowledgeSourcePublic] = []
    class Config:
        from_attributes = True

class StageBase(BaseModel):
    title: str
    description: Optional[str] = None
    order: int
    reward_xp: int = 50

class StageCreate(StageBase):
    tasks: List[TaskCreate] = []
    file_ids: List[UUID] = []

class StagePublic(StageBase):
    id: UUID
    tasks: List[TaskPublic] = []
    files: List[KnowledgeSourcePublic] = []
    class Config:
        from_attributes = True

class TrackCreate(BaseModel):
    name: str = Field(..., example="Инженер ПТО")
    description: Optional[str] = None
    stages: List[StageCreate] = []
    file_ids: List[UUID] = []

class TrackPublic(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    organization_id: UUID
    created_at: datetime
    stages: List[StagePublic] = []
    files: List[KnowledgeSourcePublic] = []
    class Config:
        from_attributes = True

class TaskSubmitRequest(BaseModel):
    user_answer: Optional[str] = None

# --- 3. User Progress ---
class UserTaskProgress(BaseModel):
    id: UUID
    task_id: UUID
    status: TaskStatusEnum
    user_answer: Optional[str]
    completed_at: Optional[datetime]
    task: Optional[TaskPublic] = None
    class Config:
        from_attributes = True

class MenteeProgress(BaseModel):
    user: UserPublic
    progress_percent: float
    pending_review_count: int

# --- 4. Testing (Quizzes) ---
class QuizOptionCreate(BaseModel):
    id: int
    text: str
    is_correct: bool

class QuizOptionPublic(BaseModel):
    id: int
    text: str

class QuizQuestionCreate(BaseModel):
    text: str
    order: int
    options: List[QuizOptionCreate]

class QuizQuestionPublic(BaseModel):
    id: UUID
    text: str
    order: int
    options: List[QuizOptionPublic]

class QuizCreate(BaseModel):
    title: str
    description: Optional[str]
    pass_threshold: float = 0.7
    questions: List[QuizQuestionCreate]

class QuizPublic(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    pass_threshold: float
    questions: List[QuizQuestionPublic] = []
    class Config:
        from_attributes = True

class QuizSubmissionItem(BaseModel):
    question_id: UUID
    selected_option_id: int

class QuizSubmission(BaseModel):
    answers: List[QuizSubmissionItem]

class QuizAttemptResult(BaseModel):
    attempt_id: UUID
    score: float
    passed: bool
    xp_earned: int
    message: str

# --- 5. Mentor Actions ---
class TaskReviewRequest(BaseModel):
    comment: Optional[str] = None

# --- 6. Support / Tickets ---
class TicketPublic(BaseModel):
    id: UUID
    question: str
    status: TicketStatusEnum
    created_at: datetime
    answer: Optional[str]
    class Config:
        from_attributes = True

class TicketResolve(BaseModel):
    answer: str
    add_to_knowledge_base: bool = True

class TicketResolvedResponse(BaseModel):
    id: UUID
    status: TicketStatusEnum
    resolved_at: datetime

# --- 7. RAG Query ---
class QueryRequest(BaseModel):
    question: str
    session_id: UUID

class QueryResponseSource(BaseModel):
    name: str
    page: Optional[int] = None
    text_chunk: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[QueryResponseSource]
    ticket_id: Optional[UUID] = None

class PublicQueryRequest(BaseModel):
    workspace_id: UUID
    question: str
    session_id: UUID

# --- 8. Analytics ---
class AnalyticsResponse(BaseModel):
    active_users: int
    avg_progress: float

# --- 9. HR & Achievements ---
class AssignMentorRequest(BaseModel):
    user_id: UUID
    mentor_id: UUID

class AchievementCreate(BaseModel):
    name: str
    description: str
    icon_name: str
    xp_value: int = 50

class AchievementPublic(BaseModel):
    id: UUID
    name: str
    description: str
    icon_url: Optional[str]
    xp_value: int
    class Config:
        from_attributes = True

# --- 10. Mentor Custom Tasks ---
class MentorTaskCreate(BaseModel):
    mentee_id: UUID
    title: str
    description: str
    reward_xp: int = 20

# --- 11. Connectors & Tools ---
class ConnectorCreate(BaseModel):
    type: ConnectorTypeEnum
    display_name: str
    auth_details: Dict[str, Any]
    sync_schedule: str = "daily"

class ConnectorPublic(BaseModel):
    id: UUID
    type: ConnectorTypeEnum
    display_name: str
    status: str
    last_sync: Optional[datetime]
    class Config:
        from_attributes = True

class SyncResponse(BaseModel):
    status: str
    message: str

class AudioQueryResponse(BaseModel):
    transcribed_question: str
    answer: str
    sources: List[QueryResponseSource] = []
    ticket_id: Optional[UUID] = None

class ToolCreate(BaseModel):
    name: str
    description: Optional[str]
    api_endpoint: AnyHttpUrl
    api_method: ToolApiMethodEnum
    parameters_schema: Dict[str, Any]

class ToolPublic(BaseModel):
    id: UUID
    name: str
    class Config:
        from_attributes = True

# --- Compatibility Aliases ---
User = UserPublic
KnowledgeSource = KnowledgeSourcePublic
MentorAssignRequest = AssignMentorRequest