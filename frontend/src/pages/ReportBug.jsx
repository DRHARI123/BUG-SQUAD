import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import projectService from '../services/projectService';
import moduleService from '../services/moduleService';
import userService from '../services/userService';
import bugService from '../services/bugService';
import aiService from '../services/aiService';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Bug,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  X,
  FileText,
  Loader2,
  Layers,
  Monitor,
  Tag,
  ListOrdered,
  Eye,
  FileCheck2,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

const ReportBug = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Duplicate Check State
  const [similarBugs, setSimilarBugs] = useState([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    project: '',
    module: '',
    testCase: '',
    title: '',
    description: '',
    environment: 'QA',
    browser: 'Chrome',
    device: 'Desktop',
    operatingSystem: 'Windows 11',
    version: 'v1.0.0',
    severity: 'Major',
    priority: 'P3 - Medium',
    reproducibility: 'Always',
    assignedTo: '',
    preconditions: '',
    stepsToReproduce: '',
    testData: '',
    expectedResult: '',
    actualResult: '',
    attachments: [],
    beforeScreenshot: '',
    afterScreenshot: '',
  });

  const handleCheckSimilarBugs = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a bug title first.');
      return;
    }
    setIsCheckingDuplicates(true);
    try {
      const res = await aiService.checkSimilarBugs({
        title: formData.title,
        description: formData.description,
        project: formData.project,
      });
      setSimilarBugs(res.similarBugs || []);
      setShowDuplicateWarning(res.isDuplicateDetected);
      if (!res.isDuplicateDetected) {
        toast.success('No potential duplicate defects found.');
      }
    } catch (err) {
      toast.error('Failed to check similar bugs.');
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  // Handle prefilled bug data from failed test execution
  useEffect(() => {
    if (location.state?.prefilledBug) {
      const p = location.state.prefilledBug;
      setFormData((prev) => ({
        ...prev,
        project: p.project || prev.project,
        module: p.module || prev.module,
        testCase: p.testCase || prev.testCase,
        title: p.title || prev.title,
        description: p.description || prev.description,
        preconditions: p.preconditions || prev.preconditions,
        stepsToReproduce: p.stepsToReproduce || prev.stepsToReproduce,
        testData: p.testData || prev.testData,
        expectedResult: p.expectedResult || prev.expectedResult,
        actualResult: p.actualResult || prev.actualResult,
      }));
      toast.success('Bug form pre-populated from failed Test Case execution!');
    }
  }, [location.state]);

  // Dynamic Options
  const [projects, setProjects] = useState([]);
  const [modules, setModules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
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
        console.error('Failed to load initial data for bug report:', err);
      }
    };
    fetchInitialData();
  }, []);

  // When selected project changes, fetch modules belonging to that project
  useEffect(() => {
    const fetchModulesForProject = async () => {
      if (!formData.project) {
        setModules([]);
        return;
      }
      try {
        setLoadingModules(true);
        const mData = await moduleService.getModules(formData.project);
        setModules(Array.isArray(mData) ? mData : (mData?.modules || []));
      } catch (err) {
        console.error('Failed to load modules for project:', err);
      } finally {
        setLoadingModules(false);
      }
    };
    fetchModulesForProject();
  }, [formData.project]);

  // Per-step validation
  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!formData.project) newErrors.project = 'Project is required';
      if (!formData.module) newErrors.module = 'Module is required';
      if (!formData.title.trim()) newErrors.title = 'Bug Title is required';
      if (!formData.description.trim()) newErrors.description = 'Bug Description is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(6, prev + 1));
    } else {
      toast.error('Please resolve validation errors before moving to the next step.');
    }
  };

  const handlePrevious = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      fileType: f.type.includes('image') ? 'image' : 'document',
    }));
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments],
    }));
  };

  const handleRemoveAttachment = (idx) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep(1)) {
      setStep(1);
      toast.error('Please resolve required fields in Step 1.');
      return;
    }

    try {
      setIsSubmitting(true);
      const createdBug = await bugService.createBug(formData);
      toast.success(`Bug ${createdBug.bugId || 'BUG'} created successfully.`);
      navigate(`/bugs/${createdBug._id || createdBug.bugId}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to submit bug.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Basic Information', icon: Layers },
    { num: 2, title: 'Environment', icon: Monitor },
    { num: 3, title: 'Classification', icon: Tag },
    { num: 4, title: 'Reproduction Details', icon: ListOrdered },
    { num: 5, title: 'Attachments & Screenshots', icon: UploadCloud },
    { num: 6, title: 'Review & Submit', icon: Eye },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red shrink-0">
            <Bug className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Report New Bug</h1>
            <p className="text-xs text-slate-400">
              Submit a detailed QA defect ticket with steps to reproduce and environment diagnostics
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/bugs')}
          className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl text-xs font-semibold border border-dark-700 transition-colors shrink-0"
        >
          Cancel & Exit
        </button>
      </div>

      {/* Responsive Stepper Header */}
      <div className="glass-card p-4 rounded-2xl border border-dark-800 shadow-card-dark overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px]">
          {stepsList.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;

            return (
              <React.Fragment key={s.num}>
                <div
                  onClick={() => s.num < step && setStep(s.num)}
                  className={`flex items-center gap-2 cursor-pointer ${
                    isCurrent
                      ? 'text-white'
                      : isCompleted
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-tr from-red-600 to-orange-500 text-white border-red-400 shadow-glow-red'
                        : isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-dark-950 border-dark-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Step {s.num}
                    </span>
                    <span className="text-xs font-bold leading-tight truncate">{s.title}</span>
                  </div>
                </div>
                {idx < stepsList.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-3 rounded ${isCompleted ? 'bg-emerald-500/40' : 'bg-dark-800'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Step Body */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark">
        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h2 className="text-base font-bold text-white mb-4 pb-2 border-b border-dark-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-red-500" /> Step 1: Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Target Project <span className="text-red-400">*</span>
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
                      {p.name} ({p.projectCode})
                    </option>
                  ))}
                </select>
                {errors.project && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.project}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Target Module <span className="text-red-400">*</span>
                </label>
                <select
                  disabled={!formData.project || loadingModules}
                  value={formData.module}
                  onChange={(e) => setFormData({ ...formData, module: e.target.value })}
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Bug Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Authentication token expiration causes infinite loop redirect"
                className={`w-full px-3 py-2 bg-dark-950 border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.title ? 'border-red-500' : 'border-dark-700'
                }`}
              />
              {errors.title && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Bug Description <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide a clear, detailed summary of the issue encountered..."
                className={`w-full px-3 py-2 bg-dark-950 border rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.description ? 'border-red-500' : 'border-dark-700'
                }`}
              />
              {errors.description && <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{errors.description}</p>}
            </div>
          </motion.div>
        )}

        {/* STEP 2: Environment */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h2 className="text-base font-bold text-white mb-4 pb-2 border-b border-dark-800 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-orange-400" /> Step 2: Environment Diagnostics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Environment
                </label>
                <select
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                >
                  <option value="Development">Development</option>
                  <option value="QA">QA</option>
                  <option value="Staging">Staging</option>
                  <option value="Production">Production</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Browser
                </label>
                <input
                  type="text"
                  value={formData.browser}
                  onChange={(e) => setFormData({ ...formData, browser: e.target.value })}
                  placeholder="e.g. Chrome 125, Firefox 126, Safari Mobile"
                  className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Device Type
                </label>
                <input
                  type="text"
                  value={formData.device}
                  onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                  placeholder="e.g. Desktop, iPhone 15 Pro, Pixel 8"
                  className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Operating System
                </label>
                <input
                  type="text"
                  value={formData.operatingSystem}
                  onChange={(e) => setFormData({ ...formData, operatingSystem: e.target.value })}
                  placeholder="e.g. Windows 11, macOS Sonoma, iOS 17"
                  className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  App / API Version
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="e.g. v1.4.2"
                  className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Classification */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h2 className="text-base font-bold text-white mb-4 pb-2 border-b border-dark-800 flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-400" /> Step 3: Classification & Assignment
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Severity Rating
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
                  Priority Level
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Reproducibility Frequency
                </label>
                <select
                  value={formData.reproducibility}
                  onChange={(e) => setFormData({ ...formData, reproducibility: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                >
                  <option value="Always">Always</option>
                  <option value="Sometimes">Sometimes</option>
                  <option value="Rarely">Rarely</option>
                  <option value="Not Reproducible">Not Reproducible</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Assign To Developer / QA Engineer (Optional)
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
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
          </motion.div>
        )}

        {/* STEP 4: Reproduction Details */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h2 className="text-base font-bold text-white mb-4 pb-2 border-b border-dark-800 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-emerald-400" /> Step 4: Reproduction Steps & Test Data
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Preconditions
              </label>
              <textarea
                rows={2}
                value={formData.preconditions}
                onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
                placeholder="User logged in, database populated with test records..."
                className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Steps to Reproduce (Numbered List)
              </label>
              <textarea
                rows={4}
                value={formData.stepsToReproduce}
                onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
                placeholder="1. Open portal homepage&#10;2. Click on Login button&#10;3. Enter credentials and click submit..."
                className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Test Data Used
              </label>
              <input
                type="text"
                value={formData.testData}
                onChange={(e) => setFormData({ ...formData, testData: e.target.value })}
                placeholder="User: qa_test@bugsquad.com, Order ID: #99401"
                className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Expected Result
                </label>
                <textarea
                  rows={3}
                  value={formData.expectedResult}
                  onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                  placeholder="Expected system behavior..."
                  className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Actual Result
                </label>
                <textarea
                  rows={3}
                  value={formData.actualResult}
                  onChange={(e) => setFormData({ ...formData, actualResult: e.target.value })}
                  placeholder="Actual error or defect behavior observed..."
                  className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 5: Attachments & Screenshots */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h2 className="text-base font-bold text-white mb-4 pb-2 border-b border-dark-800 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" /> Step 5: Screenshots & File Attachments
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Before Screenshot URL / Image String
                </label>
                <input
                  type="text"
                  value={formData.beforeScreenshot}
                  onChange={(e) => setFormData({ ...formData, beforeScreenshot: e.target.value })}
                  placeholder="https://example.com/screenshot_before.png"
                  className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  After Screenshot URL / Fixed Image (Optional)
                </label>
                <input
                  type="text"
                  value={formData.afterScreenshot}
                  onChange={(e) => setFormData({ ...formData, afterScreenshot: e.target.value })}
                  placeholder="https://example.com/screenshot_after.png"
                  className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Drag and Drop File Upload Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Upload Attachments (Logs, HAR files, PDFs, Screenshots)
              </label>
              <div className="p-6 bg-dark-950 border-2 border-dashed border-dark-700 hover:border-red-500/50 rounded-2xl text-center transition-colors">
                <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-300 font-semibold mb-1">
                  Click to select files to attach to this bug report
                </p>
                <p className="text-[11px] text-slate-500 mb-3">PNG, JPG, PDF, TXT, LOG files supported</p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="bug-attachment-input"
                />
                <label
                  htmlFor="bug-attachment-input"
                  className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-lg text-xs font-bold border border-dark-700 cursor-pointer inline-block"
                >
                  Browse Files
                </label>
              </div>

              {formData.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <span className="text-xs font-semibold text-slate-400">Attached Files:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {formData.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-dark-900 border border-dark-800 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-red-400 shrink-0" />
                          <span className="truncate text-slate-200">{att.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 6: Review */}
        {step === 6 && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-dark-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-400" /> Step 6: Review & Final Submission
              </h2>
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 font-semibold">
                Please verify details before submitting
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 p-4 bg-dark-950 rounded-xl border border-dark-800">
                <p><span className="text-slate-500 font-bold uppercase block text-[10px]">Title:</span> <span className="font-semibold text-white">{formData.title}</span></p>
                <p><span className="text-slate-500 font-bold uppercase block text-[10px]">Description:</span> <span className="text-slate-300">{formData.description}</span></p>
                <p><span className="text-slate-500 font-bold uppercase block text-[10px]">Severity & Priority:</span> <span className="font-semibold text-red-400">{formData.severity}</span> / <span className="text-slate-300">{formData.priority}</span></p>
              </div>

              <div className="space-y-2 p-4 bg-dark-950 rounded-xl border border-dark-800">
                <p><span className="text-slate-500 font-bold uppercase block text-[10px]">Environment:</span> <span className="text-slate-200">{formData.environment} ({formData.browser}, {formData.operatingSystem})</span></p>
                <p><span className="text-slate-500 font-bold uppercase block text-[10px]">Reproducibility:</span> <span className="text-slate-300">{formData.reproducibility}</span></p>
                <p><span className="text-slate-500 font-bold uppercase block text-[10px]">Steps to Reproduce:</span> <span className="text-slate-300 font-mono text-[11px]">{formData.stepsToReproduce || 'None specified'}</span></p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stepper Footer Controls */}
        <div className="pt-6 mt-6 border-t border-dark-800 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1 || isSubmitting}
            onClick={handlePrevious}
            className="px-4 py-2 bg-dark-800 hover:bg-dark-700 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-bold border border-dark-700 flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <div className="flex items-center gap-3">
            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-1.5 transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting Bug...
                  </>
                ) : (
                  <span>Submit Bug Report</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBug;
