import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ScanFace, 
  LayoutDashboard, 
  UploadCloud, 
  Video, 
  BarChart3, 
  History, 
  GitCompare,
  Settings,
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  Sparkles,
  ArrowRight,
  Cpu,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<Props> = ({ onOpenAuth }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isLanding = location.pathname === '/';

  const mainNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/demo', label: 'Demo', icon: Sparkles },
    { path: '/technical-overview', label: 'Engineering', icon: Cpu },
    { path: '/upload', label: 'Upload Video', icon: UploadCloud },
    { path: '/workspace', label: 'Workspace', icon: Video },
    { path: '/compare', label: 'Compare', icon: GitCompare },
    { path: '/history', label: 'Sessions', icon: History },
  ];

  const landingNavLinks = [
    { label: 'Live Demo', path: '/demo', isRoute: true },
    { label: 'Engineering', path: '/technical-overview', isRoute: true },
    { label: 'Architecture', id: 'architecture', isRoute: false },
    { label: 'Features', id: 'features', isRoute: false },
    { label: 'Technology', id: 'technology', isRoute: false },
    { label: 'Ethics & Privacy', id: 'privacy', isRoute: false },
    { label: 'FAQ', id: 'faq', isRoute: false },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSectionScroll = (sectionId: string) => {
    if (!isLanding) {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-[#0c0e12]/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <div 
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-neutral-950 transition-all duration-200 shadow-sm shadow-violet-500/10">
              <ScanFace className="w-5 h-5 transition-transform group-hover:scale-110" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-neutral-100 group-hover:text-violet-400 transition-colors">
                  Framewise
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                  CV 3D
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">AI Video &amp; Facial Emotion Recognition</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          {isLanding ? (
            <nav className="hidden lg:flex items-center gap-6">
              {landingNavLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => {
                    if (link.isRoute && link.path) {
                      handleNavClick(link.path);
                    } else if (link.id) {
                      handleSectionScroll(link.id);
                    }
                  }}
                  className={`text-sm font-medium transition-colors ${
                    link.isRoute
                      ? 'text-violet-400 font-bold hover:text-violet-300'
                      : 'text-neutral-400 hover:text-violet-400'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-1.5 bg-neutral-900/60 p-1.5 rounded-xl border border-neutral-800">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-neutral-800 text-violet-400 border border-neutral-700/80 shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-neutral-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* System Status Pill */}
            <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-900 border border-neutral-800 text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>MediaPipe &amp; OpenCV Active</span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
                <button
                  onClick={() => handleNavClick('/settings')}
                  title="Profile &amp; Settings"
                  className="flex items-center gap-2 text-xs text-neutral-200 bg-neutral-850 hover:bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-700/70 transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-violet-400" />
                  <span className="font-medium max-w-[110px] truncate">{user?.name}</span>
                </button>
                <button
                  onClick={() => handleNavClick('/settings')}
                  title="Account Settings"
                  className="p-1.5 text-neutral-400 hover:text-violet-400 hover:bg-neutral-800 rounded-lg transition-colors border border-transparent hover:border-neutral-700"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors border border-transparent hover:border-neutral-700"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-850 rounded-lg border border-neutral-700/80 transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    if (isLanding) {
                      handleNavClick('/upload');
                    } else {
                      onOpenAuth();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-sm shadow-violet-500/20"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg border border-neutral-700 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-[#0c0e12] px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
          
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-2">Navigation</div>
          
          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={() => handleNavClick('/')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left ${
                isLanding ? 'bg-neutral-800 text-violet-400 font-semibold' : 'text-neutral-300 hover:bg-neutral-850'
              }`}
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Landing Overview</span>
            </button>

            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left ${
                    isActive ? 'bg-neutral-800 text-violet-400 font-semibold' : 'text-neutral-300 hover:bg-neutral-850'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-neutral-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <button
                  onClick={() => handleNavClick('/settings')}
                  className="flex items-center gap-2 text-sm text-neutral-200 text-left hover:text-violet-400 transition"
                >
                  <UserIcon className="w-4 h-4 text-violet-400" />
                  <span className="font-medium truncate">{user?.name}</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleNavClick('/settings')}
                    className="p-1.5 text-neutral-400 hover:text-violet-400 rounded transition"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={logout}
                    className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 rounded transition"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full py-2.5 text-center text-xs font-semibold text-neutral-300 bg-neutral-850 border border-neutral-700 rounded-lg"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleNavClick('/upload');
                  }}
                  className="w-full py-2.5 text-center text-xs font-semibold text-neutral-950 bg-violet-500 rounded-lg shadow-sm"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </header>
  );
};
