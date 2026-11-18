import time
from pathlib import Path
from typing import Callable, Optional, Dict, Any, List
import cv2
import numpy as np

from app.cv_engine.face_landmarker import FaceLandmarkerWrapper
from app.cv_engine.head_pose import HeadPoseEstimator
from app.cv_engine.gaze_estimator import GazeEstimator
from app.cv_engine.expression_analyzer import ExpressionAnalyzer
from app.cv_engine.event_detector import EventDetector, DetectedEvent
from app.cv_engine.video_processor import VideoProcessor, VideoMetadata
from app.config import settings

class VideoAnalysisPipeline:
    """
    Central Video Analysis Pipeline orchestrating computer vision modules:
    Landmark Detection -> Head Pose -> Gaze Estimation -> Expression Analysis -> Event Detection.
    """
    def __init__(self, sample_fps: float = settings.DEFAULT_SAMPLE_FPS):
        self.sample_fps = sample_fps
        self.landmarker = FaceLandmarkerWrapper()
        self.pose_estimator = HeadPoseEstimator()
        self.gaze_estimator = GazeEstimator()
        self.expr_analyzer = ExpressionAnalyzer()
        self.event_detector = EventDetector()

    def run_pipeline(
        self,
        video_path: Path,
        preview_out_path: Optional[Path] = None,
        progress_callback: Optional[Callable[[float], None]] = None,
        is_cancelled: Optional[Callable[[], bool]] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end analysis on the video.
        Returns:
            {
                "metadata": VideoMetadata,
                "metrics": List[dict],
                "events": List[DetectedEvent],
                "summary": dict,
                "preview_path": Optional[str]
            }
        """
        start_time = time.time()
        self.event_detector.reset()

        metadata = VideoProcessor.extract_metadata(video_path)
        if not metadata.is_valid:
            raise ValueError(f"Invalid video file: {metadata.error_message}")

        total_sampled = max(1, int(metadata.duration * self.sample_fps))

        # Setup preview video writer if requested
        video_writer = None
        if preview_out_path is not None:
            preview_out_path.parent.mkdir(parents=True, exist_ok=True)
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            video_writer = cv2.VideoWriter(
                str(preview_out_path),
                fourcc,
                self.sample_fps,
                (metadata.width, metadata.height)
            )

        metrics_list: List[Dict[str, Any]] = []
        events_list: List[DetectedEvent] = []

        processed_count = 0
        face_detected_count = 0

        # Aggregation accumulators
        pose_counts = {"Forward-Facing": 0, "Turned Left": 0, "Turned Right": 0, "Tilted Up": 0, "Tilted Down": 0, "Lateral": 0}
        gaze_counts = {"Center": 0, "Left": 0, "Right": 0, "Up": 0, "Down": 0, "Closed": 0}
        ear_sum = 0.0
        ear_samples = 0
        smile_frames = 0
        mouth_open_frames = 0

        for frame_idx, timestamp, frame in VideoProcessor.stream_sampled_frames(video_path, self.sample_fps):
            if is_cancelled and is_cancelled():
                if video_writer:
                    video_writer.release()
                raise InterruptedError("Analysis was cancelled by user")

            processed_count += 1
            if progress_callback:
                progress = min(99.0, (processed_count / total_sampled) * 100.0)
                progress_callback(round(progress, 1))

            # 1. Landmark detection
            lm_res = self.landmarker.process_frame(frame)

            head_yaw = 0.0
            head_pitch = 0.0
            head_roll = 0.0
            head_label = "Forward-Facing"
            rvec, tvec = None, None

            gaze_dir = "Unknown"
            left_ear, right_ear, avg_ear = 0.0, 0.0, 0.0

            smile_intensity = 0.0
            brow_elevation = 0.0
            brow_furrow = 0.0
            mouth_openness = 0.0

            if lm_res.face_detected:
                face_detected_count += 1

                # 2. Head pose
                pose_res = self.pose_estimator.estimate_pose(lm_res.pixel_landmarks, frame.shape[:2])
                head_yaw = pose_res.yaw
                head_pitch = pose_res.pitch
                head_roll = pose_res.roll
                head_label = pose_res.orientation_label
                rvec = pose_res.rvec
                tvec = pose_res.tvec

                for key in pose_counts:
                    if key in head_label:
                        pose_counts[key] += 1
                if "Forward-Facing" in head_label:
                    pose_counts["Forward-Facing"] += 1

                # 3. Gaze direction
                gaze_res = self.gaze_estimator.estimate_gaze(lm_res.pixel_landmarks, head_yaw, head_pitch)
                gaze_dir = gaze_res.direction
                left_ear = gaze_res.left_ear
                right_ear = gaze_res.right_ear
                avg_ear = gaze_res.avg_ear

                gaze_counts[gaze_dir] = gaze_counts.get(gaze_dir, 0) + 1
                ear_sum += avg_ear
                ear_samples += 1

                # 4. Observable Expression Analysis
                expr_res = self.expr_analyzer.analyze(lm_res.blendshapes, lm_res.pixel_landmarks)
                smile_intensity = expr_res.smile_intensity
                brow_elevation = expr_res.brow_elevation
                brow_furrow = expr_res.brow_furrow
                mouth_openness = expr_res.mouth_openness

                if smile_intensity >= 0.35:
                    smile_frames += 1
                if mouth_openness >= 0.35:
                    mouth_open_frames += 1

                expression_dict = {
                    "smile_intensity": smile_intensity,
                    "brow_elevation": brow_elevation,
                    "brow_furrow": brow_furrow,
                    "mouth_openness": mouth_openness,
                    "primary_expression_pattern": expr_res.primary_expression_pattern,
                    "kinematic_confidence": expr_res.kinematic_confidence,
                    "active_indicators": expr_res.active_indicators
                }
            else:
                expression_dict = {}

            # 5. Event Detection
            frame_events = self.event_detector.evaluate_frame(
                timestamp=timestamp,
                face_detected=lm_res.face_detected,
                head_yaw=head_yaw,
                head_pitch=head_pitch,
                head_roll=head_roll,
                head_label=head_label,
                gaze_direction=gaze_dir,
                avg_ear=avg_ear,
                smile_intensity=smile_intensity,
                brow_elevation=brow_elevation,
                brow_furrow=brow_furrow,
                mouth_openness=mouth_openness
            )
            events_list.extend(frame_events)

            # Record metric record
            metric_record = {
                "timestamp": round(timestamp, 2),
                "face_detected": lm_res.face_detected,
                "head_yaw": head_yaw,
                "head_pitch": head_pitch,
                "head_roll": head_roll,
                "gaze_direction": gaze_dir,
                "eye_aspect_ratio": round(avg_ear, 3),
                "expression_measurements": expression_dict,
                "reliability_score": 0.95 if lm_res.face_detected else 0.0
            }
            metrics_list.append(metric_record)

            # Draw preview video if writer active
            if video_writer is not None:
                vis_frame = VideoProcessor.draw_visual_overlays(
                    frame=frame,
                    pixel_landmarks=lm_res.pixel_landmarks,
                    head_yaw=head_yaw,
                    head_pitch=head_pitch,
                    head_roll=head_roll,
                    gaze_direction=gaze_dir,
                    rvec=rvec,
                    tvec=tvec
                )
                video_writer.write(vis_frame)

        if video_writer is not None:
            video_writer.release()

        # Compute summary statistics
        total_f = max(1, processed_count)
        face_track_ratio = round((face_detected_count / total_f) * 100.0, 1)
        mean_ear = round(ear_sum / max(1, ear_samples), 3)

        # Convert counts to percentages
        det_f = max(1, face_detected_count)
        head_pose_pct = {k: round((v / det_f) * 100.0, 1) for k, v in pose_counts.items()}
        gaze_pct = {k: round((v / det_f) * 100.0, 1) for k, v in gaze_counts.items()}

        # Category event counts
        cat_counts = {}
        for ev in events_list:
            cat_counts[ev.event_category] = cat_counts.get(ev.event_category, 0) + 1

        summary_statistics = {
            "total_frames_analyzed": processed_count,
            "face_tracking_percentage": face_track_ratio,
            "head_pose_distribution": head_pose_pct,
            "gaze_distribution": gaze_pct,
            "mean_eye_aspect_ratio": mean_ear,
            "smile_frames_ratio": round((smile_frames / det_f) * 100.0, 1),
            "mouth_open_frames_ratio": round((mouth_open_frames / det_f) * 100.0, 1),
            "event_category_counts": cat_counts,
            "total_events_detected": len(events_list),
            "processing_duration_sec": round(time.time() - start_time, 2)
        }

        if progress_callback:
            progress_callback(100.0)

        return {
            "metadata": metadata,
            "metrics": metrics_list,
            "events": events_list,
            "summary": summary_statistics,
            "preview_path": str(preview_out_path) if preview_out_path and preview_out_path.exists() else None
        }
