import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import projectService from '../services/projectService';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectModal from '../components/projects/ProjectModal';
import DeleteConfirmModal from '../components/projects/DeleteConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FolderGit2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';

const Projects = () => {
  const { user } = useAuth();
  const location = useLocation();
  const canManage = user?.role === 'Admin' || user?.role === 'QA Manager';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalApiError, setModalApiError] = useState(null);

  // Delete Confirm Modal States
  const [deletingProject, setDeletingProject] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjects(search, statusFilter);
      const projectList = Array.isArray(data) ? data : (data?.projects || []);
      setProjects(projectList);
    } catch (err) {
      console.error('Failed to load projects:', err);
      toast.error('Unable to fetch projects.');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchProjects();
    if (location.state?.openAddModal) {
      setIsModalOpen(true);
    }
  }, [fetchProjects, location.state]);

  const handleOpenAddModal = () => {
    setEditingProject(null);
    setModalApiError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (proj) => {
    setEditingProject(proj);
    setModalApiError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalApiError(null);
  };

  const handleSaveProject = async (formData) => {
    try {
      setIsSubmitting(true);
      setModalApiError(null);
      if (editingProject) {
        await projectService.updateProject(editingProject._id, formData);
        toast.success('Project updated successfully.');
      } else {
        await projectService.createProject(formData);
        toast.success('Project created successfully.');
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unable to save project.';
      setModalApiError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;
    try {
      setIsDeleting(true);
      await projectService.deleteProject(deletingProject._id);
      toast.success('Project deleted successfully.');
      setDeletingProject(null);
      fetchProjects();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to delete project.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilter = () => {
    setSearch('');
    setStatusFilter('All');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red shrink-0">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Project Workspace</h1>
            <p className="text-xs text-slate-400">
              Manage QA projects, team allocations, and release suites
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Project
          </button>
        )}
      </div>

      {/* Filter and Search Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-dark-800 shadow-card-dark flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project, code, or client..."
              className="w-full pl-9 pr-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        {(search || statusFilter !== 'All') && (
          <button
            onClick={handleClearFilter}
            className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 self-end md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
          </button>
        )}
      </div>

      {/* Projects Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-card p-6 rounded-2xl border border-dark-800 animate-pulse h-64" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 glass-card rounded-2xl border border-dark-800">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400 mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Projects Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6">
            {search || statusFilter !== 'All'
              ? 'No projects matched your search criteria. Try clearing filters.'
              : 'There are currently no QA projects in the system.'}
          </p>

          {canManage && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-lg text-xs font-bold shadow-glow-red flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Your First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {projects.map((proj) => (
              <ProjectCard
                key={proj._id}
                project={proj}
                canManage={canManage}
                onEdit={handleOpenEditModal}
                onDelete={(p) => setDeletingProject(p)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add / Edit Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveProject}
        project={editingProject}
        isSubmitting={isSubmitting}
        apiError={modalApiError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleDeleteConfirm}
        title={`Delete '${deletingProject?.name}'?`}
        message="This will permanently delete the project and all associated modules. This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Projects;
