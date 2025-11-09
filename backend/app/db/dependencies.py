from fastapi import Depends, HTTPException, Query
from .supabase_client import supabase_client

def get_supabase_client():
    """Dependency для получения клиента Supabase"""
    return supabase_client

async def get_current_user_data(
    email: str = Query(..., description="Email пользователя"),
    db = Depends(get_supabase_client)
):
    """Dependency для получения данных текущего пользователя по email"""
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    user_data = db.get_user_full_data(email)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user_data