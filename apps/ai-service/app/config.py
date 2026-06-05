import os
from pathlib import Path

from dotenv import dotenv_values
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parents[1]


def load_env_file(path: Path, *, override: bool = False) -> None:
    if not path.exists():
        return

    for key, value in dotenv_values(path).items():
        if value is None:
            value = ""

        current_value = os.getenv(key)
        if override or current_value is None or current_value == "":
            os.environ[key] = value


load_env_file(BASE_DIR / ".env")

APP_ENV = (os.getenv("APP_ENV") or "development").lower()

load_env_file(BASE_DIR / f".env.{APP_ENV}", override=APP_ENV != "production")


class Settings(BaseSettings):
    app_env: str = APP_ENV

    database_url: str = ""
    openai_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536

    dotnet_api_base_url: str = "http://localhost:5000"
    dotnet_api_webhook_secret: str = ""
    ai_service_api_key: str = ""

    class Config:
        env_file = None
        case_sensitive = False


settings = Settings()
