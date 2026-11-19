import uuid
import pytest
from datetime import datetime
from fastapi.testclient import TestClient

from app.models.user import User
from app.models.video import Video
from app.models.analysis import AnalysisSession, FacialMetric, AnalysisEvent
from app.utils.security import create_streaming_ticket, verify_streaming_ticket, create_access_token

def test_cross_tenant_full_isolation(client: TestClient, db_session, sample_video_path):
    # 1. Setup User A
    user_a = User(
        name="User Alpha",
        email=f"alpha_{uuid.uuid4().hex[:6]}@test.com",
        password_hash="fakehash"
    )
    db_session.add(user_a)
    db_session.commit()
    db_session.refresh(user_a)
    token_a = create_access_token(data={"sub": user_a.id, "email": user_a.email})
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Setup User B
    user_b = User(
        name="User Beta",
        email=f"beta_{uuid.uuid4().hex[:6]}@test.com",
        password_hash="fakehash"
    )
    db_session.add(user_b)
    db_session.commit()
    db_session.refresh(user_b)
    token_b = create_access_token(data={"sub": user_b.id, "email": user_b.email})
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. Create Video and Session owned by User A
    video_a = Video(
        id=f"vid-a-{uuid.uuid4().hex[:6]}",
        user_id=user_a.id,
        filename="video_a.mp4",
        storage_path=str(sample_video_path),
        duration=2.0,
        fps=30.0
    )
    db_session.add(video_a)
    db_session.commit()

    session_a = AnalysisSession(
        id=str(uuid.uuid4()),
        video_id=video_a.id,
        processing_status="completed",
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        progress=100.0,
        summary_stats={
            "total_frames_analyzed": 60,
            "face_tracking_percentage": 95.0,
            "head_pose_distribution": {"Forward-Facing": 100.0},
            "gaze_distribution": {"Center": 100.0},
            "mean_eye_aspect_ratio": 0.28,
            "smile_frames_ratio": 10.0,
            "mouth_open_frames_ratio": 5.0,
            "total_events_detected": 0
        }
    )
    db_session.add(session_a)
    db_session.commit()

    # User A creates a second session for comparison test
    session_a2 = AnalysisSession(
        id=str(uuid.uuid4()),
        video_id=video_a.id,
        processing_status="completed",
        started_at=datetime.utcnow(),
        completed_at=datetime.utcnow(),
        progress=100.0,
        summary_stats={
            "total_frames_analyzed": 60,
            "face_tracking_percentage": 92.0,
            "head_pose_distribution": {"Forward-Facing": 100.0},
            "gaze_distribution": {"Center": 100.0},
            "mean_eye_aspect_ratio": 0.27,
            "smile_frames_ratio": 8.0,
            "mouth_open_frames_ratio": 4.0,
            "total_events_detected": 0
        }
    )
    db_session.add(session_a2)
    db_session.commit()

    # Verify User A can access own resources
    res = client.get(f"/api/videos/{video_a.id}", headers=headers_a)
    assert res.status_code == 200

    res = client.get(f"/api/analysis/{session_a.id}/status", headers=headers_a)
    assert res.status_code == 200

    # User B CANNOT access User A's video metadata
    res = client.get(f"/api/videos/{video_a.id}", headers=headers_b)
    assert res.status_code == 404

    # User B CANNOT access User A's analysis session status
    res = client.get(f"/api/analysis/{session_a.id}/status", headers=headers_b)
    assert res.status_code == 404

    # User B CANNOT generate streaming ticket for User A's video
    res = client.get(f"/api/videos/{video_a.id}/stream-token", headers=headers_b)
    assert res.status_code == 404

    # User B CANNOT stream User A's video directly via Bearer token
    res = client.get(f"/api/videos/{video_a.id}/stream", headers=headers_b)
    assert res.status_code == 404

    # User B CANNOT download User A's PDF report
    res = client.get(f"/api/reports/{session_a.id}/download", headers=headers_b)
    assert res.status_code == 404

    # User B CANNOT compare sessions where one or both belong to User A
    res = client.get(f"/api/analysis/compare?session_a={session_a.id}&session_b={session_a2.id}", headers=headers_b)
    assert res.status_code == 404

    # Expired ticket returns 401 when attempting to stream
    expired_ticket = create_streaming_ticket(user_id=user_a.id, resource_id=video_a.id, expires_minutes=-10)
    assert verify_streaming_ticket(expired_ticket, video_a.id) is None

    res = client.get(f"/api/videos/{video_a.id}/stream?ticket={expired_ticket}")
    assert res.status_code == 401
