from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import tasks, sync


app = FastAPI(
    title="Student Portal Backend",
    description="API для портала (бота + миниэпп)",
)

# Разрешим доступ фронту
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # позже лучше ограничить Netlify-доменом
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роуты
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(sync.router, prefix="/sync", tags=["Sync"])

@app.get("/")
async def root():
    return {"message":"Backend API is running"}