import React from 'react';
import { FacialMetric } from '../types';
import { Compass, Eye, Smile, Activity } from 'lucide-react';

interface Props {
  metric: FacialMetric | null;
  className?: string;
}

export const FacialKinematicsOverlay: React.FC<Props> = ({ metric, className = '' }) => {
  if (!metric || !metric.face_detected) {
    return (
      <div className={`flex flex-col items-center justify-center p-6 text-neutral-500 font-mono text-xs ${className}`}>
        <Activity className="w-8 h-8 text-neutral-700 animate-pulse mb-2" />
        <span>No Face Tracking in Current Frame</span>
      </div>
    );
  }

  const yaw = metric.head_yaw ?? 0;
  const pitch = metric.head_pitch ?? 0;
  const roll = metric.head_roll ?? 0;
  const ear = metric.eye_aspect_ratio ?? 0.3;
  const smile = metric.expression_measurements?.smile_intensity ?? 0;
  const brow = metric.expression_measurements?.brow_elevation ?? 0;
  const mouthOpen = metric.expression_measurements?.mouth_openness ?? 0;

  // Geometry calculations for landmark wireframe representation
  // Center is (100, 100)
  const cx = 100 + Math.max(-25, Math.min(25, yaw * 0.8));
  const cy = 100 + Math.max(-25, Math.min(25, pitch * 0.8));

  // Eye heights scaled by EAR (normal ~ 0.28 - 0.35, blink < 0.2)
  const eyeH = Math.max(1, ear * 28);
  const eyeW = 14;

  // Eyebrow offset based on brow elevation
  const browY = cy - 22 - (brow * 8);

  // Mouth smile curvature
  const smileOffset = smile * 10;
  const mouthH = 4 + (mouthOpen * 14);

  // Gaze pupil shift
  let gazeShiftX = 0;
  let gazeShiftY = 0;
  if (metric.gaze_direction?.toLowerCase().includes('left')) gazeShiftX = -3;
  if (metric.gaze_direction?.toLowerCase().includes('right')) gazeShiftX = 3;
  if (metric.gaze_direction?.toLowerCase().includes('up')) gazeShiftY = -3;
  if (metric.gaze_direction?.toLowerCase().includes('down')) gazeShiftY = 3;

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* 2D Synthetic Wireframe Projection Canvas/SVG */}
      <div className="relative w-48 h-48 bg-neutral-950/80 rounded-2xl border border-neutral-800 p-2 flex items-center justify-center shadow-inner overflow-hidden">
        
        {/* Background Grid */}
        <svg className="absolute inset-0 w-full h-full stroke-neutral-900/60 pointer-events-none" width="100%" height="100%">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Dynamic Animated Landmark Wireframe */}
        <svg 
          viewBox="0 0 200 200" 
          className="w-full h-full transition-transform duration-75"
          style={{ transform: `rotate(${roll.toFixed(1)}deg)` }}
        >
          {/* Facial Silhouette Wireframe Oval */}
          <ellipse 
            cx={cx} 
            cy={cy} 
            rx={52} 
            ry={68} 
            fill="none" 
            stroke="#f59e0b" 
            strokeWidth="1.5" 
            strokeDasharray="3 3"
            className="opacity-70"
          />

          {/* Symmetrical Center Axes */}
          <line x1={cx} y1={cy - 68} x2={cx} y2={cy + 68} stroke="#f59e0b" strokeWidth="0.75" strokeOpacity="0.4" />
          <line x1={cx - 52} y1={cy} x2={cx + 52} y2={cy} stroke="#f59e0b" strokeWidth="0.75" strokeOpacity="0.4" />

          {/* Left Eyebrow */}
          <path 
            d={`M ${cx - 36} ${browY + 2} Q ${cx - 22} ${browY - 4} ${cx - 8} ${browY}`} 
            fill="none" 
            stroke="#38bdf8" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />
          {/* Right Eyebrow */}
          <path 
            d={`M ${cx + 8} ${browY} Q ${cx + 22} ${browY - 4} ${cx + 36} ${browY + 2}`} 
            fill="none" 
            stroke="#38bdf8" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />

          {/* Left Eye */}
          <ellipse 
            cx={cx - 22} 
            cy={cy - 12} 
            rx={eyeW} 
            ry={eyeH} 
            fill="#0369a1" 
            fillOpacity="0.25"
            stroke="#38bdf8" 
            strokeWidth="1.5" 
          />
          {/* Left Pupil */}
          {ear > 0.18 && (
            <circle 
              cx={cx - 22 + gazeShiftX} 
              cy={cy - 12 + gazeShiftY} 
              r={3.5} 
              fill="#38bdf8" 
            />
          )}

          {/* Right Eye */}
          <ellipse 
            cx={cx + 22} 
            cy={cy - 12} 
            rx={eyeW} 
            ry={eyeH} 
            fill="#0369a1" 
            fillOpacity="0.25"
            stroke="#38bdf8" 
            strokeWidth="1.5" 
          />
          {/* Right Pupil */}
          {ear > 0.18 && (
            <circle 
              cx={cx + 22 + gazeShiftX} 
              cy={cy - 12 + gazeShiftY} 
              r={3.5} 
              fill="#38bdf8" 
            />
          )}

          {/* Nose Bridge */}
          <path 
            d={`M ${cx} ${cy - 10} L ${cx - 4} ${cy + 12} L ${cx + 4} ${cy + 12} Z`} 
            fill="none" 
            stroke="#a3a3a3" 
            strokeWidth="1.5" 
            strokeLinejoin="round" 
          />

          {/* Mouth Contour with Smile Puller Curvature */}
          <path 
            d={`M ${cx - 26} ${cy + 34 - smileOffset * 0.4} Q ${cx} ${cy + 34 + smileOffset} ${cx + 26} ${cy + 34 - smileOffset * 0.4}`} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />
          {mouthOpen > 0.15 && (
            <path 
              d={`M ${cx - 20} ${cy + 34} Q ${cx} ${cy + 34 + mouthH} ${cx + 20} ${cy + 34}`} 
              fill="rgba(16, 185, 129, 0.2)" 
              stroke="#10b981" 
              strokeWidth="1.5" 
            />
          )}

          {/* Perspective Head Vector Indicator */}
          <circle cx={cx} cy={cy} r={2} fill="#f59e0b" />
          <line 
            x1={cx} 
            y1={cy} 
            x2={cx + yaw * 1.2} 
            y2={cy + pitch * 1.2} 
            stroke="#f43f5e" 
            strokeWidth="2" 
            strokeLinecap="round" 
          />
        </svg>

        {/* Live Tracking HUD Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-900/90 border border-neutral-800 text-[10px] font-mono text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>MESH 478</span>
        </div>

        {/* Roll Angle Badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-neutral-900/90 border border-neutral-800 text-[10px] font-mono text-neutral-400">
          Roll: {roll > 0 ? `+${roll.toFixed(1)}°` : `${roll.toFixed(1)}°`}
        </div>
      </div>

      {/* Orientation Angles Row */}
      <div className="flex items-center justify-between w-full max-w-[200px] mt-2 text-[11px] font-mono text-neutral-400 px-1">
        <span title="Yaw (Horizontal Turn)">
          Y: <strong className="text-amber-400">{yaw > 0 ? `+${yaw.toFixed(1)}°` : `${yaw.toFixed(1)}°`}</strong>
        </span>
        <span title="Pitch (Vertical Tilt)">
          P: <strong className="text-sky-400">{pitch > 0 ? `+${pitch.toFixed(1)}°` : `${pitch.toFixed(1)}°`}</strong>
        </span>
        <span title="Roll (Lateral Tilt)">
          R: <strong className="text-emerald-400">{roll > 0 ? `+${roll.toFixed(1)}°` : `${roll.toFixed(1)}°`}</strong>
        </span>
      </div>
    </div>
  );
};
