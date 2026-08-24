import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import releaseService from '../services/releaseService';
import projectService from '../services/projectService';
import { Tag, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateRelease = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    version: 'v1.0.0',
    project: '',
    description: '',
    releaseDate: '',
    status: 'Planned',
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
    if (!formData.name || !formData.version || !formData.project) {
      toast.error('Please fill in required fields.');
      return;
    }

    setLoading(true);
    try {
      await releaseService.createRelease(formData);
      toast.success('Release created successfully!');
      navigate('/releases');
    } catch (err) {
      toast.error('Failed to create release.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/releases')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Releases
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Tag className="w-6 h-6 text-red-500" /> Create Product Release
        </h1>
        <p className="text-xs text-slate-400 mt-1">Configure target version milestone and Quality Gate parameters.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-dark-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Release Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q3 Major Platform Release"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Version Tag *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. v2.4.0"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

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
              Target Release Date
            </label>
            <input
              type="date"
              value={formData.releaseDate}
              onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Initial Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            >
              <option value="Planned">Planned</option>
              <option value="In Development">In Development</option>
              <option value="Testing">Testing</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Release Description
          </label>
          <textarea
            rows={3}
            placeholder="Release notes summary and target deployment changes..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-800">
          <button
            type="button"
            onClick={() => navigate('/releases')}
            className="px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Release'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRelease;
