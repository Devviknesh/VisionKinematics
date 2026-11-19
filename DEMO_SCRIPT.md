# VisionKinematics — 3 to 5 Minute Product Demonstration Script

A structured, professional screen-recording script for presenting VisionKinematics during senior AI/ML, Computer Vision, and Full-Stack Engineering interviews, portfolio reviews, and technical demonstrations.

---

## Technical Overview at a Glance
- **Target Duration:** 3:30 to 4:30 minutes
- **Live Production URL:** [https://visionkinematics.vercel.app](https://visionkinematics.vercel.app)
- **Live Demo Route:** [https://visionkinematics.vercel.app/demo](https://visionkinematics.vercel.app/demo)
- **Technical Overview Route:** [https://visionkinematics.vercel.app/technical-overview](https://visionkinematics.vercel.app/technical-overview)
- **Backend API (Swagger Docs):** [https://backend-production-3edefbc4.up.railway.app/docs](https://backend-production-3edefbc4.up.railway.app/docs)
- **GitHub Repository:** [https://github.com/Devviknesh/VisionKinematics](https://github.com/Devviknesh/VisionKinematics)

---

## Demonstration Sequence Timeline

```
00:00 - 00:30 | Step 01: Product Introduction & Problem Statement
00:30 - 01:00 | Step 02: Video Ingestion & Validation Pipeline
01:00 - 01:35 | Step 03: 478-Point Facial Landmark Mesh
01:35 - 02:05 | Step 04: OpenCV solvePnP 3D Cranial Pose
02:05 - 02:35 | Step 05: Ocular Kinematics, EAR & Blink Detection
02:35 - 03:05 | Step 06: Observable FACS Action Units
03:05 - 03:35 | Step 07: Synchronized Timeline Scrubbing & Seeking
03:35 - 04:00 | Step 08: Dual-Session Comparative Analytics
04:00 - 04:25 | Step 09: Research-Grade Academic PDF Dossier
04:25 - 04:50 | Step 10: Backend Architecture, Ephemeral Security & Conclusion
```

---

## Detailed Step-by-Step Script & Narration

### Step 01: Product Introduction & Problem Statement
- **Time:** `00:00 - 00:30` (30 seconds)
- **Screen to Show:** Landing Page Hero Section (`https://visionkinematics.vercel.app`)
- **Action:** Mouse slowly hovers over the hero title and metric badges (478 Mesh, solvePnP 3D, EAR Gaze, 100% Local).
- **Suggested Narration:**
  > *"Hi everyone, this is VisionKinematics—an AI-powered computer vision SaaS platform engineered to transform recorded human video into dense, frame-by-frame 3D kinematic measurements. In conversational interviews, clinical assessments, and video presentations, analyzing non-verbal behavior has historically relied on either manual human coding or proprietary black-box APIs that expose private video to third-party clouds. VisionKinematics solves this by running an entire pipeline—from 478 MediaPipe sub-pixel landmarks to OpenCV solvePnP cranial orientation and FACS Action Units—100% locally with research-grade mathematical rigor."*

---

### Step 02: Video Ingestion & Validation Pipeline
- **Time:** `00:30 - 01:00` (30 seconds)
- **Screen to Show:** Upload Page (`/upload`) or Landing Architecture Explainer
- **Action:** Drag and drop an MP4 video file onto the dropzone; show file validation and progress bar.
- **Suggested Narration:**
  > *"Let's look at the ingestion workflow. When a user uploads a video, the FastAPI backend streams the file in 1MB sequential chunks directly to disk, enforcing quota controls without exhausting server memory. OpenCV then decodes container headers, validating container integrity, frame counts, native FPS, and strict duration boundaries. This ensures corrupt or malformed containers are rejected before allocating inference compute. Once validated, an asynchronous daemon task queue begins uniform frame decimation."*

---

### Step 03: 478-Point Facial Landmark Mesh
- **Time:** `01:00 - 01:35` (35 seconds)
- **Screen to Show:** Interactive Analysis Workspace (`/workspace/:id`) or Demo Page (`/demo`)
- **Action:** Toggle on the **"478 Mesh Overlay"** canvas. Show the animated wireframe contour lines tracked over the face.
- **Suggested Narration:**
  > *"Here in the interactive workspace, you see the core inference engine at work. VisionKinematics uses MediaPipe Tasks FaceLandmarker. Unlike legacy 68-point Dlib models that only output 2D planar pixel coordinates, MediaPipe predicts 478 dense 3D vertices at sub-millisecond CPU inference speeds. Our canvas renders canonical contours for the facial silhouette, eyelid margins, vermilion lips, and dedicated iris centers at points 468 and 473. Notice how the mesh remains rock-solid even during rapid facial translations."*

---

### Step 04: OpenCV solvePnP 3D Cranial Pose
- **Time:** `01:35 - 02:05` (30 seconds)
- **Screen to Show:** Workspace 3D Cranial Orientation Card & Projection Axes
- **Action:** Point cursor to Yaw, Pitch, and Roll gauges; pause on a frame where the subject turns or tilts their head.
- **Suggested Narration:**
  > *"Next is 3D cranial pose estimation. Instead of guessing head direction with a heuristic, we formulate head pose as a Perspective-n-Point problem. We map six key anthropometric 3D landmarks—the nose tip, chin, eye corners, and mouth corners—to their 2D pixel projections using OpenCV's `solvePnP` with iterative Levenberg-Marquardt optimization. The resulting rotation vector is converted to an orthonormal 3x3 matrix via Rodrigues' formula, yielding continuous Yaw, Pitch, and Roll Euler angles in degrees, fully normalized to prevent gimbal lock."*

---

### Step 05: Ocular Kinematics, EAR & Blink Detection
- **Time:** `02:05 - 02:35` (30 seconds)
- **Screen to Show:** Workspace Ocular EAR Card & Gaze Vector Display
- **Action:** Scrub to a blink event on the timeline; observe EAR gauge dropping below 0.20 and triggering the "Active Blink" badge.
- **Suggested Narration:**
  > *"For eye tracking, we compute the scalar Eye Aspect Ratio (EAR) using the Soukupová and Čech formula across six eyelid boundary vertices. Because EAR is a normalized ratio between vertical palpebral aperture and horizontal eye width, it is mathematically invariant to scale and camera distance. When EAR dips below 0.20 for consecutive frames, our debounced state machine logs a physiological blink. Concurrently, iris centroid displacement relative to the inner and outer canthi provides approximate horizontal and vertical gaze vectors."*

---

### Step 06: Observable FACS Action Units
- **Time:** `02:35 - 03:05` (30 seconds)
- **Screen to Show:** Observable FACS Units Panel at bottom of Workspace
- **Action:** Highlight AU12 (Lip Corner Puller), AU1+2 (Brow Elevation), AU4 (Brow Furrow), AU25+26 (Jaw Separation), and AU45 (Eye Closure).
- **Suggested Narration:**
  > *"Here we ground surface facial movements in Paul Ekman's Facial Action Coding System (FACS). By combining normalized Euclidean displacement vectors with 52 neural blendshape coefficients, we measure physical muscular activations: AU12 for zygomatic major retraction during smiles, AU1 and AU2 for frontalis elevation, AU4 for corrugator furrowing, AU25/26 for jaw drop, and AU45 for palpebral closure. Importantly, we maintain strict scientific delimitations: these quantify observable geometric kinematics, avoiding pseudoscience claims of detecting internal psychological emotion or intent."*

---

### Step 07: Synchronized Timeline Scrubbing & Seeking
- **Time:** `03:05 - 03:35` (30 seconds)
- **Screen to Show:** Multi-stream Kinematic Waveforms & Visual Event Stream
- **Action:** Click directly on a peak in the Euler waveform; click a timestamped event card in the right column (e.g., `SMILE_INDICATOR_DETECTED` at t=1.8s). Show video seeking to the exact frame.
- **Suggested Narration:**
  > *"Every extracted telemetry stream is fully synchronized with browser playback. In the waveform timeline, you can see continuous Euler pitch and yaw curves. When I click any event in the right-hand Visual Event Stream—such as this smile indicator or head turn—the player instantly seeks to that precise video millisecond, updating the 478 wireframe canvas and all HUD gauges synchronously via a high-performance binary-search lookup."*

---

### Step 08: Dual-Session Comparative Analytics
- **Time:** `03:35 - 04:00` (25 seconds)
- **Screen to Show:** Session Comparison Page (`/compare`)
- **Action:** Select Session A and Session B; observe Comparative Radar Chart and Delta Metrics table.
- **Suggested Narration:**
  > *"VisionKinematics also provides longitudinal session comparison. Users can select two distinct recorded sessions to evaluate behavioural evolution—such as before-and-after interview coaching. Our backend computes real comparative deltas across head stability percentage, sustained eye contact ratios, expressivity intensity, and vocal movement density, displayed over an interactive radar visualization."*

---

### Step 09: Research-Grade Academic PDF Dossier
- **Time:** `04:00 - 04:25` (25 seconds)
- **Screen to Show:** PDF Preview (`/report/:id`) or downloaded PDF in viewer
- **Action:** Scroll through the 4-page PDF document; highlight the Matplotlib vector plots and extracted frame wireframe overlays.
- **Suggested Narration:**
  > *"For executive reporting and clinical archiving, every session exports into an official publication-grade 4-page academic PDF report. Generated headlessly using ReportLab and Matplotlib, it features vector time series charts of cranial pose, EAR palpebral occlusion timelines with scatter points on detected blinks, quantitative metric summaries, chronological event tables, actual video frames with MediaPipe wireframe overlays, and two-pass canvas numbering."*

---

### Step 10: Backend Architecture, Ephemeral Security & Conclusion
- **Time:** `04:25 - 04:50` (25 seconds)
- **Screen to Show:** Technical Overview Page (`/technical-overview`) or Architecture Diagram
- **Action:** Scroll past the architecture blocks; highlight PostgreSQL persistence and signed streaming tickets.
- **Suggested Narration:**
  > *"Under the hood, the backend is built on FastAPI and PostgreSQL with an asynchronous worker queue. To prevent unauthorized media leaks, video streaming relies on cryptographically signed HMAC-SHA256 streaming tickets with 15-minute TTLs scoped strictly to that video resource. The system includes startup recovery for interrupted sessions and a full 36-test automated suite. Both frontend and backend are live in production on Vercel and Railway. Thank you for watching!"*

---

## Technical Defense Preparation & Quick Answers

- **Why MediaPipe over fine-tuned CNN?**  
  Sub-millisecond CPU inference per frame (4-7ms), metric 3D coordinates, and 52 expression blendshapes without requiring an expensive GPU cluster in production.
- **How is head pose calculated?**  
  Perspective-n-Point pose estimation (`cv2.solvePnP` iterative Levenberg-Marquardt) mapping canonical 3D face model points to 2D image coordinates, followed by Rodrigues matrix transformation to normalized Euler angles.
- **How is video streaming secured?**  
  Short-lived, resource-scoped HMAC-SHA256 JWT tickets. Browsers cannot pass Bearer headers in native `<video>` elements, so ephemeral tickets verify resource ownership on every streaming request without permanent tokens in URLs.
- **What is the ethical boundary?**  
  Measurements quantify physical surface displacements (FACS kinematics), strictly rejecting pseudoscience claims of psychological emotion or deception detection.
