from fastapi import APIRouter, HTTPException, Query, Depends
from db.dependencies import get_supabase_client

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/")
async def get_tasks(
    email: str = Query(..., description="Email пользователя"),
    db = Depends(get_supabase_client)
):
    """Получение задач пользователя по email"""
    tasks = db.get_tasks_by_email(email) or []  # Если None, возвращаем пустой список
    
    return {
        "success": True,
        "tasks": tasks,
        "tasks_count": len(tasks),
        "user_email": email
    }

@router.get("/all")
async def get_all_tasks(db = Depends(get_supabase_client)):
    """Получение всех задач из системы (для админки)"""
    all_users = db.get_all_users()
    
    all_tasks = []
    for user in all_users:
        user_email = user.get('email')
        if user_email:
            user_tasks = db.get_tasks_by_email(user_email)
            for task in user_tasks:
                task['user_info'] = {
                    'email': user_email,
                    'user_id': user.get('id')
                }
            all_tasks.extend(user_tasks)
    
    return {
        "success": True,
        "total_tasks": len(all_tasks),
        "tasks": all_tasks
    }