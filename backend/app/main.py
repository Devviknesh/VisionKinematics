from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db
from app.routers import auth, videos, analysis, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    # Reconcile any interrupted jobs from previous server runs
    from app.processing.task_queue import task_manager
    task_manager.recover_orphaned_sessions()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI Video Analysis and Non-Verbal Communication Analyzer Backend",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:.*|http://127\.0\.0\.1:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(videos.router, prefix=settings.API_V1_PREFIX)
app.include_router(analysis.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "cv_model_loaded": settings.FACE_MODEL_PATH.exists()
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "cv_model_loaded": settings.FACE_MODEL_PATH.exists()
    }
