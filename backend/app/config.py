import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Video Analysis and Facial Emotion Recognition System"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-change-in-production-cv-analyzer-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Database
    # Defaults to local SQLite if POSTGRES_URL not reachable, fully PostgreSQL ready
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR / 'video_analyzer.db'}"
    )
    
    # Storage Paths
    STORAGE_DIR: Path = BASE_DIR / "storage"
    VIDEOS_DIR: Path = BASE_DIR / "storage" / "videos"
    PREVIEWS_DIR: Path = BASE_DIR / "storage" / "previews"
    REPORTS_DIR: Path = BASE_DIR / "storage" / "reports"
    
    # Video constraints
    MAX_UPLOAD_SIZE_BYTES: int = 250 * 1024 * 1024 # 250 MB
    MAX_VIDEO_DURATION_SECONDS: int = 900 # 15 minutes
    ALLOWED_EXTENSIONS: set = {"mp4", "mov", "avi", "webm", "mkv"}
    
    # Computer Vision parameters
    DEFAULT_SAMPLE_FPS: float = 5.0
    FACE_MODEL_PATH: Path = BASE_DIR / "app" / "cv_engine" / "models" / "face_landmarker.task"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://vision-kinematics.vercel.app",
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
settings.VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
settings.PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
