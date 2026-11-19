import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileCheck, 
  Film, 
  ScanFace, 
  Grid3X3, 
  Crosshair, 
  Compass, 
  Eye, 
  Smile, 
  Database, 
  MonitorPlay, 
  FileText,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Code,
  Info,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface StageInfo {
  id: string;
  stepNumber: string;
  name: string;
  shortTag: string;
  icon: React.ElementType;
  tech: string;
  color: string;
  whatHappens: string;
  inputData: string;
  outputData: string;
  whyNecessary: string;
  codeSnippet?: string;
}

const PIPELINE_STAGES: StageInfo[] = [
  {
    id: 'upload',
    stepNumber: '01',
    name: 'Video Upload',
    shortTag: 'Streaming Ingestion',
    icon: UploadCloud,
    tech: 'FastAPI / Multipart HTTP Stream',
    color: 'violet',
    whatHappens: 'Client streams video file in 1MB sequential chunks directly to secure backend storage, verifying file size and quota in real-time.',
    inputData: 'Raw client video bytes (MP4 / AVI / MOV / WebM) via multipart/form-data upload.',
    outputData: 'Persisted local storage file path with sanitized unique UUID-stamped filename.',
    whyNecessary: 'Prevents server RAM exhaustion when handling high-resolution video recordings by streaming directly to disk.',
    codeSnippet: 'with open(storage_path, "wb") as buffer:\n    while chunk := await file.read(1024 * 1024):\n        buffer.write(chunk)'
  },
  {
    id: 'validation',
    stepNumber: '02',
    name: 'Video Validation',
    shortTag: 'Container Integrity',
    icon: FileCheck,
    tech: 'OpenCV cv2.VideoCapture',
    color: 'violet',
    whatHappens: 'OpenCV inspects container headers, reads video metadata, verifies frame decoding, and validates duration against SaaS platform thresholds (<= 300s).',
    inputData: 'Raw storage path on disk.',
    outputData: 'VideoMetadata object: { is_valid: bool, duration: float, fps: float, resolution: "1280x720", total_frames: int }.',
    whyNecessary: 'Rejects truncated, corrupt, or weaponized container bytes before compute resources are allocated to neural inference.',
    codeSnippet: 'cap = cv2.VideoCapture(str(video_path))\nis_valid = cap.isOpened() and cap.get(cv2.CAP_PROP_FRAME_COUNT) > 0'
  },
  {
    id: 'extraction',
    stepNumber: '03',
    name: 'Frame Extraction',
    shortTag: 'Temporal Decimation',
    icon: Film,
    tech: 'OpenCV Frame Stepping',
    color: 'sky',
    whatHappens: 'Decimates original video timeline down to a standardized uniform sampling rate (e.g. 5.0 FPS) to balance dense temporal resolution with real-time inference latency.',
    inputData: 'Video stream decoded frame by frame.',
    outputData: 'Raw BGR OpenCV uint8 image matrices at exact millisecond timestamps.',
    whyNecessary: 'Processing 60 FPS full-frame video is redundant for cranial kinematics; uniform decimation achieves 12x compute optimization.',
    codeSnippet: 'frame_step = max(1, int(round(native_fps / sample_fps)))\nif frame_idx % frame_step == 0:\n    process_frame(frame, timestamp)'
  },
  {
    id: 'landmarker',
    stepNumber: '04',
    name: 'MediaPipe FaceLandmarker',
    shortTag: 'Neural Inference',
    icon: ScanFace,
    tech: 'MediaPipe Tasks Vision API (CPU/GPU)',
    color: 'sky',
    whatHappens: 'Runs a two-stage cascaded neural pipeline: BlazeFace detects the facial bounding box, then a deep 3D mesh regressor predicts dense metric facial geometry.',
    inputData: 'RGB numpy frame converted from OpenCV BGR format.',
    outputData: 'FaceLandmarkerResult containing 478 normalized 3D landmarks and 52 facial blendshapes.',
    whyNecessary: 'Delivers sub-millisecond CPU inference per frame with robust invariance to lighting, occlusion, and head orientation.',
    codeSnippet: 'mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)\nresult = detector.detect_for_video(mp_image, timestamp_ms)'
  },
  {
    id: 'landmarks-478',
    stepNumber: '05',
    name: '478 Facial Landmarks',
    shortTag: 'Dense 3D Coordinates',
    icon: Grid3X3,
    tech: '3D Metric Coordinate System',
    color: 'emerald',
    whatHappens: 'Extracts 478 metric points spanning the facial oval (36 points), left/right eyes (16 points each), lips (40 points), eyebrows, and dedicated iris centers (points 468 & 473).',
    inputData: 'Raw normalized landmark floats [x: 0..1, y: 0..1, z: relative depth].',
    outputData: 'Scaled pixel coordinates (u, v) and normalized spatial vectors.',
    whyNecessary: 'Provides the dense anthropometric grounding required for both 3D pose alignment and fine-grained facial kinematics.',
    codeSnippet: 'canonical_pts = {\n  "nose": landmarks[1],\n  "chin": landmarks[152],\n  "left_eye": landmarks[33],\n  "right_eye": landmarks[263]\n}'
  },
  {
    id: 'solvepnp',
    stepNumber: '06',
    name: 'OpenCV solvePnP',
    shortTag: 'Pinhole Camera Solver',
    icon: Crosshair,
    tech: 'cv2.solvePnP (Levenberg-Marquardt)',
    color: 'emerald',
    whatHappens: 'Solves the Perspective-n-Point pose estimation problem by minimizing reprojection error between a 3D canonical anthropometric face model and detected 2D frame landmarks.',
    inputData: '6 key 3D model vertices (mm) and corresponding 2D image coordinates (px) + estimated camera intrinsic matrix K.',
    outputData: 'Rotation vector rvec (3x1) and translation vector tvec (3x1).',
    whyNecessary: 'Establishes true 3D spatial transformation between subject face frame and camera optical sensor without requiring stereo depth sensors.',
    codeSnippet: 'success, rvec, tvec = cv2.solvePnP(\n    model_points_3d, image_points_2d, cam_matrix, dist_coeffs,\n    flags=cv2.SOLVEPNP_ITERATIVE\n)'
  },
  {
    id: 'pose-angles',
    stepNumber: '07',
    name: 'Head Pose Estimation',
    shortTag: 'Euler Decomposition',
    icon: Compass,
    tech: 'Rodrigues Matrix & Euler Math',
    color: 'violet',
    whatHappens: 'Transforms the rotation vector rvec via Rodrigues formula into a 3x3 orthonormal matrix, decomposing it into continuous Yaw (turn), Pitch (tilt), and Roll (incline) angles in degrees.',
    inputData: 'Rotation vector rvec from solvePnP.',
    outputData: 'Normalized Euler angles: Yaw (-180°..+180°), Pitch (-180°..+180°), Roll (-180°..+180°).',
    whyNecessary: 'Euler angles quantify subject attention direction, visual focus stability, and orientation bias over time.',
    codeSnippet: 'R, _ = cv2.Rodrigues(rvec)\npitch = math.degrees(math.atan2(-R[2, 1], R[2, 2]))\nyaw = math.degrees(math.atan2(R[2, 0], math.sqrt(R[0, 0]**2 + R[1, 0]**2)))\nroll = math.degrees(math.atan2(R[1, 0], R[0, 0]))'
  },
  {
    id: 'ear-gaze',
    stepNumber: '08',
    name: 'EAR & Gaze Estimation',
    shortTag: 'Ocular Kinematics',
    icon: Eye,
    tech: 'Soukupová & Čech EAR + Iris Vectors',
    color: 'sky',
    whatHappens: 'Calculates the Eye Aspect Ratio (EAR) across 6 eyelid landmarks per eye. Compares iris centroid positions (landmarks 468, 473) relative to medial and lateral canthi to classify gaze direction.',
    inputData: 'Ocular landmark subsets (eyelid boundaries and iris center coordinates).',
    outputData: 'Continuous EAR scalar (0.15-0.38) and discrete Gaze Direction ("Center", "Left", "Right", "Up", "Down", "Closed").',
    whyNecessary: 'Detects natural palpebral blinks (EAR < 0.20) and identifies sustained gaze aversion or ocular focus.',
    codeSnippet: 'EAR = (||p2 - p6|| + ||p3 - p5||) / (2.0 * ||p1 - p4||)\nis_blink = EAR < 0.20'
  },
  {
    id: 'facs-kinematics',
    stepNumber: '09',
    name: 'Facial Kinematics',
    shortTag: 'FACS Action Units',
    icon: Smile,
    tech: 'MediaPipe Blendshapes + Normalized Displacement',
    color: 'violet',
    whatHappens: 'Measures observable muscular displacements grounded in the Facial Action Coding System: AU12 (Lip Corner Puller), AU1+2 (Brow Elevation), AU4 (Brow Furrow), AU25+26 (Jaw Separation), AU45 (Eye Closure).',
    inputData: '52 classification blendshapes and normalized landmark Euclidean displacement vectors.',
    outputData: 'FACS Action Unit activation percentages (0-100%) and intensity magnitudes.',
    whyNecessary: 'Provides objective geometric measurement of facial expressivity without making unscientific claims regarding psychological emotion or intent.',
    codeSnippet: 'au12_smile = blendshapes.get("mouthSmileLeft", 0.0) + blendshapes.get("mouthSmileRight", 0.0)\nau45_blink = max(0.0, min(1.0, (0.32 - EAR) / 0.16))'
  },
  {
    id: 'persistence',
    stepNumber: '10',
    name: 'PostgreSQL Persistence',
    shortTag: 'Relational Schema',
    icon: Database,
    tech: 'SQLAlchemy ORM + PostgreSQL / SQLite',
    color: 'emerald',
    whatHappens: 'Aggregates timeline metrics, serializes summary statistics, and records timestamped event occurrences (such as prolonged gaze aversion, smiles, blinks) into indexed relational tables.',
    inputData: 'List of FacialMetric dictionaries, summary dictionaries, and DetectedEvent objects.',
    outputData: 'Persisted rows in analysis_sessions, facial_metrics, and analysis_events tables.',
    whyNecessary: 'Enables instant timeline querying, session comparison, and programmatic report generation without re-running compute-heavy computer vision pipelines.',
    codeSnippet: 'db.bulk_insert_mappings(FacialMetric, metrics_list)\nsession.summary_stats = summary_dict\ndb.commit()'
  },
  {
    id: 'workspace',
    stepNumber: '11',
    name: 'Interactive Workspace',
    shortTag: 'Synchronized Web UI',
    icon: MonitorPlay,
    tech: 'React 18 + HTML5 Video + Canvas + Recharts',
    color: 'violet',
    whatHappens: 'Frontend synchronizes video playback with frame-accurate 478 landmark wireframe rendering, continuous Euler waveform scrubber, and FACS Action Unit gauges.',
    inputData: 'Authenticated JSON telemetry stream + short-lived video streaming ticket.',
    outputData: 'Interactive, responsive UI allowing click-to-seek, scrubbing, and speed adjustments.',
    whyNecessary: 'Empowers engineers, researchers, and recruiters to inspect the exact spatial and temporal alignment of raw video frames and extracted computer vision metrics.',
    codeSnippet: 'const currentMetric = useMemo(() => {\n  return metrics.find(m => Math.abs(m.timestamp - currentTime) < 0.1);\n}, [metrics, currentTime]);'
  },
  {
    id: 'pdf-report',
    stepNumber: '12',
    name: 'Research-Grade PDF Report',
    shortTag: 'Academic Dossier',
    icon: FileText,
    tech: 'ReportLab + Matplotlib Headless Engine',
    color: 'violet',
    whatHappens: 'Generates a publication-quality 4-page academic dossier featuring Matplotlib vector time series plots, real video frames with MediaPipe wireframe overlays, event logs, and FACS delimitation disclaimers.',
    inputData: 'Relational session records, metrics, and source video file.',
    outputData: 'Dynamic multi-page PDF document served with Content-Disposition headers.',
    whyNecessary: 'Provides formal, shareable documentation suitable for clinical, academic, and executive non-verbal communication analysis.',
    codeSnippet: 'doc.build(story, canvasmaker=NumberedCanvas)\nreturn FileResponse(pdf_path, media_type="application/pdf")'
  }
];

