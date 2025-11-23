#!/bin/bash
set -e

echo "--- [1/5] Остановка контейнеров ---"
docker-compose down -v

echo "--- [2/5] Удаление 'сиротских' томов и контейнеров ---"
docker container prune -f
docker volume prune -f
docker network prune -f

echo "--- [3/5] Очистка портов (на всякий случай) ---"
# Пытаемся убить процессы на портах 8000, 8001, 5432, 11434
sudo fuser -k 8000/tcp || true
sudo fuser -k 8001/tcp || true
sudo fuser -k 5432/tcp || true
sudo fuser -k 11434/tcp || true

echo "--- [4/5] Сборка и Запуск (Fresh Start) ---"
# Запускаем в фоне (-d) и принудительно пересобираем (--build)
docker-compose up -d --build

echo "--- [5/5] Ожидание старта сервисов (15 сек)... ---"
sleep 15

echo "--- Готово! Статус контейнеров: ---"
docker-compose ps

echo "--- Логи Backend (последние 20 строк): ---"
docker-compose logs --tail=20 backend