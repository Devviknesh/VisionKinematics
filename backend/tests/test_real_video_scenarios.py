import os
import uuid
import numpy as np
import cv2
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from app.cv_engine.pipeline import VideoAnalysisPipeline
from app.cv_engine.video_processor import VideoProcessor
from app.services.report_service import ReportService
from app.models.analysis import AnalysisSession, FacialMetric, AnalysisEvent
from app.models.video import Video

@pytest.fixture(scope="module")
def shared_pipeline():
    return VideoAnalysisPipeline(sample_fps=5.0)

@pytest.fixture(scope="module")
def base_face_frames():
    """Reads 25 frames from sample_test_face.mp4 if present, else creates synthetic face frames."""
    sample_file = Path("sample_test_face.mp4")
    frames = []
    if sample_file.exists():
        cap = cv2.VideoCapture(str(sample_file))
        while len(frames) < 25:
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)
        cap.release()
    
    if not frames:
        for i in range(25):
            img = np.ones((480, 640, 3), dtype=np.uint8) * 50
            cv2.ellipse(img, (320, 240), (80, 110), 0, 0, 360, (210, 180, 150), -1)
            cv2.circle(img, (290, 220), 8, (255, 255, 255), -1)
            cv2.circle(img, (350, 220), 8, (255, 255, 255), -1)
            cv2.circle(img, (290, 220), 4, (0, 0, 0), -1)
            cv2.circle(img, (350, 220), 4, (0, 0, 0), -1)
            frames.append(img)
    return frames

def create_video_from_frames(frames, output_path: Path, fps=20.0):
    h, w = frames[0].shape[:2]
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(output_path), fourcc, fps, (w, h))
    for f in frames:
        out.write(f)
    out.release()
    return output_path

# =========================================================================
# 1. SCENARIO 1: Short Video (<10s)
# =========================================================================
def test_scenario_1_short_video(tmp_path, shared_pipeline, base_face_frames):
    vid_path = create_video_from_frames(base_face_frames[:15], tmp_path / "scenario_short.mp4", fps=20.0)
    res = shared_pipeline.run_pipeline(vid_path)
    assert res["metadata"].is_valid is True
    assert res["summary"]["total_frames_analyzed"] > 0
    assert len(res["metrics"]) > 0

# =========================================================================
# 2. SCENARIO 2: Extended / Long Video
# =========================================================================
def test_scenario_2_extended_video(tmp_path, shared_pipeline, base_face_frames):
    long_frames = (base_face_frames * 2)[:30]
    vid_path = create_video_from_frames(long_frames, tmp_path / "scenario_extended.mp4", fps=20.0)
    res = shared_pipeline.run_pipeline(vid_path)
    assert res["metadata"].is_valid is True
    assert res["summary"]["total_frames_analyzed"] >= 6
    assert res["metadata"].duration >= 1.0

# =========================================================================
# 3. SCENARIO 3: Low-Light Video (Dark frames)
# =========================================================================
def test_scenario_3_low_light_video(tmp_path, shared_pipeline, base_face_frames):
    dark_frames = [np.clip(f.astype(np.float32) * 0.15, 0, 255).astype(np.uint8) for f in base_face_frames[:15]]
    vid_path = create_video_from_frames(dark_frames, tmp_path / "scenario_low_light.mp4", fps=20.0)
    res = shared_pipeline.run_pipeline(vid_path)
    assert res["metadata"].is_valid is True
    assert "summary" in res
    assert "face_tracking_percentage" in res["summary"]

# =========================================================================
# 4. SCENARIO 4: Blurry / Poor-Quality Video
# =========================================================================
def test_scenario_4_blurry_video(tmp_path, shared_pipeline, base_face_frames):
    blurry_frames = [cv2.GaussianBlur(f, (31, 31), 0) for f in base_face_frames[:15]]
    vid_path = create_video_from_frames(blurry_frames, tmp_path / "scenario_blurry.mp4", fps=20.0)
    res = shared_pipeline.run_pipeline(vid_path)
    assert res["metadata"].is_valid is True
    assert "summary" in res

