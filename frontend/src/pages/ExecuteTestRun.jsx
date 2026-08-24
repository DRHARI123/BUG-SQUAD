import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import testRunService from '../services/testRunService';
import bugService from '../services/bugService';
import { PlayCircle, ArrowLeft, ArrowRight, CheckCircle, XCircle, AlertTriangle, Bug, Save, FastForward } from 'lucide-react';
import toast from 'react-hot-toast';

const ExecuteTestRun = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [testRun, setTestRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [execState, setExecState] = useState({
    actualResult: '',
    executionNotes: '',
    result: 'Passed',
  });

  const [bugCreatedId, setBugCreatedId] = useState(null);
  const [isCreatingBug, setIsCreatingBug] = useState(false);

  useEffect(() => {
    fetchRunDetails();
  }, [id]);

  const fetchRunDetails = async () => {
    setLoading(true);
    try {
      const data = await testRunService.getTestRunById(id);
      setTestRun(data);
      if (data.testCases && data.testCases.length > 0) {
        setExecState({
          actualResult: data.testCases[0].actualResult || '',
          executionNotes: data.testCases[0].executionNotes || '',
          result: data.testCases[0].result === 'Not Run' ? 'Passed' : data.testCases[0].result,
        });
      }
    } catch (err) {
      toast.error('Failed to load execution bench data.');
    } finally {
      setLoading(false);
    }
  };

  const currentItem = testRun?.testCases?.[currentIndex];
  const tc = currentItem?.testCase || currentItem;

  const handleRecordExecution = async (verdict) => {
    if (!tc) return;

    try {
      await testRunService.executeTestCase(id, {
        testCaseId: tc._id || tc,
        result: verdict,
        actualResult: execState.actualResult,
        executionNotes: execState.executionNotes,
        linkedBugId: bugCreatedId,
      });

      toast.success(`Test case marked ${verdict}!`);

      // Update local state
      const updatedRun = { ...testRun };
      if (updatedRun.testCases[currentIndex]) {
        updatedRun.testCases[currentIndex].result = verdict;
        updatedRun.testCases[currentIndex].actualResult = execState.actualResult;
        updatedRun.testCases[currentIndex].executionNotes = execState.executionNotes;
      }
      setTestRun(updatedRun);

      // Auto advance to next case if present
      if (currentIndex < (testRun.testCases.length - 1)) {
        handleNavigateCase(currentIndex + 1);
      }
    } catch (err) {
      toast.error('Failed to record execution outcome.');
    }
  };

  const handleNavigateCase = (index) => {
    if (index < 0 || index >= testRun.testCases.length) return;
    setCurrentIndex(index);
    setBugCreatedId(null);
    const nextItem = testRun.testCases[index];
    setExecState({
      actualResult: nextItem.actualResult || '',
      executionNotes: nextItem.executionNotes || '',
      result: nextItem.result === 'Not Run' ? 'Passed' : nextItem.result,
    });
  };

  const handleAutoCreateBug = async () => {
    if (!tc) return;
    setIsCreatingBug(true);
    try {
      const bugData = {
        title: `[TEST RUN FAIL]: ${tc.title || 'Failed Test Execution'}`,
        description: `Defect auto-reported from Test Run '${testRun.name}' (${testRun.testRunId}).`,
        project: testRun.project?._id || testRun.project,
        testCase: tc._id,
        environment: testRun.environment || 'QA',
        browser: testRun.browser || 'Chrome',
        severity: tc.severity || 'Major',
        priority: tc.priority || 'P2 - High',
        preconditions: tc.preconditions || '',
        stepsToReproduce: Array.isArray(tc.testSteps) ? tc.testSteps.map((s) => `${s.stepNumber}. ${s.action} -> ${s.expectedResult}`).join('\n') : '',
        expectedResult: tc.expectedResult || '',
        actualResult: execState.actualResult || 'Observed execution discrepancy during test run.',
      };

      const created = await bugService.createBug(bugData);
      const newBugId = created.bugId || created._id;
      setBugCreatedId(created._id);
      toast.success(`Defect ${newBugId} logged and linked automatically!`);
    } catch (err) {
      toast.error('Failed to auto-create bug ticket.');
    } finally {
      setIsCreatingBug(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!testRun || !testRun.testCases || testRun.testCases.length === 0) {
    return (
      <div className="glass-card p-12 text-center rounded-2xl border border-dark-800 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">No Test Cases to Execute</h3>
        <button onClick={() => navigate('/test-runs')} className="text-xs text-red-400 font-semibold underline">
          Return to Test Runs
        </button>
      </div>
    );
  }

  const totalCases = testRun.testCases.length;
  const passedCases = testRun.testCases.filter((c) => c.result === 'Passed').length;
  const failedCases = testRun.testCases.filter((c) => c.result === 'Failed').length;
  const blockedCases = testRun.testCases.filter((c) => c.result === 'Blocked').length;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/test-runs')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Execution Bench
        </button>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-emerald-400 font-bold">{passedCases} Passed</span>
          <span className="text-slate-600">|</span>
          <span className="text-red-400 font-bold">{failedCases} Failed</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 font-bold">{blockedCases} Blocked</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-bold">{totalCases} Total</span>
        </div>
      </div>

      {/* Bench Card Header */}
      <div className="glass-card p-4 rounded-xl border border-dark-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 font-mono text-[10px] font-bold rounded-md border border-red-500/20">
              {testRun.testRunId}
            </span>
            <h2 className="text-base font-bold text-white">{testRun.name}</h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Case {currentIndex + 1} of {totalCases} • Env: {testRun.environment} ({testRun.browser})
          </p>
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center gap-2">
          <button
            disabled={currentIndex === 0}
            onClick={() => handleNavigateCase(currentIndex - 1)}
            className="p-2 bg-dark-800 hover:bg-dark-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-slate-400">
            {currentIndex + 1}/{totalCases}
          </span>
          <button
            disabled={currentIndex === totalCases - 1}
            onClick={() => handleNavigateCase(currentIndex + 1)}
            className="p-2 bg-dark-800 hover:bg-dark-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Test Case Execution Card */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-1 bg-dark-800 text-red-400 font-mono text-xs font-bold rounded-md border border-dark-700">
              {tc.testCaseId || `TC-000${currentIndex + 1}`}
            </span>
            <h2 className="text-lg font-bold text-white">{tc.title || 'Test Step Verification'}</h2>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              currentItem?.result === 'Passed'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : currentItem?.result === 'Failed'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-dark-800 text-slate-400 border-dark-700'
            }`}
          >
            {currentItem?.result || 'Not Run'}
          </span>
        </div>

        {/* Preconditions & Steps */}
        {tc.preconditions && (
          <div className="p-3 bg-dark-900/60 rounded-xl border border-dark-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Preconditions:</span>
            <p className="text-xs text-slate-300">{tc.preconditions}</p>
          </div>
        )}

        {/* Steps Specification Table */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Test Steps & Expected Outcomes:</span>
          {(!tc.testSteps || tc.testSteps.length === 0) ? (
            <p className="text-xs text-slate-400 bg-dark-900 p-3 rounded-xl">No explicit steps specified.</p>
          ) : (
            <div className="space-y-2">
              {tc.testSteps.map((step, idx) => (
                <div key={idx} className="p-3 bg-dark-900 rounded-xl border border-dark-800 flex items-start gap-3 text-xs">
                  <span className="w-5 h-5 rounded-full bg-red-500/10 text-red-400 font-mono font-bold flex items-center justify-center shrink-0">
                    {step.stepNumber || idx + 1}
                  </span>
                  <div className="flex-1 space-y-1">
                    <p className="text-white font-medium">{step.action}</p>
                    <p className="text-slate-400 text-[11px]">
                      <span className="text-slate-500 font-semibold">Expected:</span> {step.expectedResult}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tester Form Input */}
        <div className="space-y-4 pt-4 border-t border-dark-800">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Actual Result Observed
            </label>
            <textarea
              rows={2}
              placeholder="Record exact browser output or execution observations..."
              value={execState.actualResult}
              onChange={(e) => setExecState({ ...execState, actualResult: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Execution Notes
            </label>
            <input
              type="text"
              placeholder="Additional logs or environment notes..."
              value={execState.executionNotes}
              onChange={(e) => setExecState({ ...execState, executionNotes: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Execution Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-dark-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRecordExecution('Passed')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" /> Mark Passed
            </button>

            <button
              onClick={() => handleRecordExecution('Failed')}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm"
            >
              <XCircle className="w-4 h-4" /> Mark Failed
            </button>

            <button
              onClick={() => handleRecordExecution('Blocked')}
              className="px-3.5 py-2.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" /> Blocked
            </button>

            <button
              onClick={() => handleRecordExecution('Skipped')}
              className="px-3.5 py-2.5 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2"
            >
              <FastForward className="w-4 h-4" /> Skip
            </button>
          </div>

          {/* Auto-Create Defect CTA */}
          <button
            onClick={handleAutoCreateBug}
            disabled={isCreatingBug || !!bugCreatedId}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-glow-orange"
          >
            <Bug className="w-4 h-4" /> {bugCreatedId ? 'Bug Ticket Logged' : 'Create Bug Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecuteTestRun;
