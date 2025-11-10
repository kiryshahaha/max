from fastapi import APIRouter, HTTPException, Query, Depends
from db.dependencies import get_supabase_client
from datetime import datetime

router = APIRouter(prefix="/schedule", tags=["Schedule"])

@router.get("/")
async def get_schedule(
    email: str = Query(..., description="Email пользователя"),
    week: int = Query(None, description="Номер недели"),
    group: str = Query(None, description="Группа (опционально)"),
    db = Depends(get_supabase_client)
):
    """Получение расписания пользователя по email"""
    schedule = db.get_schedule_by_email(email, week) or {}  # Если None, возвращаем пустой словарь
    
    return {
        "success": True,
        "schedule": schedule,
        "user_email": email,
        "params": {
            "week": week,
            "group": group
        }
    }
