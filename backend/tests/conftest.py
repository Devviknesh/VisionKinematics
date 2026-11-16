import os
import pytest
from pathlib import Path
import numpy as np
import cv2
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.video import Video
from app.models.analysis import AnalysisSession, FacialMetric, AnalysisEvent
from app.utils.security import get_password_hash, create_access_token

# StaticPool ensures in-memory SQLite maintains same connection across calls in test process
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_user(db_session):
    # Ensure fresh or unique user
    user = db_session.query(User).filter(User.email == "engineer@test.com").first()
    if not user:
        user = User(
            name="Test Engineer",
            email="engineer@test.com",
            password_hash=get_password_hash("SecurePassword123!")
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def auth_headers(test_user):
    token = create_access_token(data={"sub": test_user.id, "email": test_user.email})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="session")
def sample_video_path(tmp_path_factory):
    """
    Generates a genuine synthetic test video (2 seconds, 60 frames)
    with a moving facial pattern to exercise OpenCV and VideoProcessor.
    """
    tmp_dir = tmp_path_factory.mktemp("video_fixtures")
    video_file = tmp_dir / "test_session_video.mp4"

    fps = 30.0
    width, height = 640, 480
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(video_file), fourcc, fps, (width, height))

    for frame_idx in range(60):
        frame = np.ones((height, width, 3), dtype=np.uint8) * 40
        # Draw face oval
        center_x = 320 + int(30 * np.sin(frame_idx * 0.1))
        center_y = 240
        cv2.ellipse(frame, (center_x, center_y), (80, 110), 0, 0, 360, (210, 180, 150), -1)

        # Eyes
        cv2.circle(frame, (center_x - 30, center_y - 20), 8, (255, 255, 255), -1)
        cv2.circle(frame, (center_x + 30, center_y - 20), 8, (255, 255, 255), -1)

        # Pupils
        gaze_offset = int(4 * np.sin(frame_idx * 0.2))
        cv2.circle(frame, (center_x - 30 + gaze_offset, center_y - 20), 4, (0, 0, 0), -1)
        cv2.circle(frame, (center_x + 30 + gaze_offset, center_y - 20), 4, (0, 0, 0), -1)

        # Nose
        cv2.line(frame, (center_x, center_y - 10), (center_x, center_y + 15), (140, 110, 90), 2)

        # Mouth
        cv2.ellipse(frame, (center_x, center_y + 45), (25, 12), 0, 0, 180, (50, 50, 180), 2)

        out.write(frame)

    out.release()
    return video_file
