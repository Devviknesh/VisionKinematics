import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Video as VideoIcon,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  AlertCircle,
  Activity,
  RefreshCw,
  Lock,
  User as UserIcon,
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

  useEffect(() => { fetchVideos(); }, [isAuthenticated]);

  const totalVideos = videos.length;
  const completedSessions = videos.filter(v => v.session_status === 'completed').length;
  const processingSessions = videos.filter(v => v.session_status === 'processing').length;
  const totalDuration = videos.reduce((acc, v) => acc + (v.duration || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#1E1E2A]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight">Dashboard</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#101116] text-[#A1A1AA] border border-[#1E1E2A]">Overview</span>
          </div>
          <p className="text-xs text-[#A1A1AA]">Monitor video analysis sessions, facial landmark events and pipeline metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchVideos(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-[#101116] border border-[#1E1E2A] text-[#A1A1AA] hover:text-[#F5F5F7] hover:border-[#2A2A3A] transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-violet-400' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs sm:text-sm transition shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Video
          </button>
        </div>
      </div>

      {/* Auth Required Banner */}
      {authRequired && (
        <div className="p-5 rounded-xl bg-[#101116] border border-[#1E1E2A] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F5F7]">Sign In to View Your Sessions</h3>
              <p className="text-xs text-[#A1A1AA] mt-0.5">Your analysis sessions are stored securely per account.</p>
            </div>
          </div>
          <button
            onClick={onOpenAuth}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition shrink-0"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Error */}
      {error && !authRequired && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchVideos()} className="text-xs font-semibold text-rose-400 underline hover:text-rose-300">Retry</button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Videos',
            value: totalVideos,
            sub: 'Uploaded & validated',
            icon: VideoIcon,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10 border-violet-500/20',
          },
          {
            label: 'Completed Analyses',
            value: completedSessions,
            sub: 'Ready for inspection',
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
          },
          {
            label: 'In Processing',
            value: processingSessions,
            sub: 'Background pipeline',
            icon: Activity,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10 border-violet-500/20',
          },
          {
            label: 'Total Duration',
            value: `${totalDuration.toFixed(1)}s`,
            sub: 'Analysed footage',
            icon: Clock,
            color: 'text-[#A1A1AA]',
            bg: 'bg-[#1E1E2A] border-[#2A2A3A]',
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="p-5 rounded-xl bg-[#101116] border border-[#1E1E2A] hover:border-[#2A2A3A] transition group flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">{label}</p>
              <p className={`text-3xl font-extrabold mt-1 ${color}`}>{value}</p>
              <p className="text-[11px] text-[#A1A1AA] mt-1">{sub}</p>
            </div>
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${bg} group-hover:scale-105 transition-transform shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Recent Sessions (8 cols) */}
        <div className="lg:col-span-8">
          <div className="p-6 rounded-xl bg-[#101116] border border-[#1E1E2A]">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E1E2A] mb-2">
              <div>
                <h2 className="text-base font-bold text-[#F5F5F7]">Recent Analyses</h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">Uploaded videos and CV pipeline results</p>
              </div>
              <button
                onClick={() => navigate('/history')}
                className="text-xs font-semibold text-violet-400 hover:text-violet-300 inline-flex items-center gap-1 transition"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-[#A1A1AA]">
                <Activity className="w-6 h-6 text-violet-400 animate-spin mx-auto mb-2" />
                <span>Loading analysis sessions...</span>
              </div>
            ) : videos.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#14151B] border border-[#1E1E2A] flex items-center justify-center mx-auto text-[#A1A1AA]">
                  <VideoIcon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-[#F5F5F7]">No Videos Uploaded Yet</h3>
                <p className="text-xs text-[#A1A1AA] max-w-sm mx-auto">
                  Upload an MP4, MOV, or AVI recording to trigger the 478-point facial landmark analysis pipeline.
                </p>
                <button
                  onClick={() => navigate('/upload')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload Video
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#1E1E2A]">
                {videos.slice(0, 5).map((v) => {
                  const hasSession = !!v.active_session_id;
                  const isCompleted = v.session_status === 'completed';
                  return (
                    <div key={v.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#14151B] px-2 rounded-xl transition">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#14151B] border border-[#1E1E2A] flex items-center justify-center text-violet-400 shrink-0 mt-0.5">
                          <VideoIcon className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <p className="text-sm font-bold text-[#F5F5F7] truncate max-w-[200px] sm:max-w-xs">{v.filename}</p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#A1A1AA] font-mono">
                            <span>{v.duration ? `${v.duration.toFixed(1)}s` : 'Unknown'}</span>
                            <span>·</span>
                            <span>{v.resolution || 'Standard'}</span>
                            <span>·</span>
                            <span>{v.fps ? `${v.fps.toFixed(0)} FPS` : '—'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <StatusBadge status={v.session_status || 'none'} />
                        {hasSession ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => navigate(`/workspace/${v.id}/${v.active_session_id}`)}
                              className="px-3 py-1.5 rounded-lg bg-[#14151B] hover:bg-violet-600 hover:text-white text-[#F5F5F7] text-xs font-semibold border border-[#1E1E2A] transition"
                            >
                              Workspace
                            </button>
                            {isCompleted && (
                              <button
                                onClick={() => navigate(`/analytics/${v.active_session_id}`)}
                                title="Analytics"
                                className="p-1.5 rounded-lg bg-[#14151B] hover:bg-[#1E1E2A] text-[#A1A1AA] hover:text-[#F5F5F7] border border-[#1E1E2A] transition"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate(`/workspace/${v.id}`)}
                            className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition"
                          >
                            Analyse
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

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">

          {/* CV Engine Status */}
          <div className="p-5 rounded-xl bg-[#101116] border border-[#1E1E2A] space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">CV Engine</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-[#F5F5F7]">MediaPipe &amp; OpenCV Pipeline</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Frame-by-frame processing with 478 3D facial landmarks and solvePnP geometry for head-pose estimation.
            </p>
            <div className="space-y-2 pt-3 border-t border-[#1E1E2A] text-xs">
              {[
                ['Face Mesh', 'Tasks API (478 pts)'],
                ['Head Pose', 'Perspective-n-Point'],
                ['Gaze', 'Iris Vectors & EAR'],
                ['Mode', 'Server-Side'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-[#A1A1AA]">{k}</span>
                  <span className={`font-mono ${k === 'Mode' ? 'text-emerald-400' : 'text-[#F5F5F7]'}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Upload CTA */}
          <div className="p-5 rounded-xl bg-[#101116] border border-[#1E1E2A] space-y-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <UploadCloud className="w-4 h-4 text-violet-400" />
            </div>
            <h3 className="text-sm font-bold text-[#F5F5F7]">Ready to Analyse?</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Upload an interview, presentation or meeting recording to extract timestamped facial kinematics.
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Video
            </button>
          </div>

          {/* Quick links */}
          <div className="p-5 rounded-xl bg-[#101116] border border-[#1E1E2A] space-y-2">
            <p className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-3">Quick Actions</p>
            {[
              { label: 'View All Sessions', path: '/history', icon: VideoIcon },
              { label: 'Compare Sessions', path: '/compare', icon: BarChart3 },
              { label: 'Download Report', path: '/report', icon: FileText },
            ].map(({ label, path, icon: Icon }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-[#14151B] transition"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
