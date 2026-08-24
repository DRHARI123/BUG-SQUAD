import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Loader2, AlertCircle } from 'lucide-react';
import projectService from '../../services/projectService';
import moduleService from '../../services/moduleService';
import toast from 'react-hot-toast';

const ScenarioModal = ({ isOpen, onClose, onSubmit, scenario = null, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project: '',
    module: '',
    preconditions: '',
    expectedBehavior: '',
  });

  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const pList = await projectService.getProjects();
        setProjects(pList);
      } catch (err) {
        console.error('Failed to load projects for scenario modal:', err);
      }
    };
    if (isOpen) fetchProjects();
  }, [isOpen]);

  useEffect(() => {
    const fetchModules = async () => {
      if (!formData.project) {
        setModules([]);
        return;
      }
      try {
        const mList = await moduleService.getModules(formData.project);
        setModules(mList);
      } catch (err) {
        console.error('Failed to load modules:', err);
      }
    };
    if (formData.project) fetchModules();
  }, [formData.project]);

  useEffect(() => {
    if (scenario) {
      setFormData({
        name: scenario.name || '',
        description: scenario.description || '',
        project: scenario.project?._id || scenario.project || '',
        module: scenario.module?._id || scenario.module || '',
        preconditions: scenario.preconditions || '',
        expectedBehavior: scenario.expectedBehavior || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        project: '',
        module: '',
        preconditions: '',
        expectedBehavior: '',
      });
    }
    setErrors({});
  }, [scenario, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Scenario name is required';
    if (!formData.project) newErrors.project = 'Project is required';
    if (!formData.module) newErrors.module = 'Module is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill required fields.');
      return;
    }
    onSubmit(formData);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-card w-full max-w-lg bg-dark-900 border border-dark-800 rounded-2xl shadow-card-dark z-10 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-dark-800 flex items-center justify-between bg-dark-850">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white">
                {scenario ? 'Edit Test Scenario' : 'Create New Test Scenario'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Project <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value, module: '' })}
                  className={`w-full px-3 py-2 bg-dark-950 border rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer ${
                    errors.project ? 'border-red-500' : 'border-dark-700'
                  }`}
                >
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.project && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.project}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Module <span className="text-red-400">*</span>
                </label>
                <select
                  disabled={!formData.project}
                  value={formData.module}
                  onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                  className={`w-full px-3 py-2 bg-dark-950 border rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer disabled:opacity-50 ${
                    errors.module ? 'border-red-500' : 'border-dark-700'
                  }`}
                >
                  <option value="">Select Module...</option>
                  {modules.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {errors.module && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.module}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Scenario Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. User Login & Session Verification"
                className={`w-full px-3 py-2 bg-dark-950 border rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.name ? 'border-red-500' : 'border-dark-700'
                }`}
              />
              {errors.name && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Business objective and scope covered by this scenario..."
                className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Expected Behavior
              </label>
              <textarea
                rows={2}
                value={formData.expectedBehavior}
                onChange={(e) => setFormData({ ...formData, expectedBehavior: e.target.value })}
                placeholder="High-level expected system output..."
                className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="pt-4 border-t border-dark-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
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
                  <span>{scenario ? 'Update Scenario' : 'Create Scenario'}</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ScenarioModal;
