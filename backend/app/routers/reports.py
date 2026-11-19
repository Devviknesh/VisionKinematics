from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
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
from app.models.analysis import AnalysisSession, AnalysisEvent, FacialMetric
from app.services.report_service import ReportService
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{analysis_id}/download-token")
def get_report_download_token(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a short-lived (15-minute) signed ticket strictly scoped to downloading
    this specific report after verifying session ownership.
    """
    AnalysisService.get_session(db, analysis_id, current_user.id)
    ticket = create_streaming_ticket(user_id=current_user.id, resource_id=analysis_id, expires_minutes=15)
    return {
        "analysis_id": analysis_id,
        "ticket": ticket,
        "expires_in_seconds": 900
    }

@router.get("/demo/download")
def download_demo_pdf_report(db: Session = Depends(get_db)):
    """
    Downloads the research-grade PDF dossier for the demo session.
    Publicly accessible with zero authentication required.
    """
    session = (
        db.query(AnalysisSession)
        .filter(AnalysisSession.processing_status == "completed")
        .order_by(AnalysisSession.completed_at.desc())
        .first()
    )
    if not session:
        session = db.query(AnalysisSession).first()
    if not session:
        raise HTTPException(status_code=404, detail="No completed demo session found")

    video = db.query(Video).filter(Video.id == session.video_id).first()
    events = db.query(AnalysisEvent).filter(AnalysisEvent.session_id == session.id).order_by(AnalysisEvent.timestamp).all()
    metrics = db.query(FacialMetric).filter(FacialMetric.session_id == session.id).order_by(FacialMetric.timestamp).all()

    report_path = ReportService.generate_pdf_report(
        video=video,
        session=session,
        events=events,
        metrics=metrics
    )

    return FileResponse(
        path=report_path,
        media_type="application/pdf",
        filename=f"VisionKinematics_Research_Report_{session.id[:8]}.pdf"
    )

@router.get("/{analysis_id}/download")
def download_pdf_report(
    analysis_id: str,
    ticket: Optional[str] = Query(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
):
    """
    Downloads the executive PDF report.
    Accepts either an Authorization Bearer header or a short-lived report download ticket.
    Strictly verifies ownership to prevent unauthorized report downloads.
    """
    user = authenticate_media_request(resource_id=analysis_id, credentials=credentials, ticket=ticket, db=db)
    
    session = AnalysisService.get_session(db, analysis_id, user.id)
    video = db.query(Video).filter(Video.id == session.video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    events = db.query(AnalysisEvent).filter(AnalysisEvent.session_id == analysis_id).order_by(AnalysisEvent.timestamp).all()
    metrics = db.query(FacialMetric).filter(FacialMetric.session_id == analysis_id).order_by(FacialMetric.timestamp).all()

    pdf_path = ReportService.generate_pdf_report(video, session, events, metrics)
    if not pdf_path.exists():
        raise HTTPException(status_code=500, detail="Failed to generate PDF report")

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=pdf_path.name
    )
