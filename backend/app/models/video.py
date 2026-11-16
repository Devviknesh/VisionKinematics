import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Video(Base):
    __tablename__ = "videos"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False)
    preview_path = Column(String(512), nullable=True)
    duration = Column(Float, default=0.0)
    fps = Column(Float, default=0.0)
    resolution = Column(String(50), default="unknown")
    file_size = Column(Integer, default=0)
    upload_status = Column(String(50), default="uploaded") # uploaded, processing, failed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="videos")
    analysis_sessions = relationship("AnalysisSession", back_populates="video", cascade="all, delete-orphan")
