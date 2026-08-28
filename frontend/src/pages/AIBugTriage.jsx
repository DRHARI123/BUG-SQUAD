import React, { useState, useEffect } from 'react';
import aiService from '../services/aiService';
import bugService from '../services/bugService';
import { Sparkles, CheckCircle, RefreshCw, AlertTriangle, ShieldCheck, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const AIBugTriage = () => {
  const [triageResults, setTriageResults] = useState([]);
  const [selectedBugs, setSelectedBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    runTriage();
  }, []);

  const runTriage = async () => {
    setLoading(true);
    try {
      const data = await aiService.bugTriage();
      const results = data.triageResults || [];
      setTriageResults(results);
      setSelectedBugs(results.map((r) => r._id));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to execute AI bug triage.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectBug = (id) => {
    if (selectedBugs.includes(id)) {
      setSelectedBugs(selectedBugs.filter((bId) => bId !== id));
    } else {
      setSelectedBugs([...selectedBugs, id]);
    }
  };

  const handleApplySuggestions = async () => {
    if (selectedBugs.length === 0) {
      toast.error('Select at least one defect to apply AI recommendations.');
      return;
    }

    setApplying(true);
    try {
      const selectedItems = triageResults.filter((r) => selectedBugs.includes(r._id));

      await Promise.all(
        selectedItems.map((item) =>
          bugService.updateBug(item._id, {
            severity: item.suggestedSeverity,
            priority: item.suggestedPriority,
          })
        )
      );

      toast.success(`Applied AI triage recommendations to ${selectedItems.length} defects!`);
      runTriage();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to apply AI recommendations.';
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-red-500" /> AI Automated Defect Triage
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Intelligent batch analysis for open defects. Review AI severity and priority recommendations before applying.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runTriage}
            className="px-3.5 py-2 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Re-run Triage
          </button>
          <button
            onClick={handleApplySuggestions}
            disabled={applying || selectedBugs.length === 0}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Apply Selected Suggestions ({selectedBugs.length})
          </button>
        </div>
      </div>

      {/* Triage Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : triageResults.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-dark-800 space-y-4">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Open Bugs Require Triage</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">All active defects have been triaged and prioritized.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-dark-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-dark-900/80 border-b border-dark-800 text-slate-400 uppercase font-mono font-bold text-[10px]">
                  <th className="p-4 w-10">Select</th>
                  <th className="p-4">Bug ID</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Current Severity</th>
                  <th className="p-4">AI Suggested Severity</th>
                  <th className="p-4">AI Suggested Priority</th>
                  <th className="p-4">AI Triage Reasoning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60">
                {triageResults.map((row) => (
                  <tr key={row._id} className="hover:bg-dark-800/40 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedBugs.includes(row._id)}
                        onChange={() => toggleSelectBug(row._id)}
                        className="w-4 h-4 rounded text-red-500 focus:ring-0 bg-dark-800 border-dark-700"
                      />
                    </td>
                    <td className="p-4 font-mono font-bold text-red-400">{row.bugId}</td>
                    <td className="p-4 font-medium text-white max-w-xs truncate">{row.title}</td>
                    <td className="p-4 text-slate-400 font-semibold">{row.currentSeverity}</td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {row.suggestedSeverity}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        {row.suggestedPriority}
                      </span>
                    </td>

                    <td className="p-4 text-slate-400 max-w-sm leading-relaxed">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIBugTriage;
