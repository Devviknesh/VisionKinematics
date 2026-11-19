import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
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
import { DemoPage } from './pages/DemoPage';
import { TechnicalOverviewPage } from './pages/TechnicalOverviewPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Routes that use the full-width layout (no sidebar)
const FULL_WIDTH_ROUTES = ['/', '/demo', '/technical-overview'];

const AppLayout: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const location = useLocation();

  const isFullWidth = FULL_WIDTH_ROUTES.includes(location.pathname);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#08090C] text-[#F5F5F7] font-sans">

      {isFullWidth ? (
        /* Full-width layout: Landing / Demo / Technical Overview */
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<LandingPage onOpenAuth={() => setIsAuthModalOpen(true)} />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/technical-overview" element={<TechnicalOverviewPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      ) : (
        /* Sidebar layout: all authenticated app pages */
        <div className="flex min-h-screen">
          <Sidebar onOpenAuth={() => setIsAuthModalOpen(true)} />

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
            {/* Mobile top padding (for fixed mobile header) */}
            <div className="md:hidden h-14 shrink-0" />

            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto">
              <ErrorBoundary>
                <Routes>
                  <Route path="/dashboard" element={<MainDashboard onOpenAuth={() => setIsAuthModalOpen(true)} />} />
                  <Route path="/upload" element={<UploadPage onOpenAuth={() => setIsAuthModalOpen(true)} />} />
                  <Route path="/workspace" element={<AnalysisWorkspace />} />
                  <Route path="/workspace/:videoId" element={<AnalysisWorkspace />} />
                  <Route path="/workspace/:videoId/:sessionId" element={<AnalysisWorkspace />} />
                  <Route path="/analytics" element={<AnalyticsDashboard />} />
                  <Route path="/analytics/:sessionId" element={<AnalyticsDashboard />} />
                  <Route path="/history" element={<SessionHistory onOpenAuth={() => setIsAuthModalOpen(true)} />} />
                  <Route path="/compare" element={<SessionComparison />} />
                  <Route path="/settings" element={<ProfileSettings />} />
                  <Route path="/report" element={<ReportView />} />
                  <Route path="/report/:sessionId" element={<ReportView />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </ErrorBoundary>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#1E1E2A] py-5 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#A1A1AA]">
                <p>© 2026 Framewise. Engineered with MediaPipe, OpenCV, FastAPI &amp; React.</p>
                <p>478-Point Facial Mesh · solvePnP Head Pose · Research-Grade PDF</p>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Global Auth Modal */}
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
