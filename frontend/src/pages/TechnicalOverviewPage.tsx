import React, { useState } from 'react';
import { 
  Code, 
  Cpu, 
  Terminal, 
  Compass, 
  Eye, 
  Smile, 
  Database, 
  Layout, 
  Layers, 
  ShieldCheck, 
  BookOpen, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  GitBranch
} from 'lucide-react';
import { PipelineExplainer } from '../components/PipelineExplainer';

export const TechnicalOverviewPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>('A');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-12 pb-20 w-full max-w-full overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative rounded-3xl bg-neutral-900/80 border border-neutral-800 p-6 sm:p-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/10 border border-sky-400/20 text-sky-400 text-xs font-mono font-medium">
            <Cpu className="w-3.5 h-3.5" />
            <span>Senior AI/ML &amp; Computer Vision Engineering Dossier</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-100 tracking-tight leading-tight">
            Technical Overview &amp; Architectural Deep Dive
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-3xl">
            A comprehensive, mathematical and architectural explanation of VisionKinematics. Built to demonstrate production computer vision engineering: MediaPipe 3D landmark geometry, OpenCV <code className="text-amber-400 font-mono text-xs">solvePnP</code> pose minimization, ocular kinematics, FACS blendshape decomposition, and secure multi-tenant infrastructure.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="https://github.com/Devviknesh/VisionKinematics"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs sm:text-sm font-medium transition"
            >
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>GitHub Repository</span>
            </a>

            <a
              href="https://backend-production-3edefbc4.up.railway.app/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs sm:text-sm font-medium transition"
            >
              <ExternalLink className="w-4 h-4 text-sky-400" />
              <span>Swagger API Docs</span>
            </a>
          </div>
        </div>

        {/* Quick Nav Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-8 border-t border-neutral-800 mt-8">
          <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider pr-2">Jump to:</span>
          {[
            { id: 'section-a', label: 'A. MediaPipe 478 Mesh', key: 'A' },
            { id: 'section-b', label: 'B. solvePnP Head Pose', key: 'B' },
            { id: 'section-c', label: 'C. Ocular EAR & Gaze', key: 'C' },
            { id: 'section-d', label: 'D. FACS Kinematics', key: 'D' },
            { id: 'section-e', label: 'E. Backend Architecture', key: 'E' },
            { id: 'section-f', label: 'F. Frontend Architecture', key: 'F' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => scrollToSection(item.id)}
              className="px-3 py-1.5 rounded-lg bg-neutral-950/70 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-amber-400 text-xs font-mono transition"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* 2. PIPELINE INTERACTIVE EXPLAINER */}
      <section className="space-y-4">
        <PipelineExplainer />
      </section>

      {/* ========================================================================= */}
      {/* SECTION A: MediaPipe FaceLandmarker */}
      {/* ========================================================================= */}
      <section id="section-a" className="space-y-6 pt-6">
        <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
          <div className="p-2.5 rounded-xl bg-sky-400/10 border border-sky-400/30 text-sky-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">Module A</span>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">MediaPipe FaceLandmarker &amp; 3D Mesh</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
              1. Architecture &amp; Selection Rationale
            </h3>
            <p>
              MediaPipe was selected over legacy 68-point Dlib or heavyweight 3D morphable model (3DMM) CNNs for production CPU feasibility and metric accuracy. MediaPipe operates via a cascaded, lightweight two-stage network:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
              <li>
                <strong className="text-neutral-200">BlazeFace Detector:</strong> A lightweight single-shot detector optimized for sub-millisecond face localization, estimating a rotated bounding box and 6 key points.
              </li>
              <li>
                <strong className="text-neutral-200">3D Mesh Regressor:</strong> Operates strictly on cropped facial ROIs, predicting 478 3D landmark coordinates and 52 expression blendshape coefficients directly.
              </li>
              <li>
                <strong className="text-neutral-200">Refined Iris Model:</strong> Predicts landmarks 468–477 dedicated to left and right iris contours, enabling metric gaze vectoring without specialized infrared eye-trackers.
              </li>
            </ul>

            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider pt-2">
              2. Coordinate Representation
            </h3>
            <p>
              Each landmark point is output as a normalized vector <code className="text-amber-400 font-mono">[x, y, z]</code>:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
              <li><code className="text-sky-300 font-mono">x, y</code>: Normalized to <code className="font-mono">[0.0, 1.0]</code> relative to image width and height.</li>
              <li><code className="text-sky-300 font-mono">z</code>: Represents landmark depth relative to the midpoint of the horizontal line connecting both hips of the face. Smaller z indicates proximity to the camera.</li>
            </ul>
          </div>

          <div className="space-y-4">
            {/* Comparison Table */}
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
              <span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider block">
                Production Landmark Comparison Matrix
              </span>
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-500">
                    <th className="py-2">Framework</th>
                    <th className="py-2">Points</th>
                    <th className="py-2">Dimensions</th>
                    <th className="py-2">Inference (CPU)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850 text-neutral-300">
                  <tr className="text-amber-400 font-bold bg-amber-400/5">
                    <td className="py-2">MediaPipe Tasks</td>
                    <td className="py-2">478</td>
                    <td className="py-2">3D + Blendshapes</td>
                    <td className="py-2">~4-7 ms</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-neutral-400">Dlib Shape Predictor</td>
                    <td className="py-2">68</td>
                    <td className="py-2">2D Planar</td>
                    <td className="py-2">~25-40 ms</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-neutral-400">OpenFace 2.0</td>
                    <td className="py-2">68</td>
                    <td className="py-2">3D Morphable</td>
                    <td className="py-2">~60-110 ms</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Code Block */}
            <div className="p-4 rounded-2xl bg-black/60 border border-neutral-800 font-mono text-xs space-y-1.5">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                Backend Landmark Ingestion (backend/app/cv_engine/face_landmarker.py)
              </span>
              <pre className="text-sky-300 whitespace-pre overflow-x-auto">
{`from mediapipe.tasks.python.vision import FaceLandmarker

options = FaceLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=model_path),
    running_mode=RunningMode.VIDEO,
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_face_presence_confidence=0.5,
    output_face_blendshapes=True
)`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION B: Head Pose Estimation */}
      {/* ========================================================================= */}
      <section id="section-b" className="space-y-6 pt-6">
        <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
          <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Module B</span>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">Head Pose Estimation (OpenCV solvePnP)</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
              1. 3D-to-2D Perspective-n-Point Formulation
            </h3>
            <p>
              Head pose estimation is formulated as finding the rigid body transformation (rotation <code className="text-amber-400 font-mono">R</code> and translation <code className="text-amber-400 font-mono">t</code>) between an anthropometric 3D face model and detected 2D pixel coordinates:
            </p>
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-amber-300 text-center">
              s &bull; [u, v, 1]<sup>T</sup> = K &bull; [R | t] &bull; [X<sub>w</sub>, Y<sub>w</sub>, Z<sub>w</sub>, 1]<sup>T</sup>
            </div>
            <p>
              Where <code className="font-mono">K</code> is the pinhole camera intrinsic matrix approximated using frame dimensions <code className="font-mono">(w, h)</code>:
            </p>
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-sky-300 text-center">
              K = [[f<sub>x</sub>, 0, c<sub>x</sub>], [0, f<sub>y</sub>, c<sub>y</sub>], [0, 0, 1]], where f<sub>x</sub> = f<sub>y</sub> = w, c<sub>x</sub> = w/2, c<sub>y</sub> = h/2
            </div>

            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider pt-2">
              2. 3D Reference Model Points (Anthropometric Millimeters)
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-neutral-400 font-mono text-xs">
              <li>Nose tip (1): [0.0, 0.0, 0.0]</li>
              <li>Chin (152): [0.0, -330.0, -65.0]</li>
              <li>Left eye corner (33): [-225.0, 170.0, -135.0]</li>
              <li>Right eye corner (263): [225.0, 170.0, -135.0]</li>
              <li>Left mouth corner (61): [-150.0, -150.0, -125.0]</li>
              <li>Right mouth corner (291): [150.0, -150.0, -125.0]</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
              3. Euler Decomposition &amp; Normalization
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              OpenCV's <code className="text-amber-400 font-mono">cv2.solvePnP</code> returns a 3-element compact Rodrigues rotation vector <code className="font-mono">rvec</code>. We convert it to a 3x3 orthonormal rotation matrix <code className="font-mono">R = cv2.Rodrigues(rvec)</code>, then extract continuous Euler angles:
            </p>

            <div className="p-4 rounded-2xl bg-black/60 border border-neutral-800 font-mono text-xs space-y-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                Euler Extraction (backend/app/cv_engine/head_pose.py)
              </span>
              <pre className="text-amber-300 whitespace-pre overflow-x-auto">
{`# Euler angle extraction from 3x3 Rotation Matrix
pitch = math.degrees(math.atan2(-R[2, 1], R[2, 2]))
yaw = math.degrees(math.atan2(R[2, 0], math.sqrt(R[0, 0]**2 + R[1, 0]**2)))
roll = math.degrees(math.atan2(R[1, 0], R[0, 0]))

# Normalization to [-180, +180] degrees
if pitch > 90:
    pitch -= 180
elif pitch < -90:
    pitch += 180`}
              </pre>
            </div>

            <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs text-neutral-300 space-y-1">
              <strong className="text-amber-400 block font-mono">Interview Note on Gimbal Lock:</strong>
              <span>
                Standard Euler angle decomposition possesses a trigonometric singularity at pitch = &plusmn;90&deg;. In human conversational video analysis, pitch typically oscillates between [-35&deg;, +35&deg;], well within the singularity-free zone.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION C: Eye Analysis (EAR & Gaze) */}
      {/* ========================================================================= */}
      <section id="section-c" className="space-y-6 pt-6">
        <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
          <div className="p-2.5 rounded-xl bg-purple-400/10 border border-purple-400/30 text-purple-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">Module C</span>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">Eye Aspect Ratio (EAR) &amp; Ocular Kinematics</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
              1. Soukupov&aacute; &amp; Čech Eye Aspect Ratio Formula
            </h3>
            <p>
              To eliminate false blink detections caused by distance variations from the webcam, we utilize the scalar Eye Aspect Ratio (EAR), which is inherently invariant to scale and planar rotations:
            </p>
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-xs text-purple-300 text-center">
              EAR = (||p<sub>2</sub> - p<sub>6</sub>|| + ||p<sub>3</sub> - p<sub>5</sub>||) / (2.0 &bull; ||p<sub>1</sub> - p<sub>4</sub>||)
            </div>
            <p>
              Where <code className="font-mono">p<sub>1</sub>, p<sub>4</sub></code> are the medial and lateral eye corners (canthi), and <code className="font-mono">p<sub>2</sub>, p<sub>3</sub>, p<sub>5</sub>, p<sub>6</sub></code> are vertical eyelid margin coordinates.
            </p>

            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider pt-2">
              2. Blink Debouncing Logic
            </h3>
            <p>
              A physiological human blink has a characteristic duration between 100 ms and 400 ms. We enforce a temporal state machine:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-400">
              <li><strong className="text-neutral-200">Palpebral Occlusion Limit:</strong> EAR falls below 0.20 for &gt;= 2 consecutive sampled frames.</li>
              <li><strong className="text-neutral-200">Re-Opening Confirmation:</strong> EAR recovers above 0.24.</li>
              <li><strong className="text-neutral-200">Debounce Window:</strong> Events within 300 ms of each other are merged to prevent flicker artifacts.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
              3. Iris Centroid Vector &amp; Gaze Classification
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Gaze direction is computed by measuring the ratio of the iris center (landmarks 468/473) relative to the medial and lateral canthi:
            </p>

            <div className="p-4 rounded-2xl bg-black/60 border border-neutral-800 font-mono text-xs space-y-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                Gaze Vector Logic (backend/app/cv_engine/gaze_estimator.py)
              </span>
              <pre className="text-purple-300 whitespace-pre overflow-x-auto">
{`# Horizontal eye center ratio: [0.0 = Far Left, 1.0 = Far Right]
h_ratio = (iris.x - eye_inner.x) / (eye_outer.x - eye_inner.x)

if h_ratio < 0.40:
    gaze_dir = "Right"  # Mirrored camera frame
elif h_ratio > 0.60:
    gaze_dir = "Left"
else:
    gaze_dir = "Center"`}
              </pre>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 space-y-1">
              <strong className="text-neutral-200 block">Geometric Limitations:</strong>
              <span>
                Monocular webcam gaze estimation provides approximate sector classifications (&ldquo;Center&rdquo;, &ldquo;Left&rdquo;, &ldquo;Right&rdquo;, &ldquo;Up&rdquo;, &ldquo;Down&rdquo;). It is not equivalent to specialized pupillometry or corneo-reflection hardware.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION D: Facial Kinematics (FACS Action Units) */}
      {/* ========================================================================= */}
      <section id="section-d" className="space-y-6 pt-6">
        <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
          <div className="p-2.5 rounded-xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-400">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Module D</span>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">Facial Kinematics &amp; Observable FACS Grounding</h2>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
          <p>
            VisionKinematics bridges raw 478 3D landmarks with Paul Ekman's Facial Action Coding System (FACS) by mapping measured sub-pixel displacements and 52 neural blendshapes to specific muscular actions:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-amber-400 font-bold">AU12</span>
                <span className="text-neutral-500">Zygomatic</span>
              </div>
              <h4 className="text-xs font-bold text-neutral-200">Lip Corner Puller</h4>
              <p className="text-[11px] text-neutral-400">
                Composite of <code className="text-amber-300">mouthSmileLeft</code> and <code className="text-amber-300">mouthSmileRight</code>. Quantifies observable mouth corner retraction.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-sky-400 font-bold">AU1+2</span>
                <span className="text-neutral-500">Frontalis</span>
              </div>
              <h4 className="text-xs font-bold text-neutral-200">Brow Elevation</h4>
              <p className="text-[11px] text-neutral-400">
                Composite of <code className="text-sky-300">browOuterUp</code> and <code className="text-sky-300">browInnerUp</code>. Measures upward displacement of eyebrow vertices relative to eyes.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-amber-400 font-bold">AU4</span>
                <span className="text-neutral-500">Corrugator</span>
              </div>
              <h4 className="text-xs font-bold text-neutral-200">Brow Furrow</h4>
              <p className="text-[11px] text-neutral-400">
                Measured via <code className="text-amber-300">browDown</code> blendshape and horizontal canthal distance convergence between medial eyebrow points.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-purple-400 font-bold">AU25+26</span>
                <span className="text-neutral-500">Pterygoid</span>
              </div>
              <h4 className="text-xs font-bold text-neutral-200">Jaw Separation</h4>
              <p className="text-[11px] text-neutral-400">
                Quantified via <code className="text-purple-300">jawOpen</code> and Euclidean distance between upper (landmark 13) and lower (landmark 14) inner vermilion borders.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-rose-400 font-bold">AU45</span>
                <span className="text-neutral-500">Orbicularis Oculi</span>
              </div>
              <h4 className="text-xs font-bold text-neutral-200">Palpebral Closure</h4>
              <p className="text-[11px] text-neutral-400">
                Directly calculated from continuous scalar Eye Aspect Ratio (EAR) normalization: <code className="text-rose-300">clamp((0.32 - EAR) / 0.16)</code>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION E: Backend Architecture */}
      {/* ========================================================================= */}
      <section id="section-e" className="space-y-6 pt-6">
        <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
          <div className="p-2.5 rounded-xl bg-rose-400/10 border border-rose-400/30 text-rose-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">Module E</span>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">FastAPI, PostgreSQL &amp; Worker Architecture</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
              1. Threaded Asynchronous Task Manager
            </h3>
            <p>
              Video analysis is CPU-bound. FastAPI dispatches long-running analysis jobs to background daemon worker threads (<code className="font-mono">BackgroundTaskManager</code> in <code className="text-amber-400 font-mono">task_queue.py</code>), preventing HTTP connection timeouts and keeping the async event loop non-blocking.
            </p>
            <p>
              Clients poll <code className="text-sky-300 font-mono">GET /api/analysis/:id/status</code> to receive real-time progress percentages (0.0% to 100.0%).
            </p>

            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider pt-2">
              2. Orphaned Session Auto-Recovery (Phase 6 Hardening)
            </h3>
            <p>
              In cloud containerized environments (such as Railway or Kubernetes), worker containers may be recycled mid-processing. We registered an orphaned job recovery handler inside FastAPI's <code className="font-mono">lifespan</code> hook:
            </p>
            <div className="p-3 rounded-xl bg-black/60 border border-neutral-800 font-mono text-xs text-neutral-300">
              Upon startup, any job remaining in 'pending' or 'processing' with no active in-memory worker thread is transitioned to 'failed' with a descriptive error message.
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
              3. Security: Signed Ephemeral Streaming Tickets
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Standard Bearer authentication headers cannot be passed inside native HTML5 <code className="text-amber-400 font-mono">&lt;video&gt;</code> elements. Rather than insecure permanent URL tokens, we engineered a cryptographic ticket mechanism:
            </p>

            <div className="p-4 rounded-2xl bg-black/60 border border-neutral-800 font-mono text-xs space-y-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                HMAC-SHA256 Ticket (backend/app/utils/security.py)
              </span>
              <pre className="text-rose-300 whitespace-pre overflow-x-auto">
{`payload = {
    "sub": user_id,
    "res_id": video_id,        # Scoped strictly to this video
    "scope": "media_stream",   # Restricted scope
    "exp": now() + 15_minutes  # Short TTL
}
ticket = jwt.encode(payload, SECRET_KEY, algorithm="HS256")`}
              </pre>
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 space-y-1">
              <strong className="text-neutral-200 block">Cross-User Isolation:</strong>
              <span>
                Attempting to use a ticket generated for Video A to stream Video B returns 401 Unauthorized. User B attempting to generate a ticket for User A's video returns 404 Not Found.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION F: Frontend Architecture */}
      {/* ========================================================================= */}
      <section id="section-f" className="space-y-6 pt-6">
        <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
          <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Module F</span>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-100">Frontend Architecture &amp; Frame Synchronization</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
              1. React 18, Vite &amp; TypeScript Stack
            </h3>
            <p>
              The frontend is engineered as a zero-latency Single Page Application (SPA) using React 18, Vite, Tailwind CSS, Lucide icons, and Recharts. Production builds bundle 2,163 modules into minified assets in under 8 seconds.
            </p>

            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider pt-2">
              2. Frame-Accurate Telemetry Synchronization
            </h3>
            <p>
              The central challenge in video telemetry is synchronizing high-frequency computer vision measurements with non-deterministic browser HTML5 video playback.
            </p>
            <p>
              We implemented a binary search / nearest-timestamp lookup memoized on <code className="text-amber-400 font-mono">[metrics, currentTime]</code>. When the video playback fires <code className="font-mono">timeupdate</code> (approx. every 15–30 ms), the application instantaneously retrieves the closest metric record, re-rendering:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-400 text-xs">
              <li>Canvas 478 MediaPipe landmark wireframe polylines.</li>
              <li>solvePnP Euler angle gauges (Yaw, Pitch, Roll).</li>
              <li>Ocular EAR and active blink indicators.</li>
              <li>FACS Action Unit muscular activation bars.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">
              3. Click-to-Seek Event Alignment
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Every timestamped event in the Visual Event Stream maintains an exact <code className="font-mono">timestamp</code> float. Clicking any event executes a clamped seek on the underlying HTML5 video DOM element:
            </p>

            <div className="p-4 rounded-2xl bg-black/60 border border-neutral-800 font-mono text-xs space-y-2">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">
                Synchronized Seek Handler (frontend/src/pages/AnalysisWorkspace.tsx)
              </span>
              <pre className="text-amber-300 whitespace-pre overflow-x-auto">
{`const seekTo = (seconds: number) => {
  const clamped = Math.max(0, Math.min(seconds, duration || 100));
  if (videoRef.current) {
    videoRef.current.currentTime = clamped;
  }
  setCurrentTime(clamped);
};`}
              </pre>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
              <span className="text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider block">
                Verification &amp; Architecture Summary
              </span>
              <p className="text-xs text-neutral-400 leading-relaxed">
                VisionKinematics bridges academic computer vision geometry with modern production web engineering, operating completely locally with zero third-party cloud AI dependencies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ETHICAL & SCIENTIFIC DELIMITATION FOOTNOTE */}
      <section className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start gap-3 text-xs text-neutral-400 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-neutral-200">Ethical AI Statement:</strong> Computer vision can reliably measure physical kinematics—such as head rotation angles, palpebral apertures, and facial landmark coordinates. It cannot determine human emotional truth, intent, or deception. VisionKinematics enforces this scientific boundary throughout its architecture, reports, and UI.
        </div>
      </section>
    </div>
  );
};
