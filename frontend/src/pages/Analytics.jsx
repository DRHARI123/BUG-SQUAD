import React, { useState, useEffect } from 'react';
import analyticsService from '../services/analyticsService';
import projectService from '../services/projectService';
import { exportAnalyticsPDF } from '../utils/pdfExport';
import { exportAnalyticsToExcel } from '../utils/excelExport';
import {
  BarChart3,
  Filter,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  Sparkles,
  Bug,
  FileCheck2,
  Users,
  Clock,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [overview, setOverview] = useState({});
  const [bugData, setBugData] = useState({});
  const [teamData, setTeamData] = useState([]);
  const [aiInsight, setAiInsight] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [activeTab, setActiveTab] = useState('bugs');
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedProject, dateRange]);

  const fetchInitialData = async () => {
    try {
      const projRes = await projectService.getProjects();
      setProjects(Array.isArray(projRes) ? projRes : projRes?.projects || []);
    } catch (err) {}
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedProject) params.project = selectedProject;
      if (dateRange) params.dateRange = dateRange;

      const [overviewRes, bugRes, teamRes] = await Promise.all([
        analyticsService.getOverview(params),
        analyticsService.getBugAnalytics(params),
        analyticsService.getTeamAnalytics(params),
      ]);

      setOverview(overviewRes || {});
      setBugData(bugRes || {});
      setTeamData(teamRes || []);
    } catch (err) {
      toast.error('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAIInsights = async () => {
    setGeneratingAI(true);
    try {
      const res = await analyticsService.generateAIInsights({
        totalBugs: overview.totalBugs,
        openBugs: overview.openBugs,
        criticalBugs: overview.criticalBugs,
        passRate: overview.passRate,
        reqCoverage: overview.reqCoverage,
      });
      setAiInsight(res);
      toast.success('Generated AI Analytics Insights!');
    } catch (err) {
      toast.error('Failed to generate AI insights.');
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-red-500" /> Advanced QA Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time MongoDB telemetry, defect backlog trends, bug aging analysis, and team workload insights.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerateAIInsights}
            disabled={generatingAI}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" /> {generatingAI ? 'Analyzing...' : 'Generate AI Insights'}
          </button>
          <button
            onClick={() => exportAnalyticsPDF(overview, bugData)}
            className="px-3.5 py-2 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-red-400" /> Export PDF
          </button>
          <button
            onClick={() => exportAnalyticsToExcel(overview)}
            className="px-3.5 py-2 bg-dark-800 hover:bg-dark-700 text-emerald-400 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-dark-800 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider">
          <Filter className="w-4 h-4 text-red-500" /> Filters:
        </div>

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="bg-dark-900 border border-dark-700 rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-red-500"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.projectCode})
            </option>
          ))}
        </select>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-dark-900 border border-dark-700 rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-red-500"
        >
          <option value="Today">Today</option>
          <option value="Last 7 Days">Last 7 Days</option>
          <option value="Last 30 Days">Last 30 Days</option>
          <option value="Last 90 Days">Last 90 Days</option>
          <option value="This Month">This Month</option>
          <option value="This Year">This Year</option>
        </select>

        <button
          onClick={fetchAnalyticsData}
          className="px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 ml-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Apply
        </button>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Defects</span>
          <p className="text-xl font-extrabold text-white">{overview.totalBugs || 0}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Open Backlog</span>
          <p className="text-xl font-extrabold text-amber-400">{overview.openBugs || 0}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Critical / Blocker</span>
          <p className="text-xl font-extrabold text-red-500">{(overview.criticalBugs || 0) + (overview.blockerBugs || 0)}</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Test Pass Rate</span>
          <p className="text-xl font-extrabold text-emerald-400">{overview.passRate || 0}%</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Req Coverage</span>
          <p className="text-xl font-extrabold text-blue-400">{overview.reqCoverage || 0}%</p>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Resolution</span>
          <p className="text-xl font-extrabold text-purple-400">{bugData.avgResolutionHours || 0}h</p>
        </div>
      </div>

      {/* AI Insights Card if generated */}
      {aiInsight && (
        <div className="glass-card p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-3">
          <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Executive AI Analytics Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-dark-900/60 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Top Risk</span>
              <p className="font-semibold text-white mt-0.5">{aiInsight.topRisk}</p>
            </div>
            <div className="p-3 bg-dark-900/60 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Main Trend</span>
              <p className="font-semibold text-white mt-0.5">{aiInsight.mainTrend}</p>
            </div>
            <div className="p-3 bg-dark-900/60 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Recommended Action</span>
              <p className="font-semibold text-emerald-400 mt-0.5">{aiInsight.recommendedAction}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-dark-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('bugs')}
          className={`pb-3 px-3 transition-colors relative ${
            activeTab === 'bugs' ? 'text-red-500 border-b-2 border-red-500 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Bug Analytics & Aging
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 px-3 transition-colors relative ${
            activeTab === 'team' ? 'text-red-500 border-b-2 border-red-500 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Team Workload
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'bugs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bug Aging Distribution */}
          <div className="glass-card p-5 rounded-2xl border border-dark-800 space-y-4">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Defect Aging Breakdown (Open Bugs)
            </h3>
            <div className="space-y-3">
              {Object.entries(bugData.aging || {}).map(([range, count]) => (
                <div key={range} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{range}</span>
                    <span className="text-white font-mono">{count} bugs</span>
                  </div>
                  <div className="w-full h-2 bg-dark-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-orange-500"
                      style={{ width: `${Math.min((count / (overview.openBugs || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="glass-card p-5 rounded-2xl border border-dark-800 space-y-4">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" /> Severity Distribution
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(bugData.severityMap || {}).map(([sev, count]) => (
                <div key={sev} className="p-3 bg-dark-900 rounded-xl border border-dark-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300">{sev}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="glass-card rounded-2xl border border-dark-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-dark-900/80 border-b border-dark-800 text-slate-400 uppercase font-mono font-bold text-[10px]">
                  <th className="p-4">Team Member</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Assigned Open Bugs</th>
                  <th className="p-4">Resolved Bugs</th>
                  <th className="p-4">Executed Test Cases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60">
                {teamData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-dark-800/40 transition-colors">
                    <td className="p-4 font-bold text-white">{row.name}</td>
                    <td className="p-4 text-slate-400 font-medium">{row.role}</td>
                    <td className="p-4 font-mono font-bold text-amber-400">{row.openBugs}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">{row.resolvedBugs}</td>
                    <td className="p-4 font-mono font-bold text-blue-400">{row.executedTests}</td>
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

export default Analytics;
