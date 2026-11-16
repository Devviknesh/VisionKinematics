import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.models.video import Video
from app.models.analysis import AnalysisSession
from app.cv_engine.video_processor import VideoProcessor
from app.config import settings

class VideoService:
    @staticmethod
    async def save_and_create_video(db: Session, file: UploadFile, user_id: str) -> Video:
        # Validate extension
        filename = file.filename or "video.mp4"
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported format '.{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        video_id = str(uuid.uuid4())
        safe_filename = f"{video_id}_{filename}"
        storage_path = settings.VIDEOS_DIR / safe_filename

        # Stream write to disk while verifying size
        written_size = 0
        try:
            with open(storage_path, "wb") as buffer:
                while chunk := await file.read(1024 * 1024): # 1MB chunks
                    written_size += len(chunk)
                    if written_size > settings.MAX_UPLOAD_SIZE_BYTES:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB"
                        )
                    buffer.write(chunk)
        except Exception as e:
            if storage_path.exists():
                storage_path.unlink()
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Failed to save video: {str(e)}")

        # Extract metadata
        meta = VideoProcessor.extract_metadata(storage_path)
        if not meta.is_valid:
            storage_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid or corrupted video file: {meta.error_message}"
            )

        if meta.duration > settings.MAX_VIDEO_DURATION_SECONDS:
            storage_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Video duration ({meta.duration:.1f}s) exceeds maximum allowed limit of {settings.MAX_VIDEO_DURATION_SECONDS}s"
            )

        video = Video(
            id=video_id,
            user_id=user_id,
            filename=filename,
            storage_path=str(storage_path),
            duration=meta.duration,
            fps=meta.fps,
            resolution=meta.resolution,
            file_size=written_size,
            upload_status="uploaded"
        )
        db.add(video)
        db.commit()
        db.refresh(video)
        return video

    @staticmethod
    def list_user_videos(db: Session, user_id: str) -> List[dict]:
        videos = db.query(Video).filter(Video.user_id == user_id).order_by(Video.created_at.desc()).all()
        result = []
        for v in videos:
            # Get latest session
            latest_session = (
                db.query(AnalysisSession)
                .filter(AnalysisSession.video_id == v.id)
                .order_by(AnalysisSession.started_at.desc())
                .first()
            )
            v_dict = {
                "id": v.id,
                "user_id": v.user_id,
                "filename": v.filename,
                "storage_path": v.storage_path,
                "preview_path": v.preview_path,
                "duration": v.duration,
                "fps": v.fps,
                "resolution": v.resolution,
                "file_size": v.file_size,
                "upload_status": v.upload_status,
                "created_at": v.created_at,
                "active_session_id": latest_session.id if latest_session else None,
                "session_status": latest_session.processing_status if latest_session else "none"
            }
            result.append(v_dict)
        return result

    @staticmethod
    def get_video(db: Session, video_id: str, user_id: str) -> Video:
        video = db.query(Video).filter(Video.id == video_id, Video.user_id == user_id).first()
        if not video:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
        return video

    @staticmethod
    def delete_video(db: Session, video_id: str, user_id: str) -> bool:
        video = db.query(Video).filter(Video.id == video_id, Video.user_id == user_id).first()
        if not video:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")

        # Delete physical files
        try:
            p = Path(video.storage_path)
            if p.exists():
                p.unlink()
            if video.preview_path:
                prev_p = Path(video.preview_path)
                if prev_p.exists():
                    prev_p.unlink()
        except Exception:
            pass

        db.delete(video)
        db.commit()
        return True
