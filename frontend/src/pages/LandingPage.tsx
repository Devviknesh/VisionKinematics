import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ScanFace, 
  Compass, 
  Eye, 
  Smile, 
  Clock, 
  BarChart2, 
  FileCheck2, 
  ShieldCheck, 
  ArrowRight,
  Cpu,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Video,
  Play,
  FileText,
  Lock,
  Database,
  Terminal,
  Activity,
  Maximize2
} from 'lucide-react';

interface Props {
  onStart: () => void;
  onExploreFeatures?: () => void;
}

export const LandingPage: React.FC<Props> = ({ onStart }) => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const techStack = [
    { name: 'Python 3.11', desc: 'Core CV runtime & background execution', icon: Terminal, color: 'text-amber-400' },
    { name: 'OpenCV', desc: 'Perspective-n-Point pose & frame synthesis', icon: Cpu, color: 'text-sky-400' },
    { name: 'MediaPipe 3D', desc: '478-point sub-pixel facial landmarker', icon: ScanFace, color: 'text-emerald-400' },
    { name: 'FastAPI', desc: 'Asynchronous REST APIs & job queuing', icon: Activity, color: 'text-teal-400' },
    { name: 'React & Vite', desc: 'Responsive high-performance dashboard', icon: Layers, color: 'text-indigo-400' },
    { name: 'SQLAlchemy', desc: 'Relational metrics & session persistence', icon: Database, color: 'text-rose-400' },
  ];

  const features = [
    {
      num: '01',
      title: 'Facial Landmark Detection',
      tag: '478 3D Points',
      desc: 'Tracks structural facial contours across eye boundaries, eyebrows, nasal ridge, and lip perimeters with missing-face resilience and sub-pixel accuracy.',
      icon: ScanFace,
      accent: 'amber'
    },
    {
      num: '02',
      title: 'Head Pose Estimation',
      tag: 'OpenCV solvePnP',
      desc: 'Accurately computes continuous 3D rotational Euler angles: Yaw (lateral rotation), Pitch (vertical tilt), and Roll (head inclination) without intrusive hardware.',
      icon: Compass,
      accent: 'sky'
    },
    {
      num: '03',
      title: 'Gaze Direction Estimation',
      tag: 'EAR & Iris Vectors',
      desc: 'Calculates horizontal and vertical iris displacement vectors combined with Eye Aspect Ratio (EAR) to identify gaze shifts and blink timing intervals.',
      icon: Eye,
      accent: 'emerald'
    },
    {
      num: '04',
      title: 'Facial Expression Analysis',
      tag: 'Observable Blendshapes',
      desc: 'Measures physical kinematics including bilateral mouth corner retraction, eyebrow furrowing/elevation, and jaw separation—strictly labeled as physical motion.',
      icon: Smile,
      accent: 'purple'
    },
    {
      num: '05',
      title: 'Timestamped Visual Events',
      tag: 'Debounced Stream',
      desc: 'Transforms noisy continuous frame metrics into discrete, actionable visual events with customizable threshold hysteresis and click-to-seek video synchronization.',
      icon: Clock,
      accent: 'rose'
    },
    {
      num: '06',
      title: 'Interactive Analytics & Reports',
      tag: 'Executive PDF Export',
      desc: 'Synthesizes orientation distributions, gaze charts, and session metrics into comprehensive Recharts dashboards and printable ReportLab PDF dossiers.',
      icon: BarChart2,
      accent: 'teal'
    }
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Upload Video',
      desc: 'Drop standard MP4, MOV, AVI, or WebM recorded videos. Validates codecs, FPS, and resolution locally.',
      icon: Video
    },
    {
      step: '02',
      title: 'Computer Vision Processing',
      desc: 'Executes MediaPipe Face Landmarker Tasks API and OpenCV Perspective-n-Point pose modeling per sampled frame.',
      icon: Cpu
    },
    {
      step: '03',
      title: 'Visual Event Detection',
      desc: 'Debounces continuous measurements to identify discreet kinematic transitions, turns, tilts, and gaze shifts.',
      icon: Clock
    },
    {
      step: '04',
      title: 'Interactive Analytics',
      desc: 'Inspect frame-by-frame HUD overlays, playback timeline event markers, and distribution charts.',
      icon: BarChart2
    },
    {
      step: '05',
      title: 'Download Report',
      desc: 'Generate a downloadable, publication-grade executive PDF summary with comprehensive session audits.',
      icon: FileCheck2
    }
  ];

  const faqs = [
    {
      q: 'Does VisionKinematics claim to read emotions or inner psychology?',
      a: 'No. VisionKinematics strictly measures and reports observable physical kinematics—such as geometric angles of the head (Yaw, Pitch, Roll in degrees) and surface muscle displacements (e.g. mouth corner retraction in centimeters/pixels). The system adheres to scientific standards and never asserts emotional certainty, psychological condition, personality traits, or cognitive honesty.'
    },
    {
      q: 'Where is the video processed? Are my recordings sent to the cloud?',
      a: 'All video analysis executes 100% locally on your machine via the local FastAPI backend, OpenCV, and MediaPipe models. No video frames, landmark coordinates, or user information are transmitted to third-party cloud APIs.'
    },
    {
      q: 'What video formats and durations are supported?',
      a: 'VisionKinematics natively supports MP4, MOV, AVI, WebM, and MKV video formats. The engine performs frame sampling (typically 5.0 to 15.0 FPS) to balance extreme precision with fast processing times on everyday hardware.'
    },
    {
      q: 'Can I delete uploaded videos and analysis data?',
      a: 'Yes. You have full user control to delete any video and its associated landmarks, visual events, and PDF reports at any time with a single click from the Sessions dashboard.'
    },
    {
      q: 'How does the annotated preview overlay work?',
      a: 'During analysis, the engine can synthesize an optional secondary video containing an augmented HUD overlay: 3D bounding mesh, facial contours, orientation vector axes, and live kinematic metrics directly superimposed on the original frames.'
    }
  ];

  return (
    <div className="space-y-24 sm:space-y-32 pb-16">
      
      {/* 1. HERO SECTION */}
      <section id="product" className="relative pt-6 sm:pt-12 text-center max-w-5xl mx-auto px-4">
        {/* Subtle radial gradient background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-neutral-900 border border-neutral-700/80 text-neutral-300 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>AI-Powered Video Analysis &amp; Facial Emotion Recognition System</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-neutral-100 leading-[1.12]">
          Understand the Visual Patterns <br />
          <span className="text-amber-400">
            Behind Every Interaction.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
          Transform recorded videos into structured visual insights using computer vision, 
          478-point facial landmark geometry, OpenCV solvePnP head pose estimation, and observable Action Units—with research-grade accuracy and strict tenant security.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onStart}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm sm:text-base transition-all duration-150 shadow-lg shadow-amber-400/20 transform hover:-translate-y-0.5"
          >
            <span>Launch Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/demo')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold text-xs sm:text-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Interactive Demo</span>
          </button>

          <button
            onClick={() => navigate('/technical-overview')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 font-medium text-xs sm:text-sm transition-all"
          >
            <Cpu className="w-4 h-4 text-sky-400" />
            <span>Technical Overview</span>
          </button>

          <a
            href="https://github.com/Devviknesh/VisionKinematics"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 font-medium text-xs sm:text-sm transition-all"
          >
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>GitHub</span>
          </a>

          <a
            href="https://backend-production-3edefbc4.up.railway.app/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 font-medium text-xs sm:text-sm transition-all"
          >
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Swagger API</span>
          </a>
        </div>

        {/* Metric Badges Strip */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Mesh Density</p>
            <p className="text-xl sm:text-2xl font-bold text-neutral-100 mt-1">478 Points</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">MediaPipe 3D Landmarker</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Head Pose</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">solvePnP 3D</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Yaw, Pitch &amp; Roll (deg)</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Gaze Tracking</p>
            <p className="text-xl sm:text-2xl font-bold text-neutral-100 mt-1">EAR &amp; Iris</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Palpebral aperture vectors</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <p className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Cloud Hosting</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">Railway &amp; Vercel</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">FastAPI &amp; PostgreSQL DB</p>
          </div>
        </div>

        {/* Product Dashboard Preview (ScrewFast-style framed window mockup) */}
        <div className="mt-14 relative rounded-2xl border border-neutral-700/80 bg-neutral-950 p-2 sm:p-4 shadow-2xl overflow-hidden group">
          {/* OS Window Chrome */}
          <div className="flex items-center justify-between pb-3 px-2 border-b border-neutral-800/80 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-xs font-mono text-neutral-500 hidden sm:inline">VisionKinematics &mdash; Live Workspace & Analytics Session</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="px-2 py-0.5 rounded bg-neutral-900 text-[10px] font-mono text-amber-400 border border-neutral-800">FPS: 20.0</span>
              <span className="px-2 py-0.5 rounded bg-neutral-900 text-[10px] font-mono text-emerald-400 border border-neutral-800">STATUS: TRACKING</span>
            </div>
          </div>

          {/* Inner Simulated Workspace Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-left">
            {/* Left simulated player */}
            <div className="lg:col-span-8 bg-neutral-900/90 rounded-xl p-3 border border-neutral-800 flex flex-col justify-between aspect-video relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-neutral-950/20" />
              
              {/* Overlay HUD indicators */}
              <div className="relative z-10 flex items-center justify-between text-xs font-mono text-neutral-300">
                <div className="flex items-center gap-2 bg-neutral-950/70 backdrop-blur px-2.5 py-1 rounded-md border border-neutral-800">
                  <ScanFace className="w-3.5 h-3.5 text-amber-400" />
                  <span>FACE #1: 478 LANDMARKS ACQUIRED</span>
                </div>
                <div className="bg-neutral-950/70 backdrop-blur px-2 py-1 rounded-md text-[10px] text-neutral-400 border border-neutral-800">
                  HUD OVERLAY: ON
                </div>
              </div>

              {/* Center visual representation */}
              <div className="relative z-10 self-center text-center py-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-dashed border-amber-400/50 mx-auto flex items-center justify-center relative">
                  <div className="w-16 h-16 rounded-full bg-amber-400/10 flex items-center justify-center">
                    <ScanFace className="w-8 h-8 text-amber-400" />
                  </div>
                  {/* Orientation Vector line */}
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="mt-3 text-xs font-mono text-neutral-300">solvePnP: Yaw -12.4° | Pitch +4.1° | Roll -1.8°</p>
              </div>

              {/* Bottom Playback bar */}
              <div className="relative z-10 bg-neutral-950/80 backdrop-blur p-2 rounded-lg border border-neutral-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-amber-400 flex items-center justify-center text-neutral-950">
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </span>
                  <span className="font-mono text-neutral-300">00:02.4 / 00:05.0</span>
                </div>
                <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden mx-2">
                  <div className="h-full bg-amber-400 w-1/2 rounded-full" />
                </div>
                <span className="text-[11px] text-amber-400 font-medium">SMILE_DETECTED</span>
              </div>
            </div>

            {/* Right simulated panels */}
            <div className="lg:col-span-4 flex flex-col gap-2.5">
              <div className="bg-neutral-900/80 rounded-xl p-3 border border-neutral-800">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-200 mb-2">
                  <span className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-amber-400" /> Head Orientation</span>
                  <span className="text-amber-400 text-[10px] font-mono">3D POSE</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
                    <span>Yaw (L/R)</span>
                    <span className="text-neutral-200">-12.4° (Left)</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full w-[40%]" />
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
                    <span>Pitch (Up/Down)</span>
                    <span className="text-neutral-200">+4.1° (Level)</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[52%]" />
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900/80 rounded-xl p-3 border border-neutral-800 flex-1">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-200 mb-2">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" /> Recent Visual Events</span>
                  <span className="text-neutral-500 text-[10px]">SYNCED</span>
                </div>
                <div className="space-y-1.5">
                  <div className="p-1.5 rounded bg-neutral-950/70 border border-neutral-800 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-300 font-medium">Head Turned Left</span>
                    <span className="font-mono text-amber-400 text-[10px]">01.20s</span>
                  </div>
                  <div className="p-1.5 rounded bg-neutral-950/70 border border-neutral-800 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-300 font-medium">Observable Smile</span>
                    <span className="font-mono text-emerald-400 text-[10px]">02.10s</span>
                  </div>
                  <div className="p-1.5 rounded bg-neutral-950/70 border border-neutral-800 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-300 font-medium">Gaze Direction Down</span>
                    <span className="font-mono text-sky-400 text-[10px]">03.40s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL SYSTEM ARCHITECTURE & PRODUCTION EVIDENCE SHOWCASE */}
      <section id="architecture" className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-950/70 border border-sky-800/80 text-sky-300 mb-3">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>End-to-End System Design</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-neutral-100">
            System Architecture &amp; Production Evidence
          </h2>
          <p className="mt-3 text-sm sm:text-base text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            Engineered as a modular, high-throughput computer vision pipeline. Validated on genuine multi-scenario video recordings and deployed on managed cloud infrastructure.
          </p>
        </div>

        {/* Pipeline Architecture Flow */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-12 text-left">
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">Step 01</span>
            <h3 className="text-xs font-bold text-neutral-100">Chunked Ingestion</h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">1MB chunk streaming, extension verification, OpenCV codec &amp; duration validation.</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
            <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider">Step 02</span>
            <h3 className="text-xs font-bold text-neutral-100">MediaPipe 478 Mesh</h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">Dense 3D sub-pixel coordinates and 52 facial blendshapes extracted per sampled frame.</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">Step 03</span>
            <h3 className="text-xs font-bold text-neutral-100">solvePnP Cranial Pose</h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">Anthropometric 3D cranial model minimization decomposing true Euler Pitch, Yaw, and Roll.</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
            <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">Step 04</span>
            <h3 className="text-xs font-bold text-neutral-100">FACS Action Units</h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">Quantifiable AU12, AU1+2, AU4, AU25+26, and AU45 blink timing via geometric EAR.</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-2">
            <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">Step 05</span>
            <h3 className="text-xs font-bold text-neutral-100">Research PDF Dossier</h3>
            <p className="text-[11px] text-neutral-400 leading-relaxed">ReportLab &amp; Matplotlib dynamic 4-page academic reports with real frame landmark overlays.</p>
          </div>
        </div>

        {/* Genuine Production Screenshots Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Card 1 */}
          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 overflow-hidden flex flex-col group hover:border-neutral-700 transition">
            <div className="aspect-[16/10] overflow-hidden bg-neutral-950 relative border-b border-neutral-800">
              <img 
                src="/evidence/workspace_preview.png" 
                alt="Interactive Analysis Workspace" 
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-800 text-[10px] font-mono text-amber-400">
                LIVE WORKSPACE
              </div>
            </div>
            <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-100">Real-Time Analysis Workspace</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Interactive frame-accurate video player synchronized with continuous 3D Euler angle waveforms, live 478 MediaPipe landmark vector canvas, and FACS action units.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 overflow-hidden flex flex-col group hover:border-neutral-700 transition">
            <div className="aspect-[16/10] overflow-hidden bg-neutral-950 relative border-b border-neutral-800">
              <img 
                src="/evidence/compare_preview.png" 
                alt="Session Comparison" 
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-800 text-[10px] font-mono text-sky-400">
                COMPARATIVE QA
              </div>
            </div>
            <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-100">Dual-Session Comparative Radar</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Quantifies longitudinal behavioral shifts across head stability, eye contact percentage, and expressive dynamics with automated delta analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl bg-neutral-900/60 border border-neutral-800 overflow-hidden flex flex-col group hover:border-neutral-700 transition">
            <div className="aspect-[16/10] overflow-hidden bg-neutral-950 relative border-b border-neutral-800">
              <img 
                src="/evidence/report_preview.png" 
                alt="Research-Grade PDF Report" 
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-800 text-[10px] font-mono text-emerald-400">
                PDF DOSSIER
              </div>
            </div>
            <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-100">Research-Grade PDF Dossier</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Generates publication-ready academic reports incorporating Matplotlib time series plots, actual source video frame landmark wireframes, and chronological events.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST AND TECHNOLOGY SECTION */}
      <section id="technology" className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">Scientific Foundation</h2>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-neutral-100">
            Powered by Production-Grade Open Source Computer Vision
          </p>
          <p className="mt-2 text-sm text-neutral-400 max-w-2xl mx-auto">
            Zero proprietary black-box APIs. Engineered exclusively with validated, local computer vision and machine learning frameworks.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {techStack.map((tech) => {
            const Icon = tech.icon;
            return (
              <div 
                key={tech.name} 
                className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition flex flex-col items-center text-center group"
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon className={`w-5 h-5 ${tech.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-neutral-200">{tech.name}</h3>
                <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">{tech.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SIX MAJOR FEATURES SECTION (Bento Grid) */}
      <section id="features" className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">Core Capabilities</h2>
          <p className="mt-2 text-2xl sm:text-4xl font-bold text-neutral-100">
            Comprehensive Non-Verbal Analysis Suite
          </p>
          <p className="mt-2 text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto">
            Six modular, independently validated computer vision modules running in synchronized background pipelines.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div 
                key={feat.title}
                className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-neutral-800/80 border border-neutral-700/80 flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-neutral-950 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-medium text-neutral-500">
                      {feat.num}
                    </span>
                  </div>

                  <div className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-amber-400 border border-neutral-700 mb-2">
                    {feat.tag}
                  </div>

                  <h3 className="text-lg font-bold text-neutral-100 group-hover:text-amber-400 transition-colors">
                    {feat.title}
                  </h3>

                  <p className="mt-2.5 text-xs sm:text-sm text-neutral-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Real-time local processing</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. HOW IT WORKS (Visual Step-by-Step Workflow) */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">Structured Workflow</h2>
          <p className="mt-2 text-2xl sm:text-4xl font-bold text-neutral-100">
            From Raw Video to Structured Intelligence
          </p>
          <p className="mt-2 text-sm text-neutral-400 max-w-xl mx-auto">
            A linear, reproducible 5-stage computer vision pipeline designed for scientific transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {workflowSteps.map((ws, idx) => {
            const Icon = ws.icon;
            return (
              <div 
                key={ws.step}
                className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 relative flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center mb-4">
                    {ws.step}
                  </div>
                  <h3 className="text-sm font-bold text-neutral-100 mb-2">{ws.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{ws.desc}</p>
                </div>
                
                <div className="mt-6 text-neutral-600">
                  <Icon className="w-5 h-5 text-neutral-500" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. ETHICS & PRIVACY COMMITMENT (ScrewFast-style highlight card) */}
      <section id="privacy" className="max-w-5xl mx-auto px-4">
        <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-700 shadow-xl">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Scientific Responsibility</span>
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-100 mt-1">
                  Strict Boundary: Observable Kinematics vs. Psychological Speculation
                </h3>
              </div>

              <p className="text-sm text-neutral-300 leading-relaxed">
                VisionKinematics strictly analyzes <b>observable surface geometric kinematics</b> (Euler head angles, eyelid distances, and facial muscle displacements). The platform explicitly <b>rejects false claims of emotional truth, deception detection, cognitive profiling, or personality inference</b>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-200">Local Processing Only</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Video frames never leave your local hardware boundary.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-200">Zero Facial Recognition</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">No identity matching, database cross-checks, or biometric ID.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-200">Observable Physical Measurements</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Measurements are labeled as physical angles and displacements.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-200">User Data Sovereignty</h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Delete videos and all associated session records at any time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section id="faq" className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">Common Inquiries</h2>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-neutral-100">
            Frequently Asked Questions
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={faq.q}
                className="rounded-xl bg-neutral-900/60 border border-neutral-800 overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-neutral-200 hover:text-amber-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-400 leading-relaxed border-t border-neutral-800/80 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. BOTTOM CALL TO ACTION BANNER */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="p-8 sm:p-12 rounded-2xl bg-neutral-900 border border-neutral-700 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-100">
              Ready to Analyze Your First Video?
            </h2>
            <p className="text-sm sm:text-base text-neutral-400">
              Launch the local computer vision pipeline now. Zero cloud account setup, zero API fees.
            </p>
            <div className="pt-4">
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-sm sm:text-base shadow-lg shadow-amber-400/20 transition-all transform hover:-translate-y-0.5"
              >
                <span>Launch Analysis Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. COMPREHENSIVE FOOTER */}
      <footer className="border-t border-neutral-800 pt-12 pb-8 text-neutral-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <ScanFace className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-neutral-100">VisionKinematics</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Industrial-grade computer vision platform analyzing observable non-verbal communication patterns using 3D facial landmark geometry.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Version 1.0.0 &mdash; Local Execution</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Platform &amp; Code</p>
            <ul className="space-y-1.5 text-xs text-neutral-400">
              <li><button onClick={() => navigate('/demo')} className="text-amber-400 font-semibold hover:text-amber-300 transition">Interactive Demo</button></li>
              <li><button onClick={() => navigate('/technical-overview')} className="text-sky-400 font-semibold hover:text-sky-300 transition">Technical Overview</button></li>
              <li><a href="https://github.com/Devviknesh/VisionKinematics" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 transition">GitHub Repository</a></li>
              <li><a href="https://backend-production-3edefbc4.up.railway.app/docs" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition">Swagger API Documentation</a></li>
              <li><button onClick={() => scrollToSection('architecture')} className="hover:text-amber-400 transition">System Architecture</button></li>
              <li><button onClick={() => scrollToSection('features')} className="hover:text-amber-400 transition">Facial Mesh 478</button></li>
              <li><button onClick={() => scrollToSection('features')} className="hover:text-amber-400 transition">Head Pose solvePnP</button></li>
              <li><button onClick={() => scrollToSection('features')} className="hover:text-amber-400 transition">Executive Reports</button></li>
            </ul>
          </div>

          {/* Technology */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Technology</p>
            <ul className="space-y-1.5 text-xs text-neutral-400">
              <li><span className="text-neutral-300">OpenCV 5.0</span> &mdash; Perspective-n-Point</li>
              <li><span className="text-neutral-300">MediaPipe 1.2</span> &mdash; FaceLandmarker</li>
              <li><span className="text-neutral-300">FastAPI</span> &mdash; Asynchronous Core</li>
              <li><span className="text-neutral-300">React 18</span> &mdash; TypeScript UI</li>
              <li><span className="text-neutral-300">ReportLab</span> &mdash; Dynamic PDF Engine</li>
            </ul>
          </div>

          {/* Ethical Boundaries */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-neutral-200 uppercase tracking-wider">Ethical Compliance</p>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Strictly limited to observable surface geometric kinematics. Never infers emotional truth, personality, or psychological states. Zero cloud data transmission.
            </p>
            <p className="text-[11px] text-neutral-500">
              &copy; 2026 VisionKinematics. All rights reserved.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
};
