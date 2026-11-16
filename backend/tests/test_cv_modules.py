import numpy as np
import pytest
from app.cv_engine.face_landmarker import FaceLandmarkerWrapper
from app.cv_engine.head_pose import HeadPoseEstimator
from app.cv_engine.gaze_estimator import GazeEstimator
from app.cv_engine.expression_analyzer import ExpressionAnalyzer
from app.cv_engine.event_detector import EventDetector
from app.cv_engine.video_processor import VideoProcessor

def test_missing_face_handling():
    detector = FaceLandmarkerWrapper()
    blank_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    res = detector.process_frame(blank_frame)
    assert res.face_detected is False
    assert res.pixel_landmarks is None
    assert len(res.blendshapes) == 0

def test_head_pose_estimation_geometry():
    estimator = HeadPoseEstimator()
    # Create canonical landmark points where face is straight forward
    # 478 points, 640x480 frame
    landmarks = np.zeros((478, 3), dtype=np.float64)
    landmarks[1] = [320, 240, 0]      # Nose tip
    landmarks[152] = [320, 350, -20]  # Chin
    landmarks[33] = [260, 200, -30]   # Left eye outer
    landmarks[263] = [380, 200, -30]  # Right eye outer
    landmarks[61] = [280, 290, -25]   # Left mouth
    landmarks[291] = [360, 290, -25]  # Right mouth

    res = estimator.estimate_pose(landmarks, (480, 640))
    assert res.orientation_label in ["Forward-Facing", "Turned Left", "Turned Right", "Tilted Up", "Tilted Down"]
    assert isinstance(res.yaw, float)
    assert isinstance(res.pitch, float)
    assert isinstance(res.roll, float)
    assert res.confidence > 0.0

def test_gaze_ear_and_direction():
    estimator = GazeEstimator(ear_blink_threshold=0.20)
    landmarks = np.zeros((478, 3), dtype=np.float64)
    # Open eye: wide vertical distance
    # Left eye: [33, 160, 158, 133, 153, 144]
    landmarks[33] = [250, 200, 0]
    landmarks[133] = [290, 200, 0]
    landmarks[160] = [265, 192, 0]
    landmarks[158] = [275, 192, 0]
    landmarks[144] = [265, 208, 0]
    landmarks[153] = [275, 208, 0]

    # Right eye: [362, 385, 387, 263, 373, 380]
    landmarks[362] = [350, 200, 0]
    landmarks[263] = [390, 200, 0]
    landmarks[385] = [365, 192, 0]
    landmarks[387] = [375, 192, 0]
    landmarks[380] = [365, 208, 0]
    landmarks[373] = [375, 208, 0]

    # Irises in center
    for idx in range(468, 472):
        landmarks[idx] = [270, 200, 0]
    for idx in range(473, 477):
        landmarks[idx] = [370, 200, 0]

    res = estimator.estimate_gaze(landmarks)
    assert res.eyes_closed is False
    assert res.avg_ear > 0.20
    assert res.direction in ["Center", "Left", "Right", "Up", "Down"]
    assert "Approximate" in res.disclaimer

def test_expression_analysis_observable_kinematics():
    analyzer = ExpressionAnalyzer()
    blendshapes = {
        "mouthSmileLeft": 0.85,
        "mouthSmileRight": 0.82,
        "browInnerUp": 0.70,
        "jawOpen": 0.55
    }
    res = analyzer.analyze(blendshapes)
    assert res.smile_intensity > 0.8
    assert res.brow_elevation > 0.6
    assert res.mouth_openness > 0.5
    assert "Smile-related facial movement" in res.active_indicators
    assert "Eyebrow elevation observed" in res.active_indicators
    assert "Does not infer internal emotions" in res.disclaimer

def test_event_detector_debounce_and_generation():
    detector = EventDetector(debounce_sec=0.5)

    # Frame 1 at t=0.0: turn head left
    events_t0 = detector.evaluate_frame(
        timestamp=0.0,
        face_detected=True,
        head_yaw=-25.0,
        head_label="Turned Left",
        gaze_direction="Left",
        smile_intensity=0.0
    )
    assert len(events_t0) >= 1
    assert any(e.event_type == "HEAD_TURNED_LEFT" for e in events_t0)

    # Immediate Frame 2 at t=0.1: same state, should be debounced
    events_t1 = detector.evaluate_frame(
        timestamp=0.1,
        face_detected=True,
        head_yaw=-26.0,
        head_label="Turned Left",
        gaze_direction="Left",
        smile_intensity=0.0
    )
    assert not any(e.event_type == "HEAD_TURNED_LEFT" for e in events_t1)

def test_video_processor_metadata(sample_video_path):
    meta = VideoProcessor.extract_metadata(sample_video_path)
    assert meta.is_valid is True
    assert meta.duration > 1.5
    assert meta.fps == 30.0
    assert meta.resolution == "640x480"
    assert meta.total_frames == 60
