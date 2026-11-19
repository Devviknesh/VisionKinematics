from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.security import get_current_user
from app.models.user import User
from app.schemas.analysis import (
    AnalysisStatusResponse,
    AnalysisSessionResponse,
    AnalysisEventResponse,
    AnalysisResultsResponse,
)
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.get("/compare", response_model=Dict[str, Any])
def compare_sessions(
    session_a: str,
    session_b: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compares two analysis sessions belonging to the authenticated user.
    Computes real comparative metrics across tracking stability, head pose,
    gaze focus, and expression kinematics.
    """
    return AnalysisService.compare_sessions(db, session_a, session_b, current_user.id)

@router.get("/demo", response_model=Dict[str, Any])
def get_demo_analysis(db: Session = Depends(get_db)):
    """
    Publicly accessible endpoint returning a genuine completed session with full telemetry,
    landmarks, pose, and action units for interactive product demonstration.
    """
    return AnalysisService.get_demo_session(db)

@router.post("/{video_id}/start", response_model=AnalysisStatusResponse, status_code=status.HTTP_202_ACCEPTED)
def start_analysis(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = AnalysisService.start_analysis(db, video_id, current_user.id)
    return session

@router.get("/{analysis_id}/status", response_model=AnalysisStatusResponse)
def get_analysis_status(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = AnalysisService.get_session(db, analysis_id, current_user.id)
    return session

@router.get("/{analysis_id}/results", response_model=AnalysisResultsResponse)
def get_analysis_results(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return AnalysisService.get_results(db, analysis_id, current_user.id)

@router.get("/{analysis_id}/events", response_model=List[AnalysisEventResponse])
def get_analysis_events(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return AnalysisService.get_events(db, analysis_id, current_user.id)

@router.get("/{analysis_id}/statistics", response_model=Dict[str, Any])
def get_analysis_statistics(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return AnalysisService.get_statistics(db, analysis_id, current_user.id)

@router.post("/{analysis_id}/cancel")
def cancel_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cancelled = AnalysisService.cancel_analysis(db, analysis_id, current_user.id)
    return {"cancelled": cancelled}
