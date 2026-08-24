import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import projectService from '../services/projectService';
import moduleService from '../services/moduleService';
import userService from '../services/userService';
import bugService from '../services/bugService';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Bug, ArrowLeft, Loader2, Save, AlertCircle } from 'lucide-react';

const EditBug = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    bugId: '',
    title: '',
    description: '',
    project: '',
    module: '',
    environment: 'QA',
    browser: 'Chrome',
    device: 'Desktop',
    operatingSystem: 'Windows 11',
    version: 'v1.0.0',
    severity: 'Major',
    priority: 'P3 - Medium',
    status: 'New',
    reproducibility: 'Always',
    assignedTo: '',
    preconditions: '',
    stepsToReproduce: '',
    testData: '',
    expectedResult: '',
    actualResult: '',
    beforeScreenshot: '',
    afterScreenshot: '',
  });

  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [bData, pData, uData] = await Promise.all([
          bugService.getBugById(id),
          projectService.getProjects(),
          userService.getUsers(),
        ]);

        setProjects(pData);
        setUsers(uData);

        const projId = bData.project?._id || bData.project;
        if (projId) {
          const mData = await moduleService.getModules(projId);
          setModules(mData);
        }

        setFormData({
          bugId: bData.bugId || '',
          title: bData.title || '',
          description: bData.description || '',
          project: projId || '',
          module: bData.module?._id || bData.module || '',
          environment: bData.environment || 'QA',
          browser: bData.browser || 'Chrome',
          device: bData.device || 'Desktop',
          operatingSystem: bData.operatingSystem || 'Windows 11',
          version: bData.version || 'v1.0.0',
          severity: bData.severity || 'Major',
          priority: bData.priority || 'P3 - Medium',
          status: bData.status || 'New',
          reproducibility: bData.reproducibility || 'Always',
          assignedTo: bData.assignedTo?._id || bData.assignedTo || '',
          preconditions: bData.preconditions || '',
          stepsToReproduce: bData.stepsToReproduce || '',
          testData: bData.testData || '',
          expectedResult: bData.expectedResult || '',
          actualResult: bData.actualResult || '',
          beforeScreenshot: bData.beforeScreenshot || '',
          afterScreenshot: bData.afterScreenshot || '',
        });
      } catch (err) {
        console.error('Failed to load bug for edit:', err);
        toast.error('Unable to fetch bug for editing.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [id]);

  const handleProjectChange = async (newProjId) => {
    setFormData((prev) => ({ ...prev, project: newProjId, module: '' }));
    if (!newProjId) {
      setModules([]);
      return;
    }
    try {
      const mData = await moduleService.getModules(newProjId);
      setModules(mData);
    } catch (err) {
      console.error('Failed to load modules:', err);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve validation errors.');
      return;
    }

    try {
      setIsSubmitting(true);
      await bugService.updateBug(id, formData);
      toast.success(`Bug ${formData.bugId || id} updated successfully.`);
      navigate(`/bugs/${id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to update bug.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-3" />
        <p className="text-sm font-medium">Loading defect form parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Back Link */}
      <button
        onClick={() => navigate(`/bugs/${id}`)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel & Back to Bug Details
      </button>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red shrink-0">
            <Bug className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                {formData.bugId || id}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Edit Bug Specifications</h1>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Bug ID (Immutable)
            </label>
            <input
              type="text"
              readOnly
              value={formData.bugId}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-800 rounded-lg text-sm font-mono text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Project
            </label>
            <select
              value={formData.project}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              <option value="">Select Project...</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Module
            </label>
            <select
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              <option value="">Select Module...</option>
              {modules.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Bug Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 bg-dark-950 border rounded-lg text-sm text-slate-100 ${
                errors.title ? 'border-red-500' : 'border-dark-700'
              }`}
            />
            {errors.title && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.title}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Bug Description <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={`w-full px-3 py-2 bg-dark-950 border rounded-lg text-sm text-slate-100 ${
              errors.description ? 'border-red-500' : 'border-dark-700'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Severity
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 cursor-pointer"
            >
              <option value="Blocker">Blocker</option>
              <option value="Critical">Critical</option>
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
              <option value="Trivial">Trivial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 cursor-pointer"
            >
              <option value="P1 - Highest">P1 - Highest</option>
              <option value="P2 - High">P2 - High</option>
              <option value="P3 - Medium">P3 - Medium</option>
              <option value="P4 - Low">P4 - Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 cursor-pointer"
            >
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
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Assigned To
            </label>
            <select
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 cursor-pointer"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Steps to Reproduce
          </label>
          <textarea
            rows={4}
            value={formData.stepsToReproduce}
            onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
            className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm font-mono text-slate-100"
          />
        </div>

        <div className="pt-4 border-t border-dark-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/bugs/${id}`)}
            className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-lg text-xs font-semibold shadow-glow-red flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Bug Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBug;
