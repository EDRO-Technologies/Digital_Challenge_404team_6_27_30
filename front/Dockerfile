# Stage 1: Build the React application
FROM node:18-alpine as build

WORKDIR /app

# Сначала копируем package.json для кэширования слоев
COPY package*.json ./
RUN npm install

# Копируем исходный код
COPY . .

# Собираем билд (результат будет в папке /app/dist)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Копируем собранные файлы из предыдущего этапа в папку Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Копируем кастомный конфиг Nginx (нужен для SPA роутинга)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]