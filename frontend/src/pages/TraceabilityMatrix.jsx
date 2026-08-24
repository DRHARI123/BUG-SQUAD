import React, { useState, useEffect } from 'react';
import traceabilityService from '../services/traceabilityService';
import projectService from '../services/projectService';
import { exportTraceabilityPDF } from '../utils/pdfExport';
import { exportTraceabilityToExcel } from '../utils/excelExport';
import { FileCheck, Search, Filter, Download, FileSpreadsheet, CheckCircle, AlertTriangle, Layers, Bug, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const TraceabilityMatrix = () => {
  const [matrixData, setMatrixData] = useState({ summary: {}, matrix: [] });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMatrix();
  }, [selectedProject]);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const [matRes, projRes] = await Promise.all([
        traceabilityService.getTraceabilityMatrix(selectedProject ? { project: selectedProject } : {}),
        projectService.getProjects(),
      ]);
      setMatrixData(matRes || { summary: {}, matrix: [] });
      setProjects(projRes.projects || projRes || []);
    } catch (err) {
      toast.error('Failed to load traceability matrix.');
    } finally {
      setLoading(false);
    }
  };

  const rows = matrixData.matrix || [];
  const filteredRows = rows.filter((r) => {
    return (
      !searchTerm ||
      r.requirementId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.requirementTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const summary = matrixData.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-red-500" /> Requirement Traceability Matrix (RTM)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Bi-directional audit traceability: Requirement → Test Case → Test Run → Defect Ticket.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => exportTraceabilityPDF(filteredRows, summary)}
            className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> PDF Matrix
          </button>
          <button
            onClick={() => exportTraceabilityToExcel(filteredRows)}
            className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" /> Excel RTM
          </button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-dark-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Requirements</span>
          <p className="text-2xl font-extrabold text-white">{summary.totalReqs || 0}</p>
        </div>
        <div className="glass-card p-4 rounded-xl border border-dark-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Covered Requirements</span>
          <p className="text-2xl font-extrabold text-emerald-400">{summary.coveredReqs || 0}</p>
        </div>
        <div className="glass-card p-4 rounded-xl border border-dark-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Uncovered Gaps</span>
          <p className="text-2xl font-extrabold text-amber-400">{summary.uncoveredReqs || 0}</p>
        </div>
        <div className="glass-card p-4 rounded-xl border border-dark-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Coverage Rate</span>
          <p className="text-2xl font-extrabold text-blue-400">{summary.coveragePercentage || 0}%</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-xl border border-dark-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search requirement ID or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-900 border border-dark-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-red-500"
          />
        </div>

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="bg-dark-900 border border-dark-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.projectCode})
            </option>
          ))}
        </select>

        <button onClick={fetchMatrix} className="p-2 bg-dark-800 hover:bg-dark-700 text-slate-300 rounded-xl">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Traceability Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-dark-800 space-y-4">
          <FileCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Traceability Data Available</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">Link test cases to requirements to build the traceability matrix.</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-dark-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-dark-900/80 border-b border-dark-800 text-slate-400 uppercase font-mono font-bold text-[10px]">
                  <th className="p-4">Req ID</th>
                  <th className="p-4">Requirement Title</th>
                  <th className="p-4">Linked Test Cases</th>
                  <th className="p-4">Test Runs</th>
                  <th className="p-4">Verdict</th>
                  <th className="p-4">Defects</th>
                  <th className="p-4 text-center">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/60">
                {filteredRows.map((row) => (
                  <tr key={row.requirementId} className="hover:bg-dark-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-red-400">{row.requirementId}</td>
                    <td className="p-4 font-medium text-white max-w-xs truncate">{row.requirementTitle}</td>

                    <td className="p-4">
                      {row.testCases.length === 0 ? (
                        <span className="text-slate-500 font-mono text-[11px]">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {row.testCases.map((tc) => (
                            <span key={tc.id} className="px-2 py-0.5 bg-dark-900 text-slate-300 font-mono text-[10px] rounded border border-dark-700">
                              {tc.testCaseId}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      {row.testRuns.length === 0 ? (
                        <span className="text-slate-500 font-mono text-[11px]">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {row.testRuns.map((tr) => (
                            <span key={tr.id} className="px-2 py-0.5 bg-dark-900 text-slate-300 font-mono text-[10px] rounded border border-dark-700">
                              {tr.testRunId}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="p-4 font-mono text-[11px]">
                      <span className="text-emerald-400 font-bold mr-2">{row.passedCount}P</span>
                      <span className="text-red-400 font-bold mr-2">{row.failedCount}F</span>
                      <span className="text-amber-400 font-bold">{row.blockedCount}B</span>
                    </td>

                    <td className="p-4">
                      {row.bugs.length === 0 ? (
                        <span className="text-slate-500 font-mono text-[11px]">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {row.bugs.map((b) => (
                            <span key={b.id} className="px-2 py-0.5 bg-red-500/10 text-red-400 font-mono text-[10px] font-bold rounded border border-red-500/20">
                              {b.bugId}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          row.isCovered ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {row.isCovered ? 'Covered' : 'Uncovered'}
                      </span>
                    </td>
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

export default TraceabilityMatrix;
