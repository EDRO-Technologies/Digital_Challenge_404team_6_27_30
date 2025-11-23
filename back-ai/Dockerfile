# (НОВЫЙ ФАЙЛ)
# Dockerfile для 'back-ai'.
# УДАЛЕНЫ PyTorch и локальная модель.
FROM python:3.11-slim

RUN pip install --upgrade pip setuptools wheel

# --- ИСПРАВЛЕНИЕ: Добавляем 'wget' для скачивания wait-for-it ---
RUN apt-get update && apt-get install -y build-essential wget && rm -rf /var/lib/apt/lists/*

RUN pip install poetry

# --- ИСПРАВЛЕНИЕ: Скачиваем и делаем исполняемым скрипт wait-for-it ---
RUN wget -O /usr/local/bin/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh
# --- Конец ИСПРАВЛЕНИЯ ---

# --- УДАЛЕНО: Установка PyTorch (torch) больше не нужна ---
# RUN pip install torch torchvision torchaudio

WORKDIR /app

# --- УДАЛЕНО: Копирование локальной модели all-MiniLM-L6-v2 ---
# COPY ./all-MiniLM-L6-v2 /app/all-MiniLM-L6-v2

COPY pyproject.toml ./

# Устанавливаем AI-зависимости (БЕЗ torch и sentence-transformers)
RUN poetry config virtualenvs.create false && poetry install --no-root --without dev --no-interaction

COPY ./app /app/app

# Этот сервис слушает порт 8001
EXPOSE 8001

# --- ИСПРАВЛЕНИЕ: Используем wait-for-it.sh перед запуском uvicorn ---
# Мы ждем 60 секунд, пока хост 'chroma' (имя сервиса из docker-compose)
# не начнет отвечать на порту 8000 (внутренний порт chroma).
# Только после этого запускаем uvicorn.
CMD ["sh", "-c", "wait-for-it.sh chroma:8000 --timeout=60 --strict -- echo 'ChromaDB is up! Starting AI service...' && poetry run uvicorn app.main:app --host 0.0.0.0 --port 8001"]