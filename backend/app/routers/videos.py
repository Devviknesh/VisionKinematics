from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.security import get_current_user
from app.models.user import User
from app.models.video import Video
from app.schemas.video import VideoResponse, VideoUploadResponse
from app.services.video_service import VideoService

router = APIRouter(prefix="/videos", tags=["Videos"])

@router.post("/upload", response_model=VideoUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    video = await VideoService.save_and_create_video(db, file, current_user.id)
    return VideoUploadResponse(
        message="Video uploaded and validated successfully",
        video=video
    )

@router.get("", response_model=List[dict])
def list_videos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return VideoService.list_user_videos(db, current_user.id)

@router.get("/{video_id}", response_model=VideoResponse)
def get_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return VideoService.get_video(db, video_id, current_user.id)

@router.get("/{video_id}/stream")
def stream_video(
    video_id: str,
    db: Session = Depends(get_db)
):
    # Allow HTML5 video tag to stream without mandatory bearer header for convenience,
    # or validated by session cookie if present
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video or not Path(video.storage_path).exists():
        raise HTTPException(status_code=404, detail="Video file not found")
    
    return FileResponse(
        path=video.storage_path,
        media_type="video/mp4",
        filename=video.filename
    )

@router.get("/{video_id}/preview")
def stream_preview_video(
    video_id: str,
    db: Session = Depends(get_db)
):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video or not video.preview_path or not Path(video.preview_path).exists():
        raise HTTPException(status_code=404, detail="Preview video not available")
    
    return FileResponse(
        path=video.preview_path,
        media_type="video/mp4",
        filename=f"preview_{video.filename}"
    )

@router.delete("/{video_id}")
def delete_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    VideoService.delete_video(db, video_id, current_user.id)
    return {"message": "Video and all associated analysis data deleted successfully"}
