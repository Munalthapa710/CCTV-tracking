from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
PREVIEW_DIR = DATA_DIR / "previews"
SNAPSHOT_DIR = DATA_DIR / "snapshots"


class Settings(BaseSettings):
    APP_NAME: str = "AI CCTV Employee Finder System"
    DEBUG: bool = True
    DATABASE_URL: str = f"sqlite:///{(BASE_DIR / 'employee_finder.db').as_posix()}"
    FACE_MATCH_THRESHOLD: float = 0.58
    CAMERA_PROCESS_INTERVAL: float = 1.5
    STATIC_USERNAME: str = "admin"
    STATIC_PASSWORD: str = "admin123"
    PREVIEW_DIR: str = str(PREVIEW_DIR)
    SNAPSHOT_DIR: str = str(SNAPSHOT_DIR)

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
