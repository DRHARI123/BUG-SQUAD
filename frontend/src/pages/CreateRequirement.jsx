import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import requirementService from '../services/requirementService';
import projectService from '../services/projectService';
import { FileCheck, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateRequirement = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    type: 'Functional',
    priority: 'P3 - Medium',
    status: 'Draft',
    acceptanceCriteria: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const projRes = await projectService.getProjects();
      const projList = projRes.projects || projRes || [];
      setProjects(projList);
      if (projList.length > 0) setFormData((prev) => ({ ...prev, project: projList[0]._id }));
    } catch (err) {
      toast.error('Failed to load project list.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.project) {
      toast.error('Please fill in required fields.');
      return;
    }

    setLoading(true);
    try {
      await requirementService.createRequirement(formData);
      toast.success('Requirement created successfully!');
      navigate('/requirements');
    } catch (err) {
      toast.error('Failed to create requirement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/requirements')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Requirements
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-red-500" /> Create Requirement Specification
        </h1>
        <p className="text-xs text-slate-400 mt-1">Define acceptance criteria and functional specifications.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-dark-800 space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Requirement Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Real-Time Stripe Payment Webhook Validation"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Project *
            </label>
            <select
              required
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.projectCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="Functional">Functional</option>
              <option value="Non-Functional">Non-Functional</option>
              <option value="Business">Business</option>
              <option value="Technical">Technical</option>
              <option value="Security">Security</option>
              <option value="Performance">Performance</option>
              <option value="Usability">Usability</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="P1 - Highest">P1 - Highest</option>
              <option value="P2 - High">P2 - High</option>
              <option value="P3 - Medium">P3 - Medium</option>
              <option value="P4 - Low">P4 - Low</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Detailed requirement scope and technical context..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Acceptance Criteria
          </label>
          <textarea
            rows={3}
            placeholder="Given/When/Then conditions or explicit pass criteria..."
            value={formData.acceptanceCriteria}
            onChange={(e) => setFormData({ ...formData, acceptanceCriteria: e.target.value })}
            className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500 font-mono text-[11px]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-800">
          <button
            type="button"
            onClick={() => navigate('/requirements')}
            className="px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Requirement'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequirement;
