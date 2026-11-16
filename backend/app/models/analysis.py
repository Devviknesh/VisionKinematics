import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    video_id = Column(String(36), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    processing_status = Column(String(50), default="pending", index=True) # pending, processing, completed, failed, cancelled
    progress = Column(Float, default=0.0)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    processing_duration = Column(Float, default=0.0)
    summary_stats = Column(JSON, nullable=True)
    error_message = Column(String(512), nullable=True)

    video = relationship("Video", back_populates="analysis_sessions")
    metrics = relationship("FacialMetric", back_populates="session", cascade="all, delete-orphan", order_by="FacialMetric.timestamp")
    events = relationship("AnalysisEvent", back_populates="session", cascade="all, delete-orphan", order_by="AnalysisEvent.timestamp")

class FacialMetric(Base):
    __tablename__ = "facial_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(36), ForeignKey("analysis_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(Float, nullable=False, index=True)
    face_detected = Column(Boolean, default=True)
    head_yaw = Column(Float, default=0.0)
    head_pitch = Column(Float, default=0.0)
    head_roll = Column(Float, default=0.0)
    gaze_direction = Column(String(50), default="Center")
    eye_aspect_ratio = Column(Float, default=0.0)
    expression_measurements = Column(JSON, nullable=True)
    reliability_score = Column(Float, default=1.0)

    session = relationship("AnalysisSession", back_populates="metrics")

class AnalysisEvent(Base):
    __tablename__ = "analysis_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("analysis_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(Float, nullable=False, index=True)
    event_category = Column(String(50), nullable=False) # head_movement, gaze, expression, tracking
    event_type = Column(String(50), nullable=False) # e.g. HEAD_TURNED_LEFT, SMILE_DETECTED
    event_description = Column(String(255), nullable=False)
    event_value = Column(JSON, nullable=True)
    reliability_score = Column(Float, default=1.0)

    session = relationship("AnalysisSession", back_populates="events")
