import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  BarChart3, 
  Compass, 
  Eye, 
  Smile, 
  Clock, 
  FileText, 
  ArrowLeft,
  Calendar,
  Layers,
  AlertCircle,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Download,
  UploadCloud,
  ChevronDown
} from 'lucide-react';
import { api } from '../api';
import { AnalysisResults, VideoItem } from '../types';

interface Props {
  sessionId?: string;
  onBackToWorkspace?: (sessionId: string) => void;
  onNavigateToReport?: (sessionId: string) => void;
}

const PALETTE = ['#f59e0b', '#38bdf8', '#34d399', '#a855f7', '#f43f5e', '#64748b'];

export const AnalyticsDashboard: React.FC<Props> = ({
  sessionId: propSessionId,
  onBackToWorkspace,
  onNavigateToReport
}) => {
  const params = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();

  const [activeSessionId, setActiveSessionId] = useState<string>(propSessionId || params.sessionId || '');
  const [data, setData] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedVideos, setCompletedVideos] = useState<VideoItem[]>([]);

  // If no sessionId passed, find completed sessions
  useEffect(() => {
    const discoverSession = async () => {
      try {
        const vList = await api.listVideos();
        const completed = vList.filter(v => v.session_status === 'completed' && v.active_session_id);
        setCompletedVideos(completed);

        if (!activeSessionId) {
          if (completed.length > 0 && completed[0].active_session_id) {
            setActiveSessionId(completed[0].active_session_id);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        setLoading(false);
      }
    };

    discoverSession();
  }, [activeSessionId]);

  // Fetch analytics for activeSessionId
  useEffect(() => {
    if (!activeSessionId) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.getAnalysisResults(activeSessionId);
        setData(res);
        setError(null);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to fetch analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [activeSessionId]);

  const handleBack = () => {
    if (onBackToWorkspace) {
      onBackToWorkspace(activeSessionId);
    } else {
      navigate(activeSessionId ? `/workspace/${activeSessionId}` : '/workspace');
    }
  };

  const handleReport = () => {
    if (onNavigateToReport) {
      onNavigateToReport(activeSessionId);
    } else {
      navigate(`/report/${activeSessionId}`);
    }
  };

  // 1. If no completed sessions exist at all
  if (!activeSessionId && !loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
          <BarChart3 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
            No Completed Analyses Found
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Upload and analyze a recorded video to generate interactive head pose trends, gaze distributions, and event frequency charts.
          </p>
        </div>

        <button
          onClick={() => navigate('/upload')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition shadow-sm"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Video to Analyze</span>
        </button>
      </div>
    );
  }

  // 2. Loading State
  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Activity className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        <p className="text-xs text-neutral-400 font-mono">Aggregating visual kinematics &amp; analytics distributions...</p>
      </div>
    );
  }

  // 3. Error State
  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs inline-flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error || 'No analytics session data available.'}</span>
        </div>
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-200 text-xs font-semibold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { session, summary_statistics, timeline_metrics = [], events = [] } = data;

  // 1. Head Pose Trend Data (sampled for performance)
  const poseTrendData = (timeline_metrics || [])
    .filter((_, idx) => idx % Math.max(1, Math.floor((timeline_metrics?.length || 1) / 50)) === 0)
    .map(m => ({
      time: (m.timestamp ?? 0).toFixed(1) + 's',
      Yaw: Math.round(m.head_yaw ?? 0),
      Pitch: Math.round(m.head_pitch ?? 0),
      Roll: Math.round(m.head_roll ?? 0)
    }));

  // 2. Head Pose Distribution Data
  const poseDist = summary_statistics?.head_pose_distribution || {};
  const poseDistData = Object.keys(poseDist).map(key => ({
    name: key,
    percentage: poseDist[key] ?? 0
  }));

  // 3. Gaze Distribution Data
  const gazeDist = summary_statistics?.gaze_distribution || {};
  const gazeDistData = Object.keys(gazeDist).map(key => ({
    name: key,
    value: gazeDist[key] ?? 0
  }));

  // 4. Event Category Breakdown
  const catCounts = summary_statistics?.event_category_counts || {};
  const eventCatData = Object.keys(catCounts).map(key => ({
    category: key === 'head_movement' ? 'Head Pose' : key.toUpperCase(),
    count: catCounts[key] ?? 0
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-amber-400 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workspace</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
              Interactive Analytics Dossier
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-800 text-amber-400 border border-neutral-700">
              Aggregated Kinematics
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Quantitative computer vision distributions for {session?.video_filename || 'recorded video'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Session Switcher if multiple completed videos */}
          {completedVideos.length > 1 && (
            <div className="relative">
              <select
                value={activeSessionId}
                onChange={(e) => setActiveSessionId(e.target.value)}
                className="appearance-none bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs font-medium text-neutral-200 pr-8 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {completedVideos.map(cv => (
                  <option key={cv.active_session_id} value={cv.active_session_id!}>
                    {cv.filename}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <button
            onClick={handleReport}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs sm:text-sm transition shadow-sm shadow-amber-400/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Executive PDF</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Face Tracking</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1">
              {summary_statistics?.face_tracking_percentage ?? 100}%
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Frames with face detected</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Mean Eye Aspect (EAR)</p>
            <p className="text-3xl font-extrabold text-sky-400 mt-1">
              {summary_statistics?.mean_eye_aspect_ratio?.toFixed(3) ?? '0.000'}
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Eyelid openness index</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Smile Kinematics Ratio</p>
            <p className="text-3xl font-extrabold text-amber-400 mt-1">
              {summary_statistics?.smile_frames_ratio ?? 0}%
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Mouth corner retraction frames</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400">
            <Smile className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Detected Events</p>
            <p className="text-3xl font-extrabold text-neutral-100 mt-1">
              {events?.length ?? 0}
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Debounced visual transitions</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Continuous Head Pose Trends */}
        <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Continuous Head Pose Trends (Euler Degrees)</span>
              </h3>
              <p className="text-[11px] text-neutral-400">Yaw (turn), Pitch (tilt), and Roll (inclination) across video</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={poseTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="time" stroke="#737373" fontSize={10} tickLine={false} />
                <YAxis stroke="#737373" fontSize={10} tickLine={false} domain={[-60, 60]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '11px' }} 
                  labelStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="Yaw" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Pitch" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Roll" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Head Pose Angle Distribution */}
        <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <span>Head Pose Orientation Distribution (%)</span>
              </h3>
              <p className="text-[11px] text-neutral-400">Percentage breakdown of tracked orientation states</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={poseDistData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="name" stroke="#737373" fontSize={10} tickLine={false} />
                <YAxis stroke="#737373" fontSize={10} tickLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '11px' }} 
                />
                <Bar dataKey="percentage" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Gaze Direction Breakdown */}
        <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Approximate Gaze Direction Distribution</span>
              </h3>
              <p className="text-[11px] text-neutral-400">Iris vector displacements and ocular positioning</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gazeDistData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {gazeDistData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '11px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Visual Events Breakdown */}
        <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Detected Visual Events by Category</span>
              </h3>
              <p className="text-[11px] text-neutral-400">Categorical counts of debounced kinematic events</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventCatData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="category" stroke="#737373" fontSize={10} tickLine={false} />
                <YAxis stroke="#737373" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '11px' }} 
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Ethical Limitation Notice */}
      <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex items-start gap-4 text-xs text-neutral-400 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-neutral-200">Scientific &amp; Ethical Limitation Note:</span>{' '}
          All graphs reflect <b>observable physical surface kinematics</b> extracted via OpenCV and MediaPipe. 
          Gaze classifications are approximate geometric vectors, not clinical eye-tracking. Orientation and blendshape 
          indicators should not be interpreted as emotional truth or psychological states.
        </div>
      </div>

    </div>
  );
};
