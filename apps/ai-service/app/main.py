from fastapi import FastAPI
from app.routes.health import router as health_router
from app.routes.chat import router as chat_router
from app.routes.parallel_fetch import router as parallel_fetch_router

app = FastAPI(
    title="PetOmi AI Service"
)

app.include_router(health_router)
app.include_router(chat_router)
app.include_router(parallel_fetch_router)