import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Key, 
  Sliders, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Mail, 
  Lock,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export const ProfileSettings: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // Profile info state
  const [name, setName] = useState(user?.name || '');
  const [sampleFps, setSampleFps] = useState<number>(user?.preferences?.default_sample_fps || 5.0);
  const [poseSensitivity, setPoseSensitivity] = useState<string>(user?.preferences?.head_pose_sensitivity || 'normal');
  const [autoHudOverlay, setAutoHudOverlay] = useState<boolean>(user?.preferences?.auto_hud_overlay ?? true);
  const [gazeMode, setGazeMode] = useState<string>(user?.preferences?.gaze_calibration_mode || 'standard');

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      if (user.preferences) {
        if (user.preferences.default_sample_fps) setSampleFps(user.preferences.default_sample_fps);
        if (user.preferences.head_pose_sensitivity) setPoseSensitivity(user.preferences.head_pose_sensitivity);
        if (user.preferences.auto_hud_overlay !== undefined) setAutoHudOverlay(user.preferences.auto_hud_overlay);
        if (user.preferences.gaze_calibration_mode) setGazeMode(user.preferences.gaze_calibration_mode);
      }
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      await api.updateProfile({
        name,
        preferences: {
          default_sample_fps: sampleFps,
          head_pose_sensitivity: poseSensitivity,
          auto_hud_overlay: autoHudOverlay,
          gaze_calibration_mode: gazeMode
        }
      });
      await refreshUser();
      setProfileSuccess('Profile preferences updated successfully.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err?.response?.data?.detail || 'Failed to update profile settings.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err?.response?.data?.detail || 'Failed to change password. Please verify current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div className="pb-6 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
              Account &amp; CV Settings
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
              Manage your researcher profile, computer vision analysis preferences, and access security.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Profile & Computer Vision Preferences (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Profile & Preferences Form */}
          <form onSubmit={handleSaveProfile} className="p-6 sm:p-7 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-sm font-bold text-neutral-100">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Researcher Profile &amp; Engine Preferences</span>
              </div>
              <span className="text-[11px] font-mono text-neutral-500">ID: {user?.id.slice(0, 8)}...</span>
            </div>

            {profileSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Full Name / Researcher Designation
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-neutral-100 focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full bg-neutral-950/50 border border-neutral-850 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-neutral-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">Contact system admin to transfer email bindings.</p>
              </div>

              <div className="pt-4 border-t border-neutral-800 space-y-4">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Engine Parameters
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Sampling Density (FPS)
                    </label>
                    <select
                      value={sampleFps.toFixed(1)}
                      onChange={(e) => setSampleFps(parseFloat(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="5.0">5.0 FPS (Balanced Speed)</option>
                      <option value="10.0">10.0 FPS (High Precision)</option>
                      <option value="15.0">15.0 FPS (Dense Kinematics)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Head Pose Sensitivity
                    </label>
                    <select
                      value={poseSensitivity}
                      onChange={(e) => setPoseSensitivity(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-400"
                    >
                      <option value="normal">Normal (12° Yaw / 10° Pitch)</option>
                      <option value="high">High (8° Yaw / 7° Pitch)</option>
                      <option value="low">Low (16° Yaw / 14° Pitch)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div>
                    <p className="text-xs font-semibold text-neutral-200">Default HUD Overlay Stream</p>
                    <p className="text-[11px] text-neutral-500">Automatically switch workspace to annotated vision video stream</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoHudOverlay}
                    onChange={(e) => setAutoHudOverlay(e.target.checked)}
                    className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-amber-400 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs sm:text-sm transition shadow-sm shadow-amber-400/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingProfile ? 'Saving Changes...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>

        </div>

        {/* Right Column: Security, Password & Privacy (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 2: Password Update */}
          <form onSubmit={handleChangePassword} className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800 text-sm font-bold text-neutral-100">
              <Key className="w-4 h-4 text-amber-400" />
              <span>Change Password</span>
            </div>

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold text-xs transition disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{savingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </form>

          {/* Card 3: Security & Privacy Guarantee */}
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-neutral-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Security &amp; Data Isolation</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every video, facial landmark coordinate, and analysis record is isolated by strict relational ownership constraints.
            </p>
            <ul className="text-[11px] text-neutral-500 space-y-1.5 list-disc list-inside">
              <li>Ephemeral 15-minute cryptographically signed streaming tickets.</li>
              <li>Bcrypt multi-pass salted password hashing.</li>
              <li>Zero raw facial frame transmission to third-party APIs.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
