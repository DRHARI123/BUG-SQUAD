import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bugService from '../services/bugService';
import aiService from '../services/aiService';
import { exportBugPDF } from '../utils/pdfExport';
import StatusChangeModal from '../components/bugs/StatusChangeModal';
import AssignModal from '../components/bugs/AssignModal';
import DeleteConfirmModal from '../components/projects/DeleteConfirmModal';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Bug,
  ArrowLeft,
  Edit2,
  Trash2,
  RefreshCw,
  UserPlus,
  Printer,
  Calendar,
  User,
  Building2,
  Layers,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Paperclip,
  Image as ImageIcon,
  Loader2,
  Send,
  Trash,
  FileCheck2,
  Sparkles,
  Copy
} from 'lucide-react';

const BugDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canDelete = user?.role === 'Admin' || user?.role === 'QA Manager';

  const [bug, setBug] = useState(null);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const handleAIAnalyzeBug = async () => {
    if (!bug) return;
    setIsAnalyzing(true);
    try {
      const res = await aiService.analyzeBug({
        bugId: bug.bugId,
        title: bug.title,
        description: bug.description,
        stepsToReproduce: bug.stepsToReproduce,
        expectedResult: bug.expectedResult,
        actualResult: bug.actualResult,
        environment: bug.environment,
        severity: bug.severity,
        priority: bug.priority,
      });
      setAiAnalysis(res);
      setShowAnalysisModal(true);
    } catch (err) {
      toast.error('AI Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAIGenerateSummary = async () => {
    if (!bug) return;
    setIsSummarizing(true);
    try {
      const res = await aiService.getBugSummary({
        title: bug.title,
        description: bug.description,
        expectedResult: bug.expectedResult,
        actualResult: bug.actualResult,
        status: bug.status,
      });
      setAiSummary(res);
      setShowSummaryModal(true);
    } catch (err) {
      toast.error('AI Summary failed.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleApplyAISuggestion = async () => {
    if (!aiAnalysis || !bug) return;
    try {
      await bugService.updateBug(bug._id || bug.bugId, {
        severity: aiAnalysis.suggestedSeverity,
        priority: aiAnalysis.suggestedPriority,
      });
      toast.success('Applied AI severity & priority recommendations!');
      setShowAnalysisModal(false);
      fetchBugData();
    } catch (err) {
      toast.error('Failed to apply AI suggestion.');
    }
  };

  // Modals state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssignSubmitting, setIsAssignSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBugData = useCallback(async () => {
    try {
      setLoading(true);
      const [bugData, histData, commData] = await Promise.all([
        bugService.getBugById(id),
        bugService.getBugHistory(id),
        bugService.getComments(id),
      ]);
      setBug(bugData);
      setHistory(histData);
      setComments(commData);
    } catch (err) {
      console.error('[FETCH BUG DETAILS ERROR]:', err);
      toast.error('Unable to fetch bug details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBugData();
  }, [fetchBugData]);

  const handleStatusSubmit = async (newStatus, commentText) => {
    try {
      setIsStatusSubmitting(true);
      await bugService.changeStatus(bug._id || bug.bugId, newStatus, commentText);
      toast.success(`Status updated to ${newStatus}`);
      setIsStatusModalOpen(false);
      fetchBugData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to update status.';
      toast.error(msg);
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  const handleAssignSubmit = async (assignedToUserId) => {
    try {
      setIsAssignSubmitting(true);
      await bugService.assignBug(bug._id || bug.bugId, assignedToUserId);
      toast.success('Bug assigned successfully.');
      setIsAssignModalOpen(false);
      fetchBugData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to assign bug.';
      toast.error(msg);
    } finally {
      setIsAssignSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await bugService.deleteBug(bug._id || bug.bugId);
      toast.success(`Bug ${bug.bugId} deleted successfully.`);
      setIsDeleteModalOpen(false);
      navigate('/bugs');
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to delete bug.';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await bugService.addComment(bug._id || bug.bugId, newComment.trim());
      setNewComment('');
      toast.success('Comment posted.');
      const commData = await bugService.getComments(bug._id || bug.bugId);
      setComments(commData);
    } catch (err) {
      toast.error('Failed to post comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await bugService.deleteComment(bug._id || bug.bugId, commentId);
      toast.success('Comment deleted.');
      const commData = await bugService.getComments(bug._id || bug.bugId);
      setComments(commData);
    } catch (err) {
      toast.error('Failed to delete comment.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-3" />
        <p className="text-sm font-medium">Loading defect telemetry & lifecycle history...</p>
      </div>
    );
  }

  if (!bug) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Bug Record Not Found</h2>
        <p className="text-xs text-slate-400 mb-4">The requested bug ID does not exist in the database.</p>
        <Link
          to="/bugs"
          className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-lg text-xs font-semibold"
        >
          Back to Bug Repository
        </Link>
      </div>
    );
  }

  const projName = bug.project?.name || bug.projectName || 'Project';
  const modName = bug.module?.name || bug.moduleName || 'Module';
  const repUser = bug.reporter || { name: 'Sarah Connor', email: 'qa@bugsquad.qa', role: 'QA Manager' };
  const assignUser = bug.assignedTo || { name: 'Unassigned', email: '', role: 'Developer' };

  return (
    <div className="space-y-6 pb-12">
      {/* Back Link */}
      <button
        onClick={() => navigate('/bugs')}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Bugs Repository
      </button>

      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">
                {bug.bugId || bug._id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                {bug.severity}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-dark-950 text-slate-300 border border-dark-700">
                {bug.priority}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {bug.status}
              </span>
              {/* SLA Target Badge */}
              {(() => {
                const targetHoursMap = { Blocker: 8, Critical: 24, Major: 48, Minor: 96, Trivial: 168 };
                const targetHours = targetHoursMap[bug.severity] || 48;
                const deadline = new Date(new Date(bug.createdAt).getTime() + targetHours * 60 * 60 * 1000);
                const now = new Date();
                const remainingHours = (deadline - now) / (1000 * 60 * 60);

                if (['Fixed', 'Closed'].includes(bug.status)) {
                  return (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> SLA Met
                    </span>
                  );
                }

                if (remainingHours <= 0) {
                  return (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 font-mono flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3 text-red-500" /> Overdue {Math.abs(remainingHours).toFixed(1)}h
                    </span>
                  );
                }

                return (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> SLA Remaining {remainingHours.toFixed(1)}h
                  </span>
                );
              })()}
            </div>
            <h1 className="text-2xl font-extrabold text-white leading-snug">{bug.title}</h1>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="px-3.5 py-2 bg-dark-800 hover:bg-dark-700 text-amber-400 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Change Status
            </button>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="px-3.5 py-2 bg-dark-800 hover:bg-dark-700 text-purple-400 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" /> Assign
            </button>
            <button
              onClick={handleAIAnalyzeBug}
              disabled={isAnalyzing}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> {isAnalyzing ? 'Analyzing...' : 'AI Analyze Bug'}
            </button>
            <button
              onClick={handleAIGenerateSummary}
              disabled={isSummarizing}
              className="px-3.5 py-2 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-blue-400" /> AI Summary
            </button>
            <button
              onClick={() => navigate(`/bugs/${bug._id || bug.bugId}/edit`)}
              className="px-3.5 py-2 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={async () => {
                toast.loading('Generating Bug PDF Document...', { id: 'pdf-toast' });
                await exportBugPDF(bug);
                toast.success('Bug PDF Document Downloaded!', { id: 'pdf-toast' });
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" /> Export PDF
            </button>
            {canDelete && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2 bg-dark-800 hover:bg-red-500/20 text-red-400 rounded-xl border border-dark-700"
                title="Delete Bug"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Sidebar Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Bug className="w-4 h-4 text-red-500" /> Defect Summary & Description
            </h2>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {bug.description}
            </p>
          </div>

          {/* Reproduction Information Card */}
          <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Reproduction Steps & Results
            </h2>

            {bug.preconditions && (
              <div>
                <span className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Preconditions</span>
                <p className="text-xs text-slate-300 bg-dark-950 p-3 rounded-xl border border-dark-800">
                  {bug.preconditions}
                </p>
              </div>
            )}

            <div>
              <span className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Steps to Reproduce</span>
              <div className="text-xs text-slate-200 font-mono bg-dark-950 p-3 rounded-xl border border-dark-800 whitespace-pre-wrap leading-relaxed">
                {bug.stepsToReproduce || 'No explicit steps logged.'}
              </div>
            </div>

            {bug.testData && (
              <div>
                <span className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Test Data</span>
                <p className="text-xs text-slate-300 bg-dark-950 p-2.5 rounded-xl border border-dark-800 font-mono">
                  {bug.testData}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">Expected Result</span>
                <p className="text-xs text-slate-300 bg-dark-950 p-3 rounded-xl border border-dark-800">
                  {bug.expectedResult || 'N/A'}
                </p>
              </div>
              <div>
                <span className="block text-[11px] font-bold uppercase text-red-400 mb-1">Actual Result</span>
                <p className="text-xs text-slate-300 bg-dark-950 p-3 rounded-xl border border-dark-800">
                  {bug.actualResult || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Before & After Screenshots Section */}
          <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" /> Visual Proof & Screenshots
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BEFORE */}
              <div className="p-3 bg-dark-950 rounded-xl border border-dark-800">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">
                  BEFORE (Original Defect)
                </span>
                {bug.beforeScreenshot ? (
                  <img
                    src={bug.beforeScreenshot}
                    alt="Before Screenshot"
                    className="w-full h-44 object-cover rounded-lg border border-dark-800"
                  />
                ) : (
                  <div className="h-44 bg-dark-900 rounded-lg flex items-center justify-center text-xs text-slate-500 italic">
                    No screenshot uploaded.
                  </div>
                )}
              </div>

              {/* AFTER */}
              <div className="p-3 bg-dark-950 rounded-xl border border-dark-800">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  AFTER (Resolved State)
                </span>
                {bug.afterScreenshot ? (
                  <img
                    src={bug.afterScreenshot}
                    alt="After Screenshot"
                    className="w-full h-44 object-cover rounded-lg border border-dark-800"
                  />
                ) : (
                  <div className="h-44 bg-dark-900 rounded-lg flex items-center justify-center text-xs text-slate-500 italic">
                    No screenshot uploaded.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attachments List */}
          <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-orange-400" /> Attachments
            </h2>
            {!bug.attachments || bug.attachments.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No attachments.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bug.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-dark-950 border border-dark-800 hover:border-dark-700 transition-colors text-xs text-slate-200"
                  >
                    <span className="truncate font-medium">{att.name}</span>
                    <span className="text-[10px] text-red-400 font-semibold uppercase">View</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Comments Discussion Section */}
          <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" /> QA Discussion Thread ({comments.length})
            </h2>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="mb-6 space-y-2">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Post a comment, reproduction update, or patch note..."
                className="w-full p-3 bg-dark-950 border border-dark-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-lg text-xs font-bold shadow-glow-red flex items-center gap-1.5 ml-auto disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Post Comment
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">No comments yet. Start the discussion.</p>
              ) : (
                comments.map((comm) => (
                  <div key={comm._id} className="p-3 bg-dark-950 rounded-xl border border-dark-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{comm.userName}</span>
                        <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded border border-red-500/20">
                          {comm.userRole || 'Tester'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">
                          {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {user && (user.name === comm.userName || canDelete) && (
                          <button
                            onClick={() => handleDeleteComment(comm._id)}
                            className="text-slate-500 hover:text-red-400"
                            title="Delete Comment"
                          >
                            <Trash className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug">{comm.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info & Timeline (1 col) */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark space-y-4 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] pb-2 border-b border-dark-800">
              Bug Classification
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Project</span>
                <span className="font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-orange-400" /> {projName}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Module</span>
                <span className="font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" /> {modName}
                </span>
              </div>

              {bug.testCase && (
                <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                  <span className="text-[10px] font-bold text-red-400 uppercase block mb-1">Linked Test Case</span>
                  <Link
                    to={`/test-cases/${typeof bug.testCase === 'object' ? bug.testCase._id || bug.testCase.testCaseId : bug.testCase}`}
                    className="font-bold text-white hover:text-red-400 flex items-center gap-1.5 transition-colors font-mono"
                  >
                    <FileCheck2 className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{typeof bug.testCase === 'object' ? bug.testCase.testCaseId || bug.testCase.title : bug.testCase}</span>
                  </Link>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Environment Diagnostics</span>
                <div className="mt-1 space-y-1 text-slate-300 font-mono text-[11px] bg-dark-950 p-2.5 rounded-lg border border-dark-800">
                  <p>Env: {bug.environment}</p>
                  <p>Browser: {bug.browser}</p>
                  <p>Device: {bug.device}</p>
                  <p>OS: {bug.operatingSystem}</p>
                  <p>Ver: {bug.version}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-dark-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Reporter</span>
                <p className="font-semibold text-slate-200 mt-0.5">{repUser.name}</p>
                <p className="text-[10px] text-slate-500">{repUser.email}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Assigned Engineer</span>
                <p className="font-semibold text-slate-200 mt-0.5">{assignUser.name}</p>
                <p className="text-[10px] text-slate-500">{assignUser.email}</p>
              </div>
            </div>
          </div>

          {/* Bug Lifecycle Timeline */}
          <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" /> Bug Lifecycle Timeline
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-dark-800">
              {history.map((h, idx) => (
                <div key={h._id || idx} className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-dark-900" />
                  <p className="text-xs font-bold text-white">{h.message}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{h.userName}</span>
                    <span>•</span>
                    <span>{new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StatusChangeModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleStatusSubmit}
        currentStatus={bug.status}
        userRole={user?.role}
        isSubmitting={isStatusSubmitting}
      />

      <AssignModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onConfirm={handleAssignSubmit}
        currentAssignee={bug.assignedTo}
        isSubmitting={isAssignSubmitting}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete '${bug.bugId}'?`}
        message="Are you sure you want to delete this defect record? This action cannot be undone."
        isDeleting={isDeleting}
      />

      {/* AI Analysis Review Modal */}
      {showAnalysisModal && aiAnalysis && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-dark-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-dark-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> AI Defect Recommendation
              </h3>
              <button onClick={() => setShowAnalysisModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-dark-900 rounded-xl border border-dark-800">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Current Severity / Priority</span>
                  <p className="font-bold text-slate-300 mt-1">{bug.severity} | {bug.priority}</p>
                </div>
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">AI Suggested</span>
                  <p className="font-bold text-emerald-400 mt-1">{aiAnalysis.suggestedSeverity} | {aiAnalysis.suggestedPriority}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Possible Root Cause</span>
                <p className="p-3 bg-dark-900/60 rounded-xl text-slate-200">{aiAnalysis.possibleRootCause}</p>
              </div>

              <div className="space-y-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Recommended Action</span>
                <p className="p-3 bg-dark-900/60 rounded-xl text-slate-200">{aiAnalysis.recommendedNextAction}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-800">
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Ignore
              </button>
              <button
                onClick={handleApplyAISuggestion}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold shadow-glow-emerald"
              >
                Apply Suggestion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Bug Summary Modal */}
      {showSummaryModal && aiSummary && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-dark-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-dark-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-400" /> AI Executive Bug Summary
              </h3>
              <button onClick={() => setShowSummaryModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-dark-900 rounded-xl space-y-1">
                <span className="text-slate-500 font-bold text-[10px] uppercase">Problem</span>
                <p className="text-white font-medium">{aiSummary.problem}</p>
              </div>
              <div className="p-3 bg-dark-900 rounded-xl space-y-1">
                <span className="text-slate-500 font-bold text-[10px] uppercase">Impact</span>
                <p className="text-white font-medium">{aiSummary.impact}</p>
              </div>
              <div className="p-3 bg-dark-900 rounded-xl space-y-1">
                <span className="text-slate-500 font-bold text-[10px] uppercase">Expected vs Actual</span>
                <p className="text-white font-medium">{aiSummary.expectedVsActual}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-800">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(aiSummary, null, 2));
                  toast.success('Summary copied!');
                }}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BugDetails;
