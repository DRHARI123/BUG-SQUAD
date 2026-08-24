import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import releaseService from '../services/releaseService';
import { useAuth } from '../context/AuthContext';
import hasPermission from '../utils/permissions';
import { Tag, ArrowLeft, ShieldCheck, CheckCircle, XCircle, AlertTriangle, MessageSquare, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const ReleaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [releaseData, setReleaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signOffComments, setSignOffComments] = useState('');
  const [isSubmittingSignOff, setIsSubmittingSignOff] = useState(false);

  useEffect(() => {
    fetchReleaseData();
  }, [id]);

  const fetchReleaseData = async () => {
    setLoading(true);
    try {
      const data = await releaseService.getReleaseById(id);
      setReleaseData(data);
    } catch (err) {
      toast.error('Failed to load release details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOff = async (status) => {
    if (status === 'Rejected' && !signOffComments.trim()) {
      toast.error('Please enter a comment explaining rejection.');
      return;
    }

    setIsSubmittingSignOff(true);
    try {
      await releaseService.signOffRelease(id, {
        status,
        comments: signOffComments,
      });
      toast.success(`Release sign-off marked ${status}!`);
      fetchReleaseData();
    } catch (err) {
      toast.error('Failed to update sign-off status.');
    } finally {
      setIsSubmittingSignOff(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!releaseData || !releaseData.release) {
    return (
      <div className="glass-card p-12 text-center rounded-2xl border border-dark-800 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">Release Milestone Not Found</h3>
        <button onClick={() => navigate('/releases')} className="text-xs text-red-400 font-semibold underline">
          Return to Releases
        </button>
      </div>
    );
  }

  const release = releaseData.release;
  const metrics = releaseData.metrics || {};
  const signOff = release.signOff || {};

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/releases')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Releases
        </button>
      </div>

      {/* Main Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-xs font-bold rounded-lg">
              {release.releaseId || 'REL-0000'}
            </span>
            <span className="px-3 py-1 bg-dark-800 text-slate-300 font-mono text-xs font-semibold rounded-lg border border-dark-700">
              Version {release.version}
            </span>
          </div>

          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full">
            {release.status}
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-white">{release.name}</h1>
        <p className="text-xs text-slate-400 leading-relaxed">{release.description || 'No release description provided.'}</p>
      </div>

      {/* Quality Gate PASS/FAIL Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
          metrics.qualityGateStatus === 'PASS'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}
      >
        <div className="flex items-center gap-3">
          {metrics.qualityGateStatus === 'PASS' ? <ShieldCheck className="w-8 h-8 shrink-0" /> : <AlertTriangle className="w-8 h-8 shrink-0" />}
          <div>
            <h3 className="text-lg font-extrabold uppercase tracking-wide">
              QUALITY GATES EVALUATION: {metrics.qualityGateStatus || 'EVALUATING'}
            </h3>
            <p className="text-xs opacity-90">
              {metrics.qualityGateStatus === 'PASS'
                ? 'All configured quality threshold metrics passed! Eligible for release sign-off.'
                : 'Defect or test execution thresholds violated. Address open critical defects before sign-off.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-center">
          <div className="bg-dark-900/60 px-4 py-2 rounded-xl border border-dark-800">
            <span className="text-[10px] text-slate-400 uppercase block">Quality Score</span>
            <span className="text-xl font-extrabold text-white">{metrics.qualityScore || 0}/100</span>
          </div>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-dark-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pass Rate %</span>
          <p className="text-2xl font-extrabold text-emerald-400">{metrics.passRate || 0}%</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-dark-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Requirement Coverage</span>
          <p className="text-2xl font-extrabold text-blue-400">{metrics.reqCoverage || 0}%</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-dark-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Open Defects</span>
          <p className="text-2xl font-extrabold text-amber-400">{metrics.openBugs || 0}</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-dark-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Critical Bugs</span>
          <p className="text-2xl font-extrabold text-red-400">{metrics.criticalBugs || 0}</p>
        </div>
      </div>

      {/* QA Manager Sign-Off Card */}
      <div className="glass-card p-6 rounded-2xl border border-dark-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-red-500" /> Formal QA Sign-Off Approval
          </h3>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              signOff.status === 'Approved'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : signOff.status === 'Rejected'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            Sign-Off Status: {signOff.status || 'Pending'}
          </span>
        </div>

        {signOff.signedOffBy && (
          <div className="p-4 bg-dark-900/60 rounded-xl border border-dark-800 text-xs space-y-1">
            <p className="text-slate-300 font-semibold">
              Signed Off By: <span className="text-white font-bold">{signOff.signedOffBy.name || 'QA Lead'}</span> ({signOff.signedOffBy.role})
            </p>
            <p className="text-slate-400">Date: {new Date(signOff.signedOffAt).toLocaleString()}</p>
            {signOff.comments && <p className="text-slate-300 font-mono mt-2 italic">"{signOff.comments}"</p>}
          </div>
        )}

        {hasPermission(user?.role, 'release.signoff') && (
          <div className="space-y-3 pt-2">
            <textarea
              rows={2}
              placeholder="Add formal sign-off notes or reason for rejection..."
              value={signOffComments}
              onChange={(e) => setSignOffComments(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-red-500"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                disabled={isSubmittingSignOff}
                onClick={() => handleSignOff('Rejected')}
                className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Reject Sign-Off
              </button>

              <button
                disabled={isSubmittingSignOff}
                onClick={() => handleSignOff('Approved')}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-bold shadow-glow-emerald flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Approve QA Sign-Off
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReleaseDetails;