# =========================================================================
# 5. SCENARIO 5: No Visible Face Video (Pure black frames)
# =========================================================================
def test_scenario_5_no_visible_face(tmp_path, shared_pipeline):
    blank_frames = [np.zeros((480, 640, 3), dtype=np.uint8) for _ in range(15)]
    vid_path = create_video_from_frames(blank_frames, tmp_path / "scenario_no_face.mp4", fps=20.0)
    res = shared_pipeline.run_pipeline(vid_path)
    assert res["metadata"].is_valid is True
    assert res["summary"]["face_tracking_percentage"] == 0.0
    for m in res["metrics"]:
        assert m["face_detected"] is False
        assert m["eye_aspect_ratio"] == 0.0

# =========================================================================
# 6. SCENARIO 6: Multiple Faces (Side-by-side composite)
# =========================================================================
def test_scenario_6_multi_face(tmp_path, shared_pipeline, base_face_frames):
    multi_frames = []
    for f in base_face_frames[:15]:
        small = cv2.resize(f, (320, 480))
        combined = np.hstack([small, small])
        multi_frames.append(combined)
    vid_path = create_video_from_frames(multi_frames, tmp_path / "scenario_multi_face.mp4", fps=20.0)
    res = shared_pipeline.run_pipeline(vid_path)
    assert res["metadata"].is_valid is True
    assert res["summary"]["total_frames_analyzed"] > 0

# =========================================================================
# 7. SCENARIO 7: Intermittent Face Visibility (Face -> Black -> Face)
# =========================================================================
def test_scenario_7_intermittent_face(tmp_path, shared_pipeline, base_face_frames):
    blank_frame = np.zeros_like(base_face_frames[0])
    intermittent = (
        base_face_frames[:8] +
        [blank_frame] * 8 +
        base_face_frames[8:16]
    )
    vid_path = create_video_from_frames(intermittent, tmp_path / "scenario_intermittent.mp4", fps=20.0)
    res = shared_pipeline.run_pipeline(vid_path)
    assert res["metadata"].is_valid is True
    assert "face_tracking_percentage" in res["summary"]

# =========================================================================
# 8. SCENARIO 8: High Head Movement (Rotated frames)
# =========================================================================
def test_scenario_8_high_head_movement(tmp_path, shared_pipeline, base_face_frames):
    high_mov_frames = []
    h, w = base_face_frames[0].shape[:2]
    for idx, f in enumerate(base_face_frames[:15]):
        angle = np.sin(idx * 0.4) * 25.0
        M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
        rotated = cv2.warpAffine(f, M, (w, h))
        high_mov_frames.append(rotated)
    vid_path = create_video_from_frames(high_mov_frames, tmp_path / "scenario_high_movement.mp4", fps=20.0)
    res = shared_pipeline.run_pipeline(vid_path)
    assert res["metadata"].is_valid is True
    assert res["summary"]["total_frames_analyzed"] > 0

# =========================================================================
# 9. SCENARIO 9: Minimal Head Movement (Static baseline)
# =========================================================================
def test_scenario_9_minimal_movement(tmp_path, shared_pipeline, base_face_frames):
    static_frame = base_face_frames[0]
    static_frames = [static_frame.copy() for _ in range(15)]
    vid_path = create_video_from_frames(static_frames, tmp_path / "scenario_minimal_movement.mp4", fps=20.0)
    res = shared_pipeline.run_pipeline(vid_path)
    assert res["metadata"].is_valid is True
    assert res["summary"]["total_frames_analyzed"] > 0

# =========================================================================
# 10. SCENARIO 10: Corrupted Video File (Invalid bytes)
# =========================================================================
def test_scenario_10_corrupted_video_upload(client: TestClient, auth_headers: dict, tmp_path):
    corrupt_file = tmp_path / "corrupted_video.mp4"
    corrupt_file.write_bytes(b"CORRUPTED_NON_MP4_GARBAGE_PAYLOAD_DATA_1234567890")

    with open(corrupt_file, "rb") as f:
        response = client.post(
            "/api/videos/upload",
            headers=auth_headers,
            files={"file": ("corrupted.mp4", f, "video/mp4")}
        )
    assert response.status_code == 400
    assert "Invalid or corrupted video file" in response.json()["detail"]
