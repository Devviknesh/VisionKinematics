from pathlib import Path
from app.cv_engine.pipeline import VideoAnalysisPipeline
from app.services.report_service import ReportService
from app.models.analysis import AnalysisSession, AnalysisEvent
from app.models.video import Video

def test_full_cv_pipeline_execution(sample_video_path, tmp_path):
    pipeline = VideoAnalysisPipeline(sample_fps=5.0)
    preview_file = tmp_path / "test_preview.mp4"

    progress_log = []
    def on_progress(p):
        progress_log.append(p)

    result = pipeline.run_pipeline(
        video_path=sample_video_path,
        preview_out_path=preview_file,
        progress_callback=on_progress
    )

    assert "metadata" in result
    assert "metrics" in result
    assert "events" in result
    assert "summary" in result
    assert len(progress_log) > 0
    assert progress_log[-1] == 100.0

    summary = result["summary"]
    assert "total_frames_analyzed" in summary
    assert "head_pose_distribution" in summary
    assert "gaze_distribution" in summary
    assert summary["total_frames_analyzed"] > 0

def test_video_upload_and_api_flow(client, auth_headers, sample_video_path):
    with open(sample_video_path, "rb") as f:
        response = client.post(
            "/api/videos/upload",
            headers=auth_headers,
            files={"file": ("fixture_test.mp4", f, "video/mp4")}
        )
    assert response.status_code == 201
    video_data = response.json()["video"]
    video_id = video_data["id"]
    assert video_data["duration"] > 1.0

    # List videos
    list_res = client.get("/api/videos", headers=auth_headers)
    assert list_res.status_code == 200
    assert any(v["id"] == video_id for v in list_res.json())

    # Start analysis
    start_res = client.post(f"/api/analysis/{video_id}/start", headers=auth_headers)
    assert start_res.status_code == 202
    analysis_id = start_res.json()["id"]

    # Check status
    status_res = client.get(f"/api/analysis/{analysis_id}/status", headers=auth_headers)
    assert status_res.status_code == 200
    assert status_res.json()["id"] == analysis_id

def test_pdf_report_generation(tmp_path):
    video = Video(
        id="test-vid-123",
        filename="interview_sample.mp4",
        duration=120.5,
        fps=30.0,
        resolution="1920x1080"
    )
    session = AnalysisSession(
        id="test-session-456",
        summary_stats={
            "total_frames_analyzed": 600,
            "face_tracking_percentage": 98.5,
            "head_pose_distribution": {"Forward-Facing": 82.0, "Turned Left": 10.0, "Turned Right": 8.0},
            "gaze_distribution": {"Center": 75.0, "Left": 12.0, "Right": 10.0, "Closed": 3.0},
            "mean_eye_aspect_ratio": 0.285,
            "smile_frames_ratio": 14.2,
            "mouth_open_frames_ratio": 22.0,
            "total_events_detected": 8
        }
    )
    events = [
        AnalysisEvent(
            id="ev-1",
            timestamp=2.4,
            event_category="head_movement",
            event_type="HEAD_TURNED_LEFT",
            event_description="Subject turned head leftward",
            event_value={"yaw": -18.2}
        ),
        AnalysisEvent(
            id="ev-2",
            timestamp=5.1,
            event_category="expression",
            event_type="SMILE_INDICATOR_DETECTED",
            event_description="Observable smile movement detected",
            event_value={"intensity": 0.72}
        )
    ]

    pdf_path = ReportService.generate_pdf_report(video, session, events)
    assert pdf_path.exists()
    assert pdf_path.stat().st_size > 1000 # Valid non-empty PDF file

def test_public_demo_endpoints(client, db_session, test_user, sample_video_path):
    # 1. Test unauthenticated /api/analysis/demo
    demo_res = client.get("/api/analysis/demo")
    assert demo_res.status_code == 200
    data = demo_res.json()
    assert "session" in data
    assert data.get("is_demo") is True

    # 2. Add completed session & video into db to verify demo PDF download
    vid = Video(
        id="demo-test-vid",
        user_id=test_user.id,
        filename="demo_sample.mp4",
        storage_path=str(sample_video_path),
        duration=2.0,
        fps=30.0
    )
    db_session.add(vid)
    db_session.commit()

    sess = AnalysisSession(
        id="demo-test-session",
        video_id=vid.id,
        processing_status="completed",
        progress=100.0,
        summary_stats={
            "total_frames_analyzed": 60,
            "face_tracking_percentage": 95.0,
            "mean_eye_aspect_ratio": 0.28,
            "head_pose_distribution": {"Forward-Facing": 100.0},
            "gaze_distribution": {"Center": 100.0},
            "smile_frames_ratio": 10.0,
            "mouth_open_frames_ratio": 5.0,
            "total_events_detected": 0
        }
    )
    db_session.add(sess)
    db_session.commit()

    # Verify demo PDF download returns 200
    pdf_res = client.get("/api/reports/demo/download")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
