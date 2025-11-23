import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from alembic.config import Config
from alembic import command
import os
from contextlib import asynccontextmanager # <- ИСПРАВЛЕНИЕ
import asyncio

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.database import engine, Base  # Импортируем Base


# --- Alembic (Миграции) ---
def run_migrations():
    """
    Применяет миграции Alembic при старте.
    В production лучше это делать отдельной командой.
    """
    # Убедимся, что alembic.ini находится (предполагаем, что он в корне)
    alembic_cfg_path = os.path.join(os.path.dirname(__file__), "..", "alembic.ini")

    if not os.path.exists(alembic_cfg_path):
        print("alembic.ini not found, skipping migrations.")
        # (STUB) Создаем таблицы напрямую для простоты
        # В реальном проекте у вас будет alembic.ini
        print("Running SQLAlchemy create_all() as fallback...")
        
        # --- ИСПРАВЛЕНИЕ: Переносим логику в lifespan ---
        # Убираем старый asyncio.run() отсюда
        
        print("Tables will be created by lifespan event.")
        return

    print(f"Running Alembic migrations from {alembic_cfg_path}...")
    alembic_cfg = Config(alembic_cfg_path)
    alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    try:
        command.upgrade(alembic_cfg, "head")
        print("Migrations applied successfully.")
    except Exception as e:
        print(f"Failed to apply migrations: {e}")


# Запускаем миграции при импорте (до старта FastAPI)
# run_migrations()
# ПРИМЕЧАНИЕ: Вызов create_all() из-за отсутствия alembic.ini

# --- ИСПРАВЛЕНИЕ: Заменяем asyncio.run() на lifespan event ---

async def init_db():
    """Создает таблицы в БД"""
    print("Running SQLAlchemy create_all()...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created/checked.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Код для выполнения при старте
    print("Application startup: Running init_db()...")
    # Вызываем run_migrations() здесь, чтобы он решил, что делать
    run_migrations() 
    # init_db() будет вызван, только если alembic.ini не найден (через run_migrations)
    # или мы можем вызвать его принудительно, если alembic не используется
    if not os.path.exists(os.path.join(os.path.dirname(__file__), "..", "alembic.ini")):
        await init_db()
    yield
    # Код для выполнения при завершении
    print("Application shutdown.")

# --- Конец Исправления ---


# Создание основного экземпляра FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan # <- ИСПРАВЛЕНИЕ: Указываем lifespan
)

# Настройка CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В production замените "*" на домен вашего фронтенда
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутера API v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
async def read_root():
    """
    Корневой эндпоинт для проверки работоспособности.
    """
    return {"message": f"Welcome to {settings.APP_NAME}!"}


# Это позволяет запускать файл напрямую для отладки
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)