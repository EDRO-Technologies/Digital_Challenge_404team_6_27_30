from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID

# ... existing schemas ...
class KnowledgeSourceCreateQA(BaseModel):
    question: str
    answer: str

class KnowledgeSourceCreateArticle(BaseModel):
    title: str
    content: str

class FileProcessingRequest(BaseModel):
    workspace_id: UUID
    source_id: UUID
    file_path: str
    filename: str

class QASProcessingRequest(BaseModel):
    workspace_id: UUID
    source_id: UUID
    qa_in: KnowledgeSourceCreateQA

class ArticleProcessingRequest(BaseModel):
    workspace_id: UUID
    source_id: UUID
    article_in: KnowledgeSourceCreateArticle

class EmbeddingDeleteRequest(BaseModel):
    collection_name: str
    source_id: UUID

# --- RAG Query ---

class QueryRequest(BaseModel):
    workspace_id: UUID
    question: str
    session_id: UUID

class QueryResponseSource(BaseModel):
    name: str
    page: Optional[int] = None
    text_chunk: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[QueryResponseSource]
    emotion: str = "neutral" # Добавлено поле эмоции

# --- НОВОЕ: Генерация Тестов ---

class GenerateQuizRequest(BaseModel):
    text_content: str # Текст, по которому генерировать
    difficulty: str = "medium" # easy, medium, hard

class GeneratedOption(BaseModel):
    text: str
    is_correct: bool

class GeneratedQuestion(BaseModel):
    question_text: str
    options: List[GeneratedOption]

class GenerateQuizResponse(BaseModel):
    questions: List[GeneratedQuestion]