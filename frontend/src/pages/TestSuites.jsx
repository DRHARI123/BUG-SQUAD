import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import testSuiteService from '../services/testSuiteService';
import projectService from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import hasPermission from '../utils/permissions';
import { Layers, Plus, Search, Folder, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const TestSuites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [suites, setSuites] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuites();
  }, []);

  const fetchSuites = async () => {
    setLoading(true);
    try {
      const [suiteRes, projRes] = await Promise.all([
        testSuiteService.getTestSuites(),
        projectService.getProjects(),
      ]);
      setSuites(suiteRes || []);
      setProjects(projRes.projects || projRes || []);
    } catch (err) {
      toast.error('Failed to load test suites.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSuites = suites.filter((s) => {
    const matchProj = !selectedProject || s.project?._id === selectedProject || s.project === selectedProject;
    const matchSearch = !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.suiteId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchProj && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-red-500" /> Test Suites Repository
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Group related test cases into executable test suites by module and project.
          </p>
        </div>

        {hasPermission(user?.role, 'testsuite.create') && (
          <button
            onClick={() => navigate('/test-suites/new')}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Test Suite
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-dark-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search test suites..."
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
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSuites.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-dark-800 space-y-4">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Test Suites Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Organize your test cases into reusable test suites.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuites.map((suite) => (
            <div
              key={suite._id}
              className="glass-card p-5 rounded-2xl border border-dark-800 hover:border-dark-700 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-dark-800 text-red-400 font-mono text-[10px] font-bold rounded-md border border-dark-700">
                  {suite.suiteId || 'SUITE-0000'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {suite.project?.name || 'Project'}
                </span>
              </div>

              <h2 className="text-base font-bold text-white line-clamp-1">{suite.name}</h2>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{suite.description || 'No description provided.'}</p>

              <div className="pt-3 border-t border-dark-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold">{suite.testCases?.length || 0} Test Cases</span>
                </div>

                <span className="text-[10px] text-slate-500 font-mono">
                  {suite.module?.name || 'Module'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestSuites;
