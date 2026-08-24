import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import testCaseService from '../services/testCaseService';
import DeleteConfirmModal from '../components/projects/DeleteConfirmModal';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FileCheck2,
  ArrowLeft,
  Edit2,
  Trash2,
  Play,
  Copy,
  Clock,
  Bug as BugIcon,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Layers,
  User,
  ListOrdered,
  Loader2
} from 'lucide-react';

const TestCaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canDelete = user?.role === 'Admin' || user?.role === 'QA Manager';

  const [testCase, setTestCase] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [tcData, execData] = await Promise.all([
        testCaseService.getTestCaseById(id),
        testCaseService.getExecutions(id),
      ]);
      setTestCase(tcData);
      setExecutions(execData);
    } catch (err) {
      console.error('[FETCH TEST CASE DETAILS ERROR]:', err);
      toast.error('Unable to fetch test case details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleDuplicate = async () => {
    try {
      const dup = await testCaseService.duplicateTestCase(testCase._id || testCase.testCaseId);
      toast.success(`Test case duplicated as ${dup.testCaseId || 'new TC'}.`);
      navigate(`/test-cases/${dup._id || dup.testCaseId}`);
    } catch (err) {
      toast.error('Failed to duplicate test case.');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      await testCaseService.deleteTestCase(testCase._id || testCase.testCaseId);
      toast.success(`Test case ${testCase.testCaseId} deleted successfully.`);
      setIsDeleteModalOpen(false);
      navigate('/test-cases');
    } catch (err) {
      toast.error('Failed to delete test case.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Passed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Failed':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'Blocked':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Retest':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-3" />
        <p className="text-sm font-medium">Loading test case specifications & execution telemetry...</p>
      </div>
    );
  }

  if (!testCase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Test Case Not Found</h2>
        <p className="text-xs text-slate-400 mb-4">The requested Test Case ID does not exist in the database.</p>
        <Link
          to="/test-cases"
          className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white rounded-lg text-xs font-semibold"
        >
          Back to Test Cases Repository
        </Link>
      </div>
    );
  }

  const projName = testCase.project?.name || testCase.projectName || 'Project';
  const modName = testCase.module?.name || testCase.moduleName || 'Module';
  const scnName = testCase.scenario?.name || testCase.scenarioName || 'General';
  const testerUser = testCase.tester || { name: 'Tester', role: 'Tester' };
  const creatorUser = testCase.createdBy || { name: 'Admin', role: 'Admin' };
  const linkedBugs = testCase.linkedBugs || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Back Link */}
      <button
        onClick={() => navigate('/test-cases')}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Test Cases
      </button>

      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded-lg border border-red-500/20">
                {testCase.testCaseId || testCase._id}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(testCase.status)}`}>
                {testCase.status}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-dark-950 text-slate-300 border border-dark-700">
                {testCase.priority}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                {testCase.severity}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white leading-snug">{testCase.title}</h1>
          </div>

          {/* Actions Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate(`/test-cases/${testCase._id || testCase.testCaseId}/execute`)}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-1.5 transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> Execute Test
            </button>
            <button
              onClick={handleDuplicate}
              className="px-3.5 py-2 bg-dark-800 hover:bg-dark-700 text-purple-400 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" /> Duplicate
            </button>
            <button
              onClick={() => navigate(`/test-cases/${testCase._id || testCase.testCaseId}/edit`)}
              className="px-3.5 py-2 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            {canDelete && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-2 bg-dark-800 hover:bg-red-500/20 text-red-400 rounded-xl border border-dark-700"
                title="Delete Test Case"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Specs & Telemetry Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Specs Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description & Preconditions Card */}
          <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-red-500" /> Specification Description & Preconditions
            </h2>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {testCase.description || 'No description specified.'}
            </p>

            {testCase.preconditions && (
              <div className="pt-2">
                <span className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Preconditions</span>
                <p className="text-xs text-slate-300 bg-dark-950 p-3 rounded-xl border border-dark-800">
                  {testCase.preconditions}
                </p>
              </div>
            )}
          </div>

          {/* Numbered Test Steps */}
          <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-emerald-400" /> Test Execution Steps ({testCase.testSteps?.length || 0})
            </h2>

            <div className="space-y-2">
              {!testCase.testSteps || testCase.testSteps.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No execution steps logged.</p>
              ) : (
                testCase.testSteps.map((stepItem, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-dark-950 rounded-xl border border-dark-800">
                    <span className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {stepItem.stepNumber || idx + 1}
                    </span>
                    <p className="text-xs text-slate-200 font-mono leading-relaxed pt-1">{stepItem.action}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Expected vs Actual Result */}
          <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Expected vs Actual Results
            </h2>

            {testCase.testData && (
              <div>
                <span className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Test Data</span>
                <p className="text-xs text-slate-300 font-mono bg-dark-950 p-2.5 rounded-xl border border-dark-800">
                  {testCase.testData}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">Expected Result</span>
                <p className="text-xs text-slate-300 bg-dark-950 p-3 rounded-xl border border-dark-800">
                  {testCase.expectedResult}
                </p>
              </div>

              <div>
                <span className="block text-[11px] font-bold uppercase text-red-400 mb-1">Latest Actual Result</span>
                <p className="text-xs text-slate-300 bg-dark-950 p-3 rounded-xl border border-dark-800">
                  {testCase.actualResult || 'No execution result recorded yet.'}
                </p>
              </div>
            </div>
          </div>

          {/* Execution History Section */}
          <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" /> Execution History ({executions.length})
            </h2>

            {executions.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">No execution history recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-dark-800 text-slate-500 uppercase">
                      <th className="pb-2">Exec ID</th>
                      <th className="pb-2">Tester</th>
                      <th className="pb-2">Result</th>
                      <th className="pb-2">Actual Result</th>
                      <th className="pb-2 text-right">Executed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800/60 text-slate-300">
                    {executions.map((e) => (
                      <tr key={e._id}>
                        <td className="py-2.5 font-mono text-red-400 font-bold">{e.executionId}</td>
                        <td className="py-2.5">{e.testerName || e.tester?.name || 'Tester'}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(e.result)}`}>
                            {e.result}
                          </span>
                        </td>
                        <td className="py-2.5 max-w-xs truncate text-slate-300">{e.actualResult || '—'}</td>
                        <td className="py-2.5 text-right text-[11px] text-slate-500">
                          {new Date(e.executedAt).toLocaleDateString()} {new Date(e.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Linked Bugs Section */}
          <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <BugIcon className="w-4 h-4 text-red-500" /> Linked Defect Reports ({linkedBugs.length})
            </h2>

            {linkedBugs.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No defects linked to this test case.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {linkedBugs.map((b) => (
                  <Link
                    key={b._id}
                    to={`/bugs/${b._id || b.bugId}`}
                    className="p-3 bg-dark-950 rounded-xl border border-dark-800 hover:border-red-500/50 transition-colors flex items-center justify-between text-xs group"
                  >
                    <div>
                      <span className="font-mono font-bold text-red-400 block group-hover:underline">{b.bugId || b._id}</span>
                      <span className="font-semibold text-slate-200 block truncate max-w-[180px]">{b.title}</span>
                    </div>
                    <span className="text-[10px] font-semibold bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">
                      {b.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Specification Metadata */}
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-2xl border border-dark-800 shadow-card-dark space-y-4 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] pb-2 border-b border-dark-800">
              TestCase Architecture
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Project</span>
                <span className="font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-orange-400" /> {projName}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Module</span>
                <span className="font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" /> {modName}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Scenario</span>
                <span className="font-bold text-purple-400 flex items-center gap-1.5 mt-0.5">
                  <Layers className="w-3.5 h-3.5" /> {scnName}
                </span>
              </div>

              <div className="pt-2 border-t border-dark-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Assigned Tester</span>
                <p className="font-semibold text-slate-200 mt-0.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> {testerUser.name}
                </p>
                <p className="text-[10px] text-slate-500 pl-5">{testerUser.role || 'Tester'}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Author / Created By</span>
                <p className="font-semibold text-slate-200 mt-0.5">{creatorUser.name}</p>
              </div>

              <div className="pt-2 border-t border-dark-800 text-[10px] text-slate-500 space-y-1">
                <p>Created: {new Date(testCase.createdAt).toLocaleDateString()}</p>
                <p>Updated: {new Date(testCase.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete '${testCase.testCaseId}'?`}
        message="Are you sure you want to delete this test case specification? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default TestCaseDetails;
