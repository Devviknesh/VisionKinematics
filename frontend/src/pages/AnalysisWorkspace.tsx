import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Filter,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  UploadCloud,
  GitCompare,
  Video as VideoIcon,
  FastForward,
  Rewind,
  Gauge,
  Activity,
  Sliders
} from 'lucide-react';
import { api } from '../api';
import { AnalysisResults, FacialMetric, AnalysisEvent, AnalysisSession, VideoItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { FacialKinematicsOverlay } from '../components/FacialKinematicsOverlay';
import { KinematicsWaveformTimeline } from '../components/KinematicsWaveformTimeline';

interface Props {
  videoId?: string;
  sessionId?: string;
}

export const AnalysisWorkspace: React.FC<Props> = ({
  videoId: propVideoId,
  sessionId: propSessionId
}) => {
  const params = useParams<{ videoId?: string; sessionId?: string }>();
  const navigate = useNavigate();

  const [activeVideoId, setActiveVideoId] = useState<string>(propVideoId || params.videoId || '');
  const [activeSessionId, setActiveSessionId] = useState<string>(propSessionId || params.sessionId || '');
  
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableVideos, setAvailableVideos] = useState<VideoItem[]>([]);
  const [startingAnalysis, setStartingAnalysis] = useState(false);
  
  // Video playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showPreviewOverlay, setShowPreviewOverlay] = useState(false);
  const [showWireframeMesh, setShowWireframeMesh] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [streamTicket, setStreamTicket] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Fetch short-lived signed streaming ticket for authenticated media playback
  useEffect(() => {
    if (!activeVideoId) return;
    const fetchStreamToken = async () => {
      try {
        const res = await api.getVideoStreamToken(activeVideoId);
        setStreamTicket(res.ticket);
      } catch (err) {
        // Fallback gracefully
      }
    };
    fetchStreamToken();
  }, [activeVideoId]);

  // If no sessionId passed, check recent videos
  useEffect(() => {
    const discoverSession = async () => {
      if (!activeSessionId) {
        try {
          setLoading(true);
          const vList = await api.listVideos();
          setAvailableVideos(vList);

          // Find first video with completed or processing session
          const videoWithSession = vList.find(v => v.active_session_id && (v.session_status === 'completed' || v.session_status === 'processing'));
          if (videoWithSession && videoWithSession.active_session_id) {
            setActiveVideoId(videoWithSession.id);
            setActiveSessionId(videoWithSession.active_session_id);
          } else if (vList.length > 0 && vList[0].active_session_id) {
            setActiveVideoId(vList[0].id);
            setActiveSessionId(vList[0].active_session_id);
          } else {
            setLoading(false);
          }
        } catch (err: any) {
          setLoading(false);
        }
      }
    };

    discoverSession();
  }, [activeSessionId]);

  // Poll for status if sessionId is valid
  useEffect(() => {
    if (!activeSessionId) return;

    let interval: any = null;

    const checkStatus = async () => {
      try {
        const s = await api.getAnalysisStatus(activeSessionId);
        setSession(s);

        if (s.processing_status === 'completed') {
          clearInterval(interval);
          const fullResults = await api.getAnalysisResults(activeSessionId);
          setResults(fullResults);
          setLoading(false);
          setError(null);
        } else if (s.processing_status === 'failed' || s.processing_status === 'cancelled') {
          clearInterval(interval);
          setLoading(false);
          setError(s.error_message || 'Analysis did not complete successfully.');
        }
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to retrieve analysis status');
        setLoading(false);
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 1500);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSessionId]);

  // Handle starting analysis on a video without an active session
  const handleStartAnalysis = async (vid: string) => {
    try {
      setStartingAnalysis(true);
      setError(null);
      const newSession = await api.startAnalysis(vid);
      setActiveVideoId(vid);
      setActiveSessionId(newSession.id);
      setLoading(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to start analysis.');
    } finally {
      setStartingAnalysis(false);
    }
  };

  // Sync current video time
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(seconds, duration || 100));
      setCurrentTime(seconds);
    }
  };

  const skipSeconds = (offset: number) => {
    if (videoRef.current) {
      seekTo(videoRef.current.currentTime + offset);
    }
  };

  // Find metric frame closest to current video time
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

  // Filter events
  const filteredEvents = React.useMemo(() => {
    if (!results || !results.events) return [];
    if (selectedCategory === 'all') return results.events;
    return results.events.filter(e => e.event_category === selectedCategory);
  }, [results, selectedCategory]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) secs = 0;
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  // 1. Rendering Empty State if no video or session is selected
  if (!activeSessionId && !loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
          <Scan className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
            Analysis Workspace
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Select a video to inspect frame-by-frame 3D facial landmarks, head orientation, and visual communication events.
          </p>
        </div>

        {availableVideos.length > 0 ? (
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-left space-y-4">
            <h3 className="text-sm font-bold text-neutral-200">Available Videos</h3>
            <div className="divide-y divide-neutral-800">
              {availableVideos.map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <VideoIcon className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-neutral-100 truncate max-w-xs sm:max-w-sm">{v.filename}</p>
                      <p className="text-[11px] text-neutral-400 font-mono">{v.duration ? `${v.duration.toFixed(1)}s` : 'Video file'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={v.session_status || 'none'} />
                    {v.active_session_id ? (
                      <button
                        onClick={() => {
                          setActiveVideoId(v.id);
                          setActiveSessionId(v.active_session_id!);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition"
                      >
                        Open Workspace
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartAnalysis(v.id)}
                        disabled={startingAnalysis}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold transition"
                      >
                        Analyze Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <p className="text-xs text-neutral-400">No recorded videos have been uploaded yet.</p>
            <button
              onClick={() => navigate('/upload')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Your First Video</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. Rendering Processing State
  if (loading || session?.processing_status === 'processing' || session?.processing_status === 'pending') {
    const progress = session?.progress ?? 0;
    return (
      <div className="max-w-3xl mx-auto py-16 sm:py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/25">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Analyzing Video Frames Locally</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-100">
            Computer Vision Pipeline in Progress
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            Extracting 478 3D facial landmarks, computing solvePnP head orientation, and measuring gaze direction.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 max-w-md mx-auto space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>Overall Progress</span>
            <span className="text-amber-400 font-bold">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-neutral-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-amber-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">
            {progress < 25 ? 'Sampling video frames...' : progress < 75 ? 'Executing MediaPipe Face Landmarker...' : 'Debouncing visual events & compiling metrics...'}
          </p>
        </div>
      </div>
    );
  }

  // 3. Rendering Error State
  if (error || !results) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-5">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs inline-flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error || 'Failed to load analysis session'}</span>
        </div>
        <p className="text-xs text-neutral-400">
          The requested session could not be retrieved. You can return to the dashboard or select another video.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => { setActiveSessionId(''); setActiveVideoId(''); }}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition"
          >
            Select Another Video
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition"
          >
            Upload New Video
          </button>
        </div>
      </div>
    );
  }

  const videoStreamUrl = activeVideoId 
    ? (showPreviewOverlay ? api.getPreviewStreamUrl(activeVideoId, streamTicket) : api.getVideoStreamUrl(activeVideoId, streamTicket))
    : '';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Workspace Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-100 tracking-tight">
              {results.session?.video_filename || 'Video Analysis Workspace'}
            </h1>
            <StatusBadge status={results.session?.processing_status || 'completed'} />
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-400 font-mono">
            <span>Session: {activeSessionId.slice(0, 8)}</span>
            <span>&bull;</span>
            <span>Duration: {duration ? `${duration.toFixed(1)}s` : `${(results.session?.video_duration ?? 0).toFixed(1)}s`}</span>
            <span>&bull;</span>
            <span>Analyzed Frames: {results.timeline_metrics?.length ?? 0}</span>
            <span>&bull;</span>
            <span>Detected Events: {results.events?.length ?? 0}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate(`/compare?session_a=${activeSessionId}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold border border-neutral-700/80 transition"
          >
            <GitCompare className="w-4 h-4 text-sky-400" />
            <span>Compare</span>
          </button>

          <button
            onClick={() => navigate(`/analytics/${activeSessionId}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold border border-neutral-700/80 transition"
          >
            <BarChart2 className="w-4 h-4 text-amber-400" />
            <span>Interactive Analytics</span>
          </button>

          <button
            onClick={() => navigate(`/report/${activeSessionId}`)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Executive PDF</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Video Player & Synchronized Metrics (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Video Player Container */}
          <div className="rounded-2xl border border-neutral-800 bg-black overflow-hidden shadow-2xl relative group">
            
            {/* Top Player Toolbar */}
            <div className="bg-neutral-950/80 backdrop-blur px-4 py-2 border-b border-neutral-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-neutral-300 font-mono text-[11px]">
                  {showPreviewOverlay ? 'STREAM: ANNOTATED HUD OVERLAY' : 'STREAM: ORIGINAL VIDEO'}
                </span>
              </div>

              {/* Toggle Original vs Annotated HUD vs Wireframe Mesh */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center rounded-lg bg-neutral-900 p-0.5 border border-neutral-800">
                  <button
                    onClick={() => setShowPreviewOverlay(false)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      !showPreviewOverlay 
                        ? 'bg-neutral-800 text-amber-400 shadow-sm' 
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => setShowPreviewOverlay(true)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      showPreviewOverlay 
                        ? 'bg-amber-400 text-neutral-950 shadow-sm' 
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Annotated HUD
                  </button>
                </div>

                <button
                  onClick={() => setShowWireframeMesh(!showWireframeMesh)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border flex items-center gap-1.5 ${
                    showWireframeMesh
                      ? 'bg-amber-400 text-neutral-950 border-amber-400 font-bold shadow-sm'
                      : 'bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border-neutral-800'
                  }`}
                  title="Toggle 2D/3D Facial Landmark Wireframe Mesh Visualizer"
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>3D Face Mesh</span>
                </button>
              </div>
            </div>

            {/* Video Element */}
            <div className="relative aspect-video bg-neutral-950 flex items-center justify-center">
              {videoStreamUrl ? (
                <video
                  ref={videoRef}
                  src={videoStreamUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-neutral-500 font-mono">No video stream loaded</div>
              )}
            </div>

            {/* Custom Video Controls Bar */}
            <div className="bg-neutral-950/90 backdrop-blur p-4 space-y-3 border-t border-neutral-800">
              
              {/* Timeline Track with Event Markers */}
              <div className="relative group/timeline py-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 1}
                  step="0.05"
                  value={currentTime}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400 relative z-10"
                />

                {/* Event Marker Ticks on Timeline */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 pointer-events-none z-0">
                  {(results.events || []).map((ev) => {
                    const pct = duration ? ((ev.timestamp ?? 0) / duration) * 100 : 0;
                    return (
                      <span
                        key={ev.id}
                        title={`[${(ev.timestamp ?? 0).toFixed(1)}s] ${ev.event_type}`}
                        style={{ left: `${Math.min(99, Math.max(1, pct))}%` }}
                        className="absolute w-1 h-3 -top-0.5 bg-amber-400/70 rounded-full"
                      />
                    );
                  })}
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-300">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {/* Play / Pause Main Button */}
                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center transition shadow-sm"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>

                  {/* Precision Stepping: -1.0s */}
                  <button
                    onClick={() => skipSeconds(-1.0)}
                    className="px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition font-mono text-[10px]"
                    title="Jump Back 1.0s"
                  >
                    -1.0s
                  </button>

                  {/* Single Frame Step Back: -0.1s */}
                  <button
                    onClick={() => skipSeconds(-0.1)}
                    className="px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 border border-neutral-800 transition font-mono text-[10px] font-semibold"
                    title="Step Backward (0.1s / Frame)"
                  >
                    -0.1s
                  </button>

                  {/* Single Frame Step Forward: +0.1s */}
                  <button
                    onClick={() => skipSeconds(0.1)}
                    className="px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 border border-neutral-800 transition font-mono text-[10px] font-semibold"
                    title="Step Forward (0.1s / Frame)"
                  >
                    +0.1s
                  </button>

                  {/* Precision Stepping: +1.0s */}
                  <button
                    onClick={() => skipSeconds(1.0)}
                    className="px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition font-mono text-[10px]"
                    title="Jump Forward 1.0s"
                  >
                    +1.0s
                  </button>

                  {/* Reset to Start */}
                  <button
                    onClick={() => seekTo(0)}
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition"
                    title="Restart from 0:00"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <div className="font-mono text-xs text-neutral-300 ml-1">
                    <span className="text-amber-400 font-semibold">{formatTime(currentTime)}</span>
                    <span className="text-neutral-600 mx-1">/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Playback Speed Selector */}
                  <div className="flex items-center gap-1 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-800">
                    <Sliders className="w-3 h-3 text-neutral-400" />
                    <select
                      value={playbackSpeed}
                      onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                      className="bg-transparent text-[11px] font-mono text-neutral-200 focus:outline-none cursor-pointer"
                      title="Playback Speed"
                    >
                      <option value="0.25" className="bg-neutral-900">0.25x</option>
                      <option value="0.5" className="bg-neutral-900">0.5x</option>
                      <option value="0.75" className="bg-neutral-900">0.75x</option>
                      <option value="1.0" className="bg-neutral-900">1.0x</option>
                      <option value="1.25" className="bg-neutral-900">1.25x</option>
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
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        if (document.fullscreenElement) {
                          document.exitFullscreen();
                        } else {
                          videoRef.current.requestFullscreen();
                        }
                      }
                    }}
                    className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition"
                  >
                    <Maximize className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Dynamic 3D Face Mesh Wireframe Card (Collapsible) */}
          {showWireframeMesh && (
            <div className="p-5 rounded-2xl bg-neutral-900/80 border border-amber-400/40 flex flex-col sm:flex-row items-center justify-around gap-4 animate-in fade-in duration-200">
              <div className="text-center sm:text-left space-y-1">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
                  <Scan className="w-4 h-4" />
                  <span>MediaPipe 478 3D Landmark Wireframe</span>
                </span>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Synchronized reconstruction of 3D facial topology, ocular gaze vectors, and solvePnP head attitude.
                </p>
                <div className="pt-2 text-[11px] font-mono text-neutral-500">
                  <span>Frame Time: </span>
                  <span className="text-amber-400 font-bold">{formatTime(currentTime)}</span>
                </div>
              </div>
              <FacialKinematicsOverlay metric={currentMetric} />
            </div>
          )}

          {/* Multi-Stream Kinematic Waveforms (Interactive Seek Scrubbing) */}
          <KinematicsWaveformTimeline 
            metrics={results.timeline_metrics || []} 
            currentTime={currentTime} 
            duration={duration} 
            onSeek={seekTo} 
          />

          {/* Synchronized Live Kinematics Cards (Current Frame Readouts) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Head Pose solvePnP */}
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Head Orientation</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                  solvePnP
                </span>
              </div>

              {currentMetric && currentMetric.face_detected ? (
                <div className="space-y-2 pt-1 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                      <span>Yaw (Turn)</span>
                      <span className="text-neutral-100 font-bold">
                        {(currentMetric.head_yaw ?? 0) > 0 ? `+${(currentMetric.head_yaw ?? 0).toFixed(1)}°` : `${(currentMetric.head_yaw ?? 0).toFixed(1)}°`}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-400 h-full rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, (((currentMetric.head_yaw ?? 0) + 45) / 90) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                      <span>Pitch (Tilt)</span>
                      <span className="text-neutral-100 font-bold">
                        {(currentMetric.head_pitch ?? 0) > 0 ? `+${(currentMetric.head_pitch ?? 0).toFixed(1)}°` : `${(currentMetric.head_pitch ?? 0).toFixed(1)}°`}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-sky-400 h-full rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, (((currentMetric.head_pitch ?? 0) + 45) / 90) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                      <span>Roll (Incline)</span>
                      <span className="text-neutral-100 font-bold">{(currentMetric.head_roll ?? 0).toFixed(1)}°</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-400 h-full rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, (((currentMetric.head_roll ?? 0) + 45) / 90) * 100))}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-neutral-500">
                  <span>No face in active frame</span>
                </div>
              )}
            </div>

            {/* Card 2: Gaze Estimation */}
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>Gaze Direction</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                  Iris &amp; EAR
                </span>
              </div>

              {currentMetric && currentMetric.face_detected ? (
                <div className="space-y-3 pt-1">
                  <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 block">Estimated Direction</span>
                    <span className="text-base font-bold text-neutral-100 font-mono mt-0.5 block">
                      {currentMetric.gaze_direction || 'Center'}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-neutral-400 text-[11px]">
                      <span>Eye Aspect Ratio (EAR)</span>
                      <span className="text-neutral-200 font-semibold">{(currentMetric.eye_aspect_ratio ?? 0).toFixed(3)}</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-sky-400 h-full rounded-full" 
                        style={{ width: `${Math.min(100, ((currentMetric.eye_aspect_ratio ?? 0) / 0.4) * 100)}%` }} 
                      />
                    </div>
                    <p className="text-[10px] text-neutral-500 pt-0.5">
                      {(currentMetric.eye_aspect_ratio ?? 0) < 0.20 ? 'Eyes Closed / Blink' : 'Eyes Open'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-neutral-500">
                  <span>No face in active frame</span>
                </div>
              )}
            </div>

            {/* Card 3: Observable Expression Kinematics */}
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-emerald-400" />
                  <span>Facial Kinematics</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                  Blendshapes
                </span>
              </div>

              {currentMetric && currentMetric.face_detected && currentMetric.expression_measurements ? (
                <div className="space-y-2 pt-1 font-mono text-xs">
                  <div>
                    <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                      <span>Mouth Corner Retraction</span>
                      <span className="text-neutral-200 font-bold">
                        {(((currentMetric.expression_measurements?.smile_intensity ?? 0)) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-400 h-full rounded-full" 
                        style={{ width: `${Math.min(100, ((currentMetric.expression_measurements?.smile_intensity ?? 0)) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                      <span>Eyebrow Elevation</span>
                      <span className="text-neutral-200 font-bold">
                        {(((currentMetric.expression_measurements?.brow_elevation ?? 0)) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-400 h-full rounded-full" 
                        style={{ width: `${Math.min(100, ((currentMetric.expression_measurements?.brow_elevation ?? 0)) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-400 text-[11px] mb-1">
                      <span>Jaw Separation</span>
                      <span className="text-neutral-200 font-bold">
                        {(((currentMetric.expression_measurements?.mouth_openness ?? 0)) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-purple-400 h-full rounded-full" 
                        style={{ width: `${Math.min(100, ((currentMetric.expression_measurements?.mouth_openness ?? 0)) * 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-neutral-500">
                  <span>No face in active frame</span>
                </div>
              )}
            </div>

          </div>

          {/* Observable Facial Action Coding System (FACS) Kinematic Units Panel */}
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800/80">
              <div>
                <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  <span>Observable Facial Action Coding System (FACS) Kinematic Units</span>
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Frame-by-frame muscular landmark displacements measured via 478 3D mesh blendshapes.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 self-start sm:self-auto">
                FACS Geometry
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
              {/* AU12 */}
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-neutral-400">
                  <span className="text-amber-400 font-bold">AU12</span>
                  <span>Zygomatic</span>
                </div>
                <div className="text-[11px] font-semibold text-neutral-200 truncate">
                  Lip Corner Puller
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (currentMetric?.expression_measurements?.smile_intensity ?? 0) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-right text-neutral-400">
                  {((currentMetric?.expression_measurements?.smile_intensity ?? 0) * 100).toFixed(0)}%
                </div>
              </div>

              {/* AU1+2 */}
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-neutral-400">
                  <span className="text-sky-400 font-bold">AU1+2</span>
                  <span>Frontalis</span>
                </div>
                <div className="text-[11px] font-semibold text-neutral-200 truncate">
                  Brow Elevation
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-sky-400 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (currentMetric?.expression_measurements?.brow_elevation ?? 0) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-right text-neutral-400">
                  {((currentMetric?.expression_measurements?.brow_elevation ?? 0) * 100).toFixed(0)}%
                </div>
              </div>

              {/* AU4 */}
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-neutral-400">
                  <span className="text-amber-400 font-bold">AU4</span>
                  <span>Corrugator</span>
                </div>
                <div className="text-[11px] font-semibold text-neutral-200 truncate">
                  Brow Furrow
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, 1 - (currentMetric?.expression_measurements?.brow_elevation ?? 0.5)) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-right text-neutral-400">
                  {(Math.max(0, 1 - (currentMetric?.expression_measurements?.brow_elevation ?? 0.5)) * 100).toFixed(0)}%
                </div>
              </div>

              {/* AU25+26 */}
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-neutral-400">
                  <span className="text-purple-400 font-bold">AU25+26</span>
                  <span>Pterygoid</span>
                </div>
                <div className="text-[11px] font-semibold text-neutral-200 truncate">
                  Jaw Separation
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-400 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (currentMetric?.expression_measurements?.mouth_openness ?? 0) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-right text-neutral-400">
                  {((currentMetric?.expression_measurements?.mouth_openness ?? 0) * 100).toFixed(0)}%
                </div>
              </div>

              {/* AU45 */}
              <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-850 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-neutral-400">
                  <span className="text-rose-400 font-bold">AU45</span>
                  <span>Orbicularis</span>
                </div>
                <div className="text-[11px] font-semibold text-neutral-200 truncate">
                  Blink / Closure
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-400 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, (1 - ((currentMetric?.eye_aspect_ratio ?? 0.3) / 0.35))) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-right text-neutral-400">
                  {(currentMetric?.eye_aspect_ratio ?? 0.3) < 0.20 ? 'Active Blink' : 'Ocular Open'}
                </div>
              </div>
            </div>

            {/* Scientific Non-Verbal Framing Callout */}
            <div className="p-3 rounded-xl bg-neutral-950/90 border border-neutral-800 flex items-start gap-2.5 text-[11px] text-neutral-400 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-neutral-200">Scientific Non-Verbal Delimitation:</strong> Action Units quantify physical facial muscular deformations and landmark displacement vectors. In accordance with empirical computer vision standards, these measurements represent observable biomechanical movements and do not infer psychological intent, emotional integrity, or personality traits.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Timestamped Visual Event Stream (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col h-[640px]">
            
            {/* Events Header */}
            <div className="pb-3 border-b border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Visual Event Stream</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-neutral-300">
                  {filteredEvents.length} Events
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Click any event below to seek the video player to that exact second.
              </p>

              {/* Category Filter Chips */}
              <div className="flex flex-wrap gap-1 pt-1">
                {['all', 'head_movement', 'gaze', 'expression', 'tracking'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                      selectedCategory === cat
                        ? 'bg-amber-400 text-neutral-950 font-bold'
                        : 'bg-neutral-850 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat === 'head_movement' ? 'Head Pose' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Event List */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60 pr-1 mt-2 space-y-1">
              {filteredEvents.length === 0 ? (
                <div className="py-16 text-center text-xs text-neutral-500">
                  No visual events recorded for this category.
                </div>
              ) : (
                filteredEvents.map((ev) => {
                  const isCurrent = Math.abs(currentTime - (ev.timestamp ?? 0)) < 0.6;
                  
                  let badgeColor = 'text-amber-400 bg-amber-400/10 border-amber-400/30';
                  if (ev.event_category === 'gaze') badgeColor = 'text-sky-400 bg-sky-400/10 border-sky-400/30';
                  if (ev.event_category === 'expression') badgeColor = 'text-purple-400 bg-purple-400/10 border-purple-400/30';
                  if (ev.event_category === 'tracking') badgeColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';

                  return (
                    <div
                      key={ev.id}
                      onClick={() => seekTo(ev.timestamp ?? 0)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                        isCurrent 
                          ? 'bg-neutral-800 border border-amber-400/50 shadow-sm' 
                          : 'hover:bg-neutral-850 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide border ${badgeColor}`}>
                          {ev.event_category}
                        </span>
                        <span className="font-mono text-xs text-amber-400 font-bold">
                          {formatTime(ev.timestamp ?? 0)}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-neutral-200">
                        {(ev.event_type || '').replace(/_/g, ' ')}
                      </p>

                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                        {ev.event_description}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
