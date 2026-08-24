import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import testPlanService from '../services/testPlanService';
import projectService from '../services/projectService';
import userService from '../services/userService';
import { FileText, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateTestPlan = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    project: '',
    version: 'v1.0.0',
    objective: '',
    scope: '',
    outOfScope: '',
    assumptions: '',
    risks: '',
    entryCriteria: '',
    exitCriteria: '',
    environment: 'QA Staging',
    startDate: '',
    endDate: '',
    owner: '',
    status: 'Draft',
    description: '',
  });

  useEffect(() => {
    fetchFormOptions();
  }, []);

  const fetchFormOptions = async () => {
    try {
      const [projRes, userRes] = await Promise.all([
        projectService.getProjects(),
        userService.getUsers(),
      ]);
      const projList = projRes.projects || projRes || [];
      const userList = userRes.users || userRes || [];
      setProjects(projList);
      setUsers(userList);
      if (projList.length > 0) setFormData((prev) => ({ ...prev, project: projList[0]._id }));
      if (userList.length > 0) setFormData((prev) => ({ ...prev, owner: userList[0]._id }));
    } catch (err) {
      toast.error('Failed to load initial form data.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.project) {
      toast.error('Please fill in required fields.');
      return;
    }

    setLoading(true);
    try {
      await testPlanService.createTestPlan(formData);
      toast.success('Test Plan created successfully!');
      navigate('/test-plans');
    } catch (err) {
      toast.error('Failed to create test plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/test-plans')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Test Plans
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-red-500" /> Create Test Plan
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Define scope, test environment, entry/exit criteria, and risks for the quality release.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-dark-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Test Plan Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sprint 24 E-Commerce QA Master Test Plan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              Version
            </label>
            <input
              type="text"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              QA Lead / Owner
            </label>
            <select
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            >
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Test Environment
            </label>
            <input
              type="text"
              placeholder="e.g. QA Staging, Pre-Prod, Mobile Lab"
              value={formData.environment}
              onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Objective
          </label>
          <textarea
            rows={3}
            placeholder="Key quality goals and objectives for this test cycle..."
            value={formData.objective}
            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
            className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              In-Scope Features
            </label>
            <textarea
              rows={3}
              placeholder="Modules and features to be tested..."
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Out-of-Scope Features
            </label>
            <textarea
              rows={3}
              placeholder="Excluded components or third-party APIs..."
              value={formData.outOfScope}
              onChange={(e) => setFormData({ ...formData, outOfScope: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-800">
          <button
            type="button"
            onClick={() => navigate('/test-plans')}
            className="px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Test Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTestPlan;
