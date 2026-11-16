# AI-Powered Video Analysis and Non-Verbal Communication Analyzer

A production-grade, genuine computer vision web platform that processes recorded videos to extract observable 3D facial landmarks, head pose orientation, approximate gaze direction, and surface facial-expression kinematics—orchestrated through FastAPI and React.

---

## 1. System Architecture

```
[ Recorded Video Input (MP4, MOV, AVI, WebM) ]
                     │
                     ▼
  ┌──────────────────────────────────────────────────┐
  │         Computer Vision Processing Engine        │
  │  ──────────────────────────────────────────────  │
  │  1. Video Stream & Frame Sampler (OpenCV)        │
  │  2. MediaPipe Face Landmarker (478 3D Mesh)      │
  │  3. Head Pose solvePnP (Yaw, Pitch, Roll)        │
  │  4. Approximate Gaze Estimator (EAR & Iris)      │
  │  5. Observable Expression Analyzer (Blendshapes) │
  │  6. Temporal Event Detector (Debounced Shifts)   │
  └──────────────────────────────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────────┐
  │             FastAPI Backend Service              │
  │  ──────────────────────────────────────────────  │
  │  • Asynchronous Background Task Queue            │
  │  • SQLAlchemy ORM (PostgreSQL / SQLite)          │
  │  • JWT Authentication & User Isolation           │
  │  • Video Streaming (Byte-range seek support)     │
  │  • PDF Executive Report Generator (ReportLab)    │
  └──────────────────────────────────────────────────┘
                     │
                     ▼
  ┌──────────────────────────────────────────────────┐
  │        React + TypeScript Modern Dashboard       │
  │  ──────────────────────────────────────────────  │
  │  • Synchronized Video Player & Seek Timeline     │
  │  • Live 3D Pose, Gaze, & Expression Gauges       │
  │  • Interactive Event Markers & Seek Action       │
  │  • Recharts Visualizations & Analytics           │
  │  • In-Browser PDF Report Preview & Download      │
  └──────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Computer Vision & AI
- **Python 3.11**
- **MediaPipe 1.2+**: Face Landmarker task with 478 3D landmarks and facial blendshapes.
- **OpenCV (cv2)**: Video streaming, frame extraction, `cv2.solvePnP` head pose projection, preview video rendering.
- **NumPy & SciPy**: Vector kinematics, Euler angles transformation, Eye Aspect Ratio (EAR) calculations.
- **ReportLab**: Programmatic PDF report generation.

### Backend
- **FastAPI**: Asynchronous high-performance REST API.
- **SQLAlchemy 2.0**: Relational ORM with connection pooling.
- **Alembic**: Database migrations.
- **PostgreSQL / SQLite**: Default zero-dependency local SQLite with seamless PostgreSQL production config.
- **Pydantic v2**: Strict schema validation.
- **PyJWT & Bcrypt**: Password hashing and JWT session management.

### Frontend
- **React 18 + TypeScript**
- **Vite**: Ultra-fast build and development tooling.
- **Tailwind CSS**: Dark modern charcoal/navy design system with cyan & emerald accents.
- **Recharts**: Interactive charting (pie, line, bar charts).
- **Lucide React**: Clean icons.

---

## 3. Computer Vision Modules & Algorithms

### Module 1: Video Processing & Validation (`video_processor.py`)
- Reads videos frame-by-frame using `cv2.VideoCapture` to prevent memory blowup.
- Extracts duration, native FPS, frame counts, and resolution.
- Samples frames at configurable rates (`DEFAULT_SAMPLE_FPS = 5.0`).
- Renders annotated preview video with 3D projection axes and landmark mesh overlay.

### Module 2: Facial Landmark Detection (`face_landmarker.py`)
- Employs MediaPipe's Face Landmarker task running on local CPU.
- Extracts 478 points in both normalized and pixel coordinates.
- Partitions landmark indices into left/right eye contours, irises, eyebrows, nose bridge, lips, and silhouette.
- Gracefully handles missing face frames without crashing or corrupting data.

### Module 3: 3D Head Pose Estimation (`head_pose.py`)
- Uses 3D anthropometric face model coordinates:
  - Nose tip: `(0.0, 0.0, 0.0)`
  - Chin: `(0.0, -330.0, -65.0)`
  - Left eye outer: `(-225.0, 170.0, -135.0)`
  - Right eye outer: `(225.0, 170.0, -135.0)`
  - Left mouth corner: `(-150.0, -150.0, -125.0)`
  - Right mouth corner: `(150.0, -150.0, -125.0)`
- Solves using `cv2.solvePnP` with iterative Levenberg-Marquardt optimization.
- Converts rotation vector to matrix (`cv2.Rodrigues`) and extracts Euler angles:
  - **Yaw**: Leftward (< -12°) / Rightward (> +12°) rotation.
  - **Pitch**: Downward (< -10°) / Upward (> +10°) tilt.
  - **Roll**: Lateral tilt (< -12° / > +12°).
- Explicit scientific label: Reports physical orientation, distinguishing estimated orientation from psychological attention.

### Module 4: Approximate Gaze Direction (`gaze_estimator.py`)
- Computes Eye Aspect Ratio (EAR):
  $$EAR = \frac{||p_2 - p_6|| + ||p_3 - p_5||}{2 \times ||p_1 - p_4||}$$
- Detects blinks and eye closure when EAR < 0.20.
- Estimates horizontal and vertical iris displacement within eye contours with head yaw/pitch compensation.
- Classifies into: `Center`, `Left`, `Right`, `Up`, `Down`, `Closed`.

### Module 5: Observable Expression Kinematics (`expression_analyzer.py`)
- Evaluates surface blendshape activations and geometric ratios:
  - Smile-related movement: mouth corner retraction & elevation.
  - Eyebrow movements: elevation (`browInnerUp`) vs furrow (`browDown`).
  - Mouth / jaw separation: vertical lip distance.
- Strictly adheres to scientific boundaries: displays observable indicators rather than claiming emotion classification.

### Module 6: Debounced Event Detection (`event_detector.py`)
- Detects discrete visual events:
  - `HEAD_TURNED_LEFT`, `HEAD_TURNED_RIGHT`
  - `HEAD_TILTED_UP`, `HEAD_TILTED_DOWN`
  - `GAZE_DIRECTION_CHANGED`
  - `SMILE_INDICATOR_DETECTED`
  - `EYE_CLOSURE_OBSERVED`
  - `MOUTH_OPENING_OBSERVED`
  - `FACE_TEMPORARILY_LOST`
- Applies temporal debounce (minimum 0.6s) to eliminate noise.

---

## 4. Database Schema

- **`users`**: `id`, `name`, `email`, `password_hash`, `created_at`
- **`videos`**: `id`, `user_id`, `filename`, `storage_path`, `preview_path`, `duration`, `fps`, `resolution`, `file_size`, `upload_status`, `created_at`
- **`analysis_sessions`**: `id`, `video_id`, `processing_status`, `progress`, `started_at`, `completed_at`, `processing_duration`, `summary_stats`, `error_message`
- **`facial_metrics`**: `id`, `session_id`, `timestamp`, `face_detected`, `head_yaw`, `head_pitch`, `head_roll`, `gaze_direction`, `eye_aspect_ratio`, `expression_measurements`, `reliability_score`
- **`analysis_events`**: `id`, `session_id`, `timestamp`, `event_category`, `event_type`, `event_description`, `event_value`, `reliability_score`

---

## 5. Backend REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Authenticate & receive JWT |
| `GET` | `/api/auth/me` | Current user profile |
| `POST` | `/api/videos/upload` | Upload & validate video file |
| `GET` | `/api/videos` | List user uploaded videos |
| `GET` | `/api/videos/{id}` | Get video metadata |
| `GET` | `/api/videos/{id}/stream` | Stream raw video with byte-range seeking |
| `GET` | `/api/videos/{id}/preview` | Stream annotated video preview with landmark mesh |
| `DELETE` | `/api/videos/{id}` | Delete video and associated analysis records |
| `POST` | `/api/analysis/{video_id}/start` | Start asynchronous analysis |
| `GET` | `/api/analysis/{id}/status` | Check live processing progress |
| `GET` | `/api/analysis/{id}/results` | Fetch full timeline metrics & summary |
| `GET` | `/api/analysis/{id}/events` | Fetch detected events |
| `GET` | `/api/analysis/{id}/statistics` | Fetch aggregated distributions |
| `POST` | `/api/analysis/{id}/cancel` | Cancel in-progress job |
| `GET` | `/api/reports/{id}/download` | Download PDF executive report |
| `GET` | `/health` | Service health & CV model check |

---

## 6. How to Run Locally

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Step 1: Start Backend
```powershell
cd backend
# Activate virtual environment
.\venv\Scripts\Activate.ps1
# Run FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API will be live at: `http://127.0.0.1:8000`
Interactive Swagger Docs at: `http://127.0.0.1:8000/docs`

### Step 2: Start Frontend
```powershell
cd frontend
npm run dev
```
Frontend Web Application will be live at: `http://localhost:3000`

### Step 3: Run Tests
```powershell
cd backend
$env:PYTHONPATH = "backend"
.\venv\Scripts\pytest.exe backend/tests -v
```

### Docker Deployment
```bash
docker-compose up --build
```

---

## 7. Privacy & Ethical Boundaries

1. **Observable Kinematics Only**: The system tracks observable geometry (head angles, eyelid distance, mouth retraction). It does NOT evaluate mental health, personality, deception, intelligence, or emotional truth.
2. **Local Processing**: Video files are processed locally on the host machine. No video data or biometric coordinates are sent to third parties.
3. **No Biometric Identification**: The system measures surface kinematics across frames; it does not perform facial recognition or identity profiling.
