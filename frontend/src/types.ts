export interface User {
  id: string;
  name: string;
  email: string;
  preferences?: {
    default_sample_fps?: number;
    head_pose_sensitivity?: 'low' | 'normal' | 'high';
    auto_hud_overlay?: boolean;
    gaze_calibration_mode?: 'standard' | 'relaxed';
    [key: string]: any;
  };
  created_at: string;
}

export interface VideoItem {
  id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  preview_path?: string | null;
  duration: number;
  fps: number;
  resolution: string;
  file_size: number;
  upload_status: string;
  created_at: string;
  active_session_id?: string | null;
  session_status?: 'none' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
}

export interface FacialMetric {
  id: number;
  session_id: string;
  timestamp: number;
  face_detected: boolean;
  head_yaw: number;
  head_pitch: number;
  head_roll: number;
  gaze_direction: 'Center' | 'Left' | 'Right' | 'Up' | 'Down' | 'Closed' | 'Unknown';
  eye_aspect_ratio: number;
  expression_measurements?: {
    smile_intensity?: number;
    brow_elevation?: number;
    brow_furrow?: number;
    mouth_openness?: number;
    active_indicators?: string[];
  } | null;
  reliability_score: number;
}

export interface AnalysisEvent {
  id: string;
  session_id: string;
  timestamp: number;
  event_category: 'head_movement' | 'gaze' | 'expression' | 'tracking';
  event_type: string;
  event_description: string;
  event_value?: any;
  reliability_score: number;
}

export interface SummaryStatistics {
  total_frames_analyzed: number;
  face_tracking_percentage: number;
  head_pose_distribution: {
    'Forward-Facing'?: number;
    'Turned Left'?: number;
    'Turned Right'?: number;
    'Tilted Up'?: number;
    'Tilted Down'?: number;
    Lateral?: number;
    [key: string]: number | undefined;
  };
  gaze_distribution: {
    Center?: number;
    Left?: number;
    Right?: number;
    Up?: number;
    Down?: number;
    Closed?: number;
    [key: string]: number | undefined;
  };
  mean_eye_aspect_ratio: number;
  smile_frames_ratio: number;
  mouth_open_frames_ratio: number;
  event_category_counts: {
    head_movement?: number;
    gaze?: number;
    expression?: number;
    tracking?: number;
    [key: string]: number | undefined;
  };
  total_events_detected: number;
  processing_duration_sec: number;
}

export interface AnalysisSession {
  id: string;
  video_id: string;
  video_filename?: string;
  video_duration?: number;
  preview_path?: string | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  started_at?: string | null;
  completed_at?: string | null;
  processing_duration: number;
  summary_stats?: SummaryStatistics | null;
  error_message?: string | null;
  metrics_count?: number;
  events_count?: number;
}

export interface AnalysisResults {
  session: AnalysisSession;
  summary_statistics: SummaryStatistics;
  timeline_metrics: FacialMetric[];
  events: AnalysisEvent[];
}

export interface ComparisonMetric {
  category: string;
  metric: string;
  unit: string;
  session_a: number;
  session_b: number;
  diff: number;
}

export interface ComparisonRadarItem {
  subject: string;
  A: number;
  B: number;
  fullMark: number;
}

export interface SessionComparisonResponse {
  session_a: {
    id: string;
    video_id: string;
    video_filename: string;
    duration: number;
    created_at?: string;
    processing_status: string;
  };
  session_b: {
    id: string;
    video_id: string;
    video_filename: string;
    duration: number;
    created_at?: string;
    processing_status: string;
  };
  comparison_metrics: ComparisonMetric[];
  radar_data: ComparisonRadarItem[];
  disclaimer: string;
}
