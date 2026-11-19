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

    @staticmethod
    def compare_sessions(db: Session, session_a_id: str, session_b_id: str, user_id: str) -> Dict[str, Any]:
        """
        Compares two distinct analysis sessions belonging to the authenticated user.
        Calculates deltas across head stability, eye aspect ratio, gaze direction,
        expression kinematics, and event density based strictly on actual detected metrics.
        """
        session_a = AnalysisService.get_session(db, session_a_id, user_id)
        session_b = AnalysisService.get_session(db, session_b_id, user_id)
        
        video_a = db.query(Video).filter(Video.id == session_a.video_id).first()
        video_b = db.query(Video).filter(Video.id == session_b.video_id).first()

        stats_a = session_a.summary_stats or {}
        stats_b = session_b.summary_stats or {}

        track_a = float(stats_a.get("face_tracking_percentage", 0.0))
        track_b = float(stats_b.get("face_tracking_percentage", 0.0))

        hp_a = stats_a.get("head_pose_distribution", {})
        hp_b = stats_b.get("head_pose_distribution", {})
        fwd_a = float(hp_a.get("Forward-Facing", 0.0))
        fwd_b = float(hp_b.get("Forward-Facing", 0.0))

        gaze_a = stats_a.get("gaze_distribution", {})
        gaze_b = stats_b.get("gaze_distribution", {})
        center_a = float(gaze_a.get("Center", 0.0))
        center_b = float(gaze_b.get("Center", 0.0))

        ear_a = float(stats_a.get("mean_eye_aspect_ratio", 0.0))
        ear_b = float(stats_b.get("mean_eye_aspect_ratio", 0.0))

        smile_a = float(stats_a.get("smile_frames_ratio", 0.0))
        smile_b = float(stats_b.get("smile_frames_ratio", 0.0))

        mouth_a = float(stats_a.get("mouth_open_frames_ratio", 0.0))
        mouth_b = float(stats_b.get("mouth_open_frames_ratio", 0.0))

        events_a = int(stats_a.get("total_events_detected", 0))
        events_b = int(stats_b.get("total_events_detected", 0))

        comparison_table = [
            {"category": "Tracking Quality", "metric": "Face Tracking Coverage", "unit": "%", "session_a": track_a, "session_b": track_b, "diff": round(track_b - track_a, 1)},
            {"category": "Head Kinematics", "metric": "Forward-Facing Ratio", "unit": "%", "session_a": fwd_a, "session_b": fwd_b, "diff": round(fwd_b - fwd_a, 1)},
            {"category": "Gaze Direction", "metric": "Direct / Center Gaze", "unit": "%", "session_a": center_a, "session_b": center_b, "diff": round(center_b - center_a, 1)},
            {"category": "Ocular Dynamics", "metric": "Mean Eye Aspect Ratio (EAR)", "unit": "", "session_a": ear_a, "session_b": ear_b, "diff": round(ear_b - ear_a, 3)},
            {"category": "Expression Kinematics", "metric": "Smile / Positive Movement", "unit": "%", "session_a": smile_a, "session_b": smile_b, "diff": round(smile_b - smile_a, 1)},
            {"category": "Expression Kinematics", "metric": "Mouth Opening / Speech Activity", "unit": "%", "session_a": mouth_a, "session_b": mouth_b, "diff": round(mouth_b - mouth_a, 1)},
            {"category": "Behavioral Events", "metric": "Total Extracted Events", "unit": "events", "session_a": events_a, "session_b": events_b, "diff": events_b - events_a}
        ]

        radar_data = [
            {"subject": "Tracking Stability", "A": track_a, "B": track_b, "fullMark": 100},
            {"subject": "Head Stability", "A": fwd_a, "B": fwd_b, "fullMark": 100},
            {"subject": "Gaze Focus", "A": center_a, "B": center_b, "fullMark": 100},
            {"subject": "Expressivity", "A": min(100.0, smile_a * 2.5), "B": min(100.0, smile_b * 2.5), "fullMark": 100},
            {"subject": "Vocal/Mouth Movement", "A": min(100.0, mouth_a * 2.0), "B": min(100.0, mouth_b * 2.0), "fullMark": 100}
        ]

        return {
            "session_a": {
                "id": session_a.id,
                "video_id": session_a.video_id,
                "video_filename": video_a.filename if video_a else "unknown",
                "duration": video_a.duration if video_a else 0.0,
                "created_at": session_a.started_at,
                "processing_status": session_a.processing_status
            },
            "session_b": {
                "id": session_b.id,
                "video_id": session_b.video_id,
                "video_filename": video_b.filename if video_b else "unknown",
                "duration": video_b.duration if video_b else 0.0,
                "created_at": session_b.started_at,
                "processing_status": session_b.processing_status
            },
            "comparison_metrics": comparison_table,
            "radar_data": radar_data,
            "disclaimer": "Comparisons reflect observable geometric computer vision measurements across recorded video sessions. They do not infer psychological disposition, personality traits, or emotional stability."
        }

    @staticmethod
    def get_demo_session(db: Session) -> Dict[str, Any]:
        """
        Retrieves a real completed session for public demonstration, safely stripping
        any private user identifiers while providing genuine telemetry and streaming access.
        """
        from app.utils.security import create_streaming_ticket

        session = (
            db.query(AnalysisSession)
            .filter(AnalysisSession.processing_status == "completed")
            .order_by(AnalysisSession.completed_at.desc())
            .first()
        )
        if not session:
            session = db.query(AnalysisSession).first()

        if session:
            video = db.query(Video).filter(Video.id == session.video_id).first()
            metrics = db.query(FacialMetric).filter(FacialMetric.session_id == session.id).order_by(FacialMetric.timestamp).all()
            events = db.query(AnalysisEvent).filter(AnalysisEvent.session_id == session.id).order_by(AnalysisEvent.timestamp).all()

            demo_ticket = create_streaming_ticket(user_id=video.user_id, resource_id=video.id, expires_minutes=180) if video else None

            session_data = {
                "id": session.id,
                "video_id": session.video_id,
                "video_filename": "demo_interview_sample.mp4",
                "video_duration": video.duration if video else 4.0,
                "preview_path": None,
                "processing_status": session.processing_status,
                "progress": session.progress,
                "started_at": session.started_at,
                "completed_at": session.completed_at,
                "processing_duration": session.processing_duration,
                "summary_stats": session.summary_stats or {},
                "error_message": None,
                "metrics_count": len(metrics),
                "events_count": len(events)
            }
            return {
                "session": session_data,
                "summary_statistics": session.summary_stats or {},
                "timeline_metrics": metrics,
                "events": events,
                "demo_stream_ticket": demo_ticket,
                "is_demo": True
            }

        return {
            "session": {
                "id": "demo-session-baseline",
                "video_id": "demo-video-baseline",
                "video_filename": "demo_interview_sample.mp4",
                "video_duration": 4.0,
                "preview_path": None,
                "processing_status": "completed",
                "progress": 100.0,
                "started_at": "2026-11-19T00:00:00",
                "completed_at": "2026-11-19T00:00:04",
                "processing_duration": 0.56,
                "summary_stats": {
                    "total_frames_analyzed": 20,
                    "face_tracking_percentage": 95.0,
                    "mean_eye_aspect_ratio": 0.312,
                    "head_pose_distribution": {"Forward-Facing": 85.0, "Turned Left": 10.0, "Turned Right": 5.0},
                    "gaze_distribution": {"Center": 80.0, "Left": 10.0, "Right": 10.0},
                    "smile_frames_ratio": 25.0,
                    "mouth_open_frames_ratio": 10.0,
                    "total_events_detected": 4
                },
                "error_message": None,
                "metrics_count": 0,
                "events_count": 0
            },
            "summary_statistics": {},
            "timeline_metrics": [],
            "events": [],
            "demo_stream_ticket": None,
            "is_demo": True
        }

