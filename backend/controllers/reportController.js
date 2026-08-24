const Bug = require('../models/Bug');
const Project = require('../models/Project');
const TestCase = require('../models/TestCase');
const TestExecution = require('../models/TestExecution');
const User = require('../models/User');
const { memoryBugs } = require('./bugController');
const { memoryProjects } = require('./projectController');
const { memoryTestCases, memoryExecutions } = require('./testCaseController');
const mongoose = require('mongoose');

/**
 * Helper to construct MongoDB filter query from query params
 */
const buildBugQuery = (queryParams) => {
  const { project, module: moduleFilter, tester, developer, status, severity, priority, startDate, endDate } = queryParams;
  let query = {};

  if (project && mongoose.Types.ObjectId.isValid(project)) query.project = project;
  if (moduleFilter && mongoose.Types.ObjectId.isValid(moduleFilter)) query.module = moduleFilter;
  if (developer && mongoose.Types.ObjectId.isValid(developer)) query.assignedTo = developer;
  if (tester && mongoose.Types.ObjectId.isValid(tester)) query.reporter = tester;
  if (status && status !== 'All') query.status = status;
  if (severity && severity !== 'All') query.severity = severity;
  if (priority && priority !== 'All') query.priority = priority;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return query;
};

/**
 * @desc    Get aggregate summary metrics for report dashboard
 * @route   GET /api/reports/summary
 * @access  Private
 */
const getSummaryReport = async (req, res) => {
  try {
    const query = buildBugQuery(req.query);

    if (mongoose.connection.readyState === 1) {
      const totalBugs = await Bug.countDocuments(query);
      const openBugs = await Bug.countDocuments({ ...query, status: { $in: ['New', 'Assigned', 'In Progress', 'Reopened'] } });
      const criticalBugs = await Bug.countDocuments({ ...query, severity: { $in: ['Critical', 'Blocker'] } });
      const resolvedBugs = await Bug.countDocuments({ ...query, status: { $in: ['Fixed', 'Closed'] } });

      let tcQuery = {};
      if (req.query.project && mongoose.Types.ObjectId.isValid(req.query.project)) tcQuery.project = req.query.project;
      if (req.query.module && mongoose.Types.ObjectId.isValid(req.query.module)) tcQuery.module = req.query.module;

      const totalTestCases = await TestCase.countDocuments(tcQuery);
      const passedTests = await TestCase.countDocuments({ ...tcQuery, status: 'Passed' });
      const failedTests = await TestCase.countDocuments({ ...tcQuery, status: 'Failed' });
      const blockedTests = await TestCase.countDocuments({ ...tcQuery, status: 'Blocked' });

      return res.json({
        totalBugs,
        openBugs,
        criticalBugs,
        resolvedBugs,
        totalTestCases,
        passedTests,
        failedTests,
        blockedTests,
      });
    }

    // Fallback memory counts
    return res.json({
      totalBugs: memoryBugs.length,
      openBugs: memoryBugs.filter((b) => ['New', 'Assigned', 'In Progress', 'Reopened'].includes(b.status)).length,
      criticalBugs: memoryBugs.filter((b) => ['Critical', 'Blocker'].includes(b.severity)).length,
      resolvedBugs: memoryBugs.filter((b) => ['Fixed', 'Closed'].includes(b.status)).length,
      totalTestCases: memoryTestCases.length,
      passedTests: memoryTestCases.filter((tc) => tc.status === 'Passed').length,
      failedTests: memoryTestCases.filter((tc) => tc.status === 'Failed').length,
      blockedTests: memoryTestCases.filter((tc) => tc.status === 'Blocked').length,
    });
  } catch (error) {
    console.error('[SUMMARY REPORT ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch summary report.' });
  }
};

/**
 * @desc    Get bug report breakdown (Status, Severity, Priority) & filtered list
 * @route   GET /api/reports/bugs
 * @access  Private
 */
const getBugReport = async (req, res) => {
  try {
    const query = buildBugQuery(req.query);

    if (mongoose.connection.readyState === 1) {
      const bugs = await Bug.find(query)
        .populate('project', 'name projectCode')
        .populate('module', 'name')
        .populate('reporter', 'name role')
        .populate('assignedTo', 'name role')
        .sort({ createdAt: -1 });

      const statusBreakdown = {
        New: 0, Assigned: 0, 'In Progress': 0, Fixed: 0, Retest: 0, Closed: 0, Reopened: 0, Rejected: 0,
      };
      const severityBreakdown = { Blocker: 0, Critical: 0, Major: 0, Minor: 0, Trivial: 0 };
      const priorityBreakdown = { 'P1 - Highest': 0, 'P2 - High': 0, 'P3 - Medium': 0, 'P4 - Low': 0 };

      bugs.forEach((b) => {
        if (statusBreakdown[b.status] !== undefined) statusBreakdown[b.status]++;
        if (severityBreakdown[b.severity] !== undefined) severityBreakdown[b.severity]++;
        if (priorityBreakdown[b.priority] !== undefined) priorityBreakdown[b.priority]++;
      });

      return res.json({
        total: bugs.length,
        statusBreakdown,
        severityBreakdown,
        priorityBreakdown,
        bugs,
      });
    }

    // Memory Fallback
    return res.json({
      total: memoryBugs.length,
      statusBreakdown: { New: 1, Assigned: 1, Fixed: 1 },
      severityBreakdown: { Critical: 1, Major: 2 },
      priorityBreakdown: { 'P1 - Highest': 1, 'P3 - Medium': 2 },
      bugs: memoryBugs,
    });
  } catch (error) {
    console.error('[BUG REPORT ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch bug report.' });
  }
};

/**
 * @desc    Get project-wise bug report
 * @route   GET /api/reports/projects
 * @access  Private
 */
