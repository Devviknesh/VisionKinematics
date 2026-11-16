from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class VideoResponse(BaseModel):
    id: str
    user_id: str
    filename: str
    storage_path: str
    preview_path: Optional[str] = None
    duration: float
    fps: float
    resolution: str
    file_size: int
    upload_status: str
    created_at: datetime
    active_session_id: Optional[str] = None

    class Config:
        from_attributes = True

class VideoUploadResponse(BaseModel):
    message: str
    video: VideoResponse
