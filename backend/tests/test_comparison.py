import uuid
import pytest
from fastapi.testclient import TestClient
from app.models.video import Video
from app.models.analysis import AnalysisSession

def test_session_comparison(client: TestClient, auth_headers: dict, db_session, sample_video_path):
    # 1. Get user id
    me_resp = client.get("/api/auth/me", headers=auth_headers)
    user_id = me_resp.json()["id"]

    id_a = str(uuid.uuid4())
    id_b = str(uuid.uuid4())

    # 2. Seed Video A and Session A
    video_a = Video(id=f"vid-{id_a}", user_id=user_id, filename="video_a.mp4", storage_path=str(sample_video_path), duration=10.0, fps=25.0)
    db_session.add(video_a)
    
    session_a = AnalysisSession(
        id=f"sess-{id_a}",
        video_id=f"vid-{id_a}",
        processing_status="completed",
        progress=100.0,
        summary_stats={
            "face_tracking_percentage": 92.5,
            "head_pose_distribution": {"Forward-Facing": 80.0, "Turned Left": 10.0, "Turned Right": 10.0},
            "gaze_distribution": {"Center": 75.0, "Left": 15.0, "Right": 10.0},
            "mean_eye_aspect_ratio": 0.285,
            "smile_frames_ratio": 15.0,
            "mouth_open_frames_ratio": 20.0,
            "total_events_detected": 12
        }
    )
    db_session.add(session_a)

    # 3. Seed Video B and Session B
    video_b = Video(id=f"vid-{id_b}", user_id=user_id, filename="video_b.mp4", storage_path=str(sample_video_path), duration=12.0, fps=30.0)
    db_session.add(video_b)
    
    session_b = AnalysisSession(
        id=f"sess-{id_b}",
        video_id=f"vid-{id_b}",
        processing_status="completed",
        progress=100.0,
        summary_stats={
            "face_tracking_percentage": 98.0,
            "head_pose_distribution": {"Forward-Facing": 88.0, "Turned Left": 6.0, "Turned Right": 6.0},
            "gaze_distribution": {"Center": 85.0, "Left": 8.0, "Right": 7.0},
            "mean_eye_aspect_ratio": 0.292,
            "smile_frames_ratio": 28.0,
            "mouth_open_frames_ratio": 32.0,
            "total_events_detected": 18
        }
    )
    db_session.add(session_b)
    db_session.commit()

    # 4. Query comparison endpoint
    resp = client.get(f"/api/analysis/compare?session_a=sess-{id_a}&session_b=sess-{id_b}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["session_a"]["id"] == f"sess-{id_a}"
    assert data["session_b"]["id"] == f"sess-{id_b}"
    assert len(data["comparison_metrics"]) >= 5
    assert len(data["radar_data"]) >= 4
    assert "disclaimer" in data

    # 5. Check calculation accuracy
    track_metric = next(m for m in data["comparison_metrics"] if m["metric"] == "Face Tracking Coverage")
    assert track_metric["session_a"] == 92.5
    assert track_metric["session_b"] == 98.0
    assert track_metric["diff"] == 5.5

    # 6. Verify cross-user ownership security
    other_email = f"other_{uuid.uuid4()}@test.com"
    client.post("/api/auth/register", json={
        "name": "Other User",
        "email": other_email,
        "password": "Password123!"
    })
    other_token = client.post("/api/auth/login", json={
        "email": other_email,
        "password": "Password123!"
    }).json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # Other user cannot compare sessions they don't own
    denied = client.get(f"/api/analysis/compare?session_a=sess-{id_a}&session_b=sess-{id_b}", headers=other_headers)
    assert denied.status_code == 404
