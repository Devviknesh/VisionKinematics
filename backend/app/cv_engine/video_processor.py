import cv2
import numpy as np
from pathlib import Path
from dataclasses import dataclass
from typing import Generator, Tuple, Optional, Dict, Any

@dataclass
class VideoMetadata:
    filename: str
    duration: float # in seconds
    fps: float
    total_frames: int
    width: int
    height: int
    resolution: str
    file_size: int
    is_valid: bool
    error_message: Optional[str] = None

class VideoProcessor:
    """
    Handles video validation, metadata extraction, frame extraction,
    and rendering preview video with landmark & pose overlays.
    """
    def __init__(self):
        pass

    @staticmethod
    def extract_metadata(video_path: Path) -> VideoMetadata:
        if not video_path.exists():
            return VideoMetadata(
                filename=video_path.name,
                duration=0.0,
                fps=0.0,
                total_frames=0,
                width=0,
                height=0,
                resolution="0x0",
                file_size=0,
                is_valid=False,
                error_message="File does not exist"
            )

        file_size = video_path.stat().st_size
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return VideoMetadata(
                filename=video_path.name,
                duration=0.0,
                fps=0.0,
                total_frames=0,
                width=0,
                height=0,
                resolution="0x0",
                file_size=file_size,
                is_valid=False,
                error_message="Could not open video file. Unsupported codec or corrupted container."
            )

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        if fps <= 0 or total_frames <= 0:
            # Fallback estimation by counting
            fps = 30.0 if fps <= 0 else fps
            duration = 0.0
        else:
            duration = float(total_frames / fps)

        cap.release()

        resolution = f"{width}x{height}"
        return VideoMetadata(
            filename=video_path.name,
            duration=round(duration, 2),
            fps=round(fps, 2),
            total_frames=total_frames,
            width=width,
            height=height,
            resolution=resolution,
            file_size=file_size,
            is_valid=True
        )

    @staticmethod
    def stream_sampled_frames(
        video_path: Path,
        sample_fps: float = 5.0
    ) -> Generator[Tuple[int, float, np.ndarray], None, None]:
        """
        Yields (frame_index, timestamp_sec, frame_bgr) at target sample rate.
        Efficient memory management: reads frame-by-frame without buffering entire video.
        """
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return

        native_fps = cap.get(cv2.CAP_PROP_FPS)
        if native_fps <= 0:
            native_fps = 30.0

        step = max(1, int(round(native_fps / sample_fps)))
        frame_idx = 0

        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                break

            if frame_idx % step == 0:
                timestamp = frame_idx / native_fps
                yield frame_idx, timestamp, frame

            frame_idx += 1

        cap.release()

    @staticmethod
    def draw_visual_overlays(
        frame: np.ndarray,
        pixel_landmarks: Optional[np.ndarray],
        head_yaw: float,
        head_pitch: float,
        head_roll: float,
        gaze_direction: str,
        rvec: Optional[np.ndarray],
        tvec: Optional[np.ndarray]
    ) -> np.ndarray:
        """
        Overlays landmark mesh and 3D head pose projection axes onto the frame.
        """
        vis_frame = frame.copy()
        h, w = vis_frame.shape[:2]

        if pixel_landmarks is not None and len(pixel_landmarks) >= 468:
            # Draw facial landmarks as subtle dots
            # Subsample landmark dots for clean professional UI
            step = 3
            for pt in pixel_landmarks[::step]:
                x, y = int(pt[0]), int(pt[1])
                cv2.circle(vis_frame, (x, y), 1, (0, 220, 180), -1)

            # Draw eye contours with brighter accent
            left_eye_indices = [33, 160, 158, 133, 153, 144]
            right_eye_indices = [362, 385, 387, 263, 373, 380]
            l_eye_poly = pixel_landmarks[left_eye_indices][:, :2].astype(np.int32)
            r_eye_poly = pixel_landmarks[right_eye_indices][:, :2].astype(np.int32)
            cv2.polylines(vis_frame, [l_eye_poly], True, (255, 200, 0), 1)
            cv2.polylines(vis_frame, [r_eye_poly], True, (255, 200, 0), 1)

            # Draw iris centers if available
            if len(pixel_landmarks) >= 478:
                l_iris = np.mean(pixel_landmarks[468:472][:, :2], axis=0).astype(int)
                r_iris = np.mean(pixel_landmarks[473:477][:, :2], axis=0).astype(int)
                cv2.circle(vis_frame, tuple(l_iris), 3, (0, 255, 255), -1)
                cv2.circle(vis_frame, tuple(r_iris), 3, (0, 255, 255), -1)

            # Draw 3D Head Pose Axes projecting from nose tip
            if rvec is not None and tvec is not None:
                focal_length = float(w)
                cam_mat = np.array([
                    [focal_length, 0, w / 2],
                    [0, focal_length, h / 2],
                    [0, 0, 1]
                ], dtype=np.float64)
                dist_coeffs = np.zeros((4, 1), dtype=np.float64)
                
                axis_length = 80.0 # mm
                axis_points = np.array([
                    (0.0, 0.0, 0.0),          # Nose tip origin
                    (axis_length, 0.0, 0.0),  # X-axis (Pitch/Roll)
                    (0.0, axis_length, 0.0),  # Y-axis
                    (0.0, 0.0, axis_length)   # Z-axis (pointing outward from face)
                ], dtype=np.float64)

                proj_pts, _ = cv2.projectPoints(axis_points, rvec, tvec, cam_mat, dist_coeffs)
                p0 = tuple(proj_pts[0].ravel().astype(int))
                px = tuple(proj_pts[1].ravel().astype(int))
                py = tuple(proj_pts[2].ravel().astype(int))
                pz = tuple(proj_pts[3].ravel().astype(int))

                cv2.line(vis_frame, p0, px, (0, 0, 255), 2) # X = Red
                cv2.line(vis_frame, p0, py, (0, 255, 0), 2) # Y = Green
                cv2.line(vis_frame, p0, pz, (255, 0, 0), 2) # Z = Blue

        # Draw HUD status overlay banner
        overlay = vis_frame.copy()
        cv2.rectangle(overlay, (15, 15), (320, 100), (15, 20, 30), -1)
        cv2.addWeighted(overlay, 0.7, vis_frame, 0.3, 0, vis_frame)

        cv2.putText(vis_frame, f"Yaw: {head_yaw:+.1f} deg | Pitch: {head_pitch:+.1f} deg",
                    (25, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 240, 200), 1, cv2.LINE_AA)
        cv2.putText(vis_frame, f"Roll: {head_roll:+.1f} deg",
                    (25, 64), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 240, 200), 1, cv2.LINE_AA)
        cv2.putText(vis_frame, f"Gaze: {gaze_direction}",
                    (25, 86), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 220, 80), 1, cv2.LINE_AA)

        return vis_frame
