import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { FacialMetric } from '../types';
import { Activity, Compass, Eye, Smile, Filter } from 'lucide-react';

interface Props {
  metrics: FacialMetric[];
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

export const KinematicsWaveformTimeline: React.FC<Props> = ({
  metrics,
  currentTime,
  duration,
  onSeek
}) => {
  const [showHeadPose, setShowHeadPose] = useState(true);
  const [showEyes, setShowEyes] = useState(true);
  const [showSmile, setShowSmile] = useState(true);

  if (!metrics || metrics.length === 0) {
    return null;
  }

  // Downsample if more than 300 points for fluid 60fps rendering
  const step = Math.max(1, Math.floor(metrics.length / 200));
  const chartData = metrics.filter((_, idx) => idx % step === 0).map((m) => {
    const t = m.timestamp ?? 0;
    return {
      timestamp: parseFloat(t.toFixed(2)),
      yaw: m.head_yaw != null ? parseFloat(m.head_yaw.toFixed(1)) : 0,
      pitch: m.head_pitch != null ? parseFloat(m.head_pitch.toFixed(1)) : 0,
      roll: m.head_roll != null ? parseFloat(m.head_roll.toFixed(1)) : 0,
      ear: m.eye_aspect_ratio != null ? parseFloat((m.eye_aspect_ratio * 100).toFixed(1)) : 30,
      smile: m.expression_measurements?.smile_intensity != null 
        ? parseFloat((m.expression_measurements.smile_intensity * 100).toFixed(1)) 
        : 0
    };
  });

  const handleChartClick = (state: any) => {
    if (state && state.activeLabel !== undefined) {
      const seekSec = parseFloat(state.activeLabel);
      if (!isNaN(seekSec)) {
        onSeek(seekSec);
      }
    }
  };

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4 w-full min-w-0 overflow-hidden">
      {/* Header with Title and Stream Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80 w-full min-w-0">
        <div>
          <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Multi-Stream Kinematic Waveforms</span>
          </h3>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Synchronized frame-level time series. Click anywhere on the timeline to jump to that timestamp.
          </p>
        </div>

        {/* Stream Toggle Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => setShowHeadPose(!showHeadPose)}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition border flex items-center gap-1.5 ${
              showHeadPose 
                ? 'bg-amber-400/10 border-amber-400/40 text-amber-400' 
                : 'bg-neutral-950 border-neutral-800 text-neutral-500'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>Head Pose</span>
          </button>

          <button
            onClick={() => setShowEyes(!showEyes)}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition border flex items-center gap-1.5 ${
              showEyes 
                ? 'bg-sky-400/10 border-sky-400/40 text-sky-400' 
                : 'bg-neutral-950 border-neutral-800 text-neutral-500'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>EAR (x100)</span>
          </button>

          <button
            onClick={() => setShowSmile(!showSmile)}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-semibold transition border flex items-center gap-1.5 ${
              showSmile 
                ? 'bg-emerald-400/10 border-emerald-400/40 text-emerald-400' 
                : 'bg-neutral-950 border-neutral-800 text-neutral-500'
            }`}
          >
            <Smile className="w-3 h-3" />
            <span>Smile Kinematics</span>
          </button>
        </div>
      </div>

      {/* Waveform Chart Canvas */}
      <div className="h-44 w-full min-w-0 max-w-full overflow-hidden" style={{ minWidth: 0, maxWidth: '100%' }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart 
            data={chartData} 
            onClick={handleChartClick}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            style={{ maxWidth: '100%' }}
          >
            <XAxis 
              dataKey="timestamp" 
              type="number"
              domain={[0, duration || 'dataMax']}
              stroke="#525252" 
              tick={{ fontSize: 10, fill: '#a3a3a3' }}
              tickFormatter={(v) => `${v.toFixed(1)}s`}
            />
            <YAxis 
              stroke="#525252" 
              tick={{ fontSize: 10, fill: '#a3a3a3' }}
              domain={[-45, 60]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0a0a0a', 
                border: '1px solid #262626', 
                borderRadius: '0.75rem', 
                fontSize: '11px',
                color: '#e5e5e5' 
              }}
              formatter={(val: any, name: string) => {
                if (name === 'yaw') return [`${val}°`, 'Head Yaw'];
                if (name === 'pitch') return [`${val}°`, 'Head Pitch'];
                if (name === 'ear') return [`${(val / 100).toFixed(3)}`, 'Eye Aspect Ratio'];
                if (name === 'smile') return [`${val}%`, 'Smile Kinematics'];
                return [val, name];
              }}
              labelFormatter={(t) => `Time: ${parseFloat(t).toFixed(2)}s`}
            />

            {/* Synchronized Live Playhead Cursor */}
            <ReferenceLine 
              x={parseFloat(currentTime.toFixed(2))} 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="2 2"
              label={{
                value: `${currentTime.toFixed(1)}s`,
                position: 'top',
                fill: '#f59e0b',
                fontSize: 10,
                fontFamily: 'monospace'
              }}
            />

            {showHeadPose && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="yaw" 
                  stroke="#f59e0b" 
                  strokeWidth={1.5} 
                  dot={false}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="pitch" 
                  stroke="#f97316" 
                  strokeWidth={1.2} 
                  dot={false}
                  strokeDasharray="4 2"
                  isAnimationActive={false}
                />
              </>
            )}

            {showEyes && (
              <Line 
                type="monotone" 
                dataKey="ear" 
                stroke="#38bdf8" 
                strokeWidth={1.5} 
                dot={false}
                isAnimationActive={false}
              />
            )}

            {showSmile && (
              <Line 
                type="monotone" 
                dataKey="smile" 
                stroke="#10b981" 
                strokeWidth={1.5} 
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