export const PipelineExplainer: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(3); // Default to MediaPipe FaceLandmarker
  const stage = PIPELINE_STAGES[activeStageIndex];

  return (
    <div className="w-full bg-[#101116] border border-[#1E1E2A] rounded-3xl p-4 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#1E1E2A]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono font-medium">
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Architecture Explainer</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F7] mt-2">
            12-Stage Computer Vision &amp; Data Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl">
            Click through any stage below to examine its internal algorithmic operation, technology stack, data contract, and engineering rationale.
          </p>
        </div>

        {/* Stage Navigation Arrows */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setActiveStageIndex((prev) => (prev > 0 ? prev - 1 : PIPELINE_STAGES.length - 1))}
            className="p-2 rounded-xl bg-[#14151B] hover:bg-[#1E1E2A] text-[#A1A1AA] hover:text-[#F5F5F7] border border-[#1E1E2A] transition"
            title="Previous Stage"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-[#A1A1AA] px-1">
            {activeStageIndex + 1} / {PIPELINE_STAGES.length}
          </span>
          <button
            onClick={() => setActiveStageIndex((prev) => (prev < PIPELINE_STAGES.length - 1 ? prev + 1 : 0))}
            className="p-2 rounded-xl bg-[#14151B] hover:bg-[#1E1E2A] text-[#A1A1AA] hover:text-[#F5F5F7] border border-[#1E1E2A] transition"
            title="Next Stage"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Stage Ribbon */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#1E1E2A]">
        <div className="flex items-center gap-2 min-w-max">
          {PIPELINE_STAGES.map((s, idx) => {
            const Icon = s.icon;
            const isActive = idx === activeStageIndex;
            return (
              <React.Fragment key={s.id}>
                <button
                  onClick={() => setActiveStageIndex(idx)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                    isActive
                      ? 'bg-violet-500/15 border-violet-500/60 text-violet-300 shadow-md shadow-violet-500/10'
                      : 'bg-[#08090C] border-[#1E1E2A] text-[#A1A1AA] hover:text-[#F5F5F7] hover:border-[#2A2A3A]'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-violet-400' : 'text-[#A1A1AA]/60'}`}>
                    {s.stepNumber}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-400' : 'text-[#A1A1AA]'}`} />
                  <span className="text-xs font-medium whitespace-nowrap">{s.name}</span>
                </button>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-[#1E1E2A] shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Deep-Dive Stage Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 sm:p-6 rounded-2xl bg-[#08090C] border border-[#1E1E2A]">
        {/* Left Column: Stage Overview & Mechanics (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400">
                {React.createElement(stage.icon, { className: 'w-6 h-6' })}
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-wider">
                  Stage {stage.stepNumber} &bull; {stage.shortTag}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#F5F5F7] mt-0.5">
                  {stage.name}
                </h3>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#101116] border border-[#1E1E2A] text-[11px] font-mono text-sky-400">
              {stage.tech}
            </span>
          </div>

          {/* What Happens */}
          <div className="space-y-1.5 pt-2">
            <h4 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-violet-400" />
              <span>What Happens at this Stage</span>
            </h4>
            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
              {stage.whatHappens}
            </p>
          </div>

          {/* Why Necessary */}
          <div className="space-y-1.5 pt-2">
            <h4 className="text-xs font-bold text-[#F5F5F7] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Why This Stage is Necessary</span>
            </h4>
            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
              {stage.whyNecessary}
            </p>
          </div>
        </div>

        {/* Right Column: Data Contracts & Implementation (5 cols) */}
        <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Input Data */}
            <div className="p-3 rounded-xl bg-[#101116] border border-[#1E1E2A] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-bold block">
                Input Data Contract
              </span>
              <p className="text-xs text-[#F5F5F7] font-mono">
                {stage.inputData}
              </p>
            </div>

            {/* Output Data */}
            <div className="p-3 rounded-xl bg-[#101116] border border-[#1E1E2A] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400 font-bold block">
                Output Data Contract
              </span>
              <p className="text-xs text-[#F5F5F7] font-mono">
                {stage.outputData}
              </p>
            </div>
          </div>

          {/* Code Implementation Preview */}
          {stage.codeSnippet && (
            <div className="p-3 rounded-xl bg-[#08090C] border border-[#1E1E2A] font-mono text-[11px] text-[#F5F5F7] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-[#A1A1AA] pb-1 border-b border-[#1E1E2A]">
                <span className="flex items-center gap-1">
                  <Code className="w-3 h-3 text-sky-400" />
                  <span>Python / Implementation Logic</span>
                </span>
                <span className="text-[#A1A1AA]/60">Production Code</span>
              </div>
              <pre className="overflow-x-auto text-sky-300 whitespace-pre py-1">
                {stage.codeSnippet}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
