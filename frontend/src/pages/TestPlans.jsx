import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import testPlanService from '../services/testPlanService';
import projectService from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import hasPermission from '../utils/permissions';
import { FileText, Plus, Search, Filter, Calendar, User, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const TestPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [planRes, projRes] = await Promise.all([
        testPlanService.getTestPlans(),
        projectService.getProjects(),
      ]);
      setPlans(Array.isArray(planRes) ? planRes : (planRes?.testPlans || []));
      setProjects(Array.isArray(projRes) ? projRes : (projRes?.projects || []));
    } catch (err) {
      toast.error('Failed to load test plans.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = plans.filter((p) => {
    const matchProj = !selectedProject || p.project?._id === selectedProject || p.project === selectedProject;
    const matchStat = selectedStatus === 'All' || p.status === selectedStatus;
    const matchSearch = !searchTerm || p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.testPlanId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchProj && matchStat && matchSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Completed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'On Hold':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Archived':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-red-500" /> Test Plans Repository
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage release test strategy, scope, entry/exit criteria, and assigned QA testers.
          </p>
        </div>

        {hasPermission(user?.role, 'testplan.create') && (
          <button
            onClick={() => navigate('/test-plans/new')}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Test Plan
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-dark-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by ID or plan name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-900 border border-dark-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
          />
        </div>

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
          <option value="Draft">Draft</option>
          <option value="Active">Active</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      {/* Test Plans Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-dark-800 space-y-4">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Test Plans Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No test plans match your current search filters. Create a new test plan to define test strategy.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((plan) => (
            <div
              key={plan._id}
              onClick={() => navigate(`/test-plans/${plan._id}`)}
              className="glass-card p-5 rounded-2xl border border-dark-800 hover:border-dark-700 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-dark-800 text-red-400 font-mono text-[10px] font-bold rounded-md border border-dark-700">
                    {plan.testPlanId || 'TP-0000'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(plan.status)}`}>
                    {plan.status}
                  </span>
                </div>

                <h2 className="text-base font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                  {plan.name}
                </h2>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {plan.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-3 border-t border-dark-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{plan.owner?.name || 'QA Lead'}</span>
                </div>

                <div className="flex items-center gap-1 text-red-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>View Strategy</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestPlans;
