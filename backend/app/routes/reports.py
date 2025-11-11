from fastapi import APIRouter, HTTPException, Query, Depends
from db.dependencies import get_supabase_client

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/")
async def get_reports(
    email: str = Query(..., description="Email пользователя"),
    db = Depends(get_supabase_client)
):
    """Получение отчеты пользователя по email"""
    reports = db.get_reports_by_email(email) or []  # Если None, возвращаем пустой список
    
    return {
        "success": True,
        "reports": reports,
        "reports_count": len(reports),
        "user_email": email
    }