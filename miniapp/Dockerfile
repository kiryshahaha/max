FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Отключаем телеметрию и индикатор сборки
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_BUILD_INDICATOR=true

RUN npm run build

# Next.js по умолчанию использует порт 3000, а не 5173
EXPOSE 5173

CMD ["npm", "start"]