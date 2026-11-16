import cv2
import numpy as np
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Tuple
from pathlib import Path
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
from app.config import settings

@dataclass
class LandmarkResult:
    face_detected: bool
    pixel_landmarks: Optional[np.ndarray] = None # Shape (478, 3) in pixel coordinates
    normalized_landmarks: Optional[np.ndarray] = None # Shape (478, 3) in [0, 1]
    blendshapes: Dict[str, float] = field(default_factory=dict)
    transformation_matrix: Optional[np.ndarray] = None
    regions: Dict[str, Any] = field(default_factory=dict)
    confidence: float = 0.0

class FaceLandmarkerWrapper:
    """
    Robust wrapper around MediaPipe FaceLandmarker Task API.
    Extracts 478 3D landmarks, blendshapes, and key facial regions.
    """
    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path or settings.FACE_MODEL_PATH
        if not self.model_path.exists():
            raise FileNotFoundError(f"MediaPipe face landmarker model not found at {self.model_path}")
        
        options = vision.FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=str(self.model_path)),
            output_face_blendshapes=True,
            output_facial_transformation_matrixes=True,
            num_faces=1,
            running_mode=vision.RunningMode.IMAGE
        )
        self.detector = vision.FaceLandmarker.create_from_options(options)

        # Canonical landmark index mappings (MediaPipe 468/478 mesh)
        self.LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
        self.RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
        self.LEFT_IRIS_INDICES = [468, 469, 470, 471]
        self.RIGHT_IRIS_INDICES = [473, 474, 475, 476]
        self.LEFT_EYEBROW_INDICES = [70, 63, 105, 66, 107]
        self.RIGHT_EYEBROW_INDICES = [336, 296, 334, 293, 300]
        self.NOSE_TIP_INDEX = 1
        self.CHIN_INDEX = 152
        self.FOREHEAD_INDEX = 10
        self.MOUTH_CORNERS = [61, 291] # left corner, right corner
        self.LIPS_OUTER_VERTICAL = [0, 17] # upper lip top, lower lip bottom
        self.LIPS_INNER_VERTICAL = [13, 14] # upper lip inner, lower lip inner

    def process_frame(self, frame_bgr: np.ndarray) -> LandmarkResult:
        if frame_bgr is None or frame_bgr.size == 0:
            return LandmarkResult(face_detected=False)

        h, w = frame_bgr.shape[:2]
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)

        try:
            detection = self.detector.detect(mp_image)
        except Exception:
            return LandmarkResult(face_detected=False)

        if not detection.face_landmarks or len(detection.face_landmarks) == 0:
            return LandmarkResult(face_detected=False)

        raw_landmarks = detection.face_landmarks[0]
        num_pts = len(raw_landmarks)
        norm_coords = np.zeros((num_pts, 3), dtype=np.float32)
        pix_coords = np.zeros((num_pts, 3), dtype=np.float32)

        for i, lm in enumerate(raw_landmarks):
            norm_coords[i] = [lm.x, lm.y, lm.z]
            pix_coords[i] = [lm.x * w, lm.y * h, lm.z * w] # scale z approximately by width

        # Blendshapes extraction
        blendshapes_dict: Dict[str, float] = {}
        if detection.face_blendshapes and len(detection.face_blendshapes) > 0:
            for category in detection.face_blendshapes[0]:
                blendshapes_dict[category.category_name] = float(category.score)

        # Facial transformation matrix
        trans_mat = None
        if detection.facial_transformation_matrixes and len(detection.facial_transformation_matrixes) > 0:
            trans_mat = np.array(detection.facial_transformation_matrixes[0], dtype=np.float32)

        # Group key regions
        regions = {
            "left_eye": pix_coords[self.LEFT_EYE_INDICES],
            "right_eye": pix_coords[self.RIGHT_EYE_INDICES],
            "left_eyebrow": pix_coords[self.LEFT_EYEBROW_INDICES],
            "right_eyebrow": pix_coords[self.RIGHT_EYEBROW_INDICES],
            "nose_tip": pix_coords[self.NOSE_TIP_INDEX],
            "chin": pix_coords[self.CHIN_INDEX],
            "forehead": pix_coords[self.FOREHEAD_INDEX],
            "mouth_corners": pix_coords[self.MOUTH_CORNERS],
            "lips_outer_v": pix_coords[self.LIPS_OUTER_VERTICAL],
            "lips_inner_v": pix_coords[self.LIPS_INNER_VERTICAL]
        }
        if num_pts >= 478:
            regions["left_iris"] = pix_coords[self.LEFT_IRIS_INDICES]
            regions["right_iris"] = pix_coords[self.RIGHT_IRIS_INDICES]

        return LandmarkResult(
            face_detected=True,
            pixel_landmarks=pix_coords,
            normalized_landmarks=norm_coords,
            blendshapes=blendshapes_dict,
            transformation_matrix=trans_mat,
            regions=regions,
            confidence=0.95
        )
