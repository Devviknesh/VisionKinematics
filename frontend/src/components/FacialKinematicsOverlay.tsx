import React from 'react';
import { FacialMetric } from '../types';
import { Activity, ShieldCheck } from 'lucide-react';

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

  const hasRealLandmarks = Boolean(metric?.landmarks && metric.landmarks.length >= 468);

  // Compute normalized bounding box and map actual 478 MediaPipe points to 200x200 canvas
  const realMeshGeometry = React.useMemo(() => {
    if (!hasRealLandmarks || !metric?.landmarks) return null;
    const lms = metric.landmarks;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < lms.length; i++) {
      const pt = lms[i];
      if (pt[0] < minX) minX = pt[0];
      if (pt[0] > maxX) maxX = pt[0];
      if (pt[1] < minY) minY = pt[1];
      if (pt[1] > maxY) maxY = pt[1];
    }
    const width = Math.max(0.001, maxX - minX);
    const height = Math.max(0.001, maxY - minY);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    // Scale face into 140x140 area within 200x200 viewport
    const scale = 140 / Math.max(width, height);

    const points: [number, number][] = lms.map(pt => [
      100 + (pt[0] - midX) * scale,
      100 + (pt[1] - midY) * scale
    ]);

    const buildPath = (indices: number[], close = false) => {
      let d = '';
      for (let i = 0; i < indices.length; i++) {
        const idx = indices[i];
        if (idx < points.length) {
          const [px, py] = points[idx];
          d += (i === 0 ? `M ${px.toFixed(1)} ${py.toFixed(1)}` : ` L ${px.toFixed(1)} ${py.toFixed(1)}`);
        }
      }
      if (close) d += ' Z';
      return d;
    };

    return {
      points,
      faceOval: buildPath([10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10]),
      leftEye: buildPath([33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33], true),
      rightEye: buildPath([362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362], true),
      leftEyebrow: buildPath([70, 63, 105, 66, 107, 55, 65, 52, 53, 46]),
      rightEyebrow: buildPath([300, 293, 334, 296, 336, 285, 295, 282, 283, 276]),
      lipsOuter: buildPath([61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61], true),
      lipsInner: buildPath([78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78], true),
      noseBridge: buildPath([168, 6, 197, 195, 5, 4, 1, 19, 94, 2]),
      leftIris: lms.length >= 478 ? buildPath([468, 469, 470, 471, 468], true) : '',
      rightIris: lms.length >= 478 ? buildPath([473, 474, 475, 476, 473], true) : '',
      noseTip: points[1] || [100, 100]
    };
  }, [hasRealLandmarks, metric?.landmarks]);

  // Fallback synthetic geometry (only when real landmarks are absent)
  const cx = 100 + Math.max(-25, Math.min(25, yaw * 0.8));
  const cy = 100 + Math.max(-25, Math.min(25, pitch * 0.8));
  const eyeH = Math.max(1, ear * 28);
  const eyeW = 14;
  const browY = cy - 22 - (brow * 8);
  const smileOffset = smile * 10;
  const mouthH = 4 + (mouthOpen * 14);

  let gazeShiftX = 0;
  let gazeShiftY = 0;
  if (metric.gaze_direction?.toLowerCase().includes('left')) gazeShiftX = -3;
  if (metric.gaze_direction?.toLowerCase().includes('right')) gazeShiftX = 3;
  if (metric.gaze_direction?.toLowerCase().includes('up')) gazeShiftY = -3;
  if (metric.gaze_direction?.toLowerCase().includes('down')) gazeShiftY = 3;

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* 2D Mesh Canvas / SVG */}
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

        {/* Dynamic Mesh Rendering */}
        {hasRealLandmarks && realMeshGeometry ? (
          <svg 
            viewBox="0 0 200 200" 
            className="w-full h-full transition-all duration-75"
          >
            {/* Real Canonical FaceMesh Contours */}
            <path d={realMeshGeometry.faceOval} fill="none" stroke="#f59e0b" strokeWidth="1.2" opacity="0.8" />
            <path d={realMeshGeometry.leftEyebrow} fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" />
            <path d={realMeshGeometry.rightEyebrow} fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" />
            <path d={realMeshGeometry.leftEye} fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="1.2" />
            <path d={realMeshGeometry.rightEye} fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="1.2" />
            {realMeshGeometry.leftIris && <path d={realMeshGeometry.leftIris} fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />}
            {realMeshGeometry.rightIris && <path d={realMeshGeometry.rightIris} fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />}
            <path d={realMeshGeometry.noseBridge} fill="none" stroke="#a3a3a3" strokeWidth="1.2" strokeLinejoin="round" />
            <path d={realMeshGeometry.lipsOuter} fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="1.4" strokeLinejoin="round" />
            <path d={realMeshGeometry.lipsInner} fill="none" stroke="#10b981" strokeWidth="0.8" />

            {/* Real MediaPipe 478 Landmark Dots */}
            {realMeshGeometry.points.map(([px, py], i) => (
              <circle 
                key={i} 
                cx={px} 
                cy={py} 
                r={i % 5 === 0 ? 1.0 : 0.6} 
                fill={i >= 468 ? "#38bdf8" : (i === 1 || i === 152 ? "#f59e0b" : "#60a5fa")} 
                opacity={i % 5 === 0 ? 0.8 : 0.45} 
              />
            ))}

            {/* Pose Vector projecting from Real Nose Tip */}
            <circle cx={realMeshGeometry.noseTip[0]} cy={realMeshGeometry.noseTip[1]} r={2.5} fill="#f59e0b" />
            <line 
              x1={realMeshGeometry.noseTip[0]} 
              y1={realMeshGeometry.noseTip[1]} 
              x2={realMeshGeometry.noseTip[0] + yaw * 0.9} 
              y2={realMeshGeometry.noseTip[1] + pitch * 0.9} 
              stroke="#f43f5e" 
              strokeWidth="2" 
              strokeLinecap="round" 
            />
          </svg>
        ) : (
          /* Fallback Synthetic Wireframe when real coordinates not yet cached */
          <svg 
            viewBox="0 0 200 200" 
            className="w-full h-full transition-transform duration-75"
            style={{ transform: `rotate(${roll.toFixed(1)}deg)` }}
          >
            <ellipse cx={cx} cy={cy} rx={52} ry={68} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" className="opacity-70" />
            <line x1={cx} y1={cy - 68} x2={cx} y2={cy + 68} stroke="#f59e0b" strokeWidth="0.75" strokeOpacity="0.4" />
            <line x1={cx - 52} y1={cy} x2={cx + 52} y2={cy} stroke="#f59e0b" strokeWidth="0.75" strokeOpacity="0.4" />
            <path d={`M ${cx - 36} ${browY + 2} Q ${cx - 22} ${browY - 4} ${cx - 8} ${browY}`} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            <path d={`M ${cx + 8} ${browY} Q ${cx + 22} ${browY - 4} ${cx + 36} ${browY + 2}`} fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx={cx - 22} cy={cy - 12} rx={eyeW} ry={eyeH} fill="#0369a1" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.5" />
            {ear > 0.18 && <circle cx={cx - 22 + gazeShiftX} cy={cy - 12 + gazeShiftY} r={3.5} fill="#38bdf8" />}
            <ellipse cx={cx + 22} cy={cy - 12} rx={eyeW} ry={eyeH} fill="#0369a1" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.5" />
            {ear > 0.18 && <circle cx={cx + 22 + gazeShiftX} cy={cy - 12 + gazeShiftY} r={3.5} fill="#38bdf8" />}
            <path d={`M ${cx} ${cy - 10} L ${cx - 4} ${cy + 12} L ${cx + 4} ${cy + 12} Z`} fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeLinejoin="round" />
            <path d={`M ${cx - 26} ${cy + 34 - smileOffset * 0.4} Q ${cx} ${cy + 34 + smileOffset} ${cx + 26} ${cy + 34 - smileOffset * 0.4}`} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            {mouthOpen > 0.15 && <path d={`M ${cx - 20} ${cy + 34} Q ${cx} ${cy + 34 + mouthH} ${cx + 20} ${cy + 34}`} fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="1.5" />}
            <circle cx={cx} cy={cy} r={2} fill="#f59e0b" />
            <line x1={cx} y1={cy} x2={cx + yaw * 1.2} y2={cy + pitch * 1.2} stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}

        {/* Live Tracking HUD Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-neutral-900/90 border border-neutral-800 text-[10px] font-mono text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>{hasRealLandmarks ? "REAL MESH 478" : "KINEMATICS"}</span>
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

      {/* Real Landmark Coordinate Attribution */}
      <div className="mt-1 text-[9px] font-mono text-neutral-400 text-center max-w-[200px] leading-tight">
        {hasRealLandmarks 
          ? "Live MediaPipe 478 Normalized Points" 
          : "Real-time Orientation & Blendshapes"}
      </div>
    </div>
  );
};