#!/bin/bash
set -e

echo "--- 1. Удаление старого Frontend ---"
if [ -d "front" ]; then
    rm -rf front
    echo "Папка 'front' успешно удалена."
else
    echo "Папка 'front' уже отсутствует."
fi

echo "--- 2. Очистка Docker (остановка контейнеров) ---"
# Останавливаем всё, чтобы не было конфликтов портов
docker-compose down -v || true

echo "--- 3. Бэкап старой логики Workspace ---"
# Переименовываем файл, чтобы Python его не импортировал, но код остался "на память"
if [ -f "back/app/api/v1/endpoints/workspaces.py" ]; then
    mv back/app/api/v1/endpoints/workspaces.py back/app/api/v1/endpoints/_workspaces_old.py
    echo "Файл workspaces.py переименован в _workspaces_old.py"
fi

echo "--- 4. Очистка завершена ---"
echo "Теперь ваша структура готова к новой архитектуре."