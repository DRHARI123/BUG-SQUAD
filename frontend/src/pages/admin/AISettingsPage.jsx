import React, { useState, useEffect } from 'react';
import aiService from '../../services/aiService';
import { Cpu, Save, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const AISettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    aiEnabled: true,
    aiProvider: 'Google Gemini AI Engine',
    model: 'gemini-1.5-pro',
    dailyUserLimit: 50,
    monthlyUserLimit: 1000,
  });

  useEffect(() => {
    fetchAISettings();
  }, []);

  const fetchAISettings = async () => {
    setLoading(true);
    try {
      const data = await aiService.getAISettings();
      setSettings(data);
    } catch (err) {
      toast.error('Failed to load AI settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await aiService.updateAISettings(settings);
      toast.success('AI system settings saved!');
    } catch (err) {
      toast.error('Failed to save AI settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-6 h-6 text-red-500" /> AI System & API Configuration
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage AI provider model settings, feature toggles, and user request usage limits.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-dark-800 space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-4 bg-dark-900/60 rounded-xl border border-dark-800">
          <div>
            <span className="text-xs font-bold text-white block">Enable AI QA Assistant Features</span>
            <span className="text-[11px] text-slate-400">Master switch to enable/disable AI recommendations globally.</span>
          </div>

          <button
            type="button"
            onClick={() => setSettings({ ...settings, aiEnabled: !settings.aiEnabled })}
            className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
              settings.aiEnabled ? 'bg-emerald-500' : 'bg-dark-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.aiEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              AI Provider Name
            </label>
            <input
              type="text"
              value={settings.aiProvider}
              onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Model
            </label>
            <input
              type="text"
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Daily User Limit (Requests)
            </label>
            <input
              type="number"
              value={settings.dailyUserLimit}
              onChange={(e) => setSettings({ ...settings, dailyUserLimit: parseInt(e.target.value, 10) || 10 })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Monthly User Limit (Requests)
            </label>
            <input
              type="number"
              value={settings.monthlyUserLimit}
              onChange={(e) => setSettings({ ...settings, monthlyUserLimit: parseInt(e.target.value, 10) || 100 })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-xs text-amber-300">
          <Lock className="w-5 h-5 shrink-0" />
          <span>
            API secret keys are securely stored in server environment variables (<code className="font-mono text-white">AI_API_KEY</code>) and are never exposed to client browsers.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-800">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save AI Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AISettingsPage;
