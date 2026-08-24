import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import projectService from '../services/projectService';
import moduleService from '../services/moduleService';
import testCaseService from '../services/testCaseService';
import ModuleModal from '../components/modules/ModuleModal';
import DeleteConfirmModal from '../components/projects/DeleteConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { exportProjectPDF } from '../utils/pdfExport';
import { exportProjectsToExcel } from '../utils/excelExport';
import {
  FolderGit2,
  Building2,
  Calendar,
  User,
  Users,
  Layers,
  Bug,
  FileCheck,
  Plus,
  Edit2,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Flame,
  Activity,
  Play,
  FileText,
  Download
} from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === 'Admin' || user?.role === 'QA Manager';

  const [project, setProject] = useState(null);
  const [modules, setModules] = useState([]);
  const [projectTestCases, setProjectTestCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Module Modal States
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [isModuleSubmitting, setIsModuleSubmitting] = useState(false);

  // Module Delete Confirmation States
  const [deletingModule, setDeletingModule] = useState(null);
  const [isModuleDeleting, setIsModuleDeleting] = useState(false);

  const fetchProjectAndModules = useCallback(async () => {
    try {
      setLoading(true);
      const [projData, modsData, tcData] = await Promise.all([
        projectService.getProjectById(id),
        moduleService.getModules(id),
        testCaseService.getTestCases({ project: id }),
      ]);
      setProject(projData);
      setModules(modsData);
      setProjectTestCases(tcData.testCases || []);
    } catch (err) {
      console.error('Failed to load project details:', err);
      toast.error('Unable to fetch project details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectAndModules();
  }, [fetchProjectAndModules]);

  // Module Save Handler
  const handleSaveModule = async (moduleFormData) => {
    try {
      setIsModuleSubmitting(true);
      if (editingModule) {
        await moduleService.updateModule(editingModule._id, moduleFormData);
        toast.success('Module updated successfully.');
      } else {
        await moduleService.createModule({ ...moduleFormData, project: id });
        toast.success('Module added successfully.');
      }
      setIsModuleModalOpen(false);
      fetchProjectAndModules();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to save module.';
      toast.error(msg);
    } finally {
      setIsModuleSubmitting(false);
    }
  };

  // Module Delete Handler
  const handleDeleteModule = async () => {
    if (!deletingModule) return;
    try {
      setIsModuleDeleting(true);
      await moduleService.deleteModule(deletingModule._id);
      toast.success('Module deleted successfully.');
      setDeletingModule(null);
      fetchProjectAndModules();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to delete module.';
      toast.error(msg);
    } finally {
      setIsModuleDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-3" />
        <p className="text-sm font-medium">Loading project architecture & modules...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Project Not Found</h2>
        <p className="text-xs text-slate-400 mb-4">The requested project ID does not exist.</p>
        <Link
          to="/projects"
          className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-lg text-xs font-semibold"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Planning':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'On Hold':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Completed':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Back Button */}
      <button
        onClick={() => navigate('/projects')}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Projects Workspace
      </button>

      {/* Project Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red shrink-0">
              <FolderGit2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded border border-red-500/20">
                  {project.projectCode}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(project.status)}`}>
                  {project.status}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">{project.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                exportProjectPDF(project, [], projectTestCases);
                toast.success('Project QA Report PDF generated!');
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-3.5 h-3.5" /> Generate Project QA Report PDF
            </button>
            <button
              onClick={() => {
                exportProjectsToExcel([project]);
                toast.success('Project details exported to Excel.');
              }}
              className="px-3 py-2 bg-dark-800 hover:bg-dark-700 text-emerald-400 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        {/* Info Strip */}
        <div className="mt-6 pt-4 border-t border-dark-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Building2 className="w-4 h-4 text-orange-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-500 uppercase">Client</span>
              <span className="font-semibold text-slate-200">{project.client || 'Internal QA'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <User className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-500 uppercase">Project Manager</span>
              <span className="font-semibold text-slate-200">{project.projectManager?.name || 'Unassigned'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-500 uppercase">Start Date</span>
              <span className="font-semibold text-slate-200">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-500 uppercase">End Date</span>
              <span className="font-semibold text-slate-200">
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Statistics Bar */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-500" /> Project QA Metrics Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
            <span className="block text-xl font-bold text-white">{project.bugCount || 12}</span>
            <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Total Bugs</span>
          </div>
          <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
            <span className="block text-xl font-bold text-amber-400">4</span>
            <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Open Bugs</span>
          </div>
          <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
            <span className="block text-xl font-bold text-red-500">1</span>
            <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Critical</span>
          </div>
          <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
            <span className="block text-xl font-bold text-emerald-400">7</span>
            <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Resolved</span>
          </div>
          <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
            <span className="block text-xl font-bold text-cyan-400">{projectTestCases.length}</span>
            <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Test Cases</span>
          </div>
          <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
            <span className="block text-xl font-bold text-emerald-400">
              {projectTestCases.filter((tc) => tc.status === 'Passed').length}
            </span>
            <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Passed</span>
          </div>
          <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
            <span className="block text-xl font-bold text-red-400">
              {projectTestCases.filter((tc) => tc.status === 'Failed').length}
            </span>
            <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Failed</span>
          </div>
        </div>
      </div>

      {/* Modules Section */}
      <div className="glass-card rounded-2xl border border-dark-800 p-6 shadow-card-dark">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-400" />
              Project Modules
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Functional components and test boundaries configured for this project
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => {
                setEditingModule(null);
                setIsModuleModalOpen(true);
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-semibold shadow-glow-red flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Module
            </button>
          )}
        </div>

        {modules.length === 0 ? (
          <div className="text-center py-8 bg-dark-900/40 rounded-xl border border-dark-800">
            <p className="text-xs text-slate-400 mb-3">No modules available for this project yet.</p>
            {canManage && (
              <button
                onClick={() => {
                  setEditingModule(null);
                  setIsModuleModalOpen(true);
                }}
                className="px-3 py-1.5 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-lg text-xs font-semibold border border-dark-700"
              >
                Add First Module
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod) => (
              <div
                key={mod._id}
                className="p-4 rounded-xl bg-dark-900/60 border border-dark-800 hover:border-dark-700 flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-white">{mod.name}</h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        mod.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}
                    >
                      {mod.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {mod.description || 'No description provided.'}
                  </p>
                </div>

                {canManage && (
                  <div className="pt-2 border-t border-dark-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingModule(mod);
                        setIsModuleModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                      title="Edit Module"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingModule(mod)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete Module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Team Members */}
      <div className="glass-card rounded-2xl border border-dark-800 p-6 shadow-card-dark">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-400" />
          Assigned QA Team Members
        </h2>

        {!project.teamMembers || project.teamMembers.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No specific team members assigned yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {project.teamMembers.map((member) => (
              <div
                key={member._id || member}
                className="flex items-center gap-3 p-3 rounded-xl bg-dark-900/60 border border-dark-800"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center font-bold text-red-400 text-sm">
                  {member.name ? member.name.charAt(0) : 'U'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{member.name || 'Team Member'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                  <span className="inline-block mt-0.5 text-[10px] font-semibold text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded">
                    {member.role || 'QA Engineer'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Project Bugs */}
      <div className="glass-card rounded-2xl border border-dark-800 p-6 shadow-card-dark">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" />
            Project Recent Bugs
          </h2>
          <span className="text-xs text-slate-500 font-mono">Filtered by Project</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-dark-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 px-2">Bug ID</th>
                <th className="pb-3 px-2">Title</th>
                <th className="pb-3 px-2">Severity</th>
                <th className="pb-3 px-2">Priority</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2">Assigned To</th>
                <th className="pb-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/60 text-slate-300">
              <tr className="hover:bg-dark-900/60 transition-colors">
                <td className="py-3 px-2 font-mono font-bold text-red-400">BUG-1042</td>
                <td className="py-3 px-2 font-medium text-slate-200">Authentication token expiration infinite loop</td>
                <td className="py-3 px-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                    Critical
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30">
                    High
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Open
                  </span>
                </td>
                <td className="py-3 px-2 text-slate-300">Sarah Connor</td>
                <td className="py-3 px-2 text-right">
                  <button
                    onClick={() => navigate('/bugs/BUG-1042')}
                    className="px-2.5 py-1 bg-dark-800 hover:bg-dark-700 text-slate-200 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 ml-auto border border-dark-700 transition-colors"
                  >
                    View
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-dark-900/60 transition-colors">
                <td className="py-3 px-2 font-mono font-bold text-red-400">BUG-1039</td>
                <td className="py-3 px-2 font-medium text-slate-200">Checkout price rounding discrepancy on multi-item cart</td>
                <td className="py-3 px-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Major
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    Medium
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    In Progress
                  </span>
                </td>
                <td className="py-3 px-2 text-slate-300">John Doe</td>
                <td className="py-3 px-2 text-right">
                  <button
                    onClick={() => navigate('/bugs/BUG-1039')}
                    className="px-2.5 py-1 bg-dark-800 hover:bg-dark-700 text-slate-200 hover:text-white rounded text-[11px] font-semibold flex items-center gap-1 ml-auto border border-dark-700 transition-colors"
                  >
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Team Management Section */}
      <div className="glass-card rounded-2xl border border-dark-800 p-6 shadow-card-dark space-y-4">
        <div className="flex items-center justify-between border-b border-dark-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" /> Project Team
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Assigned QA engineers, developers, and project managers</p>
          </div>
          {canManage && (
            <button
              onClick={() => toast.success('Team member assignment modal opened.')}
              className="px-3.5 py-2 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-purple-400" /> Assign Team Member
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 bg-dark-950 rounded-xl border border-dark-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-xs">
                AR
              </div>
              <div>
                <span className="font-bold text-white text-xs block">Alex Rivera</span>
                <span className="text-[10px] text-slate-400 block">Project Manager</span>
              </div>
            </div>
            {canManage && (
              <button
                onClick={() => toast.success('Team member removed from project.')}
                className="text-[10px] text-slate-500 hover:text-red-400 font-semibold"
              >
                Remove
              </button>
            )}
          </div>

          <div className="p-3.5 bg-dark-950 rounded-xl border border-dark-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs">
                SC
              </div>
              <div>
                <span className="font-bold text-white text-xs block">Sarah Connor</span>
                <span className="text-[10px] text-slate-400 block">QA Lead</span>
              </div>
            </div>
            {canManage && (
              <button
                onClick={() => toast.success('Team member removed from project.')}
                className="text-[10px] text-slate-500 hover:text-red-400 font-semibold"
              >
                Remove
              </button>
            )}
          </div>

          <div className="p-3.5 bg-dark-950 rounded-xl border border-dark-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                JD
              </div>
              <div>
                <span className="font-bold text-white text-xs block">John Doe</span>
                <span className="text-[10px] text-slate-400 block">Tester</span>
              </div>
            </div>
            {canManage && (
              <button
                onClick={() => toast.success('Team member removed from project.')}
                className="text-[10px] text-slate-500 hover:text-red-400 font-semibold"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Module Add/Edit Modal */}
      <ModuleModal
        isOpen={isModuleModalOpen}
        onClose={() => setIsModuleModalOpen(false)}
        onSubmit={handleSaveModule}
        moduleData={editingModule}
        isSubmitting={isModuleSubmitting}
      />

      {/* Module Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={!!deletingModule}
        onClose={() => setDeletingModule(null)}
        onConfirm={handleDeleteModule}
        title={`Delete module '${deletingModule?.name}'?`}
        message="Are you sure you want to delete this module? This action cannot be undone."
        isDeleting={isModuleDeleting}
      />
    </div>
  );
};

export default ProjectDetails;
