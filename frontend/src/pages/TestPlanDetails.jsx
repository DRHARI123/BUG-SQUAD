import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import testPlanService from '../services/testPlanService';
import { FileText, ArrowLeft, Calendar, User, Shield, CheckCircle, AlertTriangle, Layers, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TestPlanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlan();
  }, [id]);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const data = await testPlanService.getTestPlanById(id);
      setPlan(data);
    } catch (err) {
      toast.error('Failed to load test plan details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this test plan?')) return;
    try {
      await testPlanService.deleteTestPlan(id);
      toast.success('Test Plan deleted.');
      navigate('/test-plans');
    } catch (err) {
      toast.error('Failed to delete test plan.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="glass-card p-12 text-center rounded-2xl border border-dark-800 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">Test Plan Not Found</h3>
        <button onClick={() => navigate('/test-plans')} className="text-xs text-red-400 font-semibold underline">
          Return to Test Plans
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/test-plans')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Test Plans
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* Main Banner */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-xs font-bold rounded-lg">
              {plan.testPlanId || 'TP-0000'}
            </span>
            <span className="px-3 py-1 bg-dark-800 text-slate-300 font-mono text-xs font-semibold rounded-lg border border-dark-700">
              {plan.version || 'v1.0.0'}
            </span>
          </div>

          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">
            {plan.status}
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-white">{plan.name}</h1>
        <p className="text-xs text-slate-400 leading-relaxed">{plan.description || 'No description provided.'}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-dark-800 text-xs">
          <div>
            <span className="text-slate-500 font-semibold">Project:</span>
            <p className="text-white font-bold">{plan.project?.name || 'N/A'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Environment:</span>
            <p className="text-white font-bold">{plan.environment || 'QA'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">QA Owner:</span>
            <p className="text-white font-bold">{plan.owner?.name || 'Unassigned'}</p>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Timeline:</span>
            <p className="text-white font-bold">
              {plan.startDate ? new Date(plan.startDate).toLocaleDateString() : 'N/A'} - {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Specifications & Scope Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-dark-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" /> In-Scope Features
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-dark-900/60 p-4 rounded-xl border border-dark-800 min-h-[100px]">
            {plan.scope || 'No specific in-scope details provided.'}
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-dark-800 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Out-of-Scope Features
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed bg-dark-900/60 p-4 rounded-xl border border-dark-800 min-h-[100px]">
            {plan.outOfScope || 'No out-of-scope items specified.'}
          </p>
        </div>
      </div>

      {/* Test Cases Table */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-500" /> Associated Test Cases ({plan.testCases?.length || 0})
        </h3>

        {(!plan.testCases || plan.testCases.length === 0) ? (
          <p className="text-xs text-slate-400 py-4">No test cases linked to this test plan yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dark-800 text-slate-400 uppercase font-mono font-bold text-[10px]">
                  <th className="pb-3">Test Case ID</th>
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60">
                {plan.testCases.map((tc) => (
                  <tr key={tc._id || tc.testCaseId} className="hover:bg-dark-800/40">
                    <td className="py-3 font-mono font-bold text-red-400">{tc.testCaseId || 'TC-0000'}</td>
                    <td className="py-3 font-medium text-white">{tc.title}</td>
                    <td className="py-3 text-slate-400">{tc.priority || 'P3'}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-dark-800 text-slate-300 border border-dark-700">
                        {tc.status || 'Not Run'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestPlanDetails;
