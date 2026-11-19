import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  Github,
  Zap,
  Eye,
  Compass,
  Activity,
  FileText,
  GitCompare,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Code2,
  Database,
  Shield,
} from 'lucide-react';

interface Props {
  onOpenAuth: () => void;
}

const features = [
  {
    icon: Layers,
    title: '478-Point Facial Mesh',
    desc: 'Full MediaPipe FaceMesh landmark extraction with sub-pixel 3D coordinates from every analysed frame.',
    tag: 'MediaPipe Tasks',
  },
  {
    icon: Compass,
    title: 'Head Pose Estimation',
    desc: 'OpenCV solvePnP perspective-n-point geometry calculates yaw, pitch and roll in calibrated 3D space.',
    tag: 'OpenCV solvePnP',
  },
  {
    icon: Eye,
    title: 'Gaze & EAR Analysis',
    desc: 'Iris vector estimation, Eye Aspect Ratio blink detection and gaze-direction classification per frame.',
    tag: 'Iris Landmarks',
  },
  {
    icon: Activity,
    title: 'Facial Kinematics',
    desc: 'FACS-mapped blendshape measurements: AU12 (smile), AU4 (furrow), AU25/26 (lips), AU45 (blink).',
    tag: 'FACS Blendshapes',
  },
  {
    icon: Zap,
    title: 'Interactive Workspace',
    desc: 'Frame-synced video player, live 478-point wireframe overlay, waveform timeline and event log.',
    tag: 'Real-Time Mesh',
  },
  {
    icon: FileText,
    title: 'Research-Grade PDF',
    desc: 'Matplotlib-rendered time-series charts, kinematic distributions and measurement summaries in a downloadable PDF.',
    tag: 'ReportLab PDF',
  },
  {
    icon: GitCompare,
    title: 'Session Comparison',
    desc: 'Side-by-side radar and time-series comparison of two analysis sessions with per-metric deltas.',
    tag: 'Multi-Session',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    desc: 'JWT + bcrypt auth, HMAC-SHA256 streaming tickets, per-user isolation, cross-tenant ownership checks.',
    tag: 'Security First',
  },
];

const pipeline = [
  { step: '01', label: 'Video Upload', detail: 'MP4 / MOV / AVI accepted. Stored with per-user ownership.' },
  { step: '02', label: 'Frame Sampling', detail: 'Configurable FPS sampling extracts frames for processing.' },
  { step: '03', label: 'Face Detection', detail: 'MediaPipe Tasks FaceMesh locates the face in each frame.' },
  { step: '04', label: '478 Landmarks', detail: 'Sub-pixel 3D coordinates extracted for all 478 facial points.' },
  { step: '05', label: 'Head Pose (solvePnP)', detail: 'PnP geometry estimates Euler yaw, pitch, roll angles.' },
  { step: '06', label: 'Gaze & EAR', detail: 'Iris vectors + Eye Aspect Ratio for gaze direction and blinks.' },
  { step: '07', label: 'FACS Kinematics', detail: 'MediaPipe blendshapes mapped to AU metric measurements.' },
  { step: '08', label: 'PDF Report', detail: 'Research-grade charts, timelines and summaries generated.' },
];

const techStack = [
  { name: 'MediaPipe', role: 'Face Mesh & Blendshapes' },
  { name: 'OpenCV', role: 'solvePnP Head Pose' },
  { name: 'FastAPI', role: 'Async REST Backend' },
  { name: 'PostgreSQL', role: 'Session Storage' },
  { name: 'React 18', role: 'Interactive Frontend' },
  { name: 'TypeScript', role: 'Type-Safe Client' },
  { name: 'ReportLab', role: 'PDF Generation' },
  { name: 'Matplotlib', role: 'Chart Rendering' },
];

const faqs = [
  {
    q: 'What data does Framewise collect from the video?',
    a: 'Framewise extracts 478 3D facial landmark coordinates, head-pose Euler angles, Eye Aspect Ratio values and MediaPipe blendshape weights per sampled frame. No biometric identity inference is performed and no data is shared with third parties.',
  },
  {
    q: 'Are the facial measurements real or generated?',
    a: 'All measurements are derived directly from MediaPipe and OpenCV computations on the actual uploaded video. No interpolation or synthetic values are used for primary visualizations.',
  },
  {
    q: 'Does Framewise claim to detect emotions?',
    a: 'No. Framewise measures observable facial movements and kinematics. It does not claim to infer a person\'s true emotional state, personality, or psychological condition. Measured movements are clearly distinguished from inferred patterns.',
  },
  {
    q: 'What video formats are supported?',
    a: 'MP4, MOV, and AVI files are accepted. Standard web-compatible codecs (H.264, H.265) work best.',
  },
];

