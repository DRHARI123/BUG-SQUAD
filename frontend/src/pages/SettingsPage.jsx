import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Sliders,
  Moon,
  Sun,
  Monitor,
  Bell,
  Shield,
  LogOut,
  CheckCircle2,
  Lock
} from 'lucide-react';

const SettingsPage = () => {
  const { user, logout } = useAuth();

  const [theme, setTheme] = useState(localStorage.getItem('bugsquad_theme') || 'dark');
  const [prefs, setPrefs] = useState({
    bugAssignment: true,
    bugStatus: true,
    testExecution: true,
    projectUpdates: true,
    comments: true,
  });

  const handleThemeChange = (selected) => {
    setTheme(selected);
    localStorage.setItem('bugsquad_theme', selected);
    toast.success(`Appearance theme set to ${selected.toUpperCase()}`);
  };

  const handlePrefToggle = (key) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      toast.success('Notification preference saved.');
      return next;
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red shrink-0">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Account Settings & Preferences</h1>
            <p className="text-xs text-slate-400">
              Customize UI appearance theme, notification triggers, and account security controls
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance Theme Selector */}
        <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-dark-800 pb-3 flex items-center gap-2">
            <Moon className="w-4 h-4 text-orange-400" /> UI Appearance Theme
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                theme === 'dark'
                  ? 'bg-red-500/10 border-red-500 text-red-400 font-bold shadow-glow-red'
                  : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="text-xs">Dark Mode</span>
            </button>

            <button
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                theme === 'light'
                  ? 'bg-red-500/10 border-red-500 text-red-400 font-bold'
                  : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span className="text-xs">Light Mode</span>
            </button>

            <button
              onClick={() => handleThemeChange('system')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                theme === 'system'
                  ? 'bg-red-500/10 border-red-500 text-red-400 font-bold'
                  : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-5 h-5" />
              <span className="text-xs">System Mode</span>
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-dark-800 pb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-red-500" /> Notification Preferences
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-dark-950 rounded-xl border border-dark-800">
              <div>
                <span className="font-semibold text-slate-200 block">Bug Assignment Alerts</span>
                <span className="text-[10px] text-slate-500">Notify when defects are assigned to you</span>
              </div>
              <input
                type="checkbox"
                checked={prefs.bugAssignment}
                onChange={() => handlePrefToggle('bugAssignment')}
                className="w-4 h-4 accent-red-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-dark-950 rounded-xl border border-dark-800">
              <div>
                <span className="font-semibold text-slate-200 block">Defect Status Updates</span>
                <span className="text-[10px] text-slate-500">Notify on status transitions (Fixed, Retest, Closed)</span>
              </div>
              <input
                type="checkbox"
                checked={prefs.bugStatus}
                onChange={() => handlePrefToggle('bugStatus')}
                className="w-4 h-4 accent-red-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-dark-950 rounded-xl border border-dark-800">
              <div>
                <span className="font-semibold text-slate-200 block">Test Execution Outcomes</span>
                <span className="text-[10px] text-slate-500">Notify when test cases fail or pass</span>
              </div>
              <input
                type="checkbox"
                checked={prefs.testExecution}
                onChange={() => handlePrefToggle('testExecution')}
                className="w-4 h-4 accent-red-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Account Controls */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-white block">Active User Session</span>
          <span className="text-xs text-slate-400">Logged in as {user?.name} ({user?.role})</span>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" /> End Session & Logout
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
