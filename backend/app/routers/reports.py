from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.security import get_current_user
from app.models.user import User
from app.models.video import Video
from app.models.analysis import AnalysisSession, AnalysisEvent
from app.services.report_service import ReportService
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{analysis_id}/download")
def download_pdf_report(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = AnalysisService.get_session(db, analysis_id, current_user.id)
    video = db.query(Video).filter(Video.id == session.video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    events = db.query(AnalysisEvent).filter(AnalysisEvent.session_id == analysis_id).order_by(AnalysisEvent.timestamp).all()

    pdf_path = ReportService.generate_pdf_report(video, session, events)
    if not pdf_path.exists():
        raise HTTPException(status_code=500, detail="Failed to generate PDF report")

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=pdf_path.name
    )
