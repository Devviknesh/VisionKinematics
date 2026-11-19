# VisionKinematics — Technical Architecture & System Design

**Project Title:** AI-Powered Video Analysis & Non-Verbal Communication Analyzer  
**Live Application:** [https://visionkinematics.vercel.app](https://visionkinematics.vercel.app)  
**API Documentation:** [https://backend-production-3edefbc4.up.railway.app/docs](https://backend-production-3edefbc4.up.railway.app/docs)  
**GitHub Repository:** [https://github.com/Devviknesh/VisionKinematics](https://github.com/Devviknesh/VisionKinematics)  

---

## 1. System Overview & Engineering Philosophy

VisionKinematics is an enterprise-grade, full-stack computer vision SaaS platform designed for objective, quantitative analysis of human non-verbal communication, cranial orientation kinematics, ocular dynamics, and facial action units.

Unlike speculative "emotion recognition" APIs that assign arbitrary emotional labels to facial configurations, VisionKinematics adheres strictly to **observable surface biomechanics**. It measures metric physical deformations:
- 3D Cranial Euler Angles (Yaw, Pitch, Roll in degrees)
- Bilateral Eye Aspect Ratio (EAR) and palpebral fissure distances
- Facial Action Coding System (FACS) Action Units derived from 52 blendshape coefficients and 478 3D geometric landmarks

```
+-----------------------------------------------------------------------------------+
|                                VisionKinematics Stack                             |
+-----------------------------------------------------------------------------------+
| [Frontend SPA]  React 18 + TypeScript + Vite + Tailwind CSS + Recharts (Vercel)   |
|                                         |  HTTPS (REST + Bearer JWT / Tickets)    |
|                                         v                                         |
| [Backend API]   FastAPI + Uvicorn + Pydantic v2 + Background Queue (Railway)      |
|                                         |                                         |
|         +-------------------------------+-------------------------------+         |
|         v                                                               v         |
| [Computer Vision Engine]                                       [Data Persistence] |
| • OpenCV Video Streaming & solvePnP                            • PostgreSQL       |
| • MediaPipe FaceLandmarker (478 3D mesh)                       • SQLAlchemy ORM   |
| • FACS & Blendshapes Analysis                                  • Auto-Migrations  |
| • ReportLab & Matplotlib PDF Engine                            • Media Tickets    |
+-----------------------------------------------------------------------------------+
```

---

## 2. Computer Vision Pipeline & Algorithms

### 2.1 Why MediaPipe FaceLandmarker Was Selected
1. **Mesh Density & Precision:** MediaPipe predicts 478 3D landmarks in real time (468 cranial contour points plus 10 iris boundary points), providing dense anatomical coverage across eyelids, eyebrows, nasal bridge, and lips.
2. **Sub-Pixel Efficiency:** Utilizing lightweight MobileNet-derived convolutional backbones and tensor delegates, MediaPipe executes frame inference in 15–30ms on commodity CPUs, eliminating mandatory GPU cluster overhead.
3. **Integrated Blendshape Coefficients:** Outputs 52 standardized blendshape activation weights ($[0.0, 1.0]$) alongside spatial coordinates, enabling direct mapping to facial Action Units.

### 2.2 How 478 Landmarks Are Extracted & Persisted
For each sampled video frame:
1. The BGR frame from OpenCV is converted to RGB and encapsulated in `mediapipe.Image`.
2. `detector.detect(mp_image)` infers the 478 normalized spatial landmarks $[x_i, y_i, z_i] \in [0.0, 1.0]$, scaled by image width and height.
3. Coordinates are rounded to 4 decimal places and persisted into the `landmarks` JSON column in the PostgreSQL `facial_metrics` table.
4. The React frontend reads this array directly, dynamically rendering the canonical FaceMesh topology via vector SVG with zero synthetic approximation.

### 2.3 Head Pose Estimation via OpenCV `solvePnP`
Head orientation is solved via Perspective-n-Point (PnP) geometry matching 2D image coordinates to standard anthropometric 3D cranial model coordinates:

```python
# Standardized Anthropometric 3D Cranial Model (mm)
# Camera coordinate alignment: +X right, +Y down, +Z forward into face
model_points = np.array([
    (0.0, 0.0, 0.0),          # Landmark 1: Nose tip
    (0.0, 330.0, 65.0),       # Landmark 152: Chin apex
    (-225.0, -170.0, 135.0),  # Landmark 33: Right eye outer canthus
    (225.0, -170.0, 135.0),   # Landmark 263: Left eye outer canthus
    (-150.0, 150.0, 125.0),   # Landmark 61: Right oral commissure
    (150.0, 150.0, 125.0)     # Landmark 291: Left oral commissure
], dtype=np.float64)
```

The camera intrinsic matrix $\mathbf{K}$ is initialized assuming zero optical distortion and principal point at frame center:
$$\mathbf{K} = \begin{bmatrix} f & 0 & c_x \\ 0 & f & c_y \\ 0 & 0 & 1 \end{bmatrix}, \quad f = w$$

`cv2.solvePnP` computes rotation vector $\mathbf{r}$ and translation vector $\mathbf{t}$. The rotation matrix $\mathbf{R} = \operatorname{Rodrigues}(\mathbf{r})$ is decomposed via `cv2.RQDecomp3x3` into intrinsic Tait-Bryan Euler angles:
$$\text{Pitch} = -\text{angles}[0], \quad \text{Yaw} = \text{angles}[1], \quad \text{Roll} = \text{angles}[2]$$
- **Pitch:** Positive = head tilted up; negative = head tilted down.
- **Yaw:** Positive = head turned right; negative = head turned left.
- **Roll:** Positive = lateral tilt right; negative = lateral tilt left.

### 2.4 Eye Aspect Ratio (EAR) & Blink Quantification
Following Soukupová and Čech (2016), bilateral palpebral fissure aperture is quantified via landmark Euclidean distances:
$$\text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \|p_1 - p_4\|}$$
- Left eye indices: `[33, 160, 158, 133, 153, 144]`
- Right eye indices: `[362, 385, 387, 263, 373, 380]`
- **Blink Trigger:** $\text{EAR} < 0.20$ or AU45 blendshape $\ge 0.65$.

### 2.5 Action Unit (FACS) Kinematic Measurements
Observable muscular activations are calculated by combining blendshapes with geometric fallbacks:
- **AU12 (Lip Corner Puller):** `(mouthSmileLeft + mouthSmileRight) / 2.0`
- **AU1+2 (Brow Elevation):** `browInnerUp` and `(browOuterUpLeft + browOuterUpRight) / 2.0`
- **AU4 (Brow Furrow):** `(browDownLeft + browDownRight) / 2.0`
- **AU25+26 (Jaw Separation):** `jawOpen` and vertical inter-lip distance
- **AU45 (Eye Closure / Blink):** `(eyeBlinkLeft + eyeBlinkRight) / 2.0` with geometric EAR fallback $\operatorname{clip}((0.32 - \text{EAR}) / 0.16, 0.0, 1.0)$

---

## 3. End-to-End Data Lifecycle

```
[1. Upload] ---> [2. Chunk Validator] ---> [3. Storage & DB Record]
                                                   |
                                                   v
[6. PostgreSQL Metric Rows] <--- [5. CV Engine] <--- [4. Task Queue Thread]
       |
       +---> [7. Interactive Workspace (React + SVG 478 Mesh)]
       |
       +---> [8. Research-Grade PDF Engine (ReportLab + Matplotlib)]
```

1. **Ingestion:** Video uploaded via multipart form data (`POST /api/videos/upload`). Streamed in 1MB chunks to disk up to 250MB limit with filename sanitization.
2. **Metadata Validation:** OpenCV inspects container, codec, duration ($\le 900\text{s}$), and resolution. Invalid files are unlinked immediately.
3. **Queue Execution:** Background thread processes frames at target sample rate (default 5.0 FPS) without loading full video into memory.
4. **State Machine:** Session transitions through `pending` $\rightarrow$ `processing` (with live percent progress) $\rightarrow$ `completed` or `failed`.
5. **Startup Recovery:** Upon application boot, orphaned jobs from interrupted processes are automatically reconciled.

---

## 4. Security & Access Control

- **Authentication:** Bcrypt password hashing ($12$ rounds), JWT access tokens ($24$-hour expiration).
- **Resource Ownership:** Foreign-key relationships enforce that videos, analysis sessions, and reports are queryable only by their owner (`user_id`).
- **Short-Lived Streaming & Download Tickets:**
  Media files are never exposed via public URLs or static directories. Clients obtain a cryptographically signed, 15-minute ticket strictly scoped to the specific `resource_id`:
  ```python
  ticket = create_streaming_ticket(user_id=current_user.id, resource_id=video_id, expires_minutes=15)
  ```
  Media streaming endpoints accept this ticket or Bearer authentication, verifying ownership on every range request. Cross-user attempts receive `HTTP 404/403`.

---

## 5. Research-Grade PDF Generation Architecture

The PDF reporting engine in `ReportService` leverages **ReportLab** combined with **Matplotlib** in headless `Agg` mode:
1. **Dynamic Charts:** Queries real PostgreSQL metric rows to render high-DPI figures (3-axis Cranial Pose, EAR timeline with blink scatter points, and 5-channel FACS kinematics).
2. **Visual Evidence:** Extracts genuine frames from the uploaded video (baseline frontal and peak activity) and overlays MediaPipe landmark contours.
3. **Two-Pass Canvas (`NumberedCanvas`):** Computes total page count dynamically, painting running headers on pages $\ge 2$ and footers (`Page X of Y`) across all pages.
4. **Ethical Framing:** Incorporates explicit scientific disclaimers distinguishing automated biomechanical measurements from certified human FACS scoring or internal psychological state inferences.

---

## 6. Deployment Topologies

- **Frontend:** Hosted on Vercel Edge Network with automatic SPA rewrite routing (`vercel.json`).
- **Backend:** Hosted on Railway as a containerized Docker service (`python:3.11-slim`) equipped with OpenCV system libraries (`libgl1`, `ffmpeg`, `libsm6`, `libxext6`).
- **Database:** Managed PostgreSQL instance on Railway with persistent volume storage.
