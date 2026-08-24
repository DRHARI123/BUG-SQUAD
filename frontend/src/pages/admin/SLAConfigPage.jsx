import React, { useState, useEffect } from 'react';
import slaService from '../../services/slaService';
import { Clock, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SLAConfigPage = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSLAConfigs();
  }, []);

  const fetchSLAConfigs = async () => {
    setLoading(true);
    try {
      const data = await slaService.getSLAConfigs();
      setConfigs(data || []);
    } catch (err) {
      toast.error('Failed to load SLA configurations.');
    } finally {
      setLoading(false);
    }
  };

  const handleTargetChange = (index, field, val) => {
    const updated = [...configs];
    updated[index][field] = parseInt(val, 10) || 1;
    setConfigs(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await slaService.updateSLAConfigs(configs);
      toast.success('SLA target configuration saved!');
    } catch (err) {
      toast.error('Failed to save SLA configuration.');
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-red-500" /> SLA Target Configuration
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure maximum response time (hours) and resolution SLA targets by defect severity level.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-dark-800 space-y-6">
        <div className="space-y-4">
          {configs.map((row, idx) => (
            <div key={row.severity || idx} className="p-4 bg-dark-900/60 rounded-xl border border-dark-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <span className="text-xs font-extrabold text-white block">{row.severity}</span>
                <span className="text-[10px] text-slate-400">{row.description || 'Standard SLA Target'}</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Response Target (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={row.responseTargetHours}
                  onChange={(e) => handleTargetChange(idx, 'responseTargetHours', e.target.value)}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Resolution Target (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  value={row.resolutionTargetHours}
                  onChange={(e) => handleTargetChange(idx, 'resolutionTargetHours', e.target.value)}
                  className="w-full bg-dark-950 border border-dark-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-800">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save SLA Configurations'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SLAConfigPage;
