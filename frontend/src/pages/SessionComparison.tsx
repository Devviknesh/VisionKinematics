import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  GitCompare, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Layers, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  UploadCloud,
  Compass,
  Eye,
  Smile
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../api';
import { VideoItem, SessionComparisonResponse } from '../types';

export const SessionComparison: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [completedVideos, setCompletedVideos] = useState<VideoItem[]>([]);
  const [selectedSessionA, setSelectedSessionA] = useState<string>(searchParams.get('session_a') || '');
  const [selectedSessionB, setSelectedSessionB] = useState<string>(searchParams.get('session_b') || '');
  
  const [comparisonData, setComparisonData] = useState<SessionComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's completed sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setInitialLoading(true);
        const videos = await api.listVideos();
        const completed = videos.filter(v => v.session_status === 'completed' && v.active_session_id);
        setCompletedVideos(completed);

        // Pre-select first two if available and none selected
        if (!selectedSessionA && completed.length > 0 && completed[0].active_session_id) {
          setSelectedSessionA(completed[0].active_session_id);
        }
        if (!selectedSessionB && completed.length > 1 && completed[1].active_session_id) {
          setSelectedSessionB(completed[1].active_session_id);
        }
      } catch (err: any) {
        setError('Failed to load sessions for comparison.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadSessions();
  }, []);

  // Fetch comparison whenever both sessions are selected
  useEffect(() => {
    if (!selectedSessionA || !selectedSessionB || selectedSessionA === selectedSessionB) {
      setComparisonData(null);
      return;
    }

    const fetchComparison = async () => {
      try {
        setLoading(true);
        setError(null);
        setSearchParams({ session_a: selectedSessionA, session_b: selectedSessionB });
        const data = await api.compareSessions(selectedSessionA, selectedSessionB);
        setComparisonData(data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to compare sessions.');
        setComparisonData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [selectedSessionA, selectedSessionB]);

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-xs text-neutral-400">Loading analysis sessions...</p>
      </div>
    );
  }

  if (completedVideos.length < 2) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto">
          <GitCompare className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-100">Minimum 2 Completed Sessions Required</h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
          Session comparison requires at least two completed video analyses to calculate differential kinematics, gaze trends, and stability deltas.
        </p>
        <button
          onClick={() => navigate('/upload')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Video</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
              Session Comparison
            </h1>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-neutral-800 text-amber-400 border border-neutral-700">
              Differential CV
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Perform objective, side-by-side comparative analysis of observable facial kinematics and orientation stability.
          </p>
        </div>

        <button
          onClick={() => navigate('/history')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 transition self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sessions</span>
        </button>
      </div>

      {/* Session Selectors Card */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
        <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Select Two Sessions To Contrast
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Baseline Session (Session A)
            </label>
            <select
              value={selectedSessionA}
              onChange={(e) => setSelectedSessionA(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition"
            >
              {completedVideos.map((v) => (
                <option key={v.active_session_id} value={v.active_session_id || ''}>
                  {v.filename} ({v.duration}s &bull; {new Date(v.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Comparison Session (Session B)
            </label>
            <select
              value={selectedSessionB}
              onChange={(e) => setSelectedSessionB(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition"
            >
              {completedVideos.map((v) => (
                <option key={v.active_session_id} value={v.active_session_id || ''}>
                  {v.filename} ({v.duration}s &bull; {new Date(v.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSessionA === selectedSessionB && (
          <p className="text-xs text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>Please select two distinct sessions to view meaningful differential metrics.</span>
          </p>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
          <p className="text-xs text-neutral-400">Computing differential computer vision kinematics...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {comparisonData && !loading && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* Overview Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Session A Card */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-400 border border-amber-400/30">
                  SESSION A (BASELINE)
                </span>
                <span className="text-xs font-mono text-neutral-500">{comparisonData.session_a.duration}s</span>
              </div>
              <h3 className="text-base font-bold text-neutral-100 truncate">{comparisonData.session_a.video_filename}</h3>
              <p className="text-xs text-neutral-400">
                Created: {new Date(comparisonData.session_a.created_at || '').toLocaleString()}
              </p>
            </div>

            {/* Session B Card */}
            <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-sky-400/20 text-sky-400 border border-sky-400/30">
                  SESSION B (COMPARISON)
                </span>
                <span className="text-xs font-mono text-neutral-500">{comparisonData.session_b.duration}s</span>
              </div>
              <h3 className="text-base font-bold text-neutral-100 truncate">{comparisonData.session_b.video_filename}</h3>
              <p className="text-xs text-neutral-400">
                Created: {new Date(comparisonData.session_b.created_at || '').toLocaleString()}
              </p>
            </div>

          </div>

          {/* Visual Charts: Radar & Differential Bar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Kinematics Radar Chart (6 cols) */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-100">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Multimodal Kinematic Radar Profile</span>
                </div>
              </div>
              <p className="text-[11px] text-neutral-400">
                Normalized comparison across physical head orientation, ocular gaze vectors, and facial movement intensity.
              </p>
              
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={comparisonData.radar_data}>
                    <PolarGrid stroke="#262626" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#a3a3a3', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#404040" tick={false} />
                    <Radar name="Session A" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.35} />
                    <Radar name="Session B" dataKey="B" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.35} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Key Differences Bar Chart (6 cols) */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-100">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  <span>Differential Metric Distribution (%)</span>
                </div>
              </div>
              <p className="text-[11px] text-neutral-400">
                Direct percentage points across face tracking, forward pose ratio, center gaze, and smile frequency.
              </p>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData.comparison_metrics.filter(m => m.unit === '%')}
                    margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis 
                      dataKey="metric" 
                      tick={{ fill: '#737373', fontSize: 10 }} 
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fill: '#737373', fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#f5f5f5' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar name="Session A" dataKey="session_a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar name="Session B" dataKey="session_b" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Detailed Metric Deltas Table */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-100">
                Measurable Kinematic Differences
              </h3>
              <span className="text-[11px] text-neutral-400 font-mono">
                {comparisonData.comparison_metrics.length} Parameters Evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3">Domain</th>
                    <th className="py-3 px-3">Observable Metric</th>
                    <th className="py-3 px-3 text-right">Session A</th>
                    <th className="py-3 px-3 text-right">Session B</th>
                    <th className="py-3 px-3 text-right">Differential (Δ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-mono">
                  {comparisonData.comparison_metrics.map((row, idx) => {
                    const isPositive = row.diff > 0;
                    const isZero = row.diff === 0;

                    return (
                      <tr key={idx} className="hover:bg-neutral-850/50 transition">
                        <td className="py-3 px-3 font-sans text-neutral-400">{row.category}</td>
                        <td className="py-3 px-3 font-sans text-neutral-200 font-medium">{row.metric}</td>
                        <td className="py-3 px-3 text-right text-amber-400">{row.session_a}{row.unit}</td>
                        <td className="py-3 px-3 text-right text-sky-400">{row.session_b}{row.unit}</td>
                        <td className="py-3 px-3 text-right">
                          <span className={`inline-flex items-center gap-1 font-bold ${
                            isZero ? 'text-neutral-500' : isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isZero ? <Minus className="w-3 h-3" /> : isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            <span>{row.diff > 0 ? `+${row.diff}` : row.diff}{row.unit}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scientific & Ethical Disclaimer Banner */}
          <div className="p-4 rounded-xl bg-amber-400/5 border border-amber-400/20 text-xs text-amber-300/90 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Methodology &amp; Ethical Delimitation</p>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                {comparisonData.disclaimer}
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