const getProjectReport = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const projects = await Project.find().select('name projectCode status');
      const projectReports = await Promise.all(
        projects.map(async (p) => {
          const totalBugs = await Bug.countDocuments({ project: p._id });
          const openBugs = await Bug.countDocuments({ project: p._id, status: { $in: ['New', 'Assigned', 'In Progress', 'Reopened'] } });
          const criticalBugs = await Bug.countDocuments({ project: p._id, severity: { $in: ['Critical', 'Blocker'] } });
          const majorBugs = await Bug.countDocuments({ project: p._id, severity: 'Major' });
          const fixedBugs = await Bug.countDocuments({ project: p._id, status: 'Fixed' });
          const closedBugs = await Bug.countDocuments({ project: p._id, status: 'Closed' });
          const reopenedBugs = await Bug.countDocuments({ project: p._id, status: 'Reopened' });
          const totalTestCases = await TestCase.countDocuments({ project: p._id });

          return {
            projectId: p._id,
            name: p.name,
            projectCode: p.projectCode,
            status: p.status,
            totalBugs,
            openBugs,
            criticalBugs,
            majorBugs,
            fixedBugs,
            closedBugs,
            reopenedBugs,
            totalTestCases,
          };
        })
      );

      return res.json(projectReports);
    }

    const memoryReports = memoryProjects.map((p) => ({
      projectId: p._id,
      name: p.name,
      projectCode: p.projectCode,
      status: p.status,
      totalBugs: memoryBugs.filter((b) => b.project === p._id || b.projectName === p.name).length,
      openBugs: memoryBugs.filter((b) => (b.project === p._id || b.projectName === p.name) && ['New', 'Assigned', 'In Progress'].includes(b.status)).length,
      criticalBugs: memoryBugs.filter((b) => (b.project === p._id || b.projectName === p.name) && ['Critical', 'Blocker'].includes(b.severity)).length,
      majorBugs: 1,
      fixedBugs: 1,
      closedBugs: 0,
      reopenedBugs: 0,
      totalTestCases: memoryTestCases.filter((tc) => tc.project === p._id || tc.projectName === p.name).length,
    }));

    return res.json(memoryReports);
  } catch (error) {
    console.error('[PROJECT REPORT ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch project report.' });
  }
};

/**
 * @desc    Get tester performance report with pass rate calculations
 * @route   GET /api/reports/tester-performance
 * @access  Private
 */
const getTesterPerformanceReport = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const testers = await User.find({ role: { $in: ['Tester', 'QA Manager', 'Admin'] } }).select('name email role');

      const performanceList = await Promise.all(
        testers.map(async (u) => {
          const assignedCount = await TestCase.countDocuments({ tester: u._id });
          const passedCount = await TestCase.countDocuments({ tester: u._id, status: 'Passed' });
          const failedCount = await TestCase.countDocuments({ tester: u._id, status: 'Failed' });
          const blockedCount = await TestCase.countDocuments({ tester: u._id, status: 'Blocked' });
          const notRunCount = await TestCase.countDocuments({ tester: u._id, status: 'Not Run' });
          const executedCount = passedCount + failedCount + blockedCount;

          const passPercentage = executedCount > 0 ? ((passedCount / executedCount) * 100).toFixed(1) : '0.0';

          return {
            testerId: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            assignedTestCases: assignedCount,
            executed: executedCount,
            passed: passedCount,
            failed: failedCount,
            blocked: blockedCount,
            notRun: notRunCount,
            passPercentage: Number(passPercentage),
          };
        })
      );

      return res.json(performanceList);
    }

    // Memory Fallback
    const memoryTesters = [
      {
        testerId: 'demo_qa',
        name: 'Sarah Connor',
        role: 'QA Manager',
        assignedTestCases: 10,
        executed: 8,
        passed: 7,
        failed: 1,
        blocked: 0,
        notRun: 2,
        passPercentage: 87.5,
      },
      {
        testerId: 'demo_tester',
        name: 'John Doe',
        role: 'Tester',
        assignedTestCases: 12,
        executed: 10,
        passed: 8,
        failed: 2,
        blocked: 0,
        notRun: 2,
        passPercentage: 80.0,
      },
    ];

    return res.json(memoryTesters);
  } catch (error) {
    console.error('[TESTER PERFORMANCE REPORT ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch tester performance report.' });
  }
};

/**
 * @desc    Get test execution report
 * @route   GET /api/reports/executions
 * @access  Private
 */
const getExecutionReport = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const executions = await TestExecution.find()
        .populate({
          path: 'testCase',
          select: 'testCaseId title project module',
          populate: [
            { path: 'project', select: 'name projectCode' },
            { path: 'module', select: 'name' },
          ],
        })
        .populate('tester', 'name role')
        .sort({ executedAt: -1 });

      const totals = {
        totalExecutions: executions.length,
        passed: executions.filter((e) => e.result === 'Passed').length,
        failed: executions.filter((e) => e.result === 'Failed').length,
        blocked: executions.filter((e) => e.result === 'Blocked').length,
        notRun: executions.filter((e) => e.result === 'Not Run').length,
      };

      return res.json({ totals, executions });
    }

    const totals = {
      totalExecutions: memoryExecutions.length,
      passed: memoryExecutions.filter((e) => e.result === 'Passed').length,
      failed: memoryExecutions.filter((e) => e.result === 'Failed').length,
      blocked: 0,
      notRun: 0,
    };

    return res.json({ totals, executions: memoryExecutions });
  } catch (error) {
    console.error('[EXECUTION REPORT ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch execution report.' });
  }
};

module.exports = {
  getSummaryReport,
  getBugReport,
  getProjectReport,
  getTesterPerformanceReport,
  getExecutionReport,
};
