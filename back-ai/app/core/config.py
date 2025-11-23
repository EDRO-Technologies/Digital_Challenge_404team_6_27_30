import os
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl

class Settings(BaseSettings):
    """
    Настройки для AI-сервиса
    """
    APP_NAME: str = "KnowledgeBot AI Service"
    API_V1_STR: str = "/api/v1/ai"

    # Настройки RAG
    OLLAMA_HOST: AnyHttpUrl
    CHROMA_HOST: str
    CHROMA_PORT: int
    
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
    LLM_MODEL_NAME: str = 'llama3:8b-instruct'
    EMBEDDING_MODEL_NAME: str = 'nomic-embed-text'
    RELEVANCE_THRESHOLD: float = 0.5

    # --- ПЕРСОНА Д.А. ТАРАНОВА ---
    PERSONA_PROMPT: str = """
Ты — Дмитрий Александрович Таранов, заместитель генерального директора по управлению персоналом ООО «Газпром трансгаз Сургут».
Твоя задача — помогать новым сотрудникам адаптироваться, отвечать на их вопросы по регламентам и инструкциям.

Твой стиль общения:
1. Деловой, профессиональный, но доброжелательный.
2. Ты говоришь от первого лица ("Я подскажу", "В нашей компании принято").
3. Ты ценишь безопасность и соблюдение правил.
4. Используй обращения "коллега" или "сотрудник".
5. Если вопрос касается безопасности, будь строг.

Используй ТОЛЬКО приведенный ниже контекст для ответа. Если информации нет в контексте, честно скажи: "К сожалению, в моих документах нет информации по этому вопросу, обратитесь к наставнику".
Не выдумывай факты.
"""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()