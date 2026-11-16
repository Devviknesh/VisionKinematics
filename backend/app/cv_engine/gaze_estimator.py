import numpy as np
from dataclasses import dataclass
from typing import Tuple, Dict, Any, Optional

@dataclass
class GazeResult:
    direction: str # "Center", "Left", "Right", "Up", "Down"
    left_ear: float
    right_ear: float
    avg_ear: float
    eyes_closed: bool
    horizontal_ratio: float # 0.0 (left) to 1.0 (right) relative to subject
    vertical_ratio: float # 0.0 (up) to 1.0 (down)
    confidence: float
    disclaimer: str = "Approximate gaze direction estimation based on geometric landmark tracking. Not hardware eye-tracking."

class GazeEstimator:
    """
    Estimates approximate gaze direction and Eye Aspect Ratio (EAR).
    Accounts for eye landmarks, iris centers, and head orientation.
    """
    def __init__(self, ear_blink_threshold: float = 0.20):
        self.EAR_BLINK_THRESHOLD = ear_blink_threshold
        # Left eye landmark indices: [corner_left, top1, top2, corner_right, bottom2, bottom1]
        self.LEFT_EYE = [33, 160, 158, 133, 153, 144]
        # Right eye landmark indices: [corner_left, top1, top2, corner_right, bottom2, bottom1]
        self.RIGHT_EYE = [362, 385, 387, 263, 373, 380]
        # Iris indices
        self.LEFT_IRIS = [468, 469, 470, 471]
        self.RIGHT_IRIS = [473, 474, 475, 476]

    @staticmethod
    def _calculate_ear(eye_pts: np.ndarray) -> float:
        """
        Calculates Eye Aspect Ratio (EAR) from 6 landmark points.
        """
        # Vertical distances
        v1 = np.linalg.norm(eye_pts[1][:2] - eye_pts[5][:2])
        v2 = np.linalg.norm(eye_pts[2][:2] - eye_pts[4][:2])
        # Horizontal distance
        h = np.linalg.norm(eye_pts[0][:2] - eye_pts[3][:2])
        if h < 1e-6:
            return 0.0
        ear = (v1 + v2) / (2.0 * h)
        return float(ear)

    def estimate_gaze(
        self,
        pixel_landmarks: np.ndarray,
        head_yaw: float = 0.0,
        head_pitch: float = 0.0
    ) -> GazeResult:
        if pixel_landmarks is None or len(pixel_landmarks) < 468:
            return GazeResult(
                direction="Unknown",
                left_ear=0.0,
                right_ear=0.0,
                avg_ear=0.0,
                eyes_closed=False,
                horizontal_ratio=0.5,
                vertical_ratio=0.5,
                confidence=0.0
            )

        left_eye_pts = pixel_landmarks[self.LEFT_EYE]
        right_eye_pts = pixel_landmarks[self.RIGHT_EYE]

        left_ear = self._calculate_ear(left_eye_pts)
        right_ear = self._calculate_ear(right_eye_pts)
        avg_ear = (left_ear + right_ear) / 2.0
        eyes_closed = avg_ear < self.EAR_BLINK_THRESHOLD

        # If eyes are closed, gaze direction is unavailable/closed
        if eyes_closed:
            return GazeResult(
                direction="Closed",
                left_ear=round(left_ear, 3),
                right_ear=round(right_ear, 3),
                avg_ear=round(avg_ear, 3),
                eyes_closed=True,
                horizontal_ratio=0.5,
                vertical_ratio=0.5,
                confidence=0.9
            )

        # Iris centers
        has_iris = len(pixel_landmarks) >= 478
        if has_iris:
            left_iris_center = np.mean(pixel_landmarks[self.LEFT_IRIS][:, :2], axis=0)
            right_iris_center = np.mean(pixel_landmarks[self.RIGHT_IRIS][:, :2], axis=0)
        else:
            left_iris_center = np.mean(left_eye_pts[:, :2], axis=0)
            right_iris_center = np.mean(right_eye_pts[:, :2], axis=0)

        # Compute iris position ratio in left eye
        # Left eye: corner outer = 33, corner inner = 133
        l_outer = left_eye_pts[0][:2]
        l_inner = left_eye_pts[3][:2]
        l_eye_w = np.linalg.norm(l_inner - l_outer)
        
        # Horizontal ratio (0.0 = looking left of camera / subject's right, 1.0 = looking right)
        if l_eye_w > 1e-4:
            l_h_ratio = (left_iris_center[0] - min(l_outer[0], l_inner[0])) / l_eye_w
        else:
            l_h_ratio = 0.5

        # Vertical ratio (0.0 = looking up, 1.0 = looking down)
        l_top = (left_eye_pts[1][1] + left_eye_pts[2][1]) / 2.0
        l_bot = (left_eye_pts[4][1] + left_eye_pts[5][1]) / 2.0
        l_eye_h = abs(l_bot - l_top)
        if l_eye_h > 1e-4:
            l_v_ratio = (left_iris_center[1] - l_top) / l_eye_h
        else:
            l_v_ratio = 0.5

        # Incorporate head pose influence on apparent gaze
        # Yaw and Pitch bias
        yaw_bias = head_yaw / 60.0 # subtle shift
        pitch_bias = head_pitch / 40.0

        effective_h_ratio = float(np.clip(l_h_ratio + yaw_bias * 0.25, 0.0, 1.0))
        effective_v_ratio = float(np.clip(l_v_ratio - pitch_bias * 0.25, 0.0, 1.0))

        # Classify approximate gaze direction
        direction = "Center"
        if effective_h_ratio < 0.40:
            direction = "Left"
        elif effective_h_ratio > 0.60:
            direction = "Right"
        elif effective_v_ratio < 0.38:
            direction = "Up"
        elif effective_v_ratio > 0.62:
            direction = "Down"

        return GazeResult(
            direction=direction,
            left_ear=round(left_ear, 3),
            right_ear=round(right_ear, 3),
            avg_ear=round(avg_ear, 3),
            eyes_closed=False,
            horizontal_ratio=round(effective_h_ratio, 3),
            vertical_ratio=round(effective_v_ratio, 3),
            confidence=0.85
        )
