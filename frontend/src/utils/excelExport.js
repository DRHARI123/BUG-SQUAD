import * as XLSX from 'xlsx';

/**
 * Utility function to format and trigger XLSX download
 */
const downloadWorkbook = (worksheet, sheetName, fileName) => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
};

/**
 * Export Bugs List to Excel
 */
export const exportBugsToExcel = (bugs = []) => {
  const data = bugs.map((b) => ({
    'Bug ID': b.bugId || b._id,
    Title: b.title,
    Project: b.project?.name || b.projectName || 'N/A',
    Module: b.module?.name || b.moduleName || 'N/A',
    Description: b.description || '',
    Environment: b.environment || 'QA',
    Browser: b.browser || 'Chrome',
    Device: b.device || 'Desktop',
    OS: b.operatingSystem || 'Windows 11',
    Version: b.version || 'v1.0.0',
    Severity: b.severity || 'Major',
    Priority: b.priority || 'P3 - Medium',
    Status: b.status || 'New',
    Reproducibility: b.reproducibility || 'Always',
    Reporter: b.reporter?.name || 'QA Engineer',
    'Assigned To': b.assignedTo?.name || 'Unassigned',
    'Created Date': b.createdAt ? new Date(b.createdAt).toLocaleString() : '',
    'Updated Date': b.updatedAt ? new Date(b.updatedAt).toLocaleString() : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Bug ID
    { wch: 35 }, // Title
    { wch: 25 }, // Project
    { wch: 20 }, // Module
    { wch: 40 }, // Description
    { wch: 12 }, // Environment
    { wch: 15 }, // Browser
    { wch: 15 }, // Device
    { wch: 15 }, // OS
    { wch: 10 }, // Version
    { wch: 12 }, // Severity
    { wch: 15 }, // Priority
    { wch: 12 }, // Status
    { wch: 15 }, // Reproducibility
    { wch: 20 }, // Reporter
    { wch: 20 }, // Assigned To
    { wch: 20 }, // Created Date
    { wch: 20 }, // Updated Date
  ];

  downloadWorkbook(worksheet, 'Bugs', 'Bug-Squad-Bugs.xlsx');
};

/**
 * Export Test Cases List to Excel
 */
export const exportTestCasesToExcel = (testCases = []) => {
  const data = testCases.map((tc) => ({
    'Test Case ID': tc.testCaseId || tc._id,
    Title: tc.title,
    Project: tc.project?.name || tc.projectName || 'N/A',
    Module: tc.module?.name || tc.moduleName || 'N/A',
    Scenario: tc.scenario?.name || tc.scenarioName || 'N/A',
    Priority: tc.priority || 'P3 - Medium',
    Severity: tc.severity || 'Major',
    Status: tc.status || 'Not Run',
    Tester: tc.tester?.name || 'Unassigned',
    'Created Date': tc.createdAt ? new Date(tc.createdAt).toLocaleString() : '',
    'Updated Date': tc.updatedAt ? new Date(tc.updatedAt).toLocaleString() : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 40 },
    { wch: 25 },
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
  ];

  downloadWorkbook(worksheet, 'Test Cases', 'Bug-Squad-Test-Cases.xlsx');
};

/**
 * Export Test Executions to Excel
 */
export const exportExecutionsToExcel = (executions = []) => {
  const data = executions.map((e) => ({
    'Execution ID': e.executionId || e._id,
    'Test Case ID': e.testCase?.testCaseId || e.testCase || 'N/A',
    'Test Case Title': e.testCase?.title || 'Test Specification',
    Project: e.testCase?.project?.name || 'N/A',
    Module: e.testCase?.module?.name || 'N/A',
    Tester: e.testerName || e.tester?.name || 'Tester',
    Result: e.result,
    'Actual Result': e.actualResult || '',
    'Execution Notes': e.executionNotes || '',
    'Executed Date': e.executedAt ? new Date(e.executedAt).toLocaleString() : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 35 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 35 },
    { wch: 30 },
    { wch: 20 },
  ];

  downloadWorkbook(worksheet, 'Executions', 'Bug-Squad-Test-Executions.xlsx');
};

/**
 * Export Projects List to Excel
 */
export const exportProjectsToExcel = (projects = []) => {
  const data = projects.map((p) => ({
    'Project Name': p.name,
    'Project Code': p.projectCode,
    Client: p.client || 'Internal QA',
    Status: p.status,
    'Project Manager': p.projectManager?.name || 'Unassigned',
    'Start Date': p.startDate ? new Date(p.startDate).toLocaleDateString() : '',
    'End Date': p.endDate ? new Date(p.endDate).toLocaleDateString() : '',
    'Total Bugs': p.bugCount || 0,
    'Total Test Cases': p.testCaseCount || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 20 },
    { wch: 12 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 16 },
  ];

  downloadWorkbook(worksheet, 'Projects', 'Bug-Squad-Projects.xlsx');
};

/**
 * Export Filtered Active Report View to Excel
 */
export const exportReportToExcel = (reportTitle, filterSummary = 'All Data', columns = [], rows = []) => {
  // Construct array of objects matching column names
  const data = rows.map((row) => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx] !== undefined ? row[idx] : '';
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  downloadWorkbook(worksheet, reportTitle.replace(/\s+/g, '-'), `Bug-Squad-Report.xlsx`);
};

/**
 * Export Requirement Traceability Matrix to Excel
 */
export const exportTraceabilityToExcel = (matrixRows = []) => {
  const data = matrixRows.map((r) => ({
    'Requirement ID': r.requirementId,
    'Requirement Title': r.requirementTitle,
    Project: r.project,
    Type: r.type,
    Priority: r.priority,
    Status: r.status,
    'Linked Test Cases': r.testCases.map((tc) => tc.testCaseId).join(', ') || 'None',
    'Linked Test Runs': r.testRuns.map((tr) => tr.testRunId).join(', ') || 'None',
    Passed: r.passedCount,
    Failed: r.failedCount,
    Blocked: r.blockedCount,
    'Linked Bugs': r.bugs.map((b) => b.bugId).join(', ') || 'None',
    Coverage: r.isCovered ? 'Covered' : 'Uncovered',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 40 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 25 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 25 },
    { wch: 12 },
  ];

  downloadWorkbook(worksheet, 'Traceability Matrix', 'Requirement-Traceability-Matrix.xlsx');
};

/**
 * Export Analytics Summary to Excel
 */
export const exportAnalyticsToExcel = (overview = {}) => {
  const data = [
    { Metric: 'Total Projects', Value: overview.totalProjects || 0 },
    { Metric: 'Total Bugs', Value: overview.totalBugs || 0 },
    { Metric: 'Open Bugs', Value: overview.openBugs || 0 },
    { Metric: 'Closed Bugs', Value: overview.closedBugs || 0 },
    { Metric: 'Critical Defects', Value: overview.criticalBugs || 0 },
    { Metric: 'Blocker Defects', Value: overview.blockerBugs || 0 },
    { Metric: 'Total Test Cases', Value: overview.totalTestCases || 0 },
    { Metric: 'Executed Test Cases', Value: overview.executedTestCases || 0 },
    { Metric: 'Test Pass Rate %', Value: `${overview.passRate || 0}%` },
    { Metric: 'Requirement Coverage %', Value: `${overview.reqCoverage || 0}%` },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
  downloadWorkbook(worksheet, 'Analytics Overview', 'QA-Analytics-Overview.xlsx');
};
