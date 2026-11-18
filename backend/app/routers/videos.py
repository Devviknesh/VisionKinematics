from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.security import (
    get_current_user,
    security_bearer,
    create_streaming_ticket,
    authenticate_media_request
)
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

@router.get("/{video_id}/stream-token")
def get_video_stream_token(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Issues a short-lived (15-minute), cryptographically signed streaming ticket
    specifically for this video after verifying ownership.
    """
    video = db.query(Video).filter(Video.id == video_id, Video.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found or access denied")
    
    ticket = create_streaming_ticket(user_id=current_user.id, resource_id=video_id, expires_minutes=15)
    return {
        "video_id": video_id,
        "ticket": ticket,
        "expires_in_seconds": 900
    }

@router.get("/{video_id}/stream")
def stream_video(
    video_id: str,
    ticket: Optional[str] = Query(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
):
    """
    Streams the original video file.
    Requires either a valid Bearer token or a short-lived, resource-scoped streaming ticket.
    Strictly verifies ownership to prevent cross-user video leaks.
    """
    user = authenticate_media_request(resource_id=video_id, credentials=credentials, ticket=ticket, db=db)
    
    video = db.query(Video).filter(Video.id == video_id, Video.user_id == user.id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found or access denied")
    
    if not Path(video.storage_path).exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video file not found on disk")
    
    return FileResponse(
        path=video.storage_path,
        media_type="video/mp4",
        filename=video.filename
    )

@router.get("/{video_id}/preview")
def stream_preview_video(
    video_id: str,
    ticket: Optional[str] = Query(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
):
    """
    Streams the computer vision annotated HUD overlay video file.
    Requires either a valid Bearer token or a short-lived, resource-scoped streaming ticket.
    Strictly verifies ownership to prevent cross-user video leaks.
    """
    user = authenticate_media_request(resource_id=video_id, credentials=credentials, ticket=ticket, db=db)
    
    video = db.query(Video).filter(Video.id == video_id, Video.user_id == user.id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found or access denied")
    
    if not video.preview_path or not Path(video.preview_path).exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preview video not available")
    
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
