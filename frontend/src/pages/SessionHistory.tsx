import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Video as VideoIcon, 
  Play, 
  BarChart2, 
  FileText, 
  Trash2, 
  Search, 
  UploadCloud,
  AlertCircle,
  Activity,
  ArrowRight,
  Filter,
  Lock
} from 'lucide-react';
import { VideoItem } from '../types';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

interface Props {
  onOpenAuth?: () => void;
}

export const SessionHistory: React.FC<Props> = ({ onOpenAuth }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await api.listVideos();
      setVideos(data);
      setError(null);
      setAuthRequired(false);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setAuthRequired(true);
      } else {
        setError('Failed to load sessions history.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [isAuthenticated]);

  const handleDelete = async (videoId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this video and its associated analysis records?')) {
      return;
    }

    try {
      setDeletingId(videoId);
      await api.deleteVideo(videoId);
      setVideos(videos.filter(v => v.id !== videoId));
    } catch (err) {
      alert('Failed to delete video record.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredVideos = videos.filter(v => 
    v.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
              Session History
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
              {videos.length} Archives
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Browse, inspect, or delete previous video analysis sessions and reports.
          </p>
        </div>

        <button
          onClick={() => navigate('/upload')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs sm:text-sm transition shadow-sm shadow-amber-400/20 self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Video</span>
        </button>
      </div>

      {authRequired && (
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Authentication Required</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Please sign in to access your historical analysis sessions.</p>
            </div>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      )}

      {error && !authRequired && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search videos by filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>
      </div>

      {/* Sessions List Card */}
      <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800">
        {loading ? (
          <div className="py-20 text-center space-y-2">
            <Activity className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-neutral-400 font-mono">Loading recorded sessions...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-400">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-200">
              {searchTerm ? 'No matching video sessions found' : 'No video sessions stored'}
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Upload video footage to automatically initialize landmark and head pose processing.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {filteredVideos.map((v) => {
              const hasSession = !!v.active_session_id;
              const isCompleted = v.session_status === 'completed';
              const isDeleting = deletingId === v.id;

              return (
                <div 
                  key={v.id} 
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-850/40 px-2 rounded-xl transition"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <VideoIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-neutral-100 truncate max-w-sm sm:max-w-md">
                        {v.filename}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-400 font-mono">
                        <span>{v.duration ? `${v.duration.toFixed(1)}s duration` : 'Duration N/A'}</span>
                        <span>&bull;</span>
                        <span>{v.resolution || 'Standard'}</span>
                        <span>&bull;</span>
                        <span>{v.fps ? `${v.fps.toFixed(0)} FPS` : '20 FPS'}</span>
                        <span>&bull;</span>
                        <span>Uploaded {new Date(v.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status and Actions */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    <StatusBadge status={v.session_status || 'none'} />

                    {hasSession ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/workspace/${v.id}/${v.active_session_id!}`)}
                          className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 text-xs font-semibold border border-neutral-700/80 transition"
                        >
                          Workspace
                        </button>

                        {isCompleted && (
                          <>
                            <button
                              onClick={() => navigate(`/analytics/${v.active_session_id!}`)}
                              title="Interactive Analytics"
                              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition"
                            >
                              <BarChart2 className="w-4 h-4 text-sky-400" />
                            </button>

                            <button
                              onClick={() => navigate(`/report/${v.active_session_id!}`)}
                              title="Executive Report"
                              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition"
                            >
                              <FileText className="w-4 h-4 text-emerald-400" />
                            </button>
                          </>
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

                    <button
                      onClick={() => handleDelete(v.id)}
                      disabled={isDeleting}
                      title="Permanently Delete Video &amp; Analysis"
                      className="p-2 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
