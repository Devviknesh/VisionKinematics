import uuid
import pytest
from fastapi.testclient import TestClient
from pathlib import Path
from app.utils.security import create_streaming_ticket, verify_streaming_ticket
from app.models.video import Video
from app.models.user import User

def test_streaming_ticket_crypto():
    user_id = "user-123"
    video_id = "video-456"
    ticket = create_streaming_ticket(user_id, video_id, expires_minutes=15)
    
    # Valid ticket
    verified_user = verify_streaming_ticket(ticket, video_id)
    assert verified_user == user_id

    # Tampered resource ID (cannot use Video A ticket for Video B)
    assert verify_streaming_ticket(ticket, "other-video-789") is None

    # Invalid string
    assert verify_streaming_ticket("invalid.jwt.token", video_id) is None

def test_stream_video_unauthorized(client: TestClient):
    # Attempting to stream without token or ticket returns 401
    resp = client.get("/api/videos/nonexistent-id/stream")
    assert resp.status_code == 401

def test_stream_video_with_ownership_and_ticket(client: TestClient, auth_headers: dict, db_session, sample_video_path):
    # 1. Create a video owned by test user using sample_video_path fixture
    me_resp = client.get("/api/auth/me", headers=auth_headers)
    user_id = me_resp.json()["id"]

    video = Video(
        id=f"sec-vid-{uuid.uuid4()}",
        user_id=user_id,
        filename="dummy.mp4",
        storage_path=str(sample_video_path),
        duration=2.0,
        fps=30.0
    )
    db_session.add(video)
    db_session.commit()

    # 2. Request stream-token
    token_resp = client.get(f"/api/videos/{video.id}/stream-token", headers=auth_headers)
    assert token_resp.status_code == 200
    ticket = token_resp.json()["ticket"]

    # 3. Stream using ticket
    stream_resp = client.get(f"/api/videos/{video.id}/stream?ticket={ticket}")
    assert stream_resp.status_code == 200

    # 4. Stream using Bearer header
    stream_resp2 = client.get(f"/api/videos/{video.id}/stream", headers=auth_headers)
    assert stream_resp2.status_code == 200

    # 5. Cross-user isolation: Another user cannot generate token or stream this video
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

    # Other user gets 404 for another user's video
    denied = client.get(f"/api/videos/{video.id}/stream-token", headers=other_headers)
    assert denied.status_code == 404
