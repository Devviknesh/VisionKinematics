import uuid
from pathlib import Path
from typing import Dict, Any, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.video import Video
from app.models.analysis import AnalysisSession, FacialMetric, AnalysisEvent
from app.processing.task_queue import task_manager
from app.config import settings

class AnalysisService:
    @staticmethod
    def start_analysis(db: Session, video_id: str, user_id: str) -> AnalysisSession:
        video = db.query(Video).filter(Video.id == video_id, Video.user_id == user_id).first()
        if not video:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

        # Check if already processing
        existing = (
            db.query(AnalysisSession)
            .filter(AnalysisSession.video_id == video_id, AnalysisSession.processing_status.in_(["pending", "processing"]))
            .first()
        )
        if existing:
            return existing

        session_id = str(uuid.uuid4())
        session = AnalysisSession(
            id=session_id,
            video_id=video_id,
            processing_status="pending",
            progress=0.0
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # Trigger background processing
        video_path = Path(video.storage_path)
        preview_path = settings.PREVIEWS_DIR / f"{session_id}_annotated.mp4"

        task_manager.submit_analysis(
            session_id=session_id,
            video_path=video_path,
            preview_path=preview_path
        )

        return session

    @staticmethod
    def get_session(db: Session, analysis_id: str, user_id: str) -> AnalysisSession:
        session = (
            db.query(AnalysisSession)
            .join(Video, Video.id == AnalysisSession.video_id)
            .filter(AnalysisSession.id == analysis_id, Video.user_id == user_id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis session not found")
        return session

    @staticmethod
    def get_results(db: Session, analysis_id: str, user_id: str) -> Dict[str, Any]:
        session = AnalysisService.get_session(db, analysis_id, user_id)
        video = db.query(Video).filter(Video.id == session.video_id).first()

        metrics = db.query(FacialMetric).filter(FacialMetric.session_id == analysis_id).order_by(FacialMetric.timestamp).all()
        events = db.query(AnalysisEvent).filter(AnalysisEvent.session_id == analysis_id).order_by(AnalysisEvent.timestamp).all()

        session_data = {
            "id": session.id,
            "video_id": session.video_id,
            "video_filename": video.filename if video else "unknown",
            "video_duration": video.duration if video else 0.0,
            "preview_path": video.preview_path if video else None,
            "processing_status": session.processing_status,
            "progress": session.progress,
            "started_at": session.started_at,
            "completed_at": session.completed_at,
            "processing_duration": session.processing_duration,
            "summary_stats": session.summary_stats or {},
            "error_message": session.error_message,
            "metrics_count": len(metrics),
            "events_count": len(events)
        }

        return {
            "session": session_data,
            "summary_statistics": session.summary_stats or {},
            "timeline_metrics": metrics,
            "events": events
        }

    @staticmethod
    def get_events(db: Session, analysis_id: str, user_id: str) -> List[AnalysisEvent]:
        AnalysisService.get_session(db, analysis_id, user_id)
        return db.query(AnalysisEvent).filter(AnalysisEvent.session_id == analysis_id).order_by(AnalysisEvent.timestamp).all()

    @staticmethod
    def get_statistics(db: Session, analysis_id: str, user_id: str) -> Dict[str, Any]:
        session = AnalysisService.get_session(db, analysis_id, user_id)
        return session.summary_stats or {}

    @staticmethod
    def cancel_analysis(db: Session, analysis_id: str, user_id: str) -> bool:
        session = AnalysisService.get_session(db, analysis_id, user_id)
        if session.processing_status in ["completed", "failed", "cancelled"]:
            return False

        task_manager.cancel_job(analysis_id)
        session.processing_status = "cancelled"
        session.error_message = "Cancelled by user"
        db.commit()
        return True
