import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional

@dataclass
class ExpressionResult:
    smile_intensity: float # 0.0 to 1.0
    brow_elevation: float # 0.0 to 1.0
    brow_furrow: float # 0.0 to 1.0
    mouth_openness: float # 0.0 to 1.0
    eye_closure: float # 0.0 to 1.0
    primary_expression_pattern: str # Observable composite pattern
    kinematic_confidence: float # 0.0 to 1.0
    active_indicators: List[str] = field(default_factory=list)
    raw_blendshapes: Dict[str, float] = field(default_factory=dict)
    disclaimer: str = (
        "Observable facial kinematics only. Measures physical Action Unit contractions. "
        "Does not infer internal emotions, personality traits, or psychological state."
    )

class ExpressionAnalyzer:
    """
    Analyzes observable facial-expression indicators using MediaPipe blendshapes
    and geometric landmark measurements.
    Strictly reports observable movements without claiming emotional certainty.
    """
    def __init__(
        self,
        smile_threshold: float = 0.35,
        brow_elevate_threshold: float = 0.35,
        brow_furrow_threshold: float = 0.35,
        mouth_open_threshold: float = 0.30
    ):
        self.SMILE_THRESH = smile_threshold
        self.BROW_ELEV_THRESH = brow_elevate_threshold
        self.BROW_FURROW_THRESH = brow_furrow_threshold
        self.MOUTH_OPEN_THRESH = mouth_open_threshold

    def analyze(
        self,
        blendshapes: Dict[str, float],
        pixel_landmarks: Optional[np.ndarray] = None
    ) -> ExpressionResult:
        active_indicators = []

        # 1. Smile-related movements
        smile_left = blendshapes.get("mouthSmileLeft", 0.0)
        smile_right = blendshapes.get("mouthSmileRight", 0.0)
        smile_intensity = max(smile_left, smile_right, (smile_left + smile_right) / 2.0)

        # Fallback to geometric measurement if blendshapes are flat or missing
        if smile_intensity == 0.0 and pixel_landmarks is not None and len(pixel_landmarks) >= 292:
            # Measure distance between mouth corners (61, 291) relative to face width (234 to 454)
            corner_l = pixel_landmarks[61][:2]
            corner_r = pixel_landmarks[291][:2]
            jaw_l = pixel_landmarks[234][:2]
            jaw_r = pixel_landmarks[454][:2]
            mouth_w = np.linalg.norm(corner_r - corner_l)
            face_w = np.linalg.norm(jaw_r - jaw_l)
            if face_w > 1e-4:
                mouth_ratio = mouth_w / face_w
                # Neutral mouth_ratio is around 0.38 - 0.42. Above 0.46 indicates smiling movement
                smile_intensity = float(np.clip((mouth_ratio - 0.40) / 0.15, 0.0, 1.0))

        if smile_intensity >= self.SMILE_THRESH:
            active_indicators.append("Smile-related facial movement")

        # 2. Eyebrow movements (elevation & furrowing)
        brow_up_inner = blendshapes.get("browInnerUp", 0.0)
        brow_up_l = blendshapes.get("browOuterUpLeft", 0.0)
        brow_up_r = blendshapes.get("browOuterUpRight", 0.0)
        brow_elevation = max(brow_up_inner, (brow_up_l + brow_up_r) / 2.0)

        brow_down_l = blendshapes.get("browDownLeft", 0.0)
        brow_down_r = blendshapes.get("browDownRight", 0.0)
        brow_furrow = (brow_down_l + brow_down_r) / 2.0

        if brow_elevation >= self.BROW_ELEV_THRESH:
            active_indicators.append("Eyebrow elevation observed")
        if brow_furrow >= self.BROW_FURROW_THRESH:
            active_indicators.append("Eyebrow furrow observed")

        # 3. Mouth opening / jaw movement
        jaw_open = blendshapes.get("jawOpen", 0.0)
        mouth_funnel = blendshapes.get("mouthFunnel", 0.0)
        mouth_openness = max(jaw_open, mouth_funnel)

        if mouth_openness == 0.0 and pixel_landmarks is not None and len(pixel_landmarks) >= 18:
            # Inner lip vertical distance (13, 14) relative to outer lip vertical distance (0, 17)
            inner_top = pixel_landmarks[13][:2]
            inner_bot = pixel_landmarks[14][:2]
            outer_top = pixel_landmarks[0][:2]
            outer_bot = pixel_landmarks[17][:2]
            inner_h = np.linalg.norm(inner_bot - inner_top)
            outer_h = np.linalg.norm(outer_bot - outer_top)
            if outer_h > 1e-4:
                lip_sep = inner_h / outer_h
                mouth_openness = float(np.clip(lip_sep * 1.5, 0.0, 1.0))

        if mouth_openness >= self.MOUTH_OPEN_THRESH:
            active_indicators.append("Mouth opening observed")

        # 4. Eye closure / blinking
        eye_blink_l = blendshapes.get("eyeBlinkLeft", 0.0)
        eye_blink_r = blendshapes.get("eyeBlinkRight", 0.0)
        eye_closure = (eye_blink_l + eye_blink_r) / 2.0

        if eye_closure >= 0.65:
            active_indicators.append("Eyes closed / blink pattern")

        # Determine composite observable expression pattern based strictly on kinematics
        if smile_intensity >= self.SMILE_THRESH:
            primary_pattern = "Positive / Smiling Movement"
            confidence = min(0.98, smile_intensity)
        elif brow_furrow >= self.BROW_FURROW_THRESH:
            primary_pattern = "Concentration / Eyebrow Furrow"
            confidence = min(0.95, brow_furrow)
        elif brow_elevation >= self.BROW_ELEV_THRESH:
            primary_pattern = "Inquisitive / Eyebrow Elevation"
            confidence = min(0.95, brow_elevation)
        elif mouth_openness >= self.MOUTH_OPEN_THRESH:
            primary_pattern = "Vocal / Mouth Opening Movement"
            confidence = min(0.92, mouth_openness)
        elif eye_closure >= 0.65:
            primary_pattern = "Eyes Closed / Resting Phase"
            confidence = min(0.95, eye_closure)
        else:
            primary_pattern = "Attentive Neutral Baseline"
            confidence = 0.88

        return ExpressionResult(
            smile_intensity=round(float(smile_intensity), 3),
            brow_elevation=round(float(brow_elevation), 3),
            brow_furrow=round(float(brow_furrow), 3),
            mouth_openness=round(float(mouth_openness), 3),
            eye_closure=round(float(eye_closure), 3),
            primary_expression_pattern=primary_pattern,
            kinematic_confidence=round(float(confidence), 2),
            active_indicators=active_indicators,
            raw_blendshapes={k: round(v, 3) for k, v in blendshapes.items() if v > 0.05}
        )
