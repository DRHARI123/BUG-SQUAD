import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import projectService from '../services/projectService';
import moduleService from '../services/moduleService';
import scenarioService from '../services/scenarioService';
import userService from '../services/userService';
import testCaseService from '../services/testCaseService';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FileCheck2, ArrowLeft, Plus, Trash2, Save, Loader2, AlertCircle } from 'lucide-react';

const EditTestCase = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    testCaseId: '',
    title: '',
    project: '',
    module: '',
    scenario: '',
    description: '',
    preconditions: '',
    testSteps: [],
    testData: '',
    expectedResult: '',
    priority: 'P3 - Medium',
    severity: 'Major',
    status: 'Not Run',
    tester: '',
  });

  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [tcData, pData, uData] = await Promise.all([
          testCaseService.getTestCaseById(id),
          projectService.getProjects(),
          userService.getUsers(),
        ]);

        setProjects(pData);
        setUsers(uData);

        const projId = tcData.project?._id || tcData.project;
        const modId = tcData.module?._id || tcData.module;

        if (projId) {
          const mData = await moduleService.getModules(projId);
          setModules(mData);
        }
        if (projId && modId) {
          const sData = await scenarioService.getScenarios(projId, modId);
          setScenarios(sData);
        }

        setFormData({
          testCaseId: tcData.testCaseId || '',
          title: tcData.title || '',
          project: projId || '',
          module: modId || '',
          scenario: tcData.scenario?._id || tcData.scenario || '',
          description: tcData.description || '',
          preconditions: tcData.preconditions || '',
          testSteps: Array.isArray(tcData.testSteps) && tcData.testSteps.length > 0
            ? tcData.testSteps
            : [{ stepNumber: 1, action: '' }],
          testData: tcData.testData || '',
          expectedResult: tcData.expectedResult || '',
          priority: tcData.priority || 'P3 - Medium',
          severity: tcData.severity || 'Major',
          status: tcData.status || 'Not Run',
          tester: tcData.tester?._id || tcData.tester || '',
        });
      } catch (err) {
        console.error('Failed to load test case for editing:', err);
        toast.error('Unable to fetch test case for edit.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [id]);

  const handleProjectChange = async (newProjId) => {
    setFormData((prev) => ({ ...prev, project: newProjId, module: '', scenario: '' }));
    if (!newProjId) {
      setModules([]);
      setScenarios([]);
      return;
    }
    try {
      const mData = await moduleService.getModules(newProjId);
      setModules(mData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleModuleChange = async (newModId) => {
    setFormData((prev) => ({ ...prev, module: newModId, scenario: '' }));
    if (!formData.project || !newModId) {
      setScenarios([]);
      return;
    }
    try {
      const sData = await scenarioService.getScenarios(formData.project, newModId);
      setScenarios(sData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStepChange = (index, value) => {
    const updated = [...formData.testSteps];
    updated[index].action = value;
    setFormData((prev) => ({ ...prev, testSteps: updated }));
  };

  const handleAddStep = () => {
    setFormData((prev) => ({
      ...prev,
      testSteps: [...prev.testSteps, { stepNumber: prev.testSteps.length + 1, action: '' }],
    }));
  };

  const handleRemoveStep = (index) => {
    if (formData.testSteps.length <= 1) return;
    const filtered = formData.testSteps.filter((_, i) => i !== index);
    const reindexed = filtered.map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setFormData((prev) => ({ ...prev, testSteps: reindexed }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.expectedResult.trim()) newErrors.expectedResult = 'Expected Result is required';
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
      const validSteps = formData.testSteps
        .filter((s) => s.action.trim() !== '')
        .map((s, idx) => ({ stepNumber: idx + 1, action: s.action.trim() }));

      await testCaseService.updateTestCase(id, {
        ...formData,
        testSteps: validSteps,
      });

      toast.success(`Test case ${formData.testCaseId || id} updated successfully.`);
      navigate(`/test-cases/${id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to update test case.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-3" />
        <p className="text-sm font-medium">Loading test case parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <button
        onClick={() => navigate(`/test-cases/${id}`)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel & Back to Test Case Details
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 mb-1 inline-block">
              {formData.testCaseId || id}
            </span>
            <h1 className="text-2xl font-extrabold text-white">Edit Test Case Specification</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Test Case ID (Immutable)
            </label>
            <input
              type="text"
              readOnly
              value={formData.testCaseId}
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

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Module
            </label>
            <select
              value={formData.module}
              onChange={(e) => handleModuleChange(e.target.value)}
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
              Scenario
            </label>
            <select
              value={formData.scenario}
              onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            >
              <option value="">Select Scenario...</option>
              {scenarios.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Test Case Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className={`w-full px-3 py-2 bg-dark-950 border rounded-lg text-sm text-slate-100 ${
              errors.title ? 'border-red-500' : 'border-dark-700'
            }`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Preconditions
          </label>
          <textarea
            rows={2}
            value={formData.preconditions}
            onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
            className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100"
          />
        </div>

        {/* Test Steps */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Test Steps
            </label>
            <button
              type="button"
              onClick={handleAddStep}
              className="px-3 py-1 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-lg text-xs font-bold border border-dark-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Step
            </button>
          </div>

          <div className="space-y-2">
            {formData.testSteps.map((stepItem, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-dark-950 rounded-xl border border-dark-800">
                <span className="w-7 h-7 rounded-lg bg-dark-900 border border-dark-700 flex items-center justify-center font-bold text-xs text-red-400 shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={stepItem.action}
                  onChange={(e) => handleStepChange(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-dark-900 border border-dark-800 rounded-lg text-xs text-slate-100 font-mono"
                />
                {formData.testSteps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(idx)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Expected Result <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={3}
            value={formData.expectedResult}
            onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
            className={`w-full px-3 py-2 bg-dark-950 border rounded-lg text-sm text-slate-100 ${
              errors.expectedResult ? 'border-red-500' : 'border-dark-700'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 cursor-pointer"
            >
              <option value="Not Run">Not Run</option>
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
              <option value="Blocked">Blocked</option>
              <option value="Retest">Retest</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Assigned Tester
            </label>
            <select
              value={formData.tester}
              onChange={(e) => setFormData({ ...formData, tester: e.target.value })}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 cursor-pointer"
            >
              <option value="">Select Tester...</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-dark-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/test-cases/${id}`)}
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
                <Save className="w-4 h-4" /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTestCase;
