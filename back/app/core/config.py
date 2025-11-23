from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import List, Dict, Any
import json

class Settings(BaseSettings):
    """
    Настройки 'back'
    """
    APP_NAME: str = "KnowledgeBot API"
    API_V1_STR: str = "/api/v1"
    UPLOAD_DIR: str = "/app/uploads" 
    # Настройки JWT
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    JWT_ALGORITHM: str = "HS256"

    # Настройки базы данных
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    DATABASE_URL: str

    # Настройки клиента AI-сервиса
    AI_SERVICE_URL: AnyHttpUrl
    API_V1_STR_AI: str

    # --- АДМИНИСТРАТОРЫ (HARDCODED) ---
    # Список словарей: [{"email": "...", "password": "...", "full_name": "..."}]
    # Задается в .env как JSON строка
    INITIAL_ADMINS_JSON: str = '[{"email": "admin@gazprom.ru", "password": "admin", "full_name": "Super Admin"}]'
    
    @property
    def INITIAL_ADMINS(self) -> List[Dict[str, str]]:
        """Парсит JSON строку в список словарей"""
        try:
            return json.loads(self.INITIAL_ADMINS_JSON)
        except json.JSONDecodeError:
            return []

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()