import React, { useState, useEffect } from 'react';
import slaService from '../services/slaService';
import { AlertCircle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const OverdueTasks = () => {
  const [overdueItems, setOverdueItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverdueTasks();
  }, []);

  const fetchOverdueTasks = async () => {
    setLoading(true);
    try {
      const slaRes = await slaService.getSLADashboard();
      setOverdueItems(slaRes?.breachedList || []);
    } catch (err) {
      toast.error('Failed to load overdue tasks.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-red-500" /> Overdue Tasks & SLA Breaches
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Active defect tickets and QA tasks that have exceeded target SLA resolution deadlines.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : overdueItems.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-dark-800 space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Overdue Tasks</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">All active defects and QA tasks are complying with SLA targets.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-dark-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-dark-900/80 border-b border-dark-800 text-slate-400 uppercase font-mono font-bold text-[10px]">
                  <th className="p-4">Item ID</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assigned To</th>
                  <th className="p-4">Overdue Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60">
                {overdueItems.map((row) => (
                  <tr key={row._id || row.bugId} className="hover:bg-dark-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-red-400">{row.bugId}</td>
                    <td className="p-4 font-medium text-white max-w-xs truncate">{row.title}</td>
                    <td className="p-4 text-slate-300 font-semibold">{row.severity}</td>
                    <td className="p-4 text-amber-400 font-semibold">{row.status}</td>
                    <td className="p-4 text-slate-300">{row.assignedTo}</td>
                    <td className="p-4 font-mono font-bold text-red-500">Overdue {row.overdueHours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverdueTasks;
