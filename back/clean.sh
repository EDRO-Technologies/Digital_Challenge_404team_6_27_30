#!/bin/bash
# 'set -e' УБРАН

echo "--- 1. Останавливаем все сервисы из docker-compose... ---"
docker-compose down -v

echo "--- 2. (Улучшено) Ищем и останавливаем ВСЕ 'висящие' контейнеры... ---"
CONTAINERS=$(docker ps -a -q)
if [ -n "$CONTAINERS" ]; then
  echo "Найдены 'висящие' контейнеры ($CONTAINERS). Останавливаем и удаляем..."
  docker stop $CONTAINERS
  docker rm $CONTAINERS
else
  echo " 'Висящих' контейнеров не найдено. Отлично."
fi

echo "--- 3. Добавляем 2-секундную паузу, чтобы ОС успела освободить порты... ---"
sleep 2

echo "--- 4. (ГЛАВНОЕ) Проверяем и 'убиваем' 'зомби' на ВСЕХ портах проекта... ---"
PORTS_TO_CHECK=("5432" "11434" "8000" "8001" "8002")

for PORT in "${PORTS_TO_CHECK[@]}"; do
  PID_ON_PORT=$(lsof -t -i :$PORT || true)

  if [ -n "$PID_ON_PORT" ]; then
    echo "ВНИМАНИЕ: Найден 'зомби' процесс (PID $PID_ON_PORT), держащий порт $PORT. Принудительно 'убиваем' его..."
    kill -9 $PID_ON_PORT
    echo "Порт $PORT освобожден."
  else
    echo "Порт $PORT свободен."
  fi
done

echo "--- 5. (ЗАПАСНОЙ ВАРИАНТ) Останавливаем хост-службу postgresql (на всякий случай)... ---"
systemctl stop postgresql || true

