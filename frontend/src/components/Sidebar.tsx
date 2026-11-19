import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
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
  Cpu,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  onOpenAuth: () => void;
}

const navItems = [
  { path: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { path: '/upload',     label: 'Upload',      icon: UploadCloud },
  { path: '/workspace',  label: 'Workspace',   icon: Video },
  { path: '/analytics',  label: 'Analytics',   icon: BarChart3 },
  { path: '/compare',    label: 'Compare',     icon: GitCompare },
  { path: '/history',    label: 'Sessions',    icon: History },
];

const secondaryItems = [
  { path: '/demo',               label: 'Live Demo',   icon: Sparkles },
  { path: '/technical-overview', label: 'Engineering', icon: Cpu },
];

export const Sidebar: React.FC<Props> = ({ onOpenAuth }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 cursor-pointer group"
        onClick={() => handleNav('/')}
      >
        <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </div>
        <div className="min-w-0">
          <span className="font-bold text-sm text-[#F5F5F7] tracking-tight leading-none">Framewise</span>
          <p className="text-[10px] text-[#A1A1AA] mt-0.5 leading-none hidden lg:block">Visual Intelligence</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-[#1E1E2A]" />

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              onClick={() => handleNav(path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all group ${
                active
                  ? 'sidebar-active'
                  : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-[#101116]'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-violet-400' : 'text-[#A1A1AA] group-hover:text-[#F5F5F7]'}`} />
              <span className="truncate">{label}</span>
              {active && <ChevronRight className="w-3 h-3 ml-auto text-violet-400 shrink-0" />}
            </button>
          );
        })}

        {/* Secondary — public pages */}
        <div className="pt-3 mt-3 border-t border-[#1E1E2A]">
          <p className="px-3 pb-1.5 text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-widest">Explore</p>
          {secondaryItems.map(({ path, label, icon: Icon }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => handleNav(path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-left transition-all group ${
                  active
                    ? 'sidebar-active'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-[#101116]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-violet-400' : 'text-[#A1A1AA] group-hover:text-[#F5F5F7]'}`} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom: User / Auth */}
      <div className="mx-4 mb-4 mt-2 border-t border-[#1E1E2A] pt-3">
        {isAuthenticated && user ? (
          <div className="space-y-1">
            <button
              onClick={() => handleNav('/settings')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#101116] group transition"
            >
              <div className="w-7 h-7 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0">
                <UserIcon className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold text-[#F5F5F7] truncate">{user.name}</p>
                <p className="text-[10px] text-[#A1A1AA] truncate">{user.email}</p>
              </div>
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleNav('/settings')}
                className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-[#101116] transition"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <button
                onClick={logout}
                className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#A1A1AA] hover:text-rose-400 hover:bg-rose-500/5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={onOpenAuth}
              className="w-full py-2 text-xs font-semibold text-[#A1A1AA] border border-[#1E1E2A] rounded-lg hover:border-violet-500/40 hover:text-[#F5F5F7] transition"
            >
              Sign In
            </button>
            <button
              onClick={onOpenAuth}
              className="w-full py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition shadow-sm"
            >
              Get Started Free
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 lg:w-60 h-screen sticky top-0 bg-[#08090C] border-r border-[#1E1E2A] shrink-0 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile: hamburger button (rendered in AppHeader) */}
      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 w-64 h-screen bg-[#08090C] border-r border-[#1E1E2A] flex flex-col md:hidden transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-[#101116] rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Mobile header bar (hamburger + logo) */}
      <div className="fixed top-0 left-0 right-0 z-30 flex md:hidden items-center gap-3 h-14 px-4 bg-[#08090C]/95 backdrop-blur border-b border-[#1E1E2A]">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 text-[#A1A1AA] hover:text-[#F5F5F7] hover:bg-[#101116] rounded-lg border border-[#1E1E2A] transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNav('/')}>
          <div className="w-6 h-6 rounded bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </div>
          <span className="font-bold text-sm text-[#F5F5F7] tracking-tight">Framewise</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!isAuthenticated && (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </>
  );
};
