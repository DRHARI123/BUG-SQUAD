import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import testRunService from '../services/testRunService';
import projectService from '../services/projectService';
import testCaseService from '../services/testCaseService';
import { PlayCircle, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateTestRun = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [selectedCases, setSelectedCases] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    project: '',
    version: 'v1.0.0',
    environment: 'QA Staging',
    browser: 'Chrome 125',
    device: 'Desktop',
    buildVersion: 'b1.4.0',
    status: 'Not Started',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [projRes, tcRes] = await Promise.all([
        projectService.getProjects(),
        testCaseService.getTestCases(),
      ]);
      const projList = projRes.projects || projRes || [];
      const tcList = tcRes.testCases || tcRes || [];
      setProjects(projList);
      setTestCases(tcList);
      if (projList.length > 0) setFormData((prev) => ({ ...prev, project: projList[0]._id }));
    } catch (err) {
      toast.error('Failed to load initial form data.');
    }
  };

  const toggleCase = (tcId) => {
    if (selectedCases.includes(tcId)) {
      setSelectedCases(selectedCases.filter((id) => id !== tcId));
    } else {
      setSelectedCases([...selectedCases, tcId]);
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
      const newRun = await testRunService.createTestRun({
        ...formData,
        testCases: selectedCases,
      });
      toast.success('Test Run initialized!');
      navigate(`/test-runs/${newRun._id || newRun.testRunId}/execute`);
    } catch (err) {
      toast.error('Failed to create test run.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/test-runs')}
        className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Test Runs
      </button>

      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <PlayCircle className="w-6 h-6 text-red-500" /> Initialize Test Run
        </h1>
        <p className="text-xs text-slate-400 mt-1">Setup test run environment, browser specs, and test cases.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-dark-800 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Test Run Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Release v2.4 Sanity Execution Cycle"
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
              Environment
            </label>
            <input
              type="text"
              value={formData.environment}
              onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Browser
            </label>
            <input
              type="text"
              value={formData.browser}
              onChange={(e) => setFormData({ ...formData, browser: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Build Version
            </label>
            <input
              type="text"
              value={formData.buildVersion}
              onChange={(e) => setFormData({ ...formData, buildVersion: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Test Case Checklist */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Include Test Cases ({selectedCases.length} selected)
          </label>

          <div className="max-h-60 overflow-y-auto bg-dark-900/60 p-3 rounded-xl border border-dark-800 space-y-2">
            {testCases.map((tc) => (
              <label
                key={tc._id}
                className="flex items-center gap-3 p-2.5 bg-dark-900/80 hover:bg-dark-800 rounded-lg cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedCases.includes(tc._id)}
                  onChange={() => toggleCase(tc._id)}
                  className="w-4 h-4 rounded text-red-500 focus:ring-0 bg-dark-800 border-dark-700"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-mono font-bold text-xs text-red-400 mr-2">{tc.testCaseId}</span>
                  <span className="text-xs text-white truncate font-medium">{tc.title}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-800">
          <button
            type="button"
            onClick={() => navigate('/test-runs')}
            className="px-4 py-2.5 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" /> {loading ? 'Initializing...' : 'Launch Execution Bench'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTestRun;
