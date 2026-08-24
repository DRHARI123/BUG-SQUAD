import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import testRunService from '../services/testRunService';
import projectService from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import hasPermission from '../utils/permissions';
import { PlayCircle, Plus, Search, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const TestRuns = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [runs, setRuns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [runRes, projRes] = await Promise.all([
        testRunService.getTestRuns(),
        projectService.getProjects(),
      ]);
      setRuns(runRes.testRuns || runRes || []);
      setProjects(projRes.projects || projRes || []);
    } catch (err) {
      toast.error('Failed to load test runs.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRuns = runs.filter((r) => {
    const matchProj = !selectedProject || r.project?._id === selectedProject || r.project === selectedProject;
    const matchStat = selectedStatus === 'All' || r.status === selectedStatus;
    return matchProj && matchStat;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Running':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Paused':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-red-500" /> Test Execution Bench & Runs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Execute test cycles sequentially, log test verdicts, and auto-generate defects.
          </p>
        </div>

        {hasPermission(user?.role, 'testrun.create') && (
          <button
            onClick={() => navigate('/test-runs/new')}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Test Run
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-dark-800 flex flex-wrap items-center gap-3">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500"
        >
          <option value="">All Projects</option>
          {projects.map((proj) => (
            <option key={proj._id} value={proj._id}>
              {proj.name} ({proj.projectCode})
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500"
        >
          <option value="All">All Statuses</option>
          <option value="Not Started">Not Started</option>
          <option value="Running">Running</option>
          <option value="Paused">Paused</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Test Runs Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-dark-800 space-y-4">
          <PlayCircle className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Test Runs Active</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Create a test run to start executing test cases.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRuns.map((run) => {
            const totalCases = run.testCases?.length || 0;
            const passedCases = run.testCases?.filter((c) => c.result === 'Passed').length || 0;
            const failedCases = run.testCases?.filter((c) => c.result === 'Failed').length || 0;
            const passPct = totalCases > 0 ? Math.round((passedCases / totalCases) * 100) : 0;

            return (
              <div
                key={run._id}
                className="glass-card p-5 rounded-2xl border border-dark-800 hover:border-dark-700 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-dark-800 text-red-400 font-mono text-[10px] font-bold rounded-md border border-dark-700">
                      {run.testRunId || 'TR-0000'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(run.status)}`}>
                      {run.status}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-white line-clamp-1">{run.name}</h2>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Pass Rate</span>
                      <span className="text-emerald-400 font-bold">{passPct}%</span>
                    </div>
                    <div className="w-full bg-dark-900 rounded-full h-2 overflow-hidden flex border border-dark-800">
                      <div className="bg-emerald-500 h-full" style={{ width: `${passPct}%` }} />
                      <div className="bg-red-500 h-full" style={{ width: `${totalCases > 0 ? (failedCases / totalCases) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-dark-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">{totalCases} Cases</span>

                  <button
                    onClick={() => navigate(`/test-runs/${run._id}/execute`)}
                    className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-lg text-xs font-bold shadow-glow-red flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" /> Execute Bench
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TestRuns;
