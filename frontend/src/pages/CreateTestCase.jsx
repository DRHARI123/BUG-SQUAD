import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import projectService from '../services/projectService';
import moduleService from '../services/moduleService';
import scenarioService from '../services/scenarioService';
import userService from '../services/userService';
import testCaseService from '../services/testCaseService';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FileCheck2,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  ListOrdered
} from 'lucide-react';

const CreateTestCase = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    project: '',
    module: '',
    scenario: '',
    description: '',
    preconditions: '',
    testSteps: [
      { stepNumber: 1, action: '' },
      { stepNumber: 2, action: '' },
    ],
    testData: '',
    expectedResult: '',
    priority: 'P3 - Medium',
    severity: 'Major',
    tester: '',
  });

  // Options state
  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [users, setUsers] = useState([]);

  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingScenarios, setLoadingScenarios] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [pData, uData] = await Promise.all([
          projectService.getProjects(),
          userService.getUsers(),
        ]);
        setProjects(Array.isArray(pData) ? pData : (pData?.projects || []));
        setUsers(Array.isArray(uData) ? uData : (uData?.users || []));
      } catch (err) {
        console.error('Failed to load form options:', err);
      }
    };
    fetchInitialData();
  }, []);

  // When Project changes, load Project Modules
  useEffect(() => {
    const fetchModules = async () => {
      if (!formData.project) {
        setModules([]);
        setScenarios([]);
        return;
      }
      try {
        setLoadingModules(true);
        const mData = await moduleService.getModules(formData.project);
        setModules(Array.isArray(mData) ? mData : (mData?.modules || []));
      } catch (err) {
        console.error('Failed to load modules:', err);
      } finally {
        setLoadingModules(false);
      }
    };
    fetchModules();
  }, [formData.project]);

  // When Module changes, load Module Scenarios
  useEffect(() => {
    const fetchScenarios = async () => {
      if (!formData.project || !formData.module) {
        setScenarios([]);
        return;
      }
      try {
        setLoadingScenarios(true);
        const sData = await scenarioService.getScenarios(formData.project, formData.module);
        setScenarios(Array.isArray(sData) ? sData : (sData?.scenarios || []));
      } catch (err) {
        console.error('Failed to load scenarios:', err);
      } finally {
        setLoadingScenarios(false);
      }
    };
    fetchScenarios();
  }, [formData.project, formData.module]);

  // Dynamic Step Handlers
  const handleStepChange = (index, value) => {
    const updatedSteps = [...formData.testSteps];
    updatedSteps[index].action = value;
    setFormData((prev) => ({ ...prev, testSteps: updatedSteps }));
  };

  const handleAddStep = () => {
    setFormData((prev) => ({
      ...prev,
      testSteps: [
        ...prev.testSteps,
        { stepNumber: prev.testSteps.length + 1, action: '' },
      ],
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
    if (!formData.project) newErrors.project = 'Project is required';
    if (!formData.module) newErrors.module = 'Module is required';
    if (!formData.title.trim()) newErrors.title = 'Test Case Title is required';
    if (!formData.expectedResult.trim()) newErrors.expectedResult = 'Expected Result is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    if (!formData.tester) newErrors.tester = 'Tester assignment is required';

    const validSteps = formData.testSteps.filter((s) => s.action.trim() !== '');
    if (validSteps.length === 0) newErrors.testSteps = 'At least one non-empty test step is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please resolve validation errors before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      const validSteps = formData.testSteps
        .filter((s) => s.action.trim() !== '')
        .map((s, idx) => ({ stepNumber: idx + 1, action: s.action.trim() }));

      const payload = {
        ...formData,
        testSteps: validSteps,
      };

      const createdTc = await testCaseService.createTestCase(payload);
      toast.success(`Test case ${createdTc.testCaseId || 'TC'} created successfully.`);
      navigate(`/test-cases/${createdTc._id || createdTc.testCaseId}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to create test case.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Back Link */}
      <button
        onClick={() => navigate('/test-cases')}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel & Back to Test Cases
      </button>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Create Test Case Specification</h1>
            <p className="text-xs text-slate-400">
              Specify test preconditions, dynamic execution steps, expected behavior, and tester assignment
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-6">
        {/* Section 1: Basic Information */}
        <div className="space-y-4 pb-6 border-b border-dark-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-red-500" /> Basic Specification Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Project <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value, module: '', scenario: '' })}
                className={`w-full px-3 py-2 bg-dark-950 border rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer ${
                  errors.project ? 'border-red-500' : 'border-dark-700'
                }`}
              >
                <option value="">Select Project...</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.projectCode})
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
                disabled={!formData.project || loadingModules}
                value={formData.module}
                onChange={(e) => setFormData({ ...formData, module: e.target.value, scenario: '' })}
                className={`w-full px-3 py-2 bg-dark-950 border rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer disabled:opacity-50 ${
                  errors.module ? 'border-red-500' : 'border-dark-700'
                }`}
              >
                <option value="">{loadingModules ? 'Loading Modules...' : 'Select Module...'}</option>
                {modules.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {errors.module && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.module}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Test Scenario (Optional)
              </label>
              <select
                disabled={!formData.module || loadingScenarios}
                value={formData.scenario}
                onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer disabled:opacity-50"
              >
                <option value="">{loadingScenarios ? 'Loading Scenarios...' : 'Select Scenario...'}</option>
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
              placeholder="e.g. Verify OAuth2 JWT Token Expiration and Session Lock"
              className={`w-full px-3 py-2 bg-dark-950 border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.title ? 'border-red-500' : 'border-dark-700'
              }`}
            />
            {errors.title && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Objective and validation coverage of this test case..."
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Section 2: Preconditions & Test Steps */}
        <div className="space-y-4 pb-6 border-b border-dark-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-emerald-400" /> Preconditions & Dynamic Test Steps
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Preconditions
            </label>
            <textarea
              rows={2}
              value={formData.preconditions}
              onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
              placeholder="e.g. User account is active in test database and cart contains 2 items..."
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Dynamic Test Steps Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Execution Steps <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddStep}
                className="px-3 py-1 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-lg text-xs font-bold border border-dark-700 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Step
              </button>
            </div>

            {errors.testSteps && <p className="text-[11px] text-red-400 mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.testSteps}</p>}

            <div className="space-y-2">
              {formData.testSteps.map((stepItem, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-dark-950 rounded-xl border border-dark-800">
                  <span className="w-8 h-8 rounded-lg bg-dark-900 border border-dark-700 flex items-center justify-center font-bold text-xs text-red-400 shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={stepItem.action}
                    onChange={(e) => handleStepChange(idx, e.target.value)}
                    placeholder={`Step ${idx + 1} action (e.g. Open login page /login)`}
                    className="flex-1 px-3 py-1.5 bg-dark-900 border border-dark-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                  />
                  {formData.testSteps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors"
                      title="Remove Step"
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
              Test Data
            </label>
            <input
              type="text"
              value={formData.testData}
              onChange={(e) => setFormData({ ...formData, testData: e.target.value })}
              placeholder="e.g. Email: tester@bugsquad.qa, Cart Code: PROMO20"
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Expected Result <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.expectedResult}
              onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
              placeholder="Expected system state, HTTP response, or UI output..."
              className={`w-full px-3 py-2 bg-dark-950 border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.expectedResult ? 'border-red-500' : 'border-dark-700'
              }`}
            />
            {errors.expectedResult && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.expectedResult}</p>}
          </div>
        </div>

        {/* Section 3: Classification & Tester Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Priority <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
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
              className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
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
              Assigned Tester <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.tester}
              onChange={(e) => setFormData({ ...formData, tester: e.target.value })}
              className={`w-full px-3 py-2 bg-dark-950 border rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer ${
                errors.tester ? 'border-red-500' : 'border-dark-700'
              }`}
            >
              <option value="">Select Tester...</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
            {errors.tester && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.tester}</p>}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-dark-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/test-cases')}
            className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Test Case...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Test Case Specification
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTestCase;
