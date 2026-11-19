import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileVideo, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Loader2, 
  X, 
  FileCheck, 
  Cpu 
} from 'lucide-react';
import { api } from '../api';

interface Props {
  onAnalysisStarted?: (videoId: string, sessionId: string) => void;
  onOpenAuth?: () => void;
}

export const UploadPage: React.FC<Props> = ({ onAnalysisStarted, onOpenAuth }) => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (selectedFile: File) => {
    setError(null);
    const validExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();

    if (!ext || !validExtensions.includes(ext)) {
      setError(`Unsupported format .${ext}. Please upload standard MP4, MOV, AVI, or WebM video.`);
      return;
    }

    if (selectedFile.size > 250 * 1024 * 1024) {
      setError('File size exceeds the 250MB limit.');
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    // Read duration
    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      setDuration(tempVideo.duration);
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    if (!consentChecked) {
      setError('Please acknowledge the privacy and consent authorization before proceeding.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload video
      const uploadRes = await api.uploadVideo(file, (percent) => {
        setUploadProgress(percent);
      });

      const videoId = uploadRes.video.id;

      // 2. Start analysis
      const analysisRes = await api.startAnalysis(videoId);
      const sessionId = analysisRes.id;

      // 3. Navigate to workspace
      if (onAnalysisStarted) {
        onAnalysisStarted(videoId, sessionId);
      }
      navigate(`/workspace/${videoId}/${sessionId}`);

    } catch (err: any) {
      if (err?.response?.status === 401) {
        if (onOpenAuth) onOpenAuth();
        setError('Authentication required: please sign in to upload and analyze videos.');
      } else {
        setError(err?.response?.data?.detail || err.message || 'Upload failed. Please check network connection.');
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const resetSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setDuration(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="pb-6 border-b border-[#1E1E2A] text-left">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F7] tracking-tight">
            Upload Video for Analysis
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#101116] text-[#A1A1AA] border border-[#1E1E2A]">
            Ingestion
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
          Upload recorded video footage to extract 478 3D facial landmarks, head pose orientation, gaze directions, and expression kinematics.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Drag & Drop / Upload Card */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center transition-all duration-200 ${
            isDragOver 
              ? 'border-violet-500 bg-violet-500/5' 
              : 'border-[#1E1E2A] bg-[#101116] hover:bg-[#14151B] hover:border-[#2A2A3A]'
          }`}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
            className="hidden" 
            onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
          />

          <div className="w-16 h-16 rounded-2xl bg-[#14151B] border border-[#1E1E2A] flex items-center justify-center text-violet-400 mx-auto mb-4 shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[#F5F5F7]">
            Drag and drop your video file here, or <span className="text-violet-400 underline">browse</span>
          </h3>

          <p className="mt-2 text-xs text-[#A1A1AA] max-w-md mx-auto">
            Supports MP4, MOV, AVI, and WebM format recordings up to 250MB. Processed entirely on server runtime.
          </p>

          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#A1A1AA]">
            <span className="px-2.5 py-1 rounded-md bg-[#08090C] border border-[#1E1E2A]">MP4</span>
            <span className="px-2.5 py-1 rounded-md bg-[#08090C] border border-[#1E1E2A]">MOV</span>
            <span className="px-2.5 py-1 rounded-md bg-[#08090C] border border-[#1E1E2A]">AVI</span>
            <span className="px-2.5 py-1 rounded-md bg-[#08090C] border border-[#1E1E2A]">WebM</span>
            <span className="px-2.5 py-1 rounded-md bg-[#08090C] border border-[#1E1E2A]">Max 250MB</span>
          </div>
        </div>
      ) : (
        /* Selected Video Preview & Validation Card */
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#101116] border border-[#1E1E2A] space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-[#1E1E2A]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <FileVideo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#F5F5F7] truncate max-w-sm sm:max-w-md">
                    {file.name}
                  </h3>
                  <p className="text-xs text-[#A1A1AA] font-mono">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; {duration ? `${duration.toFixed(1)}s` : 'Reading length...'}
                  </p>
                </div>
              </div>

              {!isUploading && (
                <button
                  onClick={resetSelection}
                  className="p-2 text-[#A1A1AA] hover:text-rose-400 hover:bg-[#14151B] rounded-lg transition"
                  title="Remove and select different file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Video Player Preview */}
            {previewUrl && (
              <div className="rounded-xl overflow-hidden bg-black border border-[#1E1E2A] max-h-72 flex items-center justify-center relative">
                <video 
                  src={previewUrl} 
                  controls 
                  className="w-full max-h-72 object-contain"
                />
              </div>
            )}

            {/* Upload Progress Bar (if uploading) */}
            {isUploading && (
              <div className="space-y-2 p-4 rounded-xl bg-[#08090C] border border-[#1E1E2A]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#F5F5F7] flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                    Uploading &amp; preparing computer vision engine...
                  </span>
                  <span className="font-mono text-violet-400 font-bold">{uploadProgress ?? 0}%</span>
                </div>
                <div className="w-full bg-[#14151B] h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-violet-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress ?? 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Ethics & Consent Checkbox */}
            <div className="p-4 rounded-xl bg-[#08090C] border border-[#1E1E2A]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  disabled={isUploading}
                  className="mt-1 w-4 h-4 rounded border-[#1E1E2A] bg-[#14151B] text-violet-600 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                />
                <div className="text-xs text-[#F5F5F7] space-y-1">
                  <span className="font-semibold text-[#F5F5F7]">
                    Consent &amp; Ethical Processing Acknowledgment
                  </span>
                  <p className="text-[#A1A1AA] leading-relaxed text-[11px]">
                    I confirm this video is recorded with appropriate consent. I acknowledge that Framewise 
                    strictly measures <b>observable geometric surface kinematics</b> (angles and muscle displacement) 
                    and explicitly does not perform facial recognition, identity matching, or psychological emotion inference.
                  </p>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetSelection}
                disabled={isUploading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#14151B] hover:bg-[#1E1E2A] text-[#A1A1AA] hover:text-[#F5F5F7] border border-[#1E1E2A] text-xs font-semibold transition disabled:opacity-50"
              >
                Choose Different File
              </button>

              <button
                type="button"
                onClick={handleUploadAndAnalyze}
                disabled={isUploading || !consentChecked}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs sm:text-sm transition-all shadow-sm shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Ingestion...</span>
                  </>
                ) : (
                  <>
                    <span>Start Computer Vision Analysis</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Informational Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-4 rounded-xl bg-[#101116] border border-[#1E1E2A] text-left">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-2.5">
            <FileCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-[#F5F5F7]">Sampling Resolution</h4>
          <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">
            Videos are automatically sampled at optimal FPS (5.0 &mdash; 15.0 FPS) to balance extreme precision with speed.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#101116] border border-[#1E1E2A] text-left">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-2.5">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-[#F5F5F7]">Server-Side Execution</h4>
          <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">
            All OpenCV Perspective-n-Point calculations execute inside the production Python runtime.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#101116] border border-[#1E1E2A] text-left">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-2.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-[#F5F5F7]">Full Privacy</h4>
          <p className="text-[11px] text-[#A1A1AA] mt-1 leading-relaxed">
            Videos can be purged from storage at any time with complete data sovereignty and per-user isolation.
          </p>
        </div>
      </div>

    </div>
  );
};
