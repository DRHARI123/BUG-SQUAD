import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import requirementService from '../services/requirementService';
import { FileCheck, ArrowLeft, Layers, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const RequirementDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [requirement, setRequirement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequirement();
  }, [id]);

  const fetchRequirement = async () => {
    setLoading(true);
    try {
      const data = await requirementService.getRequirementById(id);
      setRequirement(data);
    } catch (err) {
      toast.error('Failed to load requirement details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this requirement?')) return;
    try {
      await requirementService.deleteRequirement(id);
      toast.success('Requirement deleted.');
      navigate('/requirements');
    } catch (err) {
      toast.error('Failed to delete requirement.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="glass-card p-12 text-center rounded-2xl border border-dark-800 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">Requirement Not Found</h3>
        <button onClick={() => navigate('/requirements')} className="text-xs text-red-400 font-semibold underline">
          Return to Requirements
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/requirements')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Requirements
        </button>

        <button
          onClick={handleDelete}
          className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-2"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-dark-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-xs font-bold rounded-lg">
              {requirement.requirementId || 'REQ-0000'}
            </span>
            <span className="px-2.5 py-1 bg-dark-900 text-slate-300 text-xs font-semibold rounded border border-dark-800">
              {requirement.type || 'Functional'}
            </span>
          </div>

          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">
            {requirement.status}
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-white">{requirement.title}</h1>
        <p className="text-xs text-slate-400 leading-relaxed">{requirement.description || 'No description provided.'}</p>
      </div>

      {/* Acceptance Criteria */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" /> Acceptance Criteria
        </h3>
        <pre className="text-xs text-slate-300 bg-dark-900/60 p-4 rounded-xl border border-dark-800 font-mono whitespace-pre-wrap">
          {requirement.acceptanceCriteria || 'No explicit acceptance criteria specified.'}
        </pre>
      </div>

      {/* Linked Test Cases */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-500" /> Linked Test Cases ({requirement.testCases?.length || 0})
        </h3>

        {(!requirement.testCases || requirement.testCases.length === 0) ? (
          <p className="text-xs text-slate-400 py-2">No test cases linked to this requirement yet.</p>
        ) : (
          <div className="space-y-2">
            {requirement.testCases.map((tc) => (
              <div key={tc._id || tc.testCaseId} className="p-3 bg-dark-900 rounded-xl border border-dark-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-red-400">{tc.testCaseId}</span>
                  <span className="text-white font-medium">{tc.title}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-dark-800 text-slate-300 border border-dark-700">
                  {tc.status || 'Not Run'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequirementDetails;
