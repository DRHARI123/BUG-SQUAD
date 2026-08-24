import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  Users,
  FolderGit2,
  Bug,
  FileCheck2,
  Activity,
  Server,
  Database,
  Cpu,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-react';

const AdminOverview = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState({
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      totalProjects: 0,
      totalBugs: 0,
      openBugs: 0,
      criticalBugs: 0,
      totalTestCases: 0,
      failedTests: 0,
    },
    systemHealth: {
      backendApi: 'Healthy',
      database: 'Connected',
      environment: 'development',
      serverStatus: 'Running',
    },
  });

  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    const fetchAdminOverview = async () => {
      try {
        setLoading(true);
        const [statsRes, activityRes] = await Promise.all([
          adminService.getAdminStats(),
          adminService.getAuditLogs({ limit: 6 }),
        ]);
        setAdminData(statsRes);
        setAuditLogs(activityRes.logs || []);
      } catch (err) {
        console.error('Failed to load admin overview:', err);
        toast.error('Unable to fetch admin statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-3" />
        <p className="text-sm font-medium">Loading admin telemetry & system diagnostics...</p>
      </div>
    );
  }

  const { stats, systemHealth } = adminData;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">System Administration Panel</h1>
            <p className="text-xs text-slate-400">
              User role governance, security audit logs, system health telemetry, and global settings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-1.5 transition-all"
          >
            <Users className="w-4 h-4" /> Manage Users
          </button>
        </div>
      </div>

      {/* Admin Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              User Accounts
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">{stats.totalUsers}</span>
              <span className="text-xs text-emerald-400 font-semibold">{stats.activeUsers} Active</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Projects Active
            </span>
            <span className="text-2xl font-extrabold text-white">{stats.totalProjects}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <FolderGit2 className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Defect Reports
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">{stats.totalBugs}</span>
              <span className="text-xs text-red-400 font-semibold">{stats.criticalBugs} Critical</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <Bug className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Test Case Suite
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">{stats.totalTestCases}</span>
              <span className="text-xs text-red-400 font-semibold">{stats.failedTests} Failed</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* System Health Diagnostics */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" /> System Health Diagnostics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-dark-950 rounded-xl border border-dark-800 flex items-center gap-3">
            <Server className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Backend API Engine</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {systemHealth.backendApi}
              </span>
            </div>
          </div>

          <div className="p-4 bg-dark-950 rounded-xl border border-dark-800 flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Database Connection</span>
              <span className="text-xs font-bold text-blue-400 mt-0.5 block">{systemHealth.database}</span>
            </div>
          </div>

          <div className="p-4 bg-dark-950 rounded-xl border border-dark-800 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-purple-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Environment</span>
              <span className="text-xs font-bold text-slate-200 mt-0.5 block uppercase">{systemHealth.environment}</span>
            </div>
          </div>

          <div className="p-4 bg-dark-950 rounded-xl border border-dark-800 flex items-center gap-3">
            <Activity className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Server Process</span>
              <span className="text-xs font-bold text-amber-400 mt-0.5 block">{systemHealth.serverStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Overview */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-dark-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" /> Recent System Audit Logs
          </h2>
          <button
            onClick={() => navigate('/admin/activity')}
            className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
          >
            View Full Audit Trail <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div key={log._id} className="p-3 bg-dark-950 rounded-xl border border-dark-800 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">{log.description}</span>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                  <span className="text-slate-300">{log.userName}</span>
                  <span>•</span>
                  <span className="text-red-400">{log.action}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
