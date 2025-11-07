from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def sync_data():
    # Здесь потом будет логика синхронизации (например, скрапинг или обновление БД)
    return {"status": "ok", "message": "Data synchronized successfully"}