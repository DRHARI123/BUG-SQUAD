import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import requirementService from '../services/requirementService';
import projectService from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import hasPermission from '../utils/permissions';
import { FileCheck, Plus, Search, Filter, ShieldCheck, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const Requirements = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [reqRes, projRes] = await Promise.all([
        requirementService.getRequirements(),
        projectService.getProjects(),
      ]);
      setRequirements(reqRes.requirements || reqRes || []);
      setProjects(projRes.projects || projRes || []);
    } catch (err) {
      toast.error('Failed to load requirements.');
    } finally {
      setLoading(false);
    }
  };

  const filteredReqs = requirements.filter((r) => {
    const matchProj = !selectedProject || r.project?._id === selectedProject || r.project === selectedProject;
    const matchStat = selectedStatus === 'All' || r.status === selectedStatus;
    const matchType = selectedType === 'All' || r.type === selectedType;
    const matchSearch = !searchTerm || r.title?.toLowerCase().includes(searchTerm.toLowerCase()) || r.requirementId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchProj && matchStat && matchType && matchSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Ready for Testing':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'In Development':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Rejected':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-red-500" /> Requirements Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Define functional specifications, business rules, acceptance criteria, and link to test cases.
          </p>
        </div>

        {hasPermission(user?.role, 'requirement.create') && (
          <button
            onClick={() => navigate('/requirements/new')}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Requirement
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-dark-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by ID or title..."
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
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500"
        >
          <option value="All">All Types</option>
          <option value="Functional">Functional</option>
          <option value="Non-Functional">Non-Functional</option>
          <option value="Business">Business</option>
          <option value="Technical">Technical</option>
          <option value="Security">Security</option>
          <option value="Performance">Performance</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500"
        >
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Approved">Approved</option>
          <option value="In Development">In Development</option>
          <option value="Ready for Testing">Ready for Testing</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredReqs.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-dark-800 space-y-4">
          <FileCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Requirements Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Create a requirement specification to begin traceability tracking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReqs.map((reqItem) => (
            <div
              key={reqItem._id}
              onClick={() => navigate(`/requirements/${reqItem._id}`)}
              className="glass-card p-5 rounded-2xl border border-dark-800 hover:border-dark-700 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-dark-800 text-red-400 font-mono text-[10px] font-bold rounded-md border border-dark-700">
                    {reqItem.requirementId || 'REQ-0000'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(reqItem.status)}`}>
                    {reqItem.status}
                  </span>
                </div>

                <h2 className="text-base font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                  {reqItem.title}
                </h2>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{reqItem.description || 'No description provided.'}</p>
              </div>

              <div className="pt-3 border-t border-dark-800 flex items-center justify-between text-xs text-slate-400">
                <span className="px-2 py-0.5 bg-dark-900 text-slate-300 text-[10px] font-semibold rounded border border-dark-800">
                  {reqItem.type || 'Functional'}
                </span>

                <div className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{reqItem.testCases?.length || 0} Test Cases</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Requirements;
