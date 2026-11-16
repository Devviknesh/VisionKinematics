import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional, Set
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.analysis import AnalysisSession, FacialMetric, AnalysisEvent
from app.models.video import Video
from app.cv_engine.pipeline import VideoAnalysisPipeline
from app.config import settings

class BackgroundTaskManager:
    """
    Manages asynchronous video analysis jobs using worker threads.
    Provides live progress updates, safe cancellation, and database transaction management.
    """
    def __init__(self):
        self._cancelled_jobs: Set[str] = set()
        self._active_threads: Dict[str, threading.Thread] = {}

    def cancel_job(self, session_id: str) -> bool:
        self._cancelled_jobs.add(session_id)
        return True

    def is_cancelled(self, session_id: str) -> bool:
        return session_id in self._cancelled_jobs

    def submit_analysis(self, session_id: str, video_path: Path, preview_path: Optional[Path] = None):
        thread = threading.Thread(
            target=self._run_analysis_worker,
            args=(session_id, video_path, preview_path),
            daemon=True
        )
        self._active_threads[session_id] = thread
        thread.start()

    def _run_analysis_worker(self, session_id: str, video_path: Path, preview_path: Optional[Path]):
        db: Session = SessionLocal()
        start_mono_time = time.time()
        try:
            session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
            if not session:
                return

            session.processing_status = "processing"
            session.progress = 0.0
            session.started_at = datetime.utcnow()
            db.commit()

            def update_progress(percent: float):
                # Update progress in DB periodically
                try:
                    s = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
                    if s:
                        s.progress = percent
                        db.commit()
                except Exception:
                    db.rollback()

            pipeline = VideoAnalysisPipeline(sample_fps=settings.DEFAULT_SAMPLE_FPS)
            
            result = pipeline.run_pipeline(
                video_path=video_path,
                preview_out_path=preview_path,
                progress_callback=update_progress,
                is_cancelled=lambda: self.is_cancelled(session_id)
            )

            # Re-fetch session
            session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
            if not session:
                return

            # Batch insert metrics
            metrics_to_insert = []
            for m in result["metrics"]:
                metric_obj = FacialMetric(
                    session_id=session_id,
                    timestamp=m["timestamp"],
                    face_detected=m["face_detected"],
                    head_yaw=m["head_yaw"],
                    head_pitch=m["head_pitch"],
                    head_roll=m["head_roll"],
                    gaze_direction=m["gaze_direction"],
                    eye_aspect_ratio=m["eye_aspect_ratio"],
                    expression_measurements=m["expression_measurements"],
                    reliability_score=m["reliability_score"]
                )
                metrics_to_insert.append(metric_obj)

            # Batch insert events
            events_to_insert = []
            for ev in result["events"]:
                event_obj = AnalysisEvent(
                    id=ev.id,
                    session_id=session_id,
                    timestamp=ev.timestamp,
                    event_category=ev.event_category,
                    event_type=ev.event_type,
                    event_description=ev.event_description,
                    event_value=ev.event_value,
                    reliability_score=ev.reliability_score
                )
                events_to_insert.append(event_obj)

            db.bulk_save_objects(metrics_to_insert)
            db.bulk_save_objects(events_to_insert)

            # Update session status
            session.processing_status = "completed"
            session.progress = 100.0
            session.completed_at = datetime.utcnow()
            session.processing_duration = round(time.time() - start_mono_time, 2)
            session.summary_stats = result["summary"]

            # Update video preview_path
            if result.get("preview_path"):
                video = db.query(Video).filter(Video.id == session.video_id).first()
                if video:
                    video.preview_path = result["preview_path"]

            db.commit()

        except InterruptedError:
            db.rollback()
            session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
            if session:
                session.processing_status = "cancelled"
                session.error_message = "Analysis cancelled by user"
                db.commit()

        except Exception as e:
            db.rollback()
            session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
            if session:
                session.processing_status = "failed"
                session.error_message = str(e)
                db.commit()

        finally:
            self._active_threads.pop(session_id, None)
            self._cancelled_jobs.discard(session_id)
            db.close()

# Singleton background task manager
task_manager = BackgroundTaskManager()
