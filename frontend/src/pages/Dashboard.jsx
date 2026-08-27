import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';
import {
  FolderGit2,
  Bug,
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  Flame,
  XCircle,
  TrendingUp,
  Activity,
  Plus,
  Clock,
  Eye,
  Loader2,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Chart.js Registration
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activities, setActivities] = useState([]);
  const [recentBugs, setRecentBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, chartsRes, activityRes, bugsRes] = await Promise.allSettled([
          dashboardService.getStats(),
          dashboardService.getCharts(),
          dashboardService.getRecentActivity(),
          dashboardService.getRecentBugs(),
        ]);

        if (isMounted) {
          if (statsRes.status === 'fulfilled') setStats(statsRes.value || {});
          if (chartsRes.status === 'fulfilled') setCharts(chartsRes.value || {});
          if (activityRes.status === 'fulfilled') setActivities(Array.isArray(activityRes.value) ? activityRes.value : []);
          if (bugsRes.status === 'fulfilled') setRecentBugs(Array.isArray(bugsRes.value) ? bugsRes.value : []);
        }
      } catch (err) {
        console.error('[DASHBOARD LOAD ERROR]:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => { isMounted = false; };
  }, []);

  // Configure Chart Options (Dark Theme Styling)
  const darkChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8', // Slate-400
          font: { size: 11, family: 'Inter' },
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#f4f4f5',
        bodyColor: '#e4e4e7',
        borderColor: '#27272a',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        ticks: { color: '#64748b', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { size: 11, family: 'Inter' },
          usePointStyle: true,
          padding: 12,
        },
      },
      tooltip: darkChartOptions.plugins.tooltip,
    },
    cutout: '70%',
  };

  // Build Card Items from API stats
  const statCards = [
    {
      id: 'projects',
      title: 'Total Projects',
      value: stats?.totalProjects ?? '...',
      change: 'Active Workspaces',
      icon: FolderGit2,
      color: 'from-blue-500/20 to-indigo-500/20',
      iconColor: 'text-blue-400',
      borderColor: 'hover:border-blue-500/40',
    },
    {
      id: 'totalBugs',
      title: 'Total Bugs',
      value: stats?.totalBugs ?? '...',
      change: 'All Reported Issues',
      icon: Bug,
      color: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
      borderColor: 'hover:border-purple-500/40',
    },
    {
      id: 'openBugs',
      title: 'Open Bugs',
      value: stats?.openBugs ?? '...',
      change: 'Needs Triage',
      icon: AlertCircle,
      color: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-400',
      borderColor: 'hover:border-amber-500/40',
    },
    {
      id: 'criticalBugs',
      title: 'Critical Bugs',
      value: stats?.criticalBugs ?? '...',
      change: 'High Priority Blocker',
      icon: Flame,
      color: 'from-red-600/20 to-orange-600/20',
      iconColor: 'text-red-500',
      borderColor: 'hover:border-red-500/50',
    },
    {
      id: 'resolvedBugs',
      title: 'Resolved Bugs',
      value: stats?.resolvedBugs ?? '...',
      change: 'Fix Verified',
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-400',
      borderColor: 'hover:border-emerald-500/40',
    },
    {
      id: 'totalTestCases',
      title: 'Total Test Cases',
      value: stats?.totalTestCases ?? '...',
      change: 'Suite Coverage',
      icon: FileCheck2,
      color: 'from-cyan-500/20 to-blue-500/20',
      iconColor: 'text-cyan-400',
      borderColor: 'hover:border-cyan-500/40',
    },
    {
      id: 'passedTests',
      title: 'Passed Tests',
      value: stats?.passedTests ?? '...',
      change: '94.2% Pass Rate',
      icon: CheckCircle2,
      color: 'from-emerald-600/20 to-green-500/20',
      iconColor: 'text-emerald-400',
      borderColor: 'hover:border-emerald-500/40',
    },
    {
      id: 'failedTests',
      title: 'Failed Tests',
      value: stats?.failedTests ?? '...',
      change: 'Requires Attention',
      icon: XCircle,
      color: 'from-red-500/20 to-pink-600/20',
      iconColor: 'text-red-400',
      borderColor: 'hover:border-red-500/40',
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-3" />
        <p className="text-sm font-medium tracking-wide">Loading QA Dashboard telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-extrabold text-white">
              Welcome back, {user?.name || 'QA Engineer'} 👋
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
              {user?.role || 'Tester'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            QA Telemetry Hub — Live API Data & Project Telemetry Active
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-lg text-xs font-semibold border border-dark-700 transition-colors"
          >
            Manage Projects
          </button>
          <button
            onClick={() => navigate('/projects', { state: { openAddModal: true } })}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-lg text-xs font-semibold shadow-glow-red flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      </div>

      {/* 8 Statistic Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-500" />
            Live QA System Metrics
          </h2>
          <span className="text-xs text-slate-500 font-mono">DB Sync Active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                className={`glass-card p-5 rounded-2xl border border-dark-800 transition-all ${stat.borderColor} group relative overflow-hidden`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {stat.title}
                  </span>
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${stat.color} flex items-center justify-center border border-white/5`}
                  >
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    {stat.change}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Chart.js Widgets Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            QA Analytics & Quality Distribution
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Bug Status Chart */}
          <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark">
            <h3 className="text-sm font-bold text-white mb-4">Bug Status Distribution</h3>
            <div className="h-64 relative">
              {charts?.bugStatusDistribution?.datasets?.length > 0 ? (
                <Doughnut data={charts.bugStatusDistribution} options={doughnutOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">No status distribution data.</div>
              )}
            </div>
          </div>

          {/* 2. Bug Severity Chart */}
          <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark">
            <h3 className="text-sm font-bold text-white mb-4">Bug Severity Breakdown</h3>
            <div className="h-64 relative">
              {charts?.bugSeverityDistribution?.datasets?.length > 0 ? (
                <Bar data={charts.bugSeverityDistribution} options={darkChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">No severity breakdown data.</div>
              )}
            </div>
          </div>

          {/* 3. Project-wise Bug Chart */}
          <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark">
            <h3 className="text-sm font-bold text-white mb-4">Project-wise Bug Distribution</h3>
            <div className="h-64 relative">
              {charts?.projectWiseBugs?.datasets?.length > 0 ? (
                <Bar data={charts.projectWiseBugs} options={darkChartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">No project bug data.</div>
              )}
            </div>
          </div>

          {/* 4. Test Execution Chart */}
          <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark">
            <h3 className="text-sm font-bold text-white mb-4">Test Case Execution Status</h3>
            <div className="h-64 relative">
              {charts?.testExecution?.datasets?.length > 0 ? (
                <Doughnut data={charts.testExecution} options={doughnutOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">No test execution data.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid for Recent Activity & Recent Bugs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bugs Stream (2 cols) */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-dark-800 p-6 shadow-card-dark flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bug className="w-4 h-4 text-red-500" />
                Recent Reported Bugs
              </h3>
              <span className="text-xs text-slate-500">Live Stream</span>
            </div>

            {!Array.isArray(recentBugs) || recentBugs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs italic">
                No recent bugs reported yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-dark-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3 px-2">Bug ID</th>
                      <th className="pb-3 px-2">Title</th>
                      <th className="pb-3 px-2">Project</th>
                      <th className="pb-3 px-2">Severity</th>
                      <th className="pb-3 px-2">Priority</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2">Assigned To</th>
                      <th className="pb-3 px-2">Created Date</th>
                      <th className="pb-3 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800/60 text-slate-300">
                    {recentBugs.map((bug, idx) => {
                      const displayId = String(bug._id || bug.rawId || `BUG-${idx}`);
                      const rawId = String(bug.rawId || bug._id || '');
                      const bugTitle = String(bug.title || 'Untitled Defect');
                      const projectName = String(bug.project || 'QA Project');
                      const severityVal = String(bug.severity || 'Major');
                      const priorityVal = String(bug.priority || 'Medium');
                      const statusVal = String(bug.status || 'New');
                      const assigneeName = String(bug.assignedTo || 'Unassigned');

                      return (
                        <tr key={displayId + '_' + idx} className="hover:bg-dark-900/60 transition-colors">
                          <td className="py-3 px-2 font-mono font-bold text-red-400">{displayId}</td>
                          <td className="py-3 px-2 font-medium text-slate-200 max-w-[180px] truncate" title={bugTitle}>
                            {bugTitle}
                          </td>
                          <td className="py-3 px-2 text-slate-400 max-w-[120px] truncate">{projectName}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              severityVal === 'Critical' || severityVal === 'Blocker'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}>
                              {severityVal}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              priorityVal === 'High' || priorityVal === 'P1 - Highest'
                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            }`}>
                              {priorityVal}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              {statusVal}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-300">{assigneeName}</td>
                          <td className="py-3 px-2 text-slate-400 font-mono text-[11px]">
                            {bug.createdAt ? new Date(bug.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button
                              onClick={() => navigate(`/bugs/${rawId || displayId}`)}
                              className="px-2.5 py-1 bg-dark-800 hover:bg-dark-700 text-slate-200 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 ml-auto border border-dark-700 transition-colors"
                            >
                              <Eye className="w-3 h-3 text-blue-400" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Feed (1 col) */}
        <div className="glass-card rounded-2xl border border-dark-800 p-6 shadow-card-dark">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-orange-400" />
            Recent Activity Log
          </h3>

          <div className="space-y-4">
            {!Array.isArray(activities) || activities.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No activity logged yet.</p>
            ) : (
              activities.map((act, idx) => {
                const actId = String(act._id || `act_${idx}`);
                const actMessage = String(act.message || 'System activity logged');
                const userName = String(act.userName || 'System User');

                return (
                  <div key={actId} className="flex items-start gap-3 text-xs pb-3 border-b border-dark-800/60 last:border-0 last:pb-0">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium leading-snug">{actMessage}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-400">{userName}</span>
                        <span>•</span>
                        <span>
                          {act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : 'Just now'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
