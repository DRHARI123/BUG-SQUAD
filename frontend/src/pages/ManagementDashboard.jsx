import React, { useState, useEffect } from 'react';
import analyticsService from '../services/analyticsService';
import slaService from '../services/slaService';
import projectService from '../services/projectService';
import { LayoutDashboard, Sparkles, ShieldCheck, AlertTriangle, CheckCircle2, Clock, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

const ManagementDashboard = () => {
  const [overview, setOverview] = useState({});
  const [slaData, setSlaData] = useState({});
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, slaRes] = await Promise.all([
        analyticsService.getOverview(),
        slaService.getSLADashboard(),
      ]);
      setOverview(overviewRes || {});
      setSlaData(slaRes?.summary || {});
    } catch (err) {
      toast.error('Failed to load management dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAISummary = async () => {
    setGeneratingAI(true);
    try {
      const res = await analyticsService.generateAIInsights({
        totalBugs: overview.totalBugs,
        openBugs: overview.openBugs,
        criticalBugs: overview.criticalBugs,
        passRate: overview.passRate,
        reqCoverage: overview.reqCoverage,
      });
      setAiSummary(res);
      toast.success('Generated Executive AI Summary!');
    } catch (err) {
      toast.error('Failed to generate summary.');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Determine Project Health Status
  const criticalCount = (overview.criticalBugs || 0) + (overview.blockerBugs || 0);
  const healthStatus = criticalCount > 2 ? 'Critical' : criticalCount > 0 ? 'At Risk' : 'Healthy';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-red-500" /> Executive Management Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            2-minute high-level executive health summary for QA Managers and System Administrators.
          </p>
        </div>

        <button
          onClick={handleGenerateAISummary}
          disabled={generatingAI}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" /> {generatingAI ? 'Generating...' : 'Generate AI Executive Summary'}
        </button>
      </div>

      {/* Project Health Banner */}
      <div
        className={`p-6 rounded-2xl border flex items-center justify-between ${
          healthStatus === 'Healthy'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : healthStatus === 'At Risk'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-dark-900 flex items-center justify-center font-bold text-xl">
            {healthStatus === 'Healthy' ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <AlertTriangle className="w-8 h-8 text-red-400" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Overall Portfolio Status: {healthStatus.toUpperCase()}</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {healthStatus === 'Healthy'
                ? 'All projects operating within quality threshold limits.'
                : `${criticalCount} critical blocker defects require immediate engineering triage.`}
            </p>
          </div>
        </div>

        <span className="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase font-mono tracking-wider bg-dark-950/80 text-white border border-dark-700">
          Health: {healthStatus}
        </span>
      </div>

      {/* Executive Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">SLA Compliance</span>
          <p className="text-2xl font-extrabold text-emerald-400">{slaData.complianceRate || 100}%</p>
          <span className="text-[10px] text-slate-500 block">Target &gt; 90%</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Test Pass Rate</span>
          <p className="text-2xl font-extrabold text-blue-400">{overview.passRate || 0}%</p>
          <span className="text-[10px] text-slate-500 block">Executed Tests</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Requirement Coverage</span>
          <p className="text-2xl font-extrabold text-purple-400">{overview.reqCoverage || 0}%</p>
          <span className="text-[10px] text-slate-500 block">Requirements Mapped</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-dark-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Open Defects</span>
          <p className="text-2xl font-extrabold text-amber-400">{overview.openBugs || 0}</p>
          <span className="text-[10px] text-slate-500 block">{criticalCount} Critical</span>
        </div>
      </div>

      {/* AI Executive Summary Card */}
      {aiSummary && (
        <div className="glass-card p-6 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-4">
          <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" /> Executive AI Portfolio Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-dark-900/60 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Top Portfolio Risk</span>
              <p className="font-semibold text-white">{aiSummary.topRisk}</p>
            </div>
            <div className="p-4 bg-dark-900/60 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Observed Velocity</span>
              <p className="font-semibold text-white">{aiSummary.mainTrend}</p>
            </div>
            <div className="p-4 bg-dark-900/60 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Strategic Recommendation</span>
              <p className="font-semibold text-emerald-400">{aiSummary.recommendedAction}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagementDashboard;
