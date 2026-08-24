import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import testCaseService from '../services/testCaseService';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Play,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  Bug as BugIcon,
  Loader2,
  FileText,
  ListOrdered
} from 'lucide-react';

const ExecuteTestCase = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [testCase, setTestCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [result, setResult] = useState('Passed');
  const [actualResult, setActualResult] = useState('');
  const [executionNotes, setExecutionNotes] = useState('');

  useEffect(() => {
    const fetchTc = async () => {
      try {
        setLoading(true);
        const data = await testCaseService.getTestCaseById(id);
        setTestCase(data);
        setActualResult(data.actualResult || '');
      } catch (err) {
        console.error('Failed to load test case for execution:', err);
        toast.error('Unable to fetch test case for execution.');
      } finally {
        setLoading(false);
      }
    };
    fetchTc();
  }, [id]);

  const handleSubmitExecution = async (e) => {
    if (e) e.preventDefault();
    try {
      setIsSubmitting(true);
      await testCaseService.executeTestCase(id, {
        result,
        actualResult,
        executionNotes,
      });

      toast.success(`Test case ${testCase.testCaseId || id} executed successfully.`);
      navigate(`/test-cases/${id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to record execution.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBugFromFailedTest = () => {
    if (!testCase) return;

    // Convert test steps array to a formatted string
    const stepsString = Array.isArray(testCase.testSteps)
      ? testCase.testSteps.map((s, i) => `${i + 1}. ${s.action}`).join('\n')
      : '';

    const bugInitialState = {
      project: testCase.project?._id || testCase.project || '',
      module: testCase.module?._id || testCase.module || '',
      testCase: testCase._id || testCase.testCaseId || '',
      title: `Defect from ${testCase.testCaseId}: ${testCase.title}`,
      description: testCase.description || `Test case ${testCase.testCaseId} failed during execution run.`,
      preconditions: testCase.preconditions || '',
      stepsToReproduce: stepsString,
      testData: testCase.testData || '',
      expectedResult: testCase.expectedResult || '',
      actualResult: actualResult || 'Test execution failed unexpectedly.',
    };

    // Navigate to /report-bug passing state
    navigate('/bugs/new', { state: { prefilledBug: bugInitialState } });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-3" />
        <p className="text-sm font-medium">Initializing execution test bench environment...</p>
      </div>
    );
  }

  if (!testCase) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Test Case parameters unavailable.</p>
        <button onClick={() => navigate('/test-cases')} className="mt-4 px-4 py-2 bg-dark-800 text-white text-xs font-semibold rounded-lg">
          Back to Test Cases
        </button>
      </div>
    );
  }

  const projName = testCase.project?.name || testCase.projectName || 'Project';
  const modName = testCase.module?.name || testCase.moduleName || 'Module';

  return (
    <div className="space-y-6 pb-12">
      {/* Back Link */}
      <button
        onClick={() => navigate(`/test-cases/${id}`)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel & Back to Test Case Details
      </button>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red shrink-0">
            <Play className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                {testCase.testCaseId || id}
              </span>
              <span className="text-xs text-slate-400">{projName} • {modName}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">{testCase.title}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Execution Controls Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmitExecution} className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-dark-800">
              <Play className="w-5 h-5 text-red-500" /> Record Execution Result
            </h2>

            {/* Execution Result Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Execution Verdict <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setResult('Passed')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    result === 'Passed'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-glow-green font-bold'
                      : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-xs">PASSED</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResult('Failed')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    result === 'Failed'
                      ? 'bg-red-500/20 border-red-500 text-red-400 shadow-glow-red font-bold'
                      : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                  <span className="text-xs">FAILED</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResult('Blocked')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    result === 'Blocked'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                      : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <AlertOctagon className="w-5 h-5" />
                  <span className="text-xs">BLOCKED</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResult('Not Run')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    result === 'Not Run'
                      ? 'bg-slate-500/20 border-slate-500 text-slate-300 font-bold'
                      : 'bg-dark-950 border-dark-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-5 h-5" />
                  <span className="text-xs">NOT RUN</span>
                </button>
              </div>
            </div>

            {/* Create Bug CTA Button (if result === 'Failed') */}
            {result === 'Failed' && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <BugIcon className="w-4 h-4" /> Test Case Failed
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    File a defect ticket linked bi-directionally to this failed test case
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateBugFromFailedTest}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-lg text-xs font-bold shadow-glow-red flex items-center gap-1.5 shrink-0"
                >
                  <BugIcon className="w-3.5 h-3.5" /> Create Bug from Failed Test
                </button>
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Actual Result Observed
              </label>
              <textarea
                rows={3}
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
                placeholder="Log actual system behavior, console errors, or unexpected response code..."
                className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Execution Notes & Tester Remarks
              </label>
              <textarea
                rows={3}
                value={executionNotes}
                onChange={(e) => setExecutionNotes(e.target.value)}
                placeholder="Add browser details, environment parameters, or execution comments..."
                className="w-full px-3 py-2 bg-dark-950 border border-dark-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
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
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Recording Execution...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Save Execution Record
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Test Case Specification Reference Card (1 col) */}
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark space-y-4 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] pb-2 border-b border-dark-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-red-500" /> Reference Specifications
            </h3>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Expected Result</span>
              <p className="text-xs text-slate-200 bg-dark-950 p-2.5 rounded-lg border border-dark-800 mt-1">
                {testCase.expectedResult}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Execution Steps</span>
              <div className="space-y-1.5">
                {testCase.testSteps && testCase.testSteps.length > 0 ? (
                  testCase.testSteps.map((s, idx) => (
                    <div key={idx} className="p-2 bg-dark-950 rounded-lg border border-dark-800 flex items-start gap-2">
                      <span className="font-bold text-red-400 text-[11px]">{idx + 1}.</span>
                      <span className="text-slate-300 font-mono text-[11px]">{s.action}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic">No steps defined.</p>
                )}
              </div>
            </div>

            {testCase.testData && (
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Test Data</span>
                <p className="text-xs text-slate-300 font-mono bg-dark-950 p-2 rounded-lg border border-dark-800 mt-1">
                  {testCase.testData}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecuteTestCase;
