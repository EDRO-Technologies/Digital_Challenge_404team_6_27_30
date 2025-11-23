#!/bin/bash
# Выход из скрипта при любой ошибке
set -e

# --- Переменные ---
OLLAMA_SERVICE="ollama"

# 1. Модель LLM (Llama3)
LLAMA_MODEL_NAME="llama3:8b-instruct"
LLAMA_GGUF_FILE="llama3-8b.gguf"
LLAMA_MODELFILE="Modelfile" #

# 2. Модель Эмбеддингов (Nomic)
EMBED_MODEL_NAME="nomic-embed-text" # Это имя используется в back-ai/.env
EMBED_GGUF_FILE="nomic-embed-text-v1.5.Q4_K_M.gguf"
EMBED_MODELFILE="Modelfile.nomic" #

# --- Шаг 1: Установка Llama3 (16GB LLM) ---
echo "--- 1. Установка Llama3 ($LLAMA_MODEL_NAME) ---"

if [ ! -f "$LLAMA_GGUF_FILE" ]; then
    echo "Ошибка: Файл $LLAMA_GGUF_FILE не найден."
    exit 1
fi
if [ ! -f "$LLAMA_MODELFILE" ]; then
    echo "Ошибка: Файл $LLAMA_MODELFILE не найден."
    exit 1
fi

echo "Копируем 16GB GGUF-файл в контейнер (это займет время)..."
sudo docker compose cp "$LLAMA_GGUF_FILE" $OLLAMA_SERVICE:/$LLAMA_GGUF_FILE

echo "Копируем Modelfile..."
sudo docker compose cp "$LLAMA_MODELFILE" $OLLAMA_SERVICE:/$LLAMA_MODELFILE

echo "Создаем модель $LLAMA_MODEL_NAME в Ollama..."
sudo docker compose exec $OLLAMA_SERVICE ollama create $LLAMA_MODEL_NAME -f /$LLAMA_MODELFILE
echo "Llama3 установлена."


# --- Шаг 2: Установка Nomic (Embedding Model) ---
echo "--- 2. Установка Nomic ($EMBED_MODEL_NAME) ---"

if [ ! -f "$EMBED_GGUF_FILE" ]; then
    echo "Ошибка: Файл $EMBED_GGUF_FILE не найден."
    exit 1
fi
if [ ! -f "$EMBED_MODELFILE" ]; then
    echo "Ошибка: Файл $EMBED_MODELFILE не найден."
    exit 1
fi

echo "Копируем GGUF-файл эмбеддингов..."
sudo docker compose cp "$EMBED_GGUF_FILE" $OLLAMA_SERVICE:/$EMBED_GGUF_FILE

echo "Копируем Modelfile.nomic..."
sudo docker compose cp "$EMBED_MODELFILE" $OLLAMA_SERVICE:/$EMBED_MODELFILE

echo "Создаем модель $EMBED_MODEL_NAME в Ollama..."
sudo docker compose exec $OLLAMA_SERVICE ollama create $EMBED_MODEL_NAME -f /$EMBED_MODELFILE
echo "Nomic (Embedding) установлен."


# --- Шаг 3: Очистка ---
echo "--- 3. Очистка временных файлов из контейнера ---"
sudo docker compose exec $OLLAMA_SERVICE rm -f /$LLAMA_GGUF_FILE /$LLAMA_MODELFILE /$EMBED_GGUF_FILE /$EMBED_MODELFILE


# --- Шаг 4: Проверка ---
echo "--- 4. Установка завершена. Список моделей в Ollama: ---"
sudo docker compose exec $OLLAMA_SERVICE ollama list

