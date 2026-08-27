import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import testCaseService from '../services/testCaseService';
import scenarioService from '../services/scenarioService';
import projectService from '../services/projectService';
import userService from '../services/userService';
import ScenarioModal from '../components/testCases/ScenarioModal';
import DeleteConfirmModal from '../components/projects/DeleteConfirmModal';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { exportTestCasesToExcel } from '../utils/excelExport';
import {
  FileCheck2,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Play,
  Copy,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Layers,
  Download
} from 'lucide-react';

const TestCases = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canDelete = user?.role === 'Admin' || user?.role === 'QA Manager';

  // Data state
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [scenarioFilter, setScenarioFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sort, setSort] = useState('newest');

  // Metadata dropdown options
  const [projectsList, setProjectsList] = useState([]);
  const [modulesList, setModulesList] = useState([]);
  const [scenariosList, setScenariosList] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Modal States
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isScenarioSubmitting, setIsScenarioSubmitting] = useState(false);

  const [deleteModalTc, setDeleteModalTc] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTestCases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await testCaseService.getTestCases({
        search,
        project: projectFilter,
        module: moduleFilter,
        scenario: scenarioFilter,
        priority: priorityFilter,
        severity: severityFilter,
        status: statusFilter,
        sort,
        page,
        limit: 10,
      });

      setTestCases(res.testCases || []);
      setTotalPages(res.pages || 1);
      setTotalCases(res.total || 0);
    } catch (err) {
      console.error('[FETCH TEST CASES ERROR]:', err);
      toast.error('Unable to fetch test cases.');
    } finally {
      setLoading(false);
    }
  }, [search, projectFilter, moduleFilter, scenarioFilter, priorityFilter, severityFilter, statusFilter, sort, page]);

  useEffect(() => {
    fetchTestCases();
  }, [fetchTestCases]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [pData, uData, scnData] = await Promise.all([
          projectService.getProjects(),
          userService.getUsers(),
          scenarioService.getScenarios(),
        ]);
        setProjectsList(Array.isArray(pData) ? pData : (pData?.projects || []));
        setUsersList(Array.isArray(uData) ? uData : (uData?.users || []));
        setScenariosList(Array.isArray(scnData) ? scnData : (scnData?.scenarios || []));
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    };
    loadMetadata();
  }, []);

  const handleClearFilters = () => {
    setSearch('');
    setProjectFilter('All');
    setModuleFilter('All');
    setScenarioFilter('All');
    setPriorityFilter('All');
    setSeverityFilter('All');
    setStatusFilter('All');
    setSort('newest');
    setPage(1);
  };

  const handleDuplicate = async (tc) => {
    try {
      await testCaseService.duplicateTestCase(tc._id || tc.testCaseId);
      toast.success(`Test Case duplicated successfully.`);
      fetchTestCases();
    } catch (err) {
      toast.error('Failed to duplicate test case.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalTc) return;
    try {
      setIsDeleting(true);
      await testCaseService.deleteTestCase(deleteModalTc._id || deleteModalTc.testCaseId);
      toast.success(`Test Case ${deleteModalTc.testCaseId} deleted successfully.`);
      setDeleteModalTc(null);
      fetchTestCases();
    } catch (err) {
      toast.error('Failed to delete test case.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveScenario = async (scenarioFormData) => {
    try {
      setIsScenarioSubmitting(true);
      await scenarioService.createScenario(scenarioFormData);
      toast.success('Scenario created successfully.');
      setIsScenarioModalOpen(false);
      const scnData = await scenarioService.getScenarios();
      setScenariosList(scnData);
    } catch (err) {
      toast.error('Unable to create scenario.');
    } finally {
      setIsScenarioSubmitting(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Passed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Failed':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'Blocked':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Retest':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Test Case Repository</h1>
            <p className="text-xs text-slate-400">
              Manage test scenarios, steps, expected behavior, execution runs, and defect creation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              exportTestCasesToExcel(testCases);
              toast.success('Test Cases exported to Excel spreadsheet.');
            }}
            className="px-3.5 py-2.5 bg-dark-800 hover:bg-dark-700 text-emerald-400 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={() => setIsScenarioModalOpen(true)}
            className="px-3.5 py-2.5 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-4 h-4 text-purple-400" /> Create Scenario
          </button>
          <button
            onClick={() => navigate('/test-cases/new')}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Test Case
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Test Case ID (e.g. TC-0001), title, or scenario..."
              className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold shrink-0">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority Order</option>
              <option value="severity">Severity Order</option>
              <option value="updated">Recently Updated</option>
            </select>

            <button
              onClick={handleClearFilters}
              className="px-3 py-2 bg-dark-800 hover:bg-dark-700 text-red-400 hover:text-red-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-dark-700 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        </div>

        {/* Multi-Criteria Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-dark-800/80">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Project</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-dark-950 border border-dark-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="All">All Projects</option>
              {projectsList.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Scenario</label>
            <select
              value={scenarioFilter}
              onChange={(e) => setScenarioFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-dark-950 border border-dark-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="All">All Scenarios</option>
              {scenariosList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-dark-950 border border-dark-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="P1 - Highest">P1 - Highest</option>
              <option value="P2 - High">P2 - High</option>
              <option value="P3 - Medium">P3 - Medium</option>
              <option value="P4 - Low">P4 - Low</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-dark-950 border border-dark-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Blocker">Blocker</option>
              <option value="Critical">Critical</option>
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
              <option value="Trivial">Trivial</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-dark-950 border border-dark-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Not Run">Not Run</option>
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
              <option value="Blocked">Blocked</option>
              <option value="Retest">Retest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Test Cases Table Grid */}
      <div className="glass-card rounded-2xl border border-dark-800 p-6 shadow-card-dark overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Test Suite Specification Suite
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
              {totalCases} {totalCases === 1 ? 'Test Case' : 'Test Cases'}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
            <p className="text-xs font-medium">Fetching test case records...</p>
          </div>
        ) : testCases.length === 0 ? (
          <div className="text-center py-12 bg-dark-900/40 rounded-xl border border-dark-800">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Test Cases Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              There are currently no test cases matching your criteria.
            </p>
            <button
              onClick={() => navigate('/test-cases/new')}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg text-xs font-semibold shadow-glow-red"
            >
              Create First Test Case
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dark-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-2">TC ID</th>
                  <th className="pb-3 px-2">Title</th>
                  <th className="pb-3 px-2">Project</th>
                  <th className="pb-3 px-2">Scenario</th>
                  <th className="pb-3 px-2">Priority</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Tester</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60 text-slate-300">
                {testCases.map((tc) => {
                  const projName = tc.project?.name || tc.projectName || 'Project';
                  const scnName = tc.scenario?.name || tc.scenarioName || 'General';
                  const testerName = tc.tester?.name || 'Tester';

                  return (
                    <tr key={tc._id} className="hover:bg-dark-900/60 transition-colors">
                      <td className="py-3 px-2 font-mono font-bold text-red-400">{tc.testCaseId || tc._id}</td>
                      <td className="py-3 px-2 font-semibold text-white max-w-xs truncate" title={tc.title}>
                        {tc.title}
                      </td>
                      <td className="py-3 px-2 text-slate-400 max-w-[120px] truncate">{projName}</td>
                      <td className="py-3 px-2 text-slate-400 max-w-[120px] truncate">{scnName}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-dark-950 text-slate-300 border border-dark-700">
                          {tc.priority || 'P3'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(tc.status)}`}>
                          {tc.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-300">{testerName}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/test-cases/${tc._id || tc.testCaseId}/execute`)}
                            className="px-2.5 py-1 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-all shadow-glow-red"
                            title="Execute Test Case"
                          >
                            <Play className="w-3 h-3 fill-current" /> Execute
                          </button>

                          <button
                            onClick={() => navigate(`/test-cases/${tc._id || tc.testCaseId}`)}
                            className="p-1.5 text-slate-300 hover:text-white bg-dark-800 hover:bg-dark-700 rounded-lg text-xs transition-colors"
                            title="View Test Case Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                          </button>

                          <button
                            onClick={() => handleDuplicate(tc)}
                            className="p-1.5 text-slate-300 hover:text-purple-400 bg-dark-800 hover:bg-dark-700 rounded-lg text-xs transition-colors"
                            title="Duplicate Test Case"
                          >
                            <Copy className="w-3.5 h-3.5 text-purple-400" />
                          </button>

                          <button
                            onClick={() => navigate(`/test-cases/${tc._id || tc.testCaseId}/edit`)}
                            className="p-1.5 text-slate-300 hover:text-white bg-dark-800 hover:bg-dark-700 rounded-lg text-xs transition-colors"
                            title="Edit Test Case"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-300" />
                          </button>

                          {canDelete && (
                            <button
                              onClick={() => setDeleteModalTc(tc)}
                              className="p-1.5 text-slate-300 hover:text-red-400 bg-dark-800 hover:bg-dark-700 rounded-lg text-xs transition-colors"
                              title="Delete Test Case"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && testCases.length > 0 && (
          <div className="pt-4 mt-4 border-t border-dark-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {testCases.length} of {totalCases} test cases
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-dark-850 hover:bg-dark-800 disabled:opacity-40 text-slate-200 rounded-lg border border-dark-700 flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <span className="font-bold text-white px-2">
                {page} / {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 bg-dark-850 hover:bg-dark-800 disabled:opacity-40 text-slate-200 rounded-lg border border-dark-700 flex items-center gap-1 font-medium"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onSubmit={handleSaveScenario}
        isSubmitting={isScenarioSubmitting}
      />

      <DeleteConfirmModal
        isOpen={!!deleteModalTc}
        onClose={() => setDeleteModalTc(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete '${deleteModalTc?.testCaseId}'?`}
        message="Are you sure you want to delete this test case specification? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default TestCases;
