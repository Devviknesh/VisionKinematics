# VisionKinematics — AI-Powered Video Analysis & Facial Kinematics Platform

[![Production Deployment](https://img.shields.io/badge/Deployment-Live%20on%20Vercel%20%26%20Railway-success?style=flat-square)](https://visionkinematics.vercel.app)
[![API Documentation](https://img.shields.io/badge/FastAPI-Swagger%20UI-0284c7?style=flat-square)](https://backend-production-3edefbc4.up.railway.app/docs)
[![Python Version](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![React Version](https://img.shields.io/badge/React-18%20TypeScript-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![OpenCV Version](https://img.shields.io/badge/OpenCV-5.0%2B-5C3EE8?style=flat-square&logo=opencv&logoColor=white)](https://opencv.org)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Tasks%20Vision-0078D4?style=flat-square)](https://developers.google.com/mediapipe)
[![Tests Passing](https://img.shields.io/badge/Tests-36%2F36%20Passed-brightgreen?style=flat-square)](https://github.com/Devviknesh/VisionKinematics)

A production-grade, full-stack computer vision SaaS application that extracts dense 3D facial topology, estimates continuous cranial orientation via Perspective-n-Point geometry, tracks ocular kinematics, and measures observable Facial Action Coding System (FACS) muscular displacements—with frame-accurate timeline synchronization, longitudinal session comparison, and research-grade academic PDF reporting.

---

## 1. Live Deployment & Key Links

- **Live Web Application:** [https://visionkinematics.vercel.app](https://visionkinematics.vercel.app)
- **Interactive Product Demo (No Login Required):** [https://visionkinematics.vercel.app/demo](https://visionkinematics.vercel.app/demo)
- **Technical Overview & Engineering Dossier:** [https://visionkinematics.vercel.app/technical-overview](https://visionkinematics.vercel.app/technical-overview)
- **Backend REST API (FastAPI Swagger UI):** [https://backend-production-3edefbc4.up.railway.app/docs](https://backend-production-3edefbc4.up.railway.app/docs)
- **GitHub Repository:** [https://github.com/Devviknesh/VisionKinematics](https://github.com/Devviknesh/VisionKinematics)
- **Technical Architecture Document:** [`ARCHITECTURE.md`](file:///c:/Users/dev%20viknesh/Downloads/Session%20(2)/Session/ARCHITECTURE.md)
- **3–5 Minute Demonstration Video Script:** [`DEMO_SCRIPT.md`](file:///c:/Users/dev%20viknesh/Downloads/Session%20(2)/Session/DEMO_SCRIPT.md)

---

## 2. Problem Statement & Solution

### The Problem
Analyzing human non-verbal communication, facial kinematics, and gaze focus during recorded video interviews or assessments has historically suffered from:
1. **Manual Annotation Latency:** Human FACS coding takes ~100 minutes per 1 minute of video.
2. **2D Planar Limitations:** Legacy 68-point facial landmark models (such as Dlib) lack depth coordinates and distort under head rotation.
3. **Cloud Privacy & Biometric Exposure:** Uploading sensitive face video to proprietary black-box APIs breaches GDPR/HIPAA compliance.
4. **Pseudoscience Claims:** Many commercial tools claim to detect &ldquo;true emotions&rdquo;, &ldquo;deception&rdquo;, or &ldquo;personality traits&rdquo; from facial expressions without scientific grounding.

### The VisionKinematics Solution
- **Dense 3D Topology:** Extracts 478 sub-pixel 3D metric coordinates and 52 facial blendshapes using MediaPipe Tasks Vision.
- **solvePnP Cranial Pose:** Solves rigid body rotation with Levenberg-Marquardt optimization, generating normalized Euler angles (Yaw, Pitch, Roll).
- **Scale-Invariant Ocular Tracking:** Calculates Eye Aspect Ratio (EAR) and iris vectors to detect natural blinks and gaze aversion.
- **Biomechanical FACS Grounding:** Quantifies physical muscular displacement (AU12, AU1+2, AU4, AU25/26, AU45) while explicitly rejecting unscientific emotion claims.
- **100% Local Execution:** Ingests and processes video completely within secure application infrastructure.
- **Academic Reporting:** Generates 4-page publication-grade PDF dossiers with vector time series charts and video frame wireframe overlays.

---

## 3. System Architecture & End-to-End Pipeline

```
[ Client Browser (React + Three.js / Canvas) ]
                     │  ▲
        Upload (1MB) │  │  JSON Telemetry & Signed Stream Tickets
                     ▼  │
  ┌─────────────────────────────────────────────────────────┐
  │                 FastAPI REST Backend                    │
  │  ─────────────────────────────────────────────────────  │
  │  • Asynchronous Background Task Queue                   │
  │  • SQLAlchemy 2.0 ORM (PostgreSQL & SQLite)             │
  │  • JWT Auth & Scoped Ephemeral Streaming Tickets        │
  │  • Startup Orphaned Job Recovery Lifespan Hook          │
  └──────────────────────────┬──────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────┐
  │            Computer Vision Ingestion Engine             │
  │  ─────────────────────────────────────────────────────  │
  │  Stage 01: Stream Write & Quota Verification            │
  │  Stage 02: OpenCV VideoCapture Container Validation     │
  │  Stage 03: Temporal Decimation (Uniform 5.0 FPS)        │
  │  Stage 04: MediaPipe FaceLandmarker (BlazeFace + Mesh)  │
  │  Stage 05: 478 Sub-Pixel 3D Coordinates & Irises        │
  │  Stage 06: OpenCV cv2.solvePnP (Levenberg-Marquardt)    │
  │  Stage 07: Rodrigues Orthonormal Euler Angles           │
  │  Stage 08: Soukupová & Čech Eye Aspect Ratio (EAR)      │
  │  Stage 09: FACS Action Units & Blendshape Kinematics    │
  │  Stage 10: Debounced Event Detection State Machine      │
  │  Stage 11: Bulk Relational Persistence (PostgreSQL)     │
  │  Stage 12: Headless ReportLab & Matplotlib PDF Engine   │
  └─────────────────────────────────────────────────────────┘
```

---

## 4. Key Technology Stack

| Layer | Technology | Primary Function |
|---|---|---|
| **Computer Vision** | **MediaPipe 1.2+** | FaceLandmarker task predicting 478 3D landmarks & 52 blendshapes |
| **Geometry & Video** | **OpenCV 5.0+ (cv2)** | `cv2.solvePnP`, `cv2.Rodrigues`, container validation, frame decimation |
| **Numerical Math** | **NumPy & SciPy** | Vector kinematics, matrix transformation, Euler decomposition |
| **PDF Reporting** | **ReportLab & Matplotlib** | Headless publication-quality 4-page academic PDF dossier generation |
| **Backend API** | **FastAPI & Uvicorn** | High-concurrency async REST API, background worker queue |
| **Database** | **PostgreSQL & SQLAlchemy 2.0** | Relational persistence, connection pooling, indexed metrics |
| **Security & Auth** | **PyJWT & Bcrypt** | HMAC-SHA256 signed streaming tickets (15-min TTL), password hashing |
| **Frontend UI** | **React 18 & TypeScript** | Single-page application, custom wireframe canvas, video player |
| **Styling & Icons** | **Tailwind CSS & Lucide React** | Dark charcoal modern SaaS design system, responsive layout |
| **Telemetry Charts** | **Recharts** | Interactive pose waveforms, comparative radar diagrams, distribution bars |

---

## 5. Computer Vision Mathematics & Algorithms

### 5.1 Perspective-n-Point Head Pose (`head_pose.py`)
Minimizes reprojection error between a 3D anthropometric facial model and detected 2D landmarks:

$$\begin{bmatrix} u \\ v \\ 1 \end{bmatrix} = \mathbf{K} \begin{bmatrix} \mathbf{R} & \mathbf{t} \end{bmatrix} \begin{bmatrix} X_w \\ Y_w \\ Z_w \\ 1 \end{bmatrix}$$

Using pinhole camera intrinsic matrix $\mathbf{K}$ calibrated to frame width and height:
$$\mathbf{K} = \begin{bmatrix} f_x & 0 & c_x \\ 0 & f_y & c_y \\ 0 & 0 & 1 \end{bmatrix}, \quad f_x = f_y = w, \quad c_x = \frac{w}{2}, \quad c_y = \frac{h}{2}$$

The rotation vector $\mathbf{r}$ is converted to an orthonormal matrix $\mathbf{R}$ via Rodrigues' formula:
$$\mathbf{R} = \cos(\theta)\mathbf{I} + (1 - \cos(\theta))\hat{\mathbf{r}}\hat{\mathbf{r}}^T + \sin(\theta)[\hat{\mathbf{r}}]_\times$$

Euler angles are decomposed and normalized to $[-180^\circ, +180^\circ]$:
- **Yaw (Turn):** $\text{atan2}(R_{2,0}, \sqrt{R_{0,0}^2 + R_{1,0}^2})$
- **Pitch (Tilt):** $\text{atan2}(-R_{2,1}, R_{2,2})$
- **Roll (Incline):** $\text{atan2}(R_{1,0}, R_{0,0})$

### 5.2 Eye Aspect Ratio (EAR) & Blink Detection (`gaze_estimator.py`)
Computes the Soukupov&aacute; &amp; Čech scale-invariant eyelid ratio across 6 vertices:

$$\text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2.0 \cdot \|p_1 - p_4\|}$$

- **Palpebral Occlusion Threshold:** $\text{EAR} < 0.20$
- **Re-Opening Threshold:** $\text{EAR} \ge 0.24$
- **Temporal Debounce:** Minimum 300 ms window to eliminate noise.

### 5.3 Biomechanical FACS Action Units (`expression_analyzer.py`)
- **AU12 (Lip Corner Puller):** $\text{mouthSmileLeft} + \text{mouthSmileRight}$
- **AU1+2 (Brow Elevation):** $\text{browOuterUp} + \text{browInnerUp}$
- **AU4 (Brow Furrow):** $\text{browDown}$ + medial canthi convergence
- **AU25+26 (Jaw Separation):** $\text{jawOpen}$ + vertical inner vermilion displacement
- **AU45 (Palpebral Closure):** $\text{clamp}\left(\frac{0.32 - \text{EAR}}{0.16}\right)$

---

## 6. Backend REST API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user & issue JWT |
| `GET` | `/api/auth/me` | Bearer | Get authenticated user profile |
| `PUT` | `/api/auth/profile` | Bearer | Update profile name & preferences |
| `PUT` | `/api/auth/password` | Bearer | Secure password update |
| `POST` | `/api/videos/upload` | Bearer | Stream upload and validate video |
| `GET` | `/api/videos` | Bearer | List user's videos |
| `GET` | `/api/videos/{id}` | Bearer | Get video metadata |
| `GET` | `/api/videos/{id}/stream-token` | Bearer | Issue 15-min signed streaming ticket |
| `GET` | `/api/videos/{id}/stream` | Ticket / Bearer | Stream original video |
| `GET` | `/api/videos/{id}/preview` | Ticket / Bearer | Stream annotated video with wireframe |
| `POST` | `/api/analysis/{video_id}/start` | Bearer | Dispatch background analysis worker |
| `GET` | `/api/analysis/{id}/status` | Bearer | Poll analysis status & progress % |
| `GET` | `/api/analysis/{id}/results` | Bearer | Fetch dense timeline metrics & events |
| `GET` | `/api/analysis/compare` | Bearer | Compare two completed sessions |
| `GET` | `/api/analysis/demo` | Public | Fetch real completed session for public demo |
| `GET` | `/api/reports/{id}/download` | Ticket / Bearer | Download executive PDF dossier |
| `GET` | `/api/reports/demo/download` | Public | Download official demo PDF report |
| `GET` | `/health` | Public | Healthcheck & CV model verification |

---

## 7. How to Run Locally

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Git

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/Devviknesh/VisionKinematics.git
cd VisionKinematics/backend

# Create and activate virtual environment
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations / initialization
# Default uses local zero-config SQLite; PostgreSQL supported via DATABASE_URL
python -c "from app.database import init_db; init_db()"

# Start FastAPI development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API is live at: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
- Web Application is live at: `http://localhost:3000`

### 3. Environment Configuration

Create a `.env` file in `backend/` using the following template:

```env
# Application Settings
ENVIRONMENT=development
SECRET_KEY=change-this-to-a-secure-random-secret-key-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database Configuration (Leave empty for default SQLite)
# DATABASE_URL=postgresql://user:password@localhost:5432/visionkinematics

# CORS Allowed Origins
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]

# Video Limits
MAX_UPLOAD_SIZE_MB=100
MAX_VIDEO_DURATION_SECONDS=300
DEFAULT_SAMPLE_FPS=5.0
```

Create `.env` in `frontend/`:
```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## 8. Automated Test Suite

VisionKinematics includes 36 automated unit, integration, and scenario tests:

```bash
cd backend
$env:PYTHONPATH = "backend"
.\venv\Scripts\pytest.exe backend/tests/ -v
```

### Test Coverage Highlights:
- **Full Computer Vision Pipeline:** Tests end-to-end landmark extraction, pose estimation, and event detection.
- **10 Multi-Scenario Real-Video Tests:** Short video, extended duration, low-light (15% luminance), severe blur, no visible face, multi-face composite, intermittent face visibility, high rotation movement, minimal movement, and corrupted file container.
- **Cross-Tenant Security Isolation:** Verifies User B cannot access User A's videos, sessions, stream tokens, reports, or comparative radar data.
- **Signed Streaming Ticket Crypto:** Validates ticket expiration, resource binding, and scope integrity.
- **PDF Research Report Generation:** Validates ReportLab generation, Matplotlib figures, frame extraction, and empty metrics handling.

---

## 9. Scientific & Ethical Boundaries

VisionKinematics strictly adheres to computer vision and affective computing ethics:
1. **Observable Kinematics Only:** The platform quantifies observable physical surface deformations (cranial orientation, eyelid aperture, mouth retraction). It does **NOT** claim to detect emotional truth, internal psychological state, deception, or personality traits.
2. **Automated Measurements vs. Human Coding:** Automated Action Units are derived from neural blendshapes and landmark geometry; they are not certified human FACS coder scores.
3. **Approximation Acknowledgement:** Monocular webcam gaze tracking provides geometric sector approximations, not clinical pupillometry.
4. **Data Privacy:** All video processing executes strictly on-premises or within isolated tenant containers; no biometric vectors are sold or transferred to third parties.

---

## 10. License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
