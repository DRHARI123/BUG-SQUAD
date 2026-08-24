const Bug = require('../models/Bug');
const TestCase = require('../models/TestCase');
const Project = require('../models/Project');
const Requirement = require('../models/Requirement');
const Release = require('../models/Release');
const TestRun = require('../models/TestRun');
const User = require('../models/User');
const { callAIModel } = require('../utils/aiProvider');
const mongoose = require('mongoose');

/**
 * @desc    Get High-level Analytics Overview
 * @route   GET /api/analytics/overview
 * @access  Private
 */
const getOverviewAnalytics = async (req, res) => {
  try {
    const { project } = req.query;

    if (mongoose.connection.readyState === 1) {
      let filter = {};
      if (project && mongoose.Types.ObjectId.isValid(project)) filter.project = project;

      const [totalProjects, activeProjects, totalBugs, openBugs, closedBugs, criticalBugs, blockerBugs, totalTestCases, passedTests, failedTests, blockedTests, totalReqs, coveredReqs, openReleases, activeTestRuns] = await Promise.all([
        Project.countDocuments(),
        Project.countDocuments({ status: 'Active' }),
        Bug.countDocuments(filter),
        Bug.countDocuments({ ...filter, status: { $in: ['New', 'Assigned', 'In Progress', 'Reopened'] } }),
        Bug.countDocuments({ ...filter, status: { $in: ['Fixed', 'Closed'] } }),
        Bug.countDocuments({ ...filter, severity: 'Critical' }),
        Bug.countDocuments({ ...filter, severity: 'Blocker' }),
        TestCase.countDocuments(filter),
        TestCase.countDocuments({ ...filter, status: 'Passed' }),
        TestCase.countDocuments({ ...filter, status: 'Failed' }),
        TestCase.countDocuments({ ...filter, status: 'Blocked' }),
        Requirement.countDocuments(filter),
        Requirement.countDocuments({ ...filter, 'testCases.0': { $exists: true } }),
        Release.countDocuments({ status: { $ne: 'Released' } }),
        TestRun.countDocuments({ status: 'Running' }),
      ]);

      const executedCount = passedTests + failedTests + blockedTests;
      const passRate = executedCount > 0 ? ((passedTestCases / executedCount) * 100).toFixed(1) : '0.0';
      const reqCoverage = totalReqs > 0 ? ((coveredReqs / totalReqs) * 100).toFixed(1) : '0.0';

      return res.json({
        totalProjects,
        activeProjects,
        totalBugs,
        openBugs,
        closedBugs,
        criticalBugs,
        blockerBugs,
        totalTestCases,
        executedTestCases: executedCount,
        passedTests,
        failedTests,
        blockedTests,
        reqCoverage: Number(reqCoverage),
        passRate: Number(passRate),
        openReleases,
        activeTestRuns,
      });
    }

    return res.json({
      totalProjects: 3,
      activeProjects: 3,
      totalBugs: 12,
      openBugs: 4,
      closedBugs: 8,
      criticalBugs: 2,
      blockerBugs: 1,
      totalTestCases: 25,
      executedTestCases: 20,
      passedTests: 16,
      failedTests: 3,
      blockedTests: 1,
      reqCoverage: 85.0,
      passRate: 80.0,
      openReleases: 2,
      activeTestRuns: 1,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch analytics overview.' });
  }
};

/**
 * @desc    Get Detailed Bug Analytics & Aging Breakdown
 * @route   GET /api/analytics/bugs
 * @access  Private
 */
const getBugAnalytics = async (req, res) => {
  try {
    const { project } = req.query;

    if (mongoose.connection.readyState === 1) {
      let filter = {};
      if (project && mongoose.Types.ObjectId.isValid(project)) filter.project = project;

      const bugs = await Bug.find(filter).populate('assignedTo', 'name').populate('reporter', 'name');

      // Severity Breakdown
      const severityMap = { Blocker: 0, Critical: 0, Major: 0, Minor: 0, Trivial: 0 };
      // Priority Breakdown
      const priorityMap = { 'P1 - Highest': 0, 'P2 - High': 0, 'P3 - Medium': 0, 'P4 - Low': 0 };
      // Status Breakdown
      const statusMap = { New: 0, Assigned: 0, 'In Progress': 0, Fixed: 0, Retest: 0, Closed: 0, Reopened: 0, Rejected: 0 };
      // Aging Buckets
      const aging = { '0-1 Days': 0, '2-3 Days': 0, '4-7 Days': 0, '8-14 Days': 0, '15-30 Days': 0, '30+ Days': 0 };

      const now = new Date();
      let totalResolutionMs = 0;
      let resolvedCount = 0;

      bugs.forEach((b) => {
        if (severityMap[b.severity] !== undefined) severityMap[b.severity]++;
        if (priorityMap[b.priority] !== undefined) priorityMap[b.priority]++;
        if (statusMap[b.status] !== undefined) statusMap[b.status]++;

        // Aging for open bugs
        if (['New', 'Assigned', 'In Progress', 'Reopened'].includes(b.status)) {
          const ageDays = (now - new Date(b.createdAt)) / (1000 * 60 * 60 * 24);
          if (ageDays <= 1) aging['0-1 Days']++;
          else if (ageDays <= 3) aging['2-3 Days']++;
          else if (ageDays <= 7) aging['4-7 Days']++;
          else if (ageDays <= 14) aging['8-14 Days']++;
          else if (ageDays <= 30) aging['15-30 Days']++;
          else aging['30+ Days']++;
        }

        // Resolution Time
        if (['Fixed', 'Closed'].includes(b.status) && b.updatedAt) {
          totalResolutionMs += new Date(b.updatedAt) - new Date(b.createdAt);
          resolvedCount++;
        }
      });

      const avgResolutionHours = resolvedCount > 0 ? (totalResolutionMs / (resolvedCount * 1000 * 60 * 60)).toFixed(1) : '0.0';
      const reopenedCount = statusMap.Reopened || 0;
      const closedCount = statusMap.Closed || 1;
      const reopenRate = ((reopenedCount / closedCount) * 100).toFixed(1);

      return res.json({
        severityMap,
        priorityMap,
        statusMap,
        aging,
        avgResolutionHours: Number(avgResolutionHours),
        reopenRate: Number(reopenRate),
        totalBugs: bugs.length,
      });
    }

    return res.json({
      severityMap: { Blocker: 1, Critical: 2, Major: 5, Minor: 3, Trivial: 1 },
      priorityMap: { 'P1 - Highest': 3, 'P2 - High': 4, 'P3 - Medium': 4, 'P4 - Low': 1 },
      statusMap: { New: 1, Assigned: 2, 'In Progress': 1, Fixed: 3, Closed: 5 },
      aging: { '0-1 Days': 2, '2-3 Days': 1, '4-7 Days': 1, '8-14 Days': 0, '15-30 Days': 0, '30+ Days': 0 },
      avgResolutionHours: 18.5,
      reopenRate: 4.2,
      totalBugs: 12,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch bug analytics.' });
  }
};

/**
 * @desc    Get Team Workload & Productivity Metrics
 * @route   GET /api/analytics/team
 * @access  Private
 */
const getTeamAnalytics = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const users = await User.find({ status: 'Active' }).select('name email role department');

      const workload = await Promise.all(
        users.map(async (u) => {
          const openBugs = await Bug.countDocuments({ assignedTo: u._id, status: { $in: ['New', 'Assigned', 'In Progress', 'Reopened'] } });
          const resolvedBugs = await Bug.countDocuments({ assignedTo: u._id, status: { $in: ['Fixed', 'Closed'] } });
          const executedTests = await TestCase.countDocuments({ tester: u._id, status: { $ne: 'Not Run' } });

          return {
            _id: u._id,
            name: u.name,
            role: u.role,
            department: u.department || 'Quality',
            openBugs,
            resolvedBugs,
            executedTests,
          };
        })
      );

      return res.json(workload);
    }

    return res.json([
      { name: 'David Miller', role: 'Developer', openBugs: 2, resolvedBugs: 8, executedTests: 0 },
      { name: 'John Doe', role: 'Tester', openBugs: 1, resolvedBugs: 0, executedTests: 15 },
      { name: 'Sarah Connor', role: 'QA Manager', openBugs: 1, resolvedBugs: 4, executedTests: 10 },
    ]);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch team analytics.' });
  }
};

/**
 * @desc    Generate AI Analytics Insights
 * @route   POST /api/analytics/ai-insights
 * @access  Private
 */
const generateAIInsights = async (req, res) => {
  try {
    const { totalBugs, openBugs, criticalBugs, passRate, reqCoverage } = req.body;

    const prompt = `Summarize QA Analytics: Total Bugs: ${totalBugs}, Open: ${openBugs}, Critical: ${criticalBugs}, Pass Rate: ${passRate}%, Req Coverage: ${reqCoverage}%`;
    const aiResponse = await callAIModel(prompt, 'ANALYTICS_SUMMARY');

    return res.json({
      topRisk: criticalBugs > 0 ? `${criticalBugs} critical defect(s) open in target release.` : 'No critical blocker risks.',
      mainTrend: `Test pass rate is holding at ${passRate || 0}%.`,
      potentialConcern: openBugs > 5 ? 'Growing backlog of open defect tickets.' : 'Stable backlog trajectory.',
      recommendedAction: 'Focus engineering sprint on resolving high severity defects.',
      rawSummary: aiResponse,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to generate AI insights.' });
  }
};

module.exports = {
  getOverviewAnalytics,
  getBugAnalytics,
  getTeamAnalytics,
  generateAIInsights,
};
