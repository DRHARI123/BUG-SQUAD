import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderGit2,
  Calendar,
  User,
  Bug,
  FileCheck,
  Eye,
  Edit2,
  Trash2,
  Building2,
  Activity
} from 'lucide-react';

const ProjectCard = ({ project, canManage, onEdit, onDelete }) => {
  const navigate = useNavigate();

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
      case 'Archived':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const formattedStartDate = project.startDate
    ? new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card p-5 rounded-2xl border border-dark-800 hover:border-red-500/30 transition-all group flex flex-col justify-between shadow-card-dark relative overflow-hidden"
    >
      {/* Top Accent Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 opacity-80 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Header: Icon, Title, Status & Actions */}
        <div className="flex items-start justify-between gap-3 mb-3 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  {project.projectCode}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(project.status)}`}>
                  {project.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1 group-hover:text-red-400 transition-colors line-clamp-1">
                {project.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {project.description || 'No description provided for this project.'}
        </p>

        {/* Client & Manager Information */}
        <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 bg-dark-900/60 rounded-xl border border-dark-800 mb-4">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="truncate text-[11px]">{project.client || 'Internal QA'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate text-[11px]">
              {project.projectManager?.name || 'Unassigned'}
            </span>
          </div>
        </div>

        {/* Bug & Test Case Statistics */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-dark-900/40 border border-dark-800">
            <Bug className="w-4 h-4 text-purple-400" />
            <div>
              <span className="block text-xs font-bold text-white">{project.bugCount || 0}</span>
              <span className="block text-[10px] text-slate-500 uppercase">Total Bugs</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-dark-900/40 border border-dark-800">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="block text-xs font-bold text-white">{project.testCaseCount || 0}</span>
              <span className="block text-[10px] text-slate-500 uppercase">Test Cases</span>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1">
            <span>QA Progress</span>
            <span className="text-emerald-400">
              {project.status === 'Completed' ? '100%' : project.status === 'Active' ? '68%' : '25%'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-dark-950 rounded-full overflow-hidden border border-dark-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                project.status === 'Completed'
                  ? 'bg-purple-500'
                  : project.status === 'Active'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : 'bg-blue-500'
              }`}
              style={{
                width: project.status === 'Completed' ? '100%' : project.status === 'Active' ? '68%' : '25%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions & Date */}
      <div className="pt-3 border-t border-dark-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" /> {formattedStartDate}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/projects/${project._id}`)}
            className="p-1.5 text-slate-300 hover:text-white bg-dark-800 hover:bg-dark-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-dark-700"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" /> View
          </button>

          {canManage && (
            <>
              <button
                onClick={() => onEdit(project)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                title="Edit Project"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
              </button>
              <button
                onClick={() => onDelete(project)}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-dark-800 rounded-lg transition-colors"
                title="Delete Project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
