import uuid
from sqlalchemy import (
    Column, String, DateTime, ForeignKey, Enum, JSON, Text, Boolean, Integer, Float, Table
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


# --- 1. Ролевая Модель (RBAC) ---

class UserRoleEnum(str, enum.Enum):
    ADMIN = "admin"
    HR = "hr"
    MENTOR = "mentor"
    EMPLOYEE = "employee"
    UNCONFIRMED = "unconfirmed"

class TicketStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"

class KnowledgeSourceTypeEnum(str, enum.Enum):
    FILE = "FILE"
    QNA = "Q&A"
    ARTICLE = "ARTICLE"

class KnowledgeSourceStatusEnum(str, enum.Enum):
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class ConnectorTypeEnum(str, enum.Enum):
    CONFLUENCE = "CONFLUENCE"
    GOOGLE_DRIVE = "GOOGLE_DRIVE"

class ToolApiMethodEnum(str, enum.Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"

class TaskTypeEnum(str, enum.Enum):
    READING = "reading"
    QUIZ = "quiz"
    ACTION = "action"

class TaskStatusEnum(str, enum.Enum):
    LOCKED = "locked"
    AVAILABLE = "available"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    COMPLETED = "completed"

# --- Таблицы связей (Many-to-Many) с CASCADE ---

track_files = Table(
    'track_files', Base.metadata,
    Column('track_id', UUID(as_uuid=True), ForeignKey('onboarding_tracks.id', ondelete="CASCADE"), primary_key=True),
    Column('source_id', UUID(as_uuid=True), ForeignKey('knowledge_sources.id', ondelete="CASCADE"), primary_key=True)
)

stage_files = Table(
    'stage_files', Base.metadata,
    Column('stage_id', UUID(as_uuid=True), ForeignKey('stages.id', ondelete="CASCADE"), primary_key=True),
    Column('source_id', UUID(as_uuid=True), ForeignKey('knowledge_sources.id', ondelete="CASCADE"), primary_key=True)
)

task_files = Table(
    'task_files', Base.metadata,
    Column('task_id', UUID(as_uuid=True), ForeignKey('tasks.id', ondelete="CASCADE"), primary_key=True),
    Column('source_id', UUID(as_uuid=True), ForeignKey('knowledge_sources.id', ondelete="CASCADE"), primary_key=True)
)

# --- 2. Основные сущности ---

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="organization")
    tracks = relationship("OnboardingTrack", back_populates="organization")
    knowledge_sources = relationship("KnowledgeSource", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRoleEnum), nullable=False, default=UserRoleEnum.UNCONFIRMED)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    track_id = Column(UUID(as_uuid=True), ForeignKey("onboarding_tracks.id"), nullable=True)
    mentor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    xp_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="users")
    mentor = relationship("User", remote_side=[id], back_populates="mentees", foreign_keys=[mentor_id])
    mentees = relationship("User", back_populates="mentor")
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("UserQuizAttempt", back_populates="user", cascade="all, delete-orphan")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")


class OnboardingTrack(Base):
    __tablename__ = "onboarding_tracks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="tracks")
    stages = relationship("Stage", back_populates="track", cascade="all, delete-orphan", order_by="Stage.order")
    
    # M2M связь с файлами
    files = relationship("KnowledgeSource", secondary=track_files, backref="tracks")
    
    # Legacy connection
    knowledge_sources = relationship("KnowledgeSource", back_populates="track")
    
    connectors = relationship("Connector", back_populates="track", cascade="all, delete-orphan")
    tools = relationship("Tool", back_populates="track", cascade="all, delete-orphan")


class Stage(Base):
    __tablename__ = "stages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    track_id = Column(UUID(as_uuid=True), ForeignKey("onboarding_tracks.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    reward_xp = Column(Integer, default=50)

    track = relationship("OnboardingTrack", back_populates="stages")
    tasks = relationship("Task", back_populates="stage", cascade="all, delete-orphan", order_by="Task.order")
    
    files = relationship("KnowledgeSource", secondary=stage_files, backref="stages")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stage_id = Column(UUID(as_uuid=True), ForeignKey("stages.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(Enum(TaskTypeEnum), nullable=False)
    order = Column(Integer, nullable=False)
    
    knowledge_source_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_sources.id", ondelete="SET NULL"), nullable=True)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id"), nullable=True)
    reward_xp = Column(Integer, default=10)

    stage = relationship("Stage", back_populates="tasks")
    files = relationship("KnowledgeSource", secondary=task_files, backref="tasks")
    quiz = relationship("Quiz")


class KnowledgeSource(Base):
    __tablename__ = "knowledge_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    track_id = Column(UUID(as_uuid=True), ForeignKey("onboarding_tracks.id", ondelete="SET NULL"), nullable=True) 
    
    type = Column(Enum(KnowledgeSourceTypeEnum), nullable=False)
    name = Column(String(512), nullable=False)
    status = Column(Enum(KnowledgeSourceStatusEnum), nullable=False, default=KnowledgeSourceStatusEnum.PROCESSING)
    content = Column(JSON, nullable=True)
    file_path = Column(String(1024), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="knowledge_sources")
    track = relationship("OnboardingTrack", back_populates="knowledge_sources")

# --- Остальные модели ---
class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    status = Column(Enum(TaskStatusEnum), default=TaskStatusEnum.LOCKED)
    user_answer = Column(Text, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    user = relationship("User", back_populates="progress")
    task = relationship("Task")

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    pass_threshold = Column(Float, default=0.7)
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id"), nullable=False)
    text = Column(Text, nullable=False)
    order = Column(Integer, default=0)
    options = Column(JSON, nullable=False)
    quiz = relationship("Quiz", back_populates="questions")

class UserQuizAttempt(Base):
    __tablename__ = "user_quiz_attempts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id"), nullable=False)
    score = Column(Float, nullable=False)
    passed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="quiz_attempts")
    quiz = relationship("Quiz")

class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    icon_url = Column(String(1024))
    xp_value = Column(Integer, default=50)

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    achievement_id = Column(UUID(as_uuid=True), ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    session = relationship("ChatSession", back_populates="messages")

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    track_id = Column(UUID(as_uuid=True), ForeignKey("onboarding_tracks.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    question = Column(Text, nullable=False)
    status = Column(Enum(TicketStatusEnum), nullable=False, default=TicketStatusEnum.OPEN)
    answer = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

class Connector(Base):
    __tablename__ = "connectors"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    track_id = Column(UUID(as_uuid=True), ForeignKey("onboarding_tracks.id"), nullable=False)
    type = Column(Enum(ConnectorTypeEnum), nullable=False)
    display_name = Column(String(255), nullable=False)
    auth_details = Column(JSON, nullable=False)
    sync_schedule = Column(String(50), default="daily")
    status = Column(String(50), default="active")
    last_sync = Column(DateTime(timezone=True), nullable=True)
    track = relationship("OnboardingTrack", back_populates="connectors")

class Tool(Base):
    __tablename__ = "tools"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    track_id = Column(UUID(as_uuid=True), ForeignKey("onboarding_tracks.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    api_endpoint = Column(String(1024), nullable=False)
    api_method = Column(Enum(ToolApiMethodEnum), nullable=False)
    parameters_schema = Column(JSON, nullable=True)
    track = relationship("OnboardingTrack", back_populates="tools")