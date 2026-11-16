import uuid
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

@dataclass
class DetectedEvent:
    id: str
    timestamp: float # in seconds
    event_category: str # "head_movement", "gaze", "expression", "tracking"
    event_type: str # e.g. "HEAD_TURNED_LEFT", "SMILE_DETECTED"
    event_description: str
    event_value: Dict[str, Any]
    reliability_score: float = 0.95

class EventDetector:
    """
    Stateful temporal event detector. Combines head pose, gaze, expressions,
    and tracking metrics over time. Uses hysteresis and temporal debounce to
    prevent duplicate noisy triggers.
    """
    def __init__(self, debounce_sec: float = 0.8):
        self.debounce_sec = debounce_sec
        # State tracking
        self.last_event_time: Dict[str, float] = {}
        self.last_head_orientation: str = "Forward-Facing"
        self.last_gaze_direction: str = "Center"
        self.face_previously_detected: bool = True
        self.smile_active: bool = False
        self.brow_active: bool = False
        self.mouth_active: bool = False

    def reset(self):
        self.last_event_time.clear()
        self.last_head_orientation = "Forward-Facing"
        self.last_gaze_direction = "Center"
        self.face_previously_detected = True
        self.smile_active = False
        self.brow_active = False
        self.mouth_active = False

    def _can_fire(self, event_key: str, timestamp: float) -> bool:
        last_time = self.last_event_time.get(event_key, -999.0)
        if timestamp - last_time >= self.debounce_sec:
            self.last_event_time[event_key] = timestamp
            return True
        return False

    def evaluate_frame(
        self,
        timestamp: float,
        face_detected: bool,
        head_yaw: float = 0.0,
        head_pitch: float = 0.0,
        head_roll: float = 0.0,
        head_label: str = "Forward-Facing",
        gaze_direction: str = "Center",
        avg_ear: float = 0.3,
        smile_intensity: float = 0.0,
        brow_elevation: float = 0.0,
        brow_furrow: float = 0.0,
        mouth_openness: float = 0.0,
    ) -> List[DetectedEvent]:
        events: List[DetectedEvent] = []

        # 1. Face tracking continuity
        if not face_detected:
            if self.face_previously_detected:
                if self._can_fire("face_lost", timestamp):
                    events.append(DetectedEvent(
                        id=str(uuid.uuid4()),
                        timestamp=round(timestamp, 2),
                        event_category="tracking",
                        event_type="FACE_TEMPORARILY_LOST",
                        event_description="Subject face temporarily out of frame or obscured",
                        event_value={"face_detected": False},
                        reliability_score=0.98
                    ))
            self.face_previously_detected = False
            return events
        else:
            if not self.face_previously_detected:
                if self._can_fire("face_recovered", timestamp):
                    events.append(DetectedEvent(
                        id=str(uuid.uuid4()),
                        timestamp=round(timestamp, 2),
                        event_category="tracking",
                        event_type="FACE_TRACKED",
                        event_description="Subject face acquired in video frame",
                        event_value={"face_detected": True},
                        reliability_score=0.98
                    ))
            self.face_previously_detected = True

        # 2. Head Movement Events
        if "Turned Left" in head_label and "Turned Left" not in self.last_head_orientation:
            if self._can_fire("head_left", timestamp):
                events.append(DetectedEvent(
                    id=str(uuid.uuid4()),
                    timestamp=round(timestamp, 2),
                    event_category="head_movement",
                    event_type="HEAD_TURNED_LEFT",
                    event_description=f"Observable head turn leftward (Yaw: {round(head_yaw, 1)}°)",
                    event_value={"yaw": round(head_yaw, 1), "orientation": head_label},
                    reliability_score=0.92
                ))
        elif "Turned Right" in head_label and "Turned Right" not in self.last_head_orientation:
            if self._can_fire("head_right", timestamp):
                events.append(DetectedEvent(
                    id=str(uuid.uuid4()),
                    timestamp=round(timestamp, 2),
                    event_category="head_movement",
                    event_type="HEAD_TURNED_RIGHT",
                    event_description=f"Observable head turn rightward (Yaw: {round(head_yaw, 1)}°)",
                    event_value={"yaw": round(head_yaw, 1), "orientation": head_label},
                    reliability_score=0.92
                ))

        if "Tilted Up" in head_label and "Tilted Up" not in self.last_head_orientation:
            if self._can_fire("head_up", timestamp):
                events.append(DetectedEvent(
                    id=str(uuid.uuid4()),
                    timestamp=round(timestamp, 2),
                    event_category="head_movement",
                    event_type="HEAD_TILTED_UP",
                    event_description=f"Observable upward head tilt (Pitch: {round(head_pitch, 1)}°)",
                    event_value={"pitch": round(head_pitch, 1), "orientation": head_label},
                    reliability_score=0.90
                ))
        elif "Tilted Down" in head_label and "Tilted Down" not in self.last_head_orientation:
            if self._can_fire("head_down", timestamp):
                events.append(DetectedEvent(
                    id=str(uuid.uuid4()),
                    timestamp=round(timestamp, 2),
                    event_category="head_movement",
                    event_type="HEAD_TILTED_DOWN",
                    event_description=f"Observable downward head tilt (Pitch: {round(head_pitch, 1)}°)",
                    event_value={"pitch": round(head_pitch, 1), "orientation": head_label},
                    reliability_score=0.90
                ))

        self.last_head_orientation = head_label

        # 3. Gaze Direction Events
        if gaze_direction != "Closed" and gaze_direction != "Unknown":
            if gaze_direction != self.last_gaze_direction and gaze_direction != "Center":
                if self._can_fire(f"gaze_{gaze_direction.lower()}", timestamp):
                    events.append(DetectedEvent(
                        id=str(uuid.uuid4()),
                        timestamp=round(timestamp, 2),
                        event_category="gaze",
                        event_type=f"GAZE_DIRECTION_{gaze_direction.upper()}",
                        event_description=f"Approximate gaze direction shifted {gaze_direction.lower()}",
                        event_value={"direction": gaze_direction},
                        reliability_score=0.85
                    ))
            elif gaze_direction == "Center" and self.last_gaze_direction not in ["Center", "Unknown", "Closed"]:
                if self._can_fire("gaze_center", timestamp):
                    events.append(DetectedEvent(
                        id=str(uuid.uuid4()),
                        timestamp=round(timestamp, 2),
                        event_category="gaze",
                        event_type="GAZE_DIRECTION_CENTER",
                        event_description="Approximate gaze returned to forward/center position",
                        event_value={"direction": "Center"},
                        reliability_score=0.88
                    ))
            self.last_gaze_direction = gaze_direction

        # 4. Expression Observations
        # Smile
        if smile_intensity >= 0.35:
            if not self.smile_active:
                if self._can_fire("smile", timestamp):
                    events.append(DetectedEvent(
                        id=str(uuid.uuid4()),
                        timestamp=round(timestamp, 2),
                        event_category="expression",
                        event_type="SMILE_INDICATOR_DETECTED",
                        event_description=f"Smile-related facial movement detected (intensity: {int(smile_intensity*100)}%)",
                        event_value={"intensity": round(smile_intensity, 2)},
                        reliability_score=0.92
                    ))
                self.smile_active = True
        else:
            if smile_intensity < 0.20:
                self.smile_active = False

        # Eyebrows
        if brow_elevation >= 0.35:
            if not self.brow_active:
                if self._can_fire("brow_raise", timestamp):
                    events.append(DetectedEvent(
                        id=str(uuid.uuid4()),
                        timestamp=round(timestamp, 2),
                        event_category="expression",
                        event_type="EYEBROW_ELEVATION_DETECTED",
                        event_description="Eyebrow elevation pattern observed",
                        event_value={"elevation": round(brow_elevation, 2)},
                        reliability_score=0.88
                    ))
                self.brow_active = True
        elif brow_furrow >= 0.35:
            if not self.brow_active:
                if self._can_fire("brow_furrow", timestamp):
                    events.append(DetectedEvent(
                        id=str(uuid.uuid4()),
                        timestamp=round(timestamp, 2),
                        event_category="expression",
                        event_type="EYEBROW_FURROW_DETECTED",
                        event_description="Eyebrow furrowing pattern observed",
                        event_value={"furrow": round(brow_furrow, 2)},
                        reliability_score=0.88
                    ))
                self.brow_active = True
        else:
            if brow_elevation < 0.20 and brow_furrow < 0.20:
                self.brow_active = False

        # Mouth Opening
        if mouth_openness >= 0.35:
            if not self.mouth_active:
                if self._can_fire("mouth_open", timestamp):
                    events.append(DetectedEvent(
                        id=str(uuid.uuid4()),
                        timestamp=round(timestamp, 2),
                        event_category="expression",
                        event_type="MOUTH_OPENING_OBSERVED",
                        event_description=f"Mouth opening / jaw separation observed ({int(mouth_openness*100)}%)",
                        event_value={"openness": round(mouth_openness, 2)},
                        reliability_score=0.90
                    ))
                self.mouth_active = True
        else:
            if mouth_openness < 0.20:
                self.mouth_active = False

        # Eye closure / Blinking
        if avg_ear < 0.18:
            if self._can_fire("eye_blink", timestamp):
                events.append(DetectedEvent(
                    id=str(uuid.uuid4()),
                    timestamp=round(timestamp, 2),
                    event_category="expression",
                    event_type="EYE_CLOSURE_OBSERVED",
                    event_description="Eye closure / blink pattern observed",
                    event_value={"avg_ear": round(avg_ear, 3)},
                    reliability_score=0.92
                ))

        return events
