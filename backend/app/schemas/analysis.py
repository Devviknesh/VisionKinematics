from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

class FacialMetricResponse(BaseModel):
    id: int
    session_id: str
    timestamp: float
    face_detected: bool
    head_yaw: float
    head_pitch: float
    head_roll: float
    gaze_direction: str
    eye_aspect_ratio: float
    expression_measurements: Optional[Dict[str, Any]] = None
    reliability_score: float
    landmarks: Optional[List[List[float]]] = None

    class Config:
        from_attributes = True

class AnalysisEventResponse(BaseModel):
    id: str
    session_id: str
    timestamp: float
    event_category: str
    event_type: str
    event_description: str
    event_value: Optional[Any] = None
    reliability_score: float

    class Config:
        from_attributes = True

class AnalysisStatusResponse(BaseModel):
    id: str
    video_id: str
    processing_status: str
    progress: float
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    processing_duration: float
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

class AnalysisSessionResponse(BaseModel):
    id: str
    video_id: str
    processing_status: str
    progress: float
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    processing_duration: float
    summary_stats: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    metrics_count: Optional[int] = 0
    events_count: Optional[int] = 0

    class Config:
        from_attributes = True

class AnalysisResultsResponse(BaseModel):
    session: AnalysisSessionResponse
    summary_statistics: Dict[str, Any]
    timeline_metrics: List[FacialMetricResponse]
    events: List[AnalysisEventResponse]

class DemoAnalysisResponse(AnalysisResultsResponse):
    demo_stream_ticket: Optional[str] = None
    is_demo: bool = True