export const LandingPage: React.FC<Props> = ({ onOpenAuth }) => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="fw-gradient-bg min-h-screen">

      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 w-full border-b border-[#1E1E2A] bg-[#08090C]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center group-hover:bg-violet-500/25 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <span className="font-bold text-base text-[#F5F5F7] tracking-tight">Framewise</span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#A1A1AA]">
            <button onClick={() => navigate('/demo')} className="hover:text-violet-400 transition">Live Demo</button>
            <button onClick={() => navigate('/technical-overview')} className="hover:text-violet-400 transition">Engineering</button>
            <button onClick={() => { const el = document.getElementById('features'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#F5F5F7] transition">Features</button>
            <button onClick={() => { const el = document.getElementById('pipeline'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#F5F5F7] transition">Pipeline</button>
            <button onClick={() => { const el = document.getElementById('faq'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-[#F5F5F7] transition">FAQ</button>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuth}
              className="hidden sm:block px-4 py-1.5 text-sm font-medium text-[#A1A1AA] hover:text-[#F5F5F7] transition"
            >
              Sign In
            </button>
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition shadow-sm"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-500/8 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 border border-violet-500/25 text-violet-400 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Research-Grade Computer Vision Platform
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#F5F5F7] leading-tight tracking-tight mb-6">
            Visual Intelligence,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-500">
              Made Measurable.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed mb-10">
            Upload any video and extract 478-point facial landmarks, 3D head pose, Eye Aspect Ratio, and FACS-mapped facial kinematics — frame by frame, with a downloadable research-grade PDF report.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition shadow-lg shadow-violet-500/20"
            >
              Start Analyzing Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/demo')}
              className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-[#A1A1AA] bg-[#101116] border border-[#1E1E2A] hover:border-violet-500/40 hover:text-[#F5F5F7] rounded-xl transition"
            >
              <Play className="w-4 h-4" />
              View Demo
            </button>
          </div>

          {/* Social proof line */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-[#A1A1AA]">
            {[
              '478-Point Facial Mesh',
              'OpenCV solvePnP',
              'FACS Blendshapes',
              'Research PDF',
              '36 / 36 Tests Passing',
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F7] tracking-tight">
              Every measurement, traceable to source data
            </h2>
            <p className="mt-4 text-[#A1A1AA] max-w-xl mx-auto text-sm">
              Framewise computes observable facial movements from real video frames. No interpolation. No synthetic data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc, tag }) => (
              <div
                key={title}
                className="group p-5 rounded-xl bg-[#101116] border border-[#1E1E2A] hover:border-violet-500/30 transition-all"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition">
                  <Icon className="w-4.5 h-4.5 text-violet-400" style={{ width: 18, height: 18 }} />
                </div>
                <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#08090C] border border-[#1E1E2A] text-[#A1A1AA] mb-3">
                  {tag}
                </div>
                <h3 className="text-sm font-bold text-[#F5F5F7] mb-2">{title}</h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pipeline ─── */}
      <section id="pipeline" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#101116] border-y border-[#1E1E2A]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Processing Pipeline</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F7] tracking-tight">
              From video upload to research report
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pipeline.map(({ step, label, detail }) => (
              <div key={step} className="relative p-5 rounded-xl bg-[#08090C] border border-[#1E1E2A] hover:border-violet-500/30 transition group">
                <div className="text-[11px] font-mono font-bold text-violet-500 mb-3">{step}</div>
                <h3 className="text-sm font-bold text-[#F5F5F7] mb-2">{label}</h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">{detail}</p>
                <ChevronRight className="absolute top-5 right-4 w-4 h-4 text-[#1E1E2A] group-hover:text-violet-500/50 transition lg:block hidden" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tech Stack ─── */}
      <section id="technology" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Technology</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F7] tracking-tight">
              Built on proven computer vision foundations
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {techStack.map(({ name, role }) => (
              <div key={name} className="p-4 rounded-xl bg-[#101116] border border-[#1E1E2A] hover:border-violet-500/25 transition text-center group">
                <Code2 className="w-5 h-5 text-violet-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-bold text-[#F5F5F7]">{name}</p>
                <p className="text-[11px] text-[#A1A1AA] mt-1">{role}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-5 rounded-xl bg-violet-500/5 border border-violet-500/15 text-center">
            <Database className="w-5 h-5 text-violet-400 mx-auto mb-2" />
            <p className="text-sm text-[#A1A1AA] max-w-xl mx-auto">
              All computations run <span className="text-violet-400 font-semibold">server-side</span> using the same MediaPipe and OpenCV libraries used in production research applications. Results are stored in PostgreSQL and scoped to your authenticated account.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Ethics & Privacy ─── */}
      <section id="privacy" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#101116] border-y border-[#1E1E2A]">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-8 h-8 text-violet-400 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-[#F5F5F7] mb-4">Ethics &amp; Privacy</h2>
          <p className="text-sm text-[#A1A1AA] leading-relaxed mb-6">
            Framewise measures <strong className="text-[#F5F5F7]">observable facial geometry and movement</strong> — not emotions, personality or psychological states.
            Blendshape weights are labelled as <em>measured facial movements</em>, never inferred internal states.
            Your video data is stored only in your authenticated account and is never shared with third parties.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-[#A1A1AA]">
            {[
              'Measurements ≠ Emotions',
              'Per-user data isolation',
              'Streaming ticket auth',
              'No third-party sharing',
              'Transparent labelling',
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#08090C] border border-[#1E1E2A] rounded-full">
                <CheckCircle2 className="w-3 h-3 text-violet-400" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl font-extrabold text-[#F5F5F7] tracking-tight">Common questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl bg-[#101116] border border-[#1E1E2A] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left gap-4"
                >
                  <span className="text-sm font-semibold text-[#F5F5F7]">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#A1A1AA] shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-xs text-[#A1A1AA] leading-relaxed border-t border-[#1E1E2A] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-violet-500/5 blur-3xl rounded-full" />
          </div>
          <div className="relative z-10 p-10 rounded-2xl bg-[#101116] border border-violet-500/20">
            <h2 className="text-3xl font-extrabold text-[#F5F5F7] mb-4 tracking-tight">
              Ready to analyse your video?
            </h2>
            <p className="text-sm text-[#A1A1AA] mb-8">
              Upload a recording and get a full 478-point facial analysis with head pose, gaze, kinematics and a downloadable research PDF — in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-2 px-7 py-3 text-base font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition shadow-lg shadow-violet-500/20"
              >
                Start Analysing Free
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/demo')}
                className="inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold text-[#A1A1AA] bg-[#08090C] border border-[#1E1E2A] hover:border-violet-500/40 hover:text-[#F5F5F7] rounded-xl transition"
              >
                <Play className="w-4 h-4" />
                View Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#1E1E2A] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <span className="font-bold text-sm text-[#F5F5F7]">Framewise</span>
              </div>
              <p className="text-xs text-[#A1A1AA] max-w-xs leading-relaxed">
                Research-grade computer vision. Visual Intelligence, Made Measurable.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="text-xs font-semibold text-[#F5F5F7] mb-3">Product</p>
                <div className="space-y-2">
                  <button onClick={() => navigate('/demo')} className="block text-xs text-[#A1A1AA] hover:text-violet-400 transition">Live Demo</button>
                  <button onClick={() => navigate('/technical-overview')} className="block text-xs text-[#A1A1AA] hover:text-violet-400 transition">Engineering</button>
                  <button onClick={onOpenAuth} className="block text-xs text-[#A1A1AA] hover:text-violet-400 transition">Get Started</button>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#F5F5F7] mb-3">Technology</p>
                <div className="space-y-2 text-xs text-[#A1A1AA]">
                  <p>MediaPipe Tasks</p>
                  <p>OpenCV solvePnP</p>
                  <p>FastAPI + PostgreSQL</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#F5F5F7] mb-3">Resources</p>
                <div className="space-y-2">
                  <a href="https://github.com/Devviknesh/VisionKinematics" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-violet-400 transition">
                    <Github className="w-3 h-3" /> GitHub
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  <a href="https://backend-production-3edefbc4.up.railway.app/docs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-violet-400 transition">
                    API Docs
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#1E1E2A] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#A1A1AA]">
            <p>© 2026 Framewise. Engineered with MediaPipe, OpenCV, FastAPI &amp; React.</p>
            <p>478-Point Facial Mesh · solvePnP Head Pose · Research-Grade PDF</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
