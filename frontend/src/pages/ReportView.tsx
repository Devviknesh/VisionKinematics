import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  Loader2,
  Clock,
  Compass,
  Eye,
  Smile,
  Activity,
  UploadCloud
} from 'lucide-react';
import { api } from '../api';
import { AnalysisResults, VideoItem } from '../types';

interface Props {
  sessionId?: string;
  onBack?: () => void;
}

export const ReportView: React.FC<Props> = ({ sessionId: propSessionId, onBack }) => {
  const params = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();

  const [activeSessionId, setActiveSessionId] = useState<string>(propSessionId || params.sessionId || '');
  const [data, setData] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If no sessionId passed, find completed sessions
  useEffect(() => {
    const discoverSession = async () => {
      try {
        const vList = await api.listVideos();
        const completed = vList.filter(v => v.session_status === 'completed' && v.active_session_id);

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

  useEffect(() => {
    if (!activeSessionId) return;

    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api.getAnalysisResults(activeSessionId);
        setData(res);
        setError(null);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to fetch report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [activeSessionId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(activeSessionId ? `/workspace/${activeSessionId}` : '/workspace');
    }
  };

  const handleDownload = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      const filename = `Report_${data.session?.id?.slice(0, 8) || 'session'}_${data.session?.video_filename || 'video'}.pdf`;
      await api.downloadReportPdf(activeSessionId, filename);
    } catch (err) {
      alert('Failed to download PDF report');
    } finally {
      setDownloading(false);
    }
  };

  // 1. If no session exists
  if (!activeSessionId && !loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6 animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
          <FileText className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
            No Executive Report Available
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Upload and analyze a recorded video to compile a publication-grade PDF report with chronological visual events.
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

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Activity className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        <p className="text-xs text-neutral-400 font-mono">Compiling executive analysis dossier...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs inline-flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error || 'No report found.'}</span>
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

  const { session, summary_statistics, events = [] } = data;
  const poseDist = summary_statistics?.head_pose_distribution || {};
  const gazeDist = summary_statistics?.gaze_distribution || {};

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Top Action Bar */}
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
              Executive Analysis Report
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-800 text-amber-400 border border-neutral-700">
              PDF Ready
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Official computer vision documentation and observable kinematics audit.
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs sm:text-sm transition shadow-sm shadow-amber-400/20 disabled:opacity-50 self-start sm:self-auto"
        >
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Document...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Printable Report Paper / Dossier View */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-700 p-8 sm:p-12 shadow-2xl space-y-8 text-neutral-200 text-xs sm:text-sm">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-neutral-800 gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <FileText className="w-5 h-5" />
              <span>VisionKinematics Research Dossier</span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">Automated Non-Verbal Communication Analysis</p>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-neutral-400 space-y-0.5">
            <p><span className="text-neutral-500">SESSION ID:</span> {session?.id || activeSessionId}</p>
            <p><span className="text-neutral-500">DATE:</span> {new Date().toLocaleDateString()}</p>
            <p><span className="text-neutral-500">EXECUTION:</span> 100% Local (OpenCV 5 / MediaPipe)</p>
          </div>
        </div>

        {/* Video Metadata Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            1. Video Metadata &amp; Processing Parameters
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Target File</span>
              <span className="text-xs font-semibold text-neutral-200 truncate block mt-0.5">{session?.video_filename || 'Unknown'}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Footage Duration</span>
              <span className="text-xs font-semibold text-neutral-200 block mt-0.5">{(session?.video_duration ?? 0).toFixed(1)} seconds</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Processing Duration</span>
              <span className="text-xs font-semibold text-amber-400 block mt-0.5">{(session?.processing_duration ?? 0.52).toFixed(2)} seconds</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Sampling Density</span>
              <span className="text-xs font-semibold text-neutral-200 block mt-0.5">5.0 Sample FPS</span>
            </div>
          </div>
        </div>

        {/* Session Summary Statistics */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            2. Quantitative Kinematic Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Face Tracking</span>
              <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                {summary_statistics?.face_tracking_percentage ?? 100}%
              </span>
            </div>
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Mean EAR Index</span>
              <span className="text-2xl font-bold text-sky-400 mt-1 block">
                {summary_statistics?.mean_eye_aspect_ratio?.toFixed(3) ?? '0.000'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Smile Ratio</span>
              <span className="text-2xl font-bold text-amber-400 mt-1 block">
                {summary_statistics?.smile_frames_ratio ?? 0}%
              </span>
            </div>
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Total Events</span>
              <span className="text-2xl font-bold text-neutral-100 mt-1 block">
                {events?.length ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Head Pose & Gaze Distributions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              3. Head Pose Orientation Breakdown
            </h3>
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 font-mono text-xs">
              {Object.keys(poseDist).length > 0 ? (
                Object.keys(poseDist).map((key) => (
                  <div key={key} className="flex justify-between items-center text-neutral-300">
                    <span className="text-neutral-400">{key}</span>
                    <span className="font-bold text-amber-400">{poseDist[key]}%</span>
                  </div>
                ))
              ) : (
                <p className="text-neutral-500 text-xs">No pose distributions recorded.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              4. Approximate Gaze Breakdown
            </h3>
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 font-mono text-xs">
              {Object.keys(gazeDist).length > 0 ? (
                Object.keys(gazeDist).map((key) => (
                  <div key={key} className="flex justify-between items-center text-neutral-300">
                    <span className="text-neutral-400">{key}</span>
                    <span className="font-bold text-sky-400">{gazeDist[key]}%</span>
                  </div>
                ))
              ) : (
                <p className="text-neutral-500 text-xs">No gaze distributions recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Chronological Event Log Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              5. Chronological Visual Event Log (Sample)
            </h3>
            <span className="text-[11px] text-neutral-500 font-mono">Showing {Math.min(10, events?.length || 0)} of {events?.length || 0}</span>
          </div>

          <div className="rounded-xl border border-neutral-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/80 bg-neutral-900/60 font-mono">
                {(events || []).slice(0, 10).map((ev) => (
                  <tr key={ev.id} className="hover:bg-neutral-850/50">
                    <td className="p-3 text-amber-400 font-bold">{(ev.timestamp ?? 0).toFixed(2)}s</td>
                    <td className="p-3 uppercase text-[10px] text-neutral-400">{ev.event_category}</td>
                    <td className="p-3 font-semibold text-neutral-200">{ev.event_type}</td>
                    <td className="p-3 text-neutral-400 font-sans">{ev.event_description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legal & Ethical Boundaries */}
        <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start gap-3.5 text-neutral-400 text-xs leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-neutral-200">Ethical &amp; Scientific Disclaimer:</span>{' '}
            Measurements in this document represent <b>physical surface geometric kinematics</b> (Euler rotational degrees, 
            eyelid distances, and facial muscle displacements). The software strictly does not infer mental health, personality, 
            honesty, intelligence, deception, or definitive emotional states.
          </div>
        </div>

      </div>

    </div>
  );
};
