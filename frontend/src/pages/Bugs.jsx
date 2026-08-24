import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bugService from '../services/bugService';
import projectService from '../services/projectService';
import userService from '../services/userService';
import StatusChangeModal from '../components/bugs/StatusChangeModal';
import AssignModal from '../components/bugs/AssignModal';
import DeleteConfirmModal from '../components/projects/DeleteConfirmModal';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { exportBugsToExcel } from '../utils/excelExport';
import {
  Bug,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Download
} from 'lucide-react';

const Bugs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canDelete = user?.role === 'Admin' || user?.role === 'QA Manager';

  // Bugs State
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBugs, setTotalBugs] = useState(0);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [environmentFilter, setEnvironmentFilter] = useState('All');
  const [sort, setSort] = useState('newest');

  // Metadata dropdown options
  const [projectsList, setProjectsList] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Modals state
  const [statusModalBug, setStatusModalBug] = useState(null);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);

  const [assignModalBug, setAssignModalBug] = useState(null);
  const [isAssignSubmitting, setIsAssignSubmitting] = useState(false);

  const [deleteModalBug, setDeleteModalBug] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBugs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await bugService.getBugs({
        search,
        project: projectFilter,
        severity: severityFilter,
        priority: priorityFilter,
        status: statusFilter,
        environment: environmentFilter,
        sort,
        page,
        limit: 10,
      });

      setBugs(res.bugs || []);
      setTotalPages(res.pages || 1);
      setTotalBugs(res.total || 0);
    } catch (err) {
      console.error('[FETCH BUGS ERROR]:', err);
      toast.error('Unable to fetch bug records.');
    } finally {
      setLoading(false);
    }
  }, [search, projectFilter, severityFilter, priorityFilter, statusFilter, environmentFilter, sort, page]);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [pData, uData] = await Promise.all([
          projectService.getProjects(),
          userService.getUsers(),
        ]);
        setProjectsList(pData);
        setUsersList(uData);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    loadMetadata();
  }, []);

  const handleClearFilters = () => {
    setSearch('');
    setProjectFilter('All');
    setSeverityFilter('All');
    setPriorityFilter('All');
    setStatusFilter('All');
    setEnvironmentFilter('All');
    setSort('newest');
    setPage(1);
  };

  const handleStatusSubmit = async (newStatus, comment) => {
    if (!statusModalBug) return;
    try {
      setIsStatusSubmitting(true);
      await bugService.changeStatus(statusModalBug._id || statusModalBug.bugId, newStatus, comment);
      toast.success(`Bug ${statusModalBug.bugId} status updated to ${newStatus}`);
      setStatusModalBug(null);
      fetchBugs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to update status.';
      toast.error(msg);
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  const handleAssignSubmit = async (assignedToUserId) => {
    if (!assignModalBug) return;
    try {
      setIsAssignSubmitting(true);
      await bugService.assignBug(assignModalBug._id || assignModalBug.bugId, assignedToUserId);
      toast.success(`Bug ${assignModalBug.bugId} assigned successfully.`);
      setAssignModalBug(null);
      fetchBugs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to assign bug.';
      toast.error(msg);
    } finally {
      setIsAssignSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalBug) return;
    try {
      setIsDeleting(true);
      await bugService.deleteBug(deleteModalBug._id || deleteModalBug.bugId);
      toast.success(`Bug ${deleteModalBug.bugId} deleted successfully.`);
      setDeleteModalBug(null);
      fetchBugs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to delete bug.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'Blocker':
        return 'bg-red-600/20 text-red-400 border-red-500/40';
      case 'Critical':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'Major':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'Minor':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'New':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Assigned':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'In Progress':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Fixed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Retest':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Closed':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'Reopened':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'Rejected':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
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
            <Bug className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Bug Tracking Module</h1>
            <p className="text-xs text-slate-400">
              Manage defects, classification, lifecycle verification, and team resolution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              exportBugsToExcel(bugs);
              toast.success('Bugs exported to Excel spreadsheet.');
            }}
            className="px-3.5 py-2.5 bg-dark-800 hover:bg-dark-700 text-emerald-400 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={() => navigate('/bugs/new')}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Report New Bug
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Bug ID (e.g. BUG-0001), title, or keywords..."
              className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-dark-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>

          {/* Sort Selector & Clear Filter */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold shrink-0">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="updated">Recently Updated</option>
              <option value="severity">Severity Order</option>
              <option value="priority">Priority Order</option>
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
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-dark-950 border border-dark-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Fixed">Fixed</option>
              <option value="Retest">Retest</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Environment</label>
            <select
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-dark-950 border border-dark-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="All">All Environments</option>
              <option value="Development">Development</option>
              <option value="QA">QA</option>
              <option value="Staging">Staging</option>
              <option value="Production">Production</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bugs Table Grid */}
      <div className="glass-card rounded-2xl border border-dark-800 p-6 shadow-card-dark overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Bug Repository Telemetry
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
              {totalBugs} {totalBugs === 1 ? 'Bug' : 'Bugs'}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
            <p className="text-xs font-medium">Fetching defect records...</p>
          </div>
        ) : bugs.length === 0 ? (
          <div className="text-center py-12 bg-dark-900/40 rounded-xl border border-dark-800">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Bugs Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              No bugs matched your filter parameters. Try clearing filters or submit a new bug.
            </p>
            <button
              onClick={() => navigate('/bugs/new')}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg text-xs font-semibold shadow-glow-red"
            >
              Report New Bug
            </button>
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
                  <th className="pb-3 px-2">Reporter</th>
                  <th className="pb-3 px-2">Assigned To</th>
                  <th className="pb-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60 text-slate-300">
                {bugs.map((b) => {
                  const projName = b.project?.name || b.projectName || 'Project';
                  const repName = b.reporter?.name || 'Reporter';
                  const assignName = b.assignedTo?.name || 'Unassigned';

                  return (
                    <tr key={b._id} className="hover:bg-dark-900/60 transition-colors group">
                      <td className="py-3 px-2 font-mono font-bold text-red-400">{b.bugId || b._id}</td>
                      <td className="py-3 px-2 font-semibold text-white max-w-xs truncate" title={b.title}>
                        {b.title}
                      </td>
                      <td className="py-3 px-2 text-slate-400 max-w-[120px] truncate">{projName}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getSeverityBadge(b.severity)}`}>
                          {b.severity}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-dark-950 text-slate-300 border border-dark-700">
                          {b.priority || 'P3'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-300">{repName}</td>
                      <td className="py-3 px-2 text-slate-300">{assignName}</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/bugs/${b._id || b.bugId}`)}
                            className="p-1.5 text-slate-300 hover:text-white bg-dark-800 hover:bg-dark-700 rounded-lg text-xs transition-colors"
                            title="View Bug Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                          </button>

                          <button
                            onClick={() => setStatusModalBug(b)}
                            className="p-1.5 text-slate-300 hover:text-amber-400 bg-dark-800 hover:bg-dark-700 rounded-lg text-xs transition-colors"
                            title="Change Status"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          <button
                            onClick={() => setAssignModalBug(b)}
                            className="p-1.5 text-slate-300 hover:text-purple-400 bg-dark-800 hover:bg-dark-700 rounded-lg text-xs transition-colors"
                            title="Assign Bug"
                          >
                            <UserPlus className="w-3.5 h-3.5 text-purple-400" />
                          </button>

                          <button
                            onClick={() => navigate(`/bugs/${b._id || b.bugId}/edit`)}
                            className="p-1.5 text-slate-300 hover:text-white bg-dark-800 hover:bg-dark-700 rounded-lg text-xs transition-colors"
                            title="Edit Bug"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-300" />
                          </button>

                          {canDelete && (
                            <button
                              onClick={() => setDeleteModalBug(b)}
                              className="p-1.5 text-slate-300 hover:text-red-400 bg-dark-800 hover:bg-dark-700 rounded-lg text-xs transition-colors"
                              title="Delete Bug"
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
        {!loading && bugs.length > 0 && (
          <div className="pt-4 mt-4 border-t border-dark-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {bugs.length} of {totalBugs} bugs
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
                className="px-3 py-1.5 bg-dark-850 hover:bg-dark-800 disabled:opacity-40 text-slate-200 rounded-lg border border-dark-700 flex items-center gap-1 font-medium"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <StatusChangeModal
        isOpen={!!statusModalBug}
        onClose={() => setStatusModalBug(null)}
        onConfirm={handleStatusSubmit}
        currentStatus={statusModalBug?.status}
        userRole={user?.role}
        isSubmitting={isStatusSubmitting}
      />

      <AssignModal
        isOpen={!!assignModalBug}
        onClose={() => setAssignModalBug(null)}
        onConfirm={handleAssignSubmit}
        currentAssignee={assignModalBug?.assignedTo}
        isSubmitting={isAssignSubmitting}
      />

      <DeleteConfirmModal
        isOpen={!!deleteModalBug}
        onClose={() => setDeleteModalBug(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete '${deleteModalBug?.bugId}'?`}
        message="Are you sure you want to delete this defect record? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Bugs;
