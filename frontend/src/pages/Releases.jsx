import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import releaseService from '../services/releaseService';
import projectService from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import hasPermission from '../utils/permissions';
import { Tag, Plus, Search, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Releases = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [releases, setReleases] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [relRes, projRes] = await Promise.all([
        releaseService.getReleases(),
        projectService.getProjects(),
      ]);
      setReleases(Array.isArray(relRes) ? relRes : (relRes?.releases || []));
      setProjects(Array.isArray(projRes) ? projRes : (projRes?.projects || []));
    } catch (err) {
      toast.error('Failed to load release management data.');
    } finally {
      setLoading(false);
    }
  };

  const filteredReleases = releases.filter((r) => {
    return !selectedProject || r.project?._id === selectedProject || r.project === selectedProject;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Released':
      case 'Ready':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Testing':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'In Development':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Cancelled':
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
            <Tag className="w-6 h-6 text-red-500" /> Release Governance & Quality Gates
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track product releases, evaluate QA Quality Gates, and manage QA Sign-Off approvals.
          </p>
        </div>

        {hasPermission(user?.role, 'release.create') && (
          <button
            onClick={() => navigate('/releases/new')}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Release
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-dark-800 flex items-center gap-3">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500 min-w-[200px]"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.projectCode})
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredReleases.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-dark-800 space-y-4">
          <Tag className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Releases Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Create a release milestone to track quality metrics and sign-offs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReleases.map((release) => (
            <div
              key={release._id}
              onClick={() => navigate(`/releases/${release._id}`)}
              className="glass-card p-5 rounded-2xl border border-dark-800 hover:border-dark-700 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-dark-800 text-red-400 font-mono text-[10px] font-bold rounded-md border border-dark-700">
                    {release.releaseId || 'REL-0000'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(release.status)}`}>
                    {release.status}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <h2 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">{release.name}</h2>
                  <p className="text-xs text-slate-400 font-mono font-semibold">Version: {release.version}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-dark-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Target: {release.releaseDate ? new Date(release.releaseDate).toLocaleDateString() : 'TBD'}
                </span>

                <div className="flex items-center gap-1 text-red-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Sign-Off Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Releases;
