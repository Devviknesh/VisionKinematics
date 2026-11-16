import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  Video as VideoIcon, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Play, 
  FileText,
  Trash2,
  AlertCircle,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  Compass,
  Lock,
  User as UserIcon
} from 'lucide-react';
import { VideoItem } from '../types';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

interface Props {
  onOpenAuth?: () => void;
}

export const MainDashboard: React.FC<Props> = ({ onOpenAuth }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  const fetchVideos = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await api.listVideos();
      setVideos(data);
      setError(null);
      setAuthRequired(false);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setAuthRequired(true);
        if (onOpenAuth) onOpenAuth();
      } else {
        setError('Failed to fetch videos. Please ensure the backend is running.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [isAuthenticated]);

  const totalVideos = videos.length;
  const completedSessions = videos.filter(v => v.session_status === 'completed').length;
  const processingSessions = videos.filter(v => v.session_status === 'processing').length;
  const totalDuration = videos.reduce((acc, v) => acc + (v.duration || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
              Overview Dashboard
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
              SaaS Console
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Monitor real-time video processing pipelines, facial landmark events, and session analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchVideos(true)}
            title="Refresh Data"
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-700/80 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs sm:text-sm transition-all shadow-sm shadow-amber-400/20"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Recorded Video</span>
          </button>
        </div>
      </div>

      {/* Unauthenticated Alert Prompt */}
      {authRequired && (
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Sign In to View Your Video History</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Your video recordings and analysis sessions are securely stored with user encryption.</p>
            </div>
          </div>
          <button
            onClick={onOpenAuth}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition shrink-0"
          >
            Sign In to Account
          </button>
        </div>
      )}

      {error && !authRequired && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => fetchVideos()} 
            className="text-xs font-semibold text-rose-400 underline hover:text-rose-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Videos */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700/80 transition-colors flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Videos</p>
            <p className="text-3xl font-extrabold text-neutral-100 mt-1">{totalVideos}</p>
            <p className="text-[11px] text-neutral-500 mt-1">Uploaded &amp; validated</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-neutral-800/80 border border-neutral-700/70 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <VideoIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Completed Analyses */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700/80 transition-colors flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Completed Analyses</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1">{completedSessions}</p>
            <p className="text-[11px] text-neutral-500 mt-1">Ready for full inspection</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: In Processing */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700/80 transition-colors flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">In Processing</p>
            <p className="text-3xl font-extrabold text-amber-400 mt-1">{processingSessions}</p>
            <p className="text-[11px] text-neutral-500 mt-1">Background worker queue</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Video Footage Analysed */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700/80 transition-colors flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Duration</p>
            <p className="text-3xl font-extrabold text-neutral-100 mt-1">{totalDuration.toFixed(1)}s</p>
            <p className="text-[11px] text-neutral-500 mt-1">Recorded video frames</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-neutral-800/80 border border-neutral-700/70 flex items-center justify-center text-neutral-300 group-hover:scale-105 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Content Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recent Videos Table (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h2 className="text-lg font-bold text-neutral-100">Recent Video Analyses</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Recorded videos and computer vision results</p>
              </div>
              <button
                onClick={() => navigate('/history')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 transition"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-neutral-400">
                <Activity className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
                <span>Loading analysis sessions...</span>
              </div>
            ) : videos.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-400">
                  <VideoIcon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-200">No Videos Uploaded Yet</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Upload an MP4, MOV, or AVI video to trigger the 478-point facial landmark and head pose analysis pipeline.
                </p>
                <button
                  onClick={() => navigate('/upload')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Video</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/80">
                {videos.slice(0, 5).map((v) => {
                  const hasSession = !!v.active_session_id;
                  const isCompleted = v.session_status === 'completed';

                  return (
                    <div 
                      key={v.id} 
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-850/40 px-2 rounded-xl transition"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                          <VideoIcon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-neutral-100 truncate max-w-[220px] sm:max-w-xs">
                            {v.filename}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 font-mono">
                            <span>{v.duration ? `${v.duration.toFixed(1)}s` : 'Unknown'}</span>
                            <span>&bull;</span>
                            <span>{v.resolution || 'Standard'}</span>
                            <span>&bull;</span>
                            <span>{v.fps ? `${v.fps.toFixed(0)} FPS` : '20 FPS'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <StatusBadge status={v.session_status || 'none'} />

                        {hasSession ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => navigate(`/workspace/${v.id}/${v.active_session_id}`)}
                              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 text-xs font-semibold border border-neutral-700/80 transition"
                            >
                              Workspace
                            </button>
                            {isCompleted && (
                              <button
                                onClick={() => navigate(`/analytics/${v.active_session_id}`)}
                                title="View Analytics"
                                className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate(`/workspace/${v.id}`)}
                            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition"
                          >
                            Analyze
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Engine Summary & Quick Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Quick Engine Status Card */}
          <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Local CV Engine</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <h3 className="text-base font-bold text-neutral-100">
              MediaPipe &amp; OpenCV Pipeline
            </h3>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Every video uploaded is processed frame-by-frame on your machine using 478 3D facial landmarks and solvePnP geometry.
            </p>

            <div className="space-y-2 pt-2 border-t border-neutral-800 text-xs text-neutral-300">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Face Mesh Model</span>
                <span className="font-mono text-neutral-200">Tasks API (478 pts)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Head Pose</span>
                <span className="font-mono text-neutral-200">Perspective-n-Point</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Gaze Estimation</span>
                <span className="font-mono text-neutral-200">Iris Vectors &amp; EAR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Execution Mode</span>
                <span className="font-mono text-emerald-400">100% Local</span>
              </div>
            </div>
          </div>

          {/* Quick Upload CTA Card */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-700/80 text-left space-y-3">
            <h3 className="text-sm font-bold text-neutral-100">Ready to Analyze?</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Upload an interview, presentation, or meeting recording to extract timestamped visual communication patterns.
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Video Now</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
