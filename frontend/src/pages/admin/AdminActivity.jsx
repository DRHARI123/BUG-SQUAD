import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Clock,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shield
} from 'lucide-react';

const AdminActivity = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = async (p = 1) => {
    try {
      setLoading(true);
      const res = await adminService.getAuditLogs({ page: p, limit: 15 });
      setLogs(res.logs || []);
      setTotalPages(res.pages || 1);
      setTotalLogs(res.total || 0);
    } catch (err) {
      console.error(err);
      toast.error('Unable to fetch system activity audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">System Audit & Governance Logs</h1>
            <p className="text-xs text-slate-400">
              Immutable trail of user provisioning, authentication, defect modifications, and system operations
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchLogs(page)}
          className="px-3.5 py-2 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit Trail
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
        <div className="flex items-center justify-between border-b border-dark-800 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-400" /> Audit Log History ({totalLogs})
          </h2>
          <span className="text-xs text-slate-500 font-mono">Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
            <p className="text-xs font-medium">Fetching system audit trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No activity recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dark-800 text-slate-400 uppercase font-semibold">
                  <th className="pb-3 px-2">User</th>
                  <th className="pb-3 px-2">Action</th>
                  <th className="pb-3 px-2">Entity</th>
                  <th className="pb-3 px-2">Description Detail</th>
                  <th className="pb-3 px-2 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60 text-slate-300">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-dark-900/60 transition-colors">
                    <td className="py-3 px-2">
                      <span className="font-bold text-white block">{log.userName || log.user?.name || 'System'}</span>
                      <span className="text-[10px] text-slate-400 block">{log.userRole || log.user?.role || 'System'}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-300 font-semibold">{log.entityType}</td>
                    <td className="py-3 px-2 text-slate-200 max-w-md">{log.description}</td>
                    <td className="py-3 px-2 text-right font-mono text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="pt-4 border-t border-dark-800 flex items-center justify-between text-xs text-slate-400">
            <span>Showing {logs.length} of {totalLogs} audit records</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-dark-850 hover:bg-dark-800 disabled:opacity-40 text-slate-200 rounded-lg border border-dark-700 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="font-bold text-white px-2">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 bg-dark-850 hover:bg-dark-800 disabled:opacity-40 text-slate-200 rounded-lg border border-dark-700 flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivity;
