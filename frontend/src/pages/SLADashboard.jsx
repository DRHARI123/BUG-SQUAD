import React, { useState, useEffect } from 'react';
import slaService from '../services/slaService';
import projectService from '../services/projectService';
import { Clock, ShieldAlert, AlertTriangle, CheckCircle2, RefreshCw, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const SLADashboard = () => {
  const [data, setData] = useState({ summary: {}, breachedList: [] });
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchSLADashboard();
  }, [selectedProject]);

  const fetchInitialData = async () => {
    try {
      const projRes = await projectService.getProjects();
      setProjects(Array.isArray(projRes) ? projRes : projRes?.projects || []);
    } catch (err) {}
  };

  const fetchSLADashboard = async (isManual = false) => {
    setLoading(true);
    try {
      const params = {};
      if (selectedProject) params.project = selectedProject;
      const res = await slaService.getSLADashboard(params);
      setData(res || { summary: {}, breachedList: [] });
      if (isManual) toast.success('SLA Compliance Telemetry refreshed.');
    } catch (err) {
      toast.error('Failed to load SLA dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const { summary = {}, breachedList = [] } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-red-500" /> SLA Compliance Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Service Level Agreement response & resolution target compliance tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-dark-900 border border-dark-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-red-500"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.projectCode})
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchSLADashboard(true)}
            className="px-3.5 py-2 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">SLA Compliance Rate</span>
          <p className="text-2xl font-extrabold text-emerald-400">{summary.complianceRate || 100}%</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tracked Bugs</span>
          <p className="text-2xl font-extrabold text-white">{summary.totalTracked || 0}</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">On Track</span>
          <p className="text-2xl font-extrabold text-emerald-400">{summary.onTrack || 0}</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">At Risk (&lt; 4 Hours)</span>
          <p className="text-2xl font-extrabold text-amber-400">{summary.atRisk || 0}</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">SLA Breached</span>
          <p className="text-2xl font-extrabold text-red-500">{summary.breached || 0}</p>
        </div>
      </div>

      {/* SLA Breached Defects Table */}
      <div className="glass-card rounded-2xl border border-dark-800 space-y-4 p-5">
        <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" /> Breached & High Risk Defect Tickets
        </h3>

        {breachedList.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-xs font-bold text-white">All Defects Complying with SLA Targets</p>
            <p className="text-[11px] text-slate-400">Zero active SLA target breaches detected.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-dark-900/80 border-b border-dark-800 text-slate-400 uppercase font-mono font-bold text-[10px]">
                  <th className="p-3">Bug ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Assigned To</th>
                  <th className="p-3">Overdue Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60">
                {breachedList.map((row) => (
                  <tr key={row._id || row.bugId} className="hover:bg-dark-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-red-400">{row.bugId}</td>
                    <td className="p-3 font-medium text-white max-w-xs truncate">{row.title}</td>
                    <td className="p-3 text-slate-300 font-semibold">{row.severity}</td>
                    <td className="p-3 text-amber-400 font-semibold">{row.status}</td>
                    <td className="p-3 text-slate-400">{row.project}</td>
                    <td className="p-3 text-slate-300">{row.assignedTo}</td>
                    <td className="p-3 font-mono font-bold text-red-500">Overdue {row.overdueHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SLADashboard;
