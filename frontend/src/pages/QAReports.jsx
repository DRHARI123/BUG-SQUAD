import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import reportService from '../services/reportService';
import projectService from '../services/projectService';
import userService from '../services/userService';
import moduleService from '../services/moduleService';
import { exportQAReportPDF } from '../utils/pdfExport';
import { exportReportToExcel } from '../utils/excelExport';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  BarChart3,
  Filter,
  RefreshCw,
  FileText,
  Download,
  Printer,
  Calendar,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Building2,
  User,
  Loader2
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const QAReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active Report Tab (1 to 10)
  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [project, setProject] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [tester, setTester] = useState('All');
  const [developer, setDeveloper] = useState('All');
  const [status, setStatus] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [priority, setPriority] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown Metadata
  const [projectsList, setProjectsList] = useState([]);
  const [modulesList, setModulesList] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Telemetry Data State
  const [summaryStats, setSummaryStats] = useState({
    totalBugs: 0,
    openBugs: 0,
    criticalBugs: 0,
    resolvedBugs: 0,
    totalTestCases: 0,
    passedTests: 0,
    failedTests: 0,
    blockedTests: 0,
  });

  const [bugData, setBugData] = useState({ total: 0, statusBreakdown: {}, severityBreakdown: {}, priorityBreakdown: {}, bugs: [] });
  const [projectReports, setProjectReports] = useState([]);
  const [testerReports, setTesterReports] = useState([]);
  const [executionData, setExecutionData] = useState({ totals: {}, executions: [] });

  // Report History Log
  const [reportHistory, setReportHistory] = useState([
    {
      id: 'rep_1',
      reportType: 'Bug Summary Report',
      generatedBy: user?.name || 'QA Admin',
      generatedDate: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      format: 'PDF',
    },
    {
      id: 'rep_2',
      reportType: 'Tester Performance Report',
      generatedBy: user?.name || 'QA Admin',
      generatedDate: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
      format: 'Excel',
    },
  ]);

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        project: project !== 'All' ? project : undefined,
        module: moduleFilter !== 'All' ? moduleFilter : undefined,
        tester: tester !== 'All' ? tester : undefined,
        developer: developer !== 'All' ? developer : undefined,
        status: status !== 'All' ? status : undefined,
        severity: severity !== 'All' ? severity : undefined,
        priority: priority !== 'All' ? priority : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const [summaryRes, bugRes, projRes, testerRes, execRes] = await Promise.all([
        reportService.getSummaryReport(params),
        reportService.getBugReport(params),
        reportService.getProjectReport(),
        reportService.getTesterPerformanceReport(),
        reportService.getExecutionReport(),
      ]);

      setSummaryStats(summaryRes);
      setBugData(bugRes);
      setProjectReports(projRes);
      setTesterReports(testerRes);
      setExecutionData(execRes);
    } catch (err) {
      console.error('[LOAD REPORT DATA ERROR]:', err);
      toast.error('Unable to fetch QA report telemetry.');
    } finally {
      setLoading(false);
    }
  }, [project, moduleFilter, tester, developer, status, severity, priority, startDate, endDate]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [pData, uData] = await Promise.all([
          projectService.getProjects(),
          userService.getUsers(),
        ]);
        setProjectsList(pData);
        setUsersList(uData);
      } catch (err) {
        console.error(err);
      }
    };
    loadMetadata();
  }, []);

  useEffect(() => {
    if (project !== 'All') {
      moduleService.getModules(project).then(setModulesList).catch(console.error);
    } else {
      setModulesList([]);
    }
  }, [project]);

  const handleClearFilters = () => {
    setProject('All');
    setModuleFilter('All');
    setTester('All');
    setDeveloper('All');
    setStatus('All');
    setSeverity('All');
    setPriority('All');
    setStartDate('');
    setEndDate('');
  };

  const reportTabs = [
    { id: 1, title: 'Bug Summary' },
    { id: 2, title: 'Project Breakdown' },
    { id: 3, title: 'Severity Report' },
    { id: 4, title: 'Priority Report' },
    { id: 5, title: 'Status Report' },
    { id: 6, title: 'Tester Performance' },
    { id: 7, title: 'Test Executions' },
    { id: 8, title: 'Test Pass/Fail' },
    { id: 9, title: 'Open Bugs' },
    { id: 10, title: 'Critical Bugs' },
  ];

  const logExportHistory = (reportType, format) => {
    const newEntry = {
      id: 'rep_' + Date.now(),
      reportType,
      generatedBy: user?.name || 'QA Engineer',
      generatedDate: new Date().toISOString(),
      format,
    };
    setReportHistory((prev) => [newEntry, ...prev]);
  };

  // Export PDF Handler
  const handleExportPDF = () => {
    const activeTabObj = reportTabs.find((t) => t.id === activeTab);
    const reportTitle = activeTabObj ? activeTabObj.title : 'QA Report';

    let columns = [];
    let rows = [];

    if (activeTab === 2) {
      columns = ['Project Code', 'Project Name', 'Total Bugs', 'Open Bugs', 'Critical', 'Fixed', 'Test Cases'];
      rows = projectReports.map((p) => [p.projectCode, p.name, p.totalBugs, p.openBugs, p.criticalBugs, p.fixedBugs, p.totalTestCases]);
    } else if (activeTab === 6) {
      columns = ['Tester', 'Role', 'Assigned TCs', 'Executed', 'Passed', 'Failed', 'Pass Rate %'];
      rows = testerReports.map((t) => [t.name, t.role, t.assignedTestCases, t.executed, t.passed, t.failed, `${t.passPercentage}%`]);
    } else if (activeTab === 7) {
      columns = ['Execution ID', 'Test Case ID', 'Tester', 'Result', 'Actual Result'];
      rows = (executionData.executions || []).map((e) => [e.executionId, e.testCase?.testCaseId || 'TC', e.testerName || 'Tester', e.result, e.actualResult || '—']);
    } else {
      columns = ['Bug ID', 'Title', 'Project', 'Severity', 'Priority', 'Status', 'Assigned To'];
      rows = (bugData.bugs || []).map((b) => [b.bugId || b._id, b.title, b.project?.name || b.projectName || 'Project', b.severity, b.priority, b.status, b.assignedTo?.name || 'Unassigned']);
    }

    const filterSummary = `Project: ${project}, Status: ${status}, Severity: ${severity}`;
    exportQAReportPDF(reportTitle, filterSummary, columns, rows);
    logExportHistory(reportTitle, 'PDF');
    toast.success(`${reportTitle} exported to PDF.`);
  };

  // Export Excel Handler
  const handleExportExcel = () => {
    const activeTabObj = reportTabs.find((t) => t.id === activeTab);
    const reportTitle = activeTabObj ? activeTabObj.title : 'QA Report';

    let columns = [];
    let rows = [];

    if (activeTab === 2) {
      columns = ['Project Code', 'Project Name', 'Total Bugs', 'Open Bugs', 'Critical', 'Fixed', 'Test Cases'];
      rows = projectReports.map((p) => [p.projectCode, p.name, p.totalBugs, p.openBugs, p.criticalBugs, p.fixedBugs, p.totalTestCases]);
    } else if (activeTab === 6) {
      columns = ['Tester', 'Role', 'Assigned TCs', 'Executed', 'Passed', 'Failed', 'Pass Rate %'];
      rows = testerReports.map((t) => [t.name, t.role, t.assignedTestCases, t.executed, t.passed, t.failed, `${t.passPercentage}%`]);
    } else {
      columns = ['Bug ID', 'Title', 'Project', 'Severity', 'Priority', 'Status', 'Assigned To'];
      rows = (bugData.bugs || []).map((b) => [b.bugId || b._id, b.title, b.project?.name || b.projectName || 'Project', b.severity, b.priority, b.status, b.assignedTo?.name || 'Unassigned']);
    }

    exportReportToExcel(reportTitle, 'Filter Export', columns, rows);
    logExportHistory(reportTitle, 'Excel');
    toast.success(`${reportTitle} exported to Excel spreadsheet.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-dark-900 via-dark-850 to-dark-900 p-6 rounded-2xl border border-dark-800 shadow-card-dark print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white shadow-glow-red shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">QA Quality Telemetry & Reports</h1>
            <p className="text-xs text-slate-400">
              Corporate QA reports, defect distribution, tester performance, PDF exports & Excel analytics
            </p>
          </div>
        </div>

        {/* Global Export Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white rounded-xl text-xs font-bold shadow-glow-red flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-dark-800 hover:bg-dark-700 text-emerald-400 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-dark-800 hover:bg-dark-700 text-slate-200 rounded-xl text-xs font-semibold border border-dark-700 flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      {/* Top QA Dashboard Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
          <span className="block text-xl font-bold text-white">{summaryStats.totalBugs}</span>
          <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Total Bugs</span>
        </div>
        <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
          <span className="block text-xl font-bold text-amber-400">{summaryStats.openBugs}</span>
          <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Open Bugs</span>
        </div>
        <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
          <span className="block text-xl font-bold text-red-500">{summaryStats.criticalBugs}</span>
          <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Critical</span>
        </div>
        <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
          <span className="block text-xl font-bold text-emerald-400">{summaryStats.resolvedBugs}</span>
          <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Resolved</span>
        </div>
        <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
          <span className="block text-xl font-bold text-cyan-400">{summaryStats.totalTestCases}</span>
          <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Test Cases</span>
        </div>
        <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
          <span className="block text-xl font-bold text-emerald-400">{summaryStats.passedTests}</span>
          <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Passed</span>
        </div>
        <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
          <span className="block text-xl font-bold text-red-400">{summaryStats.failedTests}</span>
          <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Failed</span>
        </div>
        <div className="glass-card p-3 rounded-xl border border-dark-800 text-center">
          <span className="block text-xl font-bold text-amber-500">{summaryStats.blockedTests}</span>
          <span className="block text-[10px] text-slate-400 uppercase font-medium mt-0.5">Blocked</span>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="glass-card p-4 rounded-2xl border border-dark-800 shadow-card-dark space-y-3 print:hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-red-500" /> Report Query Filter Controls
          </span>
          <button
            onClick={handleClearFilters}
            className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Project</label>
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-dark-950 border border-dark-700 rounded-lg text-xs text-slate-200 cursor-pointer"
            >
              <option value="All">All Projects</option>
              {projectsList.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Module</label>
            <select
              disabled={project === 'All'}
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-dark-950 border border-dark-700 rounded-lg text-xs text-slate-200 cursor-pointer disabled:opacity-50"
            >
              <option value="All">All Modules</option>
              {modulesList.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-dark-950 border border-dark-700 rounded-lg text-xs text-slate-200 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Fixed">Fixed</option>
              <option value="Retest">Retest</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-dark-950 border border-dark-700 rounded-lg text-xs text-slate-200 cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Blocker">Blocker</option>
              <option value="Critical">Critical</option>
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
              <option value="Trivial">Trivial</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-dark-950 border border-dark-700 rounded-lg text-xs text-slate-200 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="P1 - Highest">P1 - Highest</option>
              <option value="P2 - High">P2 - High</option>
              <option value="P3 - Medium">P3 - Medium</option>
              <option value="P4 - Low">P4 - Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 print:hidden">
        {reportTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border ${
              activeTab === t.id
                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white border-red-500 shadow-glow-red'
                : 'bg-dark-900 border-dark-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Report Content Body */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-2" />
          <p className="text-xs font-medium">Aggregating database reports...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: Bug Summary */}
          {activeTab === 1 && (
            <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-6">
              <h2 className="text-base font-bold text-white border-b border-dark-800 pb-3">Bug Summary Telemetry</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Status Distribution</h3>
                  <div className="space-y-2">
                    {Object.entries(bugData.statusBreakdown || {}).map(([st, count]) => (
                      <div key={st} className="flex items-center justify-between text-xs p-2 bg-dark-950 rounded-lg border border-dark-800">
                        <span className="font-semibold text-slate-300">{st}</span>
                        <span className="font-mono font-bold text-red-400">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Severity Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(bugData.severityBreakdown || {}).map(([sev, count]) => (
                      <div key={sev} className="flex items-center justify-between text-xs p-2 bg-dark-950 rounded-lg border border-dark-800">
                        <span className="font-semibold text-slate-300">{sev}</span>
                        <span className="font-mono font-bold text-orange-400">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Project-wise Bug Report */}
          {activeTab === 2 && (
            <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
              <h2 className="text-base font-bold text-white border-b border-dark-800 pb-3">Project-wise Defect Breakdown</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-dark-800 text-slate-400 uppercase font-semibold">
                      <th className="pb-3">Project Code</th>
                      <th className="pb-3">Project Name</th>
                      <th className="pb-3">Total Bugs</th>
                      <th className="pb-3">Open Bugs</th>
                      <th className="pb-3">Critical</th>
                      <th className="pb-3">Fixed</th>
                      <th className="pb-3">Test Cases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800/60 text-slate-300">
                    {projectReports.map((p) => (
                      <tr
                        key={p.projectId}
                        onClick={() => navigate(`/projects/${p.projectId}`)}
                        className="hover:bg-dark-900 cursor-pointer transition-colors"
                      >
                        <td className="py-3 font-mono font-bold text-red-400">{p.projectCode}</td>
                        <td className="py-3 font-semibold text-white">{p.name}</td>
                        <td className="py-3 font-bold">{p.totalBugs}</td>
                        <td className="py-3 text-amber-400 font-semibold">{p.openBugs}</td>
                        <td className="py-3 text-red-500 font-bold">{p.criticalBugs}</td>
                        <td className="py-3 text-emerald-400 font-semibold">{p.fixedBugs}</td>
                        <td className="py-3 text-cyan-400">{p.totalTestCases}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: Tester Performance Report */}
          {activeTab === 6 && (
            <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
              <h2 className="text-base font-bold text-white border-b border-dark-800 pb-3">Tester Performance Analytics</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-dark-800 text-slate-400 uppercase font-semibold">
                      <th className="pb-3">Tester</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Assigned TCs</th>
                      <th className="pb-3">Executed</th>
                      <th className="pb-3">Passed</th>
                      <th className="pb-3">Failed</th>
                      <th className="pb-3">Blocked</th>
                      <th className="pb-3">Pass Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800/60 text-slate-300">
                    {testerReports.map((t) => (
                      <tr key={t.testerId} className="hover:bg-dark-900 transition-colors">
                        <td className="py-3 font-bold text-white">{t.name}</td>
                        <td className="py-3 text-slate-400">{t.role}</td>
                        <td className="py-3">{t.assignedTestCases}</td>
                        <td className="py-3 font-bold">{t.executed}</td>
                        <td className="py-3 text-emerald-400 font-semibold">{t.passed}</td>
                        <td className="py-3 text-red-400 font-semibold">{t.failed}</td>
                        <td className="py-3 text-amber-400">{t.blocked}</td>
                        <td className="py-3 font-mono font-bold text-emerald-400">{t.passPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9 & 10: Open & Critical Bugs */}
          {(activeTab === 9 || activeTab === 10) && (
            <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark space-y-4">
              <div className="flex items-center justify-between border-b border-dark-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {activeTab === 10 && <Flame className="w-5 h-5 text-red-500 animate-pulse" />}
                  {activeTab === 10 ? 'Critical & Blocker Defect Report' : 'Open Defect Report'}
                </h2>
                {activeTab === 10 && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/30 font-bold">
                    Action Required
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-dark-800 text-slate-400 uppercase font-semibold">
                      <th className="pb-3">Bug ID</th>
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Severity</th>
                      <th className="pb-3">Priority</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800/60 text-slate-300">
                    {(bugData.bugs || [])
                      .filter((b) =>
                        activeTab === 10
                          ? ['Critical', 'Blocker'].includes(b.severity)
                          : ['New', 'Assigned', 'In Progress', 'Reopened'].includes(b.status)
                      )
                      .map((b) => (
                        <tr
                          key={b._id}
                          onClick={() => navigate(`/bugs/${b._id || b.bugId}`)}
                          className="hover:bg-dark-900 cursor-pointer transition-colors"
                        >
                          <td className="py-3 font-mono font-bold text-red-400">{b.bugId || b._id}</td>
                          <td className="py-3 font-semibold text-white max-w-xs truncate">{b.title}</td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              {b.severity}
                            </span>
                          </td>
                          <td className="py-3 text-slate-300">{b.priority}</td>
                          <td className="py-3 text-slate-300">{b.status}</td>
                          <td className="py-3 text-slate-200">{b.assignedTo?.name || 'Unassigned'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Report Generation History Log */}
          <div className="glass-card p-6 rounded-2xl border border-dark-800 shadow-card-dark print:hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" /> Export History Log
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-dark-800 text-slate-500 uppercase">
                    <th className="pb-2">Report Name</th>
                    <th className="pb-2">Generated By</th>
                    <th className="pb-2">Format</th>
                    <th className="pb-2 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800/60 text-slate-400">
                  {reportHistory.map((rh) => (
                    <tr key={rh.id}>
                      <td className="py-2.5 font-semibold text-slate-200">{rh.reportType}</td>
                      <td className="py-2.5">{rh.generatedBy}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rh.format === 'PDF' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {rh.format}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-[11px]">
                        {new Date(rh.generatedDate).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QAReports;
