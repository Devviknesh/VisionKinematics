import cv2
import numpy as np
from dataclasses import dataclass
from typing import Tuple, Dict, Any, Optional

@dataclass
class HeadPoseResult:
    yaw: float # degrees: negative = looking left, positive = looking right
    pitch: float # degrees: negative = looking down, positive = looking up
    roll: float # degrees: negative = tilted left, positive = tilted right
    orientation_label: str # e.g. "Forward", "Turned Left", "Turned Right", "Tilted Up", "Tilted Down"
    rvec: Optional[np.ndarray] = None
    tvec: Optional[np.ndarray] = None
    confidence: float = 1.0

class HeadPoseEstimator:
    """
    Estimates 3D Head Pose (Yaw, Pitch, Roll) using OpenCV solvePnP and facial landmarks.
    Clearly distinguishes physical head orientation from psychological attention or engagement.
    """
    def __init__(self):
        # Standard Anthropometric 3D Facial Model Points in millimeters
        # Coordinate conventions (aligned with camera coordinate system):
        # +X: points right (subject's left / viewer's right)
        # +Y: points down (towards chin, matching image plane Y increasing downwards)
        # +Z: points into the scene (away from camera, into face)
        self.model_points = np.array([
            (0.0, 0.0, 0.0),          # Nose tip (landmark 1)
            (0.0, 330.0, 65.0),       # Chin (landmark 152)
            (-225.0, -170.0, 135.0),  # Right eye outer corner (landmark 33)
            (225.0, -170.0, 135.0),   # Left eye outer corner (landmark 263)
            (-150.0, 150.0, 125.0),   # Right mouth corner (landmark 61)
            (150.0, 150.0, 125.0)     # Left mouth corner (landmark 291)
        ], dtype=np.float64)

        # Thresholds in degrees for classification
        self.YAW_THRESHOLD = 12.0
        self.PITCH_THRESHOLD = 10.0
        self.ROLL_THRESHOLD = 12.0

    def estimate_pose(self, pixel_landmarks: np.ndarray, frame_shape: Tuple[int, int]) -> HeadPoseResult:
        """
        Estimates yaw, pitch, roll given the (N, 3) pixel coordinates and (height, width).
        """
        if pixel_landmarks is None or len(pixel_landmarks) < 468:
            return HeadPoseResult(yaw=0.0, pitch=0.0, roll=0.0, orientation_label="Unknown", confidence=0.0)

        h, w = frame_shape[:2]

        # 2D image points corresponding to the 3D model points
        image_points = np.array([
            pixel_landmarks[1][:2],    # Nose tip
            pixel_landmarks[152][:2],  # Chin
            pixel_landmarks[33][:2],   # Left eye outer
            pixel_landmarks[263][:2],  # Right eye outer
            pixel_landmarks[61][:2],   # Left mouth corner
            pixel_landmarks[291][:2]   # Right mouth corner
        ], dtype=np.float64)

        # Camera intrinsic matrix approximation
        focal_length = float(w)
        center = (w / 2.0, h / 2.0)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)

        dist_coeffs = np.zeros((4, 1), dtype=np.float64)

        # Solve PnP
        success, rvec, tvec = cv2.solvePnP(
            self.model_points,
            image_points,
            camera_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )

        if not success:
            return HeadPoseResult(yaw=0.0, pitch=0.0, roll=0.0, orientation_label="Unknown", confidence=0.0)

        # Convert rotation vector to rotation matrix
        rmat, _ = cv2.Rodrigues(rvec)

        # Decompose rotation matrix into Euler angles
        # Using cv2.RQDecomp3x3 for robust Euler angle extraction
        angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)
        # In this coordinate frame (+X right, +Y down, +Z forward):
        # angles[0] is rotation around X (pitch): a positive angle tilts the nose downwards.
        # Standard aeronautical / computer vision pitch convention:
        # positive = looking/tilted UP, negative = looking/tilted DOWN.
        pitch = float(-angles[0])
        yaw = float(angles[1])   # y-axis: positive = turned right, negative = turned left
        roll = float(angles[2])  # z-axis: positive = tilted right, negative = tilted left

        # Categorize orientation
        label_parts = []
        if yaw < -self.YAW_THRESHOLD:
            label_parts.append("Turned Left")
        elif yaw > self.YAW_THRESHOLD:
            label_parts.append("Turned Right")

        if pitch < -self.PITCH_THRESHOLD:
            label_parts.append("Tilted Down")
        elif pitch > self.PITCH_THRESHOLD:
            label_parts.append("Tilted Up")

        if not label_parts:
            if abs(roll) > self.ROLL_THRESHOLD:
                label_parts.append("Tilted Lateral" if roll > 0 else "Tilted Lateral")
            else:
                label_parts.append("Forward-Facing")

        orientation_label = " & ".join(label_parts) if label_parts else "Forward-Facing"

        return HeadPoseResult(
            yaw=round(yaw, 2),
            pitch=round(pitch, 2),
            roll=round(roll, 2),
            orientation_label=orientation_label,
            rvec=rvec,
            tvec=tvec,
            confidence=0.92
        )
