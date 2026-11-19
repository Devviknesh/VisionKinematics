import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Compass, 
  Eye, 
  Smile, 
  Clock, 
  FileText, 
  BarChart2, 
  Layers, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Scan,
  Sparkles,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Video as VideoIcon,
  Activity,
  Gauge,
  Sliders,
  Terminal,
  Download,
  Info
} from 'lucide-react';
import { api } from '../api';
import { AnalysisResults, FacialMetric, AnalysisEvent } from '../types';
import { FacialKinematicsOverlay } from '../components/FacialKinematicsOverlay';
import { KinematicsWaveformTimeline } from '../components/KinematicsWaveformTimeline';
import { PipelineExplainer } from '../components/PipelineExplainer';

export const DemoPage: React.FC = () => {
  const navigate = useNavigate();

  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [demoTicket, setDemoTicket] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);

  // Video playback & scrubber state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(4.0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [showWireframeMesh, setShowWireframeMesh] = useState<boolean>(true);
  const [activeGuidedTab, setActiveGuidedTab] = useState<'overview' | 'pose' | 'ocular' | 'facs'>('overview');

  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch real demo session telemetry
  useEffect(() => {
    const fetchDemoData = async () => {
      try {
        setLoading(true);
        const data = await api.getDemoAnalysis();
        setResults(data);
        if (data.demo_stream_ticket) {
          setDemoTicket(data.demo_stream_ticket);
        }
        if (data.session && data.session.video_duration) {
          setDuration(data.session.video_duration);
        }
      } catch (err: any) {
        console.warn('Demo session fetch note:', err);
        setError('Notice: Demo session data unavailable. Ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchDemoData();
  }, []);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Media playback notice:', e);
        setIsPlaying(false);
      });
    }
  };

  const seekTo = (seconds: number) => {
    const clamped = Math.max(0, Math.min(seconds, duration || 100));
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
    setCurrentTime(clamped);
  };

  const currentMetric: FacialMetric | null = React.useMemo(() => {
    if (!results || !results.timeline_metrics || results.timeline_metrics.length === 0) return null;
    let closest = results.timeline_metrics[0];
    let minDiff = Math.abs((closest.timestamp ?? 0) - currentTime);

    for (let i = 1; i < results.timeline_metrics.length; i++) {
      const diff = Math.abs((results.timeline_metrics[i].timestamp ?? 0) - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = results.timeline_metrics[i];
      }
    }
    return closest;
  }, [results, currentTime]);

  const handleDownloadDemoPdf = async () => {
    try {
      setDownloadingPdf(true);
      await api.downloadDemoReportPdf();
    } catch (err) {
      alert('Could not download demo PDF. Please ensure backend is reachable.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const stats = results?.summary_statistics || {};

  return (
    <div className="space-y-10 pb-16 w-full max-w-full overflow-x-hidden">
      {/* 1. HERO DEMO HEADER */}
      <section className="relative rounded-3xl bg-gradient-to-b from-neutral-900/90 via-neutral-900/40 to-neutral-950 border border-neutral-800 p-6 sm:p-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Product Demonstration</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-100 tracking-tight leading-tight">
            Framewise in Action: Genuine Computer Vision Telemetry
          </h1>
          
          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-3xl">
            Explore live computer vision analytics extracted from a genuine recorded video analysis session. 
            Inspect sub-pixel 478 MediaPipe landmarks, OpenCV <code className="text-violet-400 font-mono text-xs">solvePnP</code> 3D head pose angles, Eye Aspect Ratio (EAR) palpebral blinks, and observable FACS Action Units.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/upload')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-violet-500/20"
            >
              <span>Analyze Your Own Video</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleDownloadDemoPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs sm:text-sm font-medium transition"
            >
              {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin text-violet-400" /> : <Download className="w-4 h-4 text-emerald-400" />}
              <span>Download Official Demo PDF</span>
            </button>

            <a
              href="https://github.com/Devviknesh/VisionKinematics"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs sm:text-sm transition"
            >
              <Terminal className="w-4 h-4 text-violet-400" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>

        {/* Guided Feature Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-8 border-t border-neutral-800/80 mt-8">
          <button
            onClick={() => setActiveGuidedTab('overview')}
            className={`p-3 rounded-xl border text-left transition ${
              activeGuidedTab === 'overview'
                ? 'bg-neutral-800 border-violet-500/60 text-neutral-100'
                : 'bg-neutral-950/40 border-neutral-850 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-violet-400 block font-bold">Pillar 01</span>
            <span className="text-xs font-bold block mt-0.5">478 Landmark Mesh</span>
          </button>

          <button
            onClick={() => setActiveGuidedTab('pose')}
            className={`p-3 rounded-xl border text-left transition ${
              activeGuidedTab === 'pose'
                ? 'bg-neutral-800 border-violet-500/60 text-neutral-100'
                : 'bg-neutral-950/40 border-neutral-850 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-sky-400 block font-bold">Pillar 02</span>
            <span className="text-xs font-bold block mt-0.5">solvePnP Cranial Pose</span>
          </button>

          <button
            onClick={() => setActiveGuidedTab('ocular')}
            className={`p-3 rounded-xl border text-left transition ${
              activeGuidedTab === 'ocular'
                ? 'bg-neutral-800 border-violet-500/60 text-neutral-100'
                : 'bg-neutral-950/40 border-neutral-850 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-purple-400 block font-bold">Pillar 03</span>
            <span className="text-xs font-bold block mt-0.5">Ocular EAR &amp; Blinks</span>
          </button>

          <button
            onClick={() => setActiveGuidedTab('facs')}
            className={`p-3 rounded-xl border text-left transition ${
              activeGuidedTab === 'facs'
                ? 'bg-neutral-800 border-violet-500/60 text-neutral-100'
                : 'bg-neutral-950/40 border-neutral-850 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="text-[10px] font-mono uppercase text-emerald-400 block font-bold">Pillar 04</span>
            <span className="text-xs font-bold block mt-0.5">Observable FACS AUs</span>
          </button>
        </div>
      </section>

      {/* 2. REAL TELEMETRY WORKSPACE PREVIEW */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-100 flex items-center gap-2">
              <Scan className="w-5 h-5 text-violet-400" />
              <span>Real Analysis Session Telemetry</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live synchronized playback scrubbing across frame timestamps and extracted computer vision metrics.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
              Session: {results?.session?.id?.slice(0, 8) || '274e6805'}
            </span>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 font-bold">
              Status: COMPLETED
            </span>
          </div>
        </div>

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full min-w-0">
          {/* Left Column: Player & Mesh Canvas (8 cols) */}
          <div className="lg:col-span-8 space-y-4 w-full min-w-0">
            {/* Video Player Card */}
            <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 overflow-hidden relative shadow-xl">
              <div className="aspect-[16/10] bg-black relative flex items-center justify-center">
                {results?.session?.video_id ? (
                  <video
                    ref={videoRef}
                    src={api.getVideoStreamUrl(results.session.video_id, demoTicket)}
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    playsInline
                    muted={isMuted}
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <VideoIcon className="w-10 h-10 text-neutral-600 mx-auto" />
                    <p className="text-xs text-neutral-400 font-mono">Sample Video Stream Loaded</p>
                  </div>
                )}

                {/* Live Floating HUD */}
                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none">
                  <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur border border-neutral-800 text-[10px] font-mono text-violet-400 font-bold">
                    t={formatTime(currentTime)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur border border-neutral-800 text-[10px] font-mono text-sky-400">
                    Yaw: {currentMetric ? `${(currentMetric.head_yaw ?? 0).toFixed(1)}°` : '0.0°'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur border border-neutral-800 text-[10px] font-mono text-purple-400">
                    EAR: {currentMetric ? (currentMetric.eye_aspect_ratio ?? 0).toFixed(3) : '0.280'}
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    onClick={() => setShowWireframeMesh(!showWireframeMesh)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                      showWireframeMesh 
                        ? 'bg-violet-600 text-white font-bold border-violet-500' 
                        : 'bg-black/80 text-neutral-300 border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    478 Mesh Overlay
                  </button>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="p-3 sm:p-4 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>

                  <button
                    onClick={() => seekTo(0)}
                    className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition"
                    title="Restart"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-mono text-neutral-400 px-1">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-800 text-[11px] font-mono text-neutral-300">
                    <Sliders className="w-3 h-3 text-neutral-400" />
                    <select
                      value={playbackSpeed}
                      onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                      className="bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value="0.5" className="bg-neutral-900">0.5x</option>
                      <option value="1.0" className="bg-neutral-900">1.0x</option>
                      <option value="1.5" className="bg-neutral-900">1.5x</option>
                      <option value="2.0" className="bg-neutral-900">2.0x</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 478 Landmark Wireframe Visualizer */}
            {showWireframeMesh && (
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/80 border border-violet-500/30 flex flex-col sm:flex-row items-center justify-around gap-4 animate-in fade-in duration-200">
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 text-xs font-mono font-bold">
                    <Scan className="w-3.5 h-3.5" />
                    <span>Dense 3D Landmark Surface</span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-200">
                    MediaPipe 478 Sub-Pixel Coordinates
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-sm">
                    Canonical contours for facial oval, palpebral apertures, and lips synchronized with video time <code className="text-violet-400 font-mono">{formatTime(currentTime)}</code>.
                  </p>
                </div>
                <FacialKinematicsOverlay metric={currentMetric} />
              </div>
            )}

            {/* Continuous Euler Waveforms Scrubber */}
            <KinematicsWaveformTimeline
              metrics={results?.timeline_metrics || []}
              currentTime={currentTime}
              duration={duration}
              onSeek={seekTo}
            />
          </div>

          {/* Right Column: Live Measurement Gauges & Event Stream (4 cols) */}
          <div className="lg:col-span-4 space-y-4 w-full min-w-0">
            {/* Live Card 1: 3D Head Orientation */}
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-violet-400" />
                  <span>3D Cranial Orientation</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                  solvePnP
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                    <span>Yaw (Turn)</span>
                    <span className="text-neutral-100 font-bold">
                      {currentMetric ? `${(currentMetric.head_yaw ?? 0).toFixed(1)}°` : '0.0°'}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-violet-500 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, Math.max(0, (((currentMetric?.head_yaw ?? 0) + 45) / 90) * 100))}%` }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                    <span>Pitch (Tilt)</span>
                    <span className="text-neutral-100 font-bold">
                      {currentMetric ? `${(currentMetric.head_pitch ?? 0).toFixed(1)}°` : '0.0°'}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-sky-400 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, Math.max(0, (((currentMetric?.head_pitch ?? 0) + 45) / 90) * 100))}%` }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                    <span>Roll (Incline)</span>
                    <span className="text-neutral-100 font-bold">
                      {currentMetric ? `${(currentMetric.head_roll ?? 0).toFixed(1)}°` : '0.0°'}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, Math.max(0, (((currentMetric?.head_roll ?? 0) + 30) / 60) * 100))}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Card 2: Eye Aspect Ratio & Blinks */}
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>Ocular EAR &amp; Gaze</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                  Soukupová
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Eye Aspect Ratio</span>
                  <span className="text-sky-300 font-bold">
                    {currentMetric ? (currentMetric.eye_aspect_ratio ?? 0).toFixed(3) : '0.285'}
                  </span>
                </div>

                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-sky-400 h-full rounded-full transition-all" 
                    style={{ width: `${Math.min(100, Math.max(0, ((currentMetric?.eye_aspect_ratio ?? 0.28) / 0.40) * 100))}%` }} 
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] pt-1">
                  <span className="text-neutral-400">Gaze Direction</span>
                  <span className="px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/60 text-sky-300 font-bold">
                    {currentMetric?.gaze_direction || 'Center'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Card 3: FACS Action Units */}
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-purple-400" />
                  <span>Observable FACS Units</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                  Blendshapes
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                    <span>AU12 (Lip Corner Pull)</span>
                    <span className="text-neutral-200">
                      {(((currentMetric?.expression_measurements?.smile_intensity ?? 0)) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-400 h-full rounded-full" 
                      style={{ width: `${Math.min(100, ((currentMetric?.expression_measurements?.smile_intensity ?? 0)) * 100)}%` }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                    <span>AU1+2 (Brow Elevation)</span>
                    <span className="text-neutral-200">
                      {(((currentMetric?.expression_measurements?.brow_elevation ?? 0)) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-violet-500 h-full rounded-full" 
                      style={{ width: `${Math.min(100, ((currentMetric?.expression_measurements?.brow_elevation ?? 0)) * 100)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamped Event Stream with Click-to-Seek */}
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3 flex flex-col h-72">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-violet-400" />
                  <span>Timestamped Events</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                  {results?.events?.length || 0} Events
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-neutral-700">
                {(!results?.events || results.events.length === 0) ? (
                  <p className="text-xs text-neutral-500 py-6 text-center">No events recorded</p>
                ) : (
                  results.events.map((ev) => {
                    const isSelected = Math.abs(currentTime - (ev.timestamp ?? 0)) < 0.4;
                    return (
                      <div
                        key={ev.id}
                        onClick={() => seekTo(ev.timestamp ?? 0)}
                        className={`p-2 rounded-xl cursor-pointer transition border text-xs ${
                          isSelected
                            ? 'bg-neutral-800 border-violet-500/60 shadow-sm'
                            : 'bg-neutral-950/60 border-neutral-850 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-violet-400 font-bold">{formatTime(ev.timestamp ?? 0)}</span>
                          <span className="text-neutral-500 uppercase">{ev.event_category}</span>
                        </div>
                        <p className="text-xs text-neutral-200 font-medium mt-0.5 truncate">
                          {ev.event_type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE 12-STAGE PIPELINE EXPLAINER */}
      <section className="space-y-4">
        <PipelineExplainer />
      </section>

      {/* 4. RESEARCH-GRADE PDF REPORT PREVIEW BANNER */}
      <section className="rounded-3xl bg-neutral-900/60 border border-neutral-800 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-mono font-medium">
            <FileText className="w-3.5 h-3.5" />
            <span>Research-Grade PDF Reporting</span>
          </div>
          <h3 className="text-lg sm:text-2xl font-bold text-neutral-100">
            Export Formal Academic Dossiers in One Click
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Every session can be exported into an official 4-page PDF document featuring Matplotlib vector time series plots, actual source video frame wireframe overlays, chronological event logs, and scientific FACS disclaimers.
          </p>
        </div>

        <button
          onClick={handleDownloadDemoPdf}
          disabled={downloadingPdf}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 shrink-0"
        >
          {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Download Demo PDF Report</span>
        </button>
      </section>

      {/* 5. SCIENTIFIC & ETHICAL BOUNDARY CALLOUT */}
      <section className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-start gap-3 text-xs text-neutral-400 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-neutral-200">Scientific &amp; Ethical Delimitation:</strong> Framewise measures observable physical surface displacements and cranial attitudes using computer vision geometry. These automated kinematic measurements are strictly not certified human FACS coding, nor do they claim to detect psychological intent, deception, or internal emotional states.
        </div>
      </section>
    </div>
  );
};
