from dotenv import load_dotenv
from pathlib import Path
import os

# Загружаем .env ПЕРВОЙ СТРОКОЙ
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

print(f"Environment loaded from: {env_path}")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Импорты
from routes import tasks, sync, announcements, auth, schedule, users, faculties, rooms, teachers, profile, marks, reports
from db.supabase_client import supabase_client

app = FastAPI(
    title="Student Portal Backend API",
    description="API для работы с реальными данными из Supabase",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем только основные роуты
app.include_router(tasks.router)
app.include_router(sync.router)
app.include_router(users.router)
app.include_router(announcements.router)
app.include_router(schedule.router)
app.include_router(auth.router)
app.include_router(faculties.router)
app.include_router(rooms.router)
app.include_router(teachers.router)
app.include_router(profile.router)
app.include_router(marks.router)
app.include_router(reports.router)

@app.get("/")
async def root():
    return {
        "message": "Backend API is running with real Supabase data",
        "database": "Connected to user_data table",
        "endpoints": [
            "/tasks?email=student@guap.ru",
            "/profile?email=student@guap.ru", 
            "/schedule?email=student@guap.ru&week=44",
            "/marks?email=student@guap.ru",
            "/reports?email=student@guap.ru",
            "/materials?email=student@guap.ru"
        ]
    }

@app.get("/health")
async def health_check():
    """Проверка здоровья сервиса и подключения к БД"""
    try:
        # Простая проверка - пытаемся получить данные
        test_email = "test@example.com"
        test_result = supabase_client.find_user_by_email(test_email)
        return {
            "status": "healthy",
            "database": "connected",
            "service": "GUAP Backend API"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }