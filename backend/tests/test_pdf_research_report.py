import pytest
from pathlib import Path
from app.models.video import Video
from app.models.analysis import AnalysisSession, AnalysisEvent, FacialMetric
from app.services.report_service import ReportService


def test_research_pdf_generation_with_full_metrics(tmp_path):
    video = Video(
        id="vid-research-1",
        filename="interview_sample.mp4",
        duration=10.0,
        fps=20.0,
        resolution="640x480",
        storage_path="sample_test_face.mp4"
    )
    session = AnalysisSession(
        id="session-res-1234",
        summary_stats={
            "total_frames_analyzed": 50,
            "face_tracking_percentage": 96.0,
            "head_pose_distribution": {"Forward-Facing": 88.0, "Turned Left": 6.0, "Turned Right": 6.0, "Tilted Up": 0.0, "Tilted Down": 0.0},
            "gaze_distribution": {"Center": 72.0, "Left": 10.0, "Right": 8.0, "Up": 4.0, "Down": 2.0, "Closed": 4.0},
            "mean_eye_aspect_ratio": 0.312,
            "smile_frames_ratio": 12.0,
            "mouth_open_frames_ratio": 8.0,
            "total_events_detected": 4
        }
    )

    # 50 simulated continuous metrics frames
    metrics = []
    for i in range(50):
        t = i * 0.2
        metrics.append(FacialMetric(
            id=i,
            session_id=session.id,
            timestamp=t,
            face_detected=True,
            head_yaw=-3.5 + (i % 5) * 0.5,
            head_pitch=2.2 + (i % 3) * 0.3,
            head_roll=0.3,
            gaze_direction="Center",
            eye_aspect_ratio=0.18 if i in [10, 25] else 0.32,
            expression_measurements={
                "smile_intensity": 0.10 + (0.4 if 15 <= i <= 20 else 0.0),
                "brow_elevation": 0.15,
                "brow_furrow": 0.02,
                "mouth_openness": 0.05,
                "eye_closure": 0.85 if i in [10, 25] else 0.02
            },
            landmarks=[[0.5, 0.5, 0.0]] * 478
        ))

    events = [
        AnalysisEvent(
            id="ev-1",
            session_id=session.id,
            timestamp=2.0,
            event_category="gaze",
            event_type="EYES_CLOSED",
            event_description="Blink event detected (EAR < 0.20)",
            reliability_score=0.98
        ),
        AnalysisEvent(
            id="ev-2",
            session_id=session.id,
            timestamp=3.2,
            event_category="expression",
            event_type="SMILE_INDICATOR_DETECTED",
            event_description="AU12 Lip Corner Puller activation",
            reliability_score=0.92
        )
    ]

    pdf_path = ReportService.generate_pdf_report(video, session, events, metrics)
    assert pdf_path.exists()
    assert pdf_path.stat().st_size > 50000  # Should be substantial with embedded figures
    with open(pdf_path, "rb") as f:
        header = f.read(8)
        assert header.startswith(b"%PDF-")


def test_research_pdf_empty_metrics_and_events():
    video = Video(
        id="vid-empty-1",
        filename="empty_video.mp4",
        duration=0.0,
        fps=0.0,
        resolution="0x0",
        storage_path="nonexistent_video.mp4"
    )
    session = AnalysisSession(
        id="session-empty-999",
        summary_stats={}
    )

    pdf_path = ReportService.generate_pdf_report(video, session, [], [])
    assert pdf_path.exists()
    assert pdf_path.stat().st_size > 1000
    with open(pdf_path, "rb") as f:
        assert f.read(5) == b"%PDF-"
