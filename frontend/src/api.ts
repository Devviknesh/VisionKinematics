import axios from 'axios';
import { 
  User, 
  VideoItem, 
  AnalysisSession, 
  AnalysisResults, 
  AnalysisEvent, 
  SummaryStatistics,
  SessionComparisonResponse 
} from './types';

const VITE_BACKEND_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = VITE_BACKEND_URL ? `${VITE_BACKEND_URL.replace(/\/+$/, '')}/api` : '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('vision_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth & Profile
  async register(data: { name: string; email: string; password: string }) {
    const res = await client.post<User>('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await client.post<{ access_token: string; token_type: string; user: User }>('/auth/login', data);
    return res.data;
  },

  async getMe() {
    const res = await client.get<User>('/auth/me');
    return res.data;
  },

  async updateProfile(data: { name?: string; preferences?: Record<string, any> }) {
    const res = await client.put<User>('/auth/profile', data);
    return res.data;
  },

  async changePassword(data: { current_password: string; new_password: string }) {
    const res = await client.put<{ message: string }>('/auth/password', data);
    return res.data;
  },

  // Videos
  async uploadVideo(file: File, onProgress?: (percent: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await client.post<{ message: string; video: VideoItem }>('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },

  async listVideos() {
    const res = await client.get<VideoItem[]>('/videos');
    return res.data;
  },

  async getVideo(videoId: string) {
    const res = await client.get<VideoItem>(`/videos/${videoId}`);
    return res.data;
  },

  async deleteVideo(videoId: string) {
    const res = await client.delete<{ message: string }>(`/videos/${videoId}`);
    return res.data;
  },

  // Security: Short-lived Streaming Tickets
  async getVideoStreamToken(videoId: string) {
    const res = await client.get<{ video_id: string; ticket: string; expires_in_seconds: number }>(`/videos/${videoId}/stream-token`);
    return res.data;
  },

  getVideoStreamUrl(videoId: string, ticket?: string) {
    return `${API_BASE}/videos/${videoId}/stream${ticket ? `?ticket=${encodeURIComponent(ticket)}` : ''}`;
  },

  getPreviewStreamUrl(videoId: string, ticket?: string) {
    return `${API_BASE}/videos/${videoId}/preview${ticket ? `?ticket=${encodeURIComponent(ticket)}` : ''}`;
  },

  // Analysis
  async startAnalysis(videoId: string) {
    const res = await client.post<AnalysisSession>(`/analysis/${videoId}/start`);
    return res.data;
  },

  async getAnalysisStatus(analysisId: string) {
    const res = await client.get<AnalysisSession>(`/analysis/${analysisId}/status`);
    return res.data;
  },

  async getAnalysisResults(analysisId: string) {
    const res = await client.get<AnalysisResults>(`/analysis/${analysisId}/results`);
    return res.data;
  },

  async getAnalysisEvents(analysisId: string) {
    const res = await client.get<AnalysisEvent[]>(`/analysis/${analysisId}/events`);
    return res.data;
  },

  async getAnalysisStatistics(analysisId: string) {
    const res = await client.get<SummaryStatistics>(`/analysis/${analysisId}/statistics`);
    return res.data;
  },

  async cancelAnalysis(analysisId: string) {
    const res = await client.post<{ cancelled: boolean }>(`/analysis/${analysisId}/cancel`);
    return res.data;
  },

  async compareSessions(sessionA: string, sessionB: string) {
    const res = await client.get<SessionComparisonResponse>(`/analysis/compare?session_a=${encodeURIComponent(sessionA)}&session_b=${encodeURIComponent(sessionB)}`);
    return res.data;
  },

  async getDemoAnalysis() {
    const res = await client.get<AnalysisResults & { demo_stream_ticket?: string; is_demo?: boolean }>('/analysis/demo');
    return res.data;
  },

  // Reports
  async getReportDownloadToken(analysisId: string) {
    const res = await client.get<{ analysis_id: string; ticket: string; expires_in_seconds: number }>(`/reports/${analysisId}/download-token`);
    return res.data;
  },

  getReportDownloadUrl(analysisId: string, ticket?: string) {
    return `${API_BASE}/reports/${analysisId}/download${ticket ? `?ticket=${encodeURIComponent(ticket)}` : ''}`;
  },

  getDemoReportDownloadUrl() {
    return `${API_BASE}/reports/demo/download`;
  },

  async downloadDemoReportPdf() {
    const res = await client.get('/reports/demo/download', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'VisionKinematics_Research_Report_Demo.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  async downloadReportPdf(analysisId: string, filename: string) {
    const res = await client.get(`/reports/${analysisId}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Health
  async getHealth() {
    const healthUrl = VITE_BACKEND_URL ? `${VITE_BACKEND_URL.replace(/\/+$/, '')}/health` : '/health';
    const res = await axios.get(healthUrl);
    return res.data;
  }
};
