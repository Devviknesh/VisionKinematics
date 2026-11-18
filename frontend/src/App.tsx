import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './pages/LandingPage';
import { AuthModal } from './pages/AuthModal';
import { MainDashboard } from './pages/MainDashboard';
import { UploadPage } from './pages/UploadPage';
import { AnalysisWorkspace } from './pages/AnalysisWorkspace';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { SessionHistory } from './pages/SessionHistory';
import { ReportView } from './pages/ReportView';
import { SessionComparison } from './pages/SessionComparison';
import { ProfileSettings } from './pages/ProfileSettings';
import { NotFoundPage } from './pages/NotFoundPage';

const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0e12] text-neutral-100 font-sans selection:bg-amber-400 selection:text-neutral-950">
      {/* Top Navbar with Route-Aware Active Links */}
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Main Content Area wrapped in ErrorBoundary */}
      <ErrorBoundary>
        {isLanding ? (
          <main className="flex-1 w-full">
            <LandingPage
              onStart={() => {
                if (isAuthenticated) {
                  navigate('/dashboard');
                } else {
                  navigate('/upload');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </main>
        ) : (
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <Routes>
              <Route 
                path="/dashboard" 
                element={<MainDashboard onOpenAuth={() => setIsAuthModalOpen(true)} />} 
              />
              <Route 
                path="/upload" 
                element={<UploadPage onOpenAuth={() => setIsAuthModalOpen(true)} />} 
              />
              <Route 
                path="/workspace" 
                element={<AnalysisWorkspace />} 
              />
              <Route 
                path="/workspace/:videoId" 
                element={<AnalysisWorkspace />} 
              />
              <Route 
                path="/workspace/:videoId/:sessionId" 
                element={<AnalysisWorkspace />} 
              />
              <Route 
                path="/analytics" 
                element={<AnalyticsDashboard />} 
              />
              <Route 
                path="/analytics/:sessionId" 
                element={<AnalyticsDashboard />} 
              />
              <Route 
                path="/history" 
                element={<SessionHistory onOpenAuth={() => setIsAuthModalOpen(true)} />} 
              />
              <Route 
                path="/compare" 
                element={<SessionComparison />} 
              />
              <Route 
                path="/settings" 
                element={<ProfileSettings />} 
              />
              <Route 
                path="/report" 
                element={<ReportView />} 
              />
              <Route 
                path="/report/:sessionId" 
                element={<ReportView />} 
              />
              <Route 
                path="*" 
                element={<NotFoundPage />} 
              />
            </Routes>
          </main>
        )}
      </ErrorBoundary>

      {/* Global App Footer (shown on inner SaaS pages) */}
      {!isLanding && (
        <footer className="border-t border-neutral-800 bg-[#0c0e12] py-6 text-xs text-neutral-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>&copy; 2026 VisionKinematics AI. Engineered with OpenCV 5, MediaPipe Tasks, FastAPI &amp; React.</p>
            <p className="text-[11px] text-neutral-400">
              Observable 3D Facial Kinematics &bull; 100% Local Execution
            </p>
          </div>
        </footer>
      )}

      {/* Globally Accessible Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
