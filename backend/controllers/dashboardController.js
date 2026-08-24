const Project = require('../models/Project');
const Bug = require('../models/Bug');
const TestCase = require('../models/TestCase');
const { Activity, memoryActivities } = require('../models/Activity');
const { memoryProjects } = require('./projectController');
const { memoryBugs } = require('./bugController');
const { memoryTestCases } = require('./testCaseController');
const mongoose = require('mongoose');

/**
 * @desc    Get aggregate stats for dashboard cards
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getDashboardStats = async (req, res) => {
  try {
    let totalProjectsCount = 0;
    let totalBugsCount = 0;
    let openBugsCount = 0;
    let criticalBugsCount = 0;
    let resolvedBugsCount = 0;

    let totalTcCount = 0;
    let passedTcCount = 0;
    let failedTcCount = 0;

    if (mongoose.connection.readyState === 1) {
      totalProjectsCount = await Project.countDocuments();
      totalBugsCount = await Bug.countDocuments();
      openBugsCount = await Bug.countDocuments({ status: { $in: ['New', 'Assigned', 'In Progress', 'Reopened'] } });
      criticalBugsCount = await Bug.countDocuments({ severity: { $in: ['Critical', 'Blocker'] } });
      resolvedBugsCount = await Bug.countDocuments({ status: { $in: ['Fixed', 'Closed'] } });

      totalTcCount = await TestCase.countDocuments();
      passedTcCount = await TestCase.countDocuments({ status: 'Passed' });
      failedTcCount = await TestCase.countDocuments({ status: 'Failed' });
    } else {
      totalProjectsCount = memoryProjects.length;
      totalBugsCount = memoryBugs.length;
      openBugsCount = memoryBugs.filter((b) => ['New', 'Assigned', 'In Progress', 'Reopened'].includes(b.status)).length;
      criticalBugsCount = memoryBugs.filter((b) => ['Critical', 'Blocker'].includes(b.severity)).length;
      resolvedBugsCount = memoryBugs.filter((b) => ['Fixed', 'Closed'].includes(b.status)).length;

      totalTcCount = memoryTestCases.length;
      passedTcCount = memoryTestCases.filter((tc) => tc.status === 'Passed').length;
      failedTcCount = memoryTestCases.filter((tc) => tc.status === 'Failed').length;
    }

    const stats = {
      totalProjects: totalProjectsCount,
      totalBugs: totalBugsCount,
      openBugs: openBugsCount,
      criticalBugs: criticalBugsCount,
      resolvedBugs: resolvedBugsCount,
      totalTestCases: totalTcCount,
      passedTests: passedTcCount,
      failedTests: failedTcCount,
    };

    return res.json(stats);
  } catch (error) {
    console.error('[DASHBOARD STATS ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch dashboard statistics.' });
  }
};

/**
 * @desc    Get chart datasets for dashboard
 * @route   GET /api/dashboard/charts
 * @access  Private
 */
const getDashboardCharts = async (req, res) => {
  try {
    let bugsList = [];
    let projectsList = [];

    if (mongoose.connection.readyState === 1) {
      projectsList = await Project.find().select('name projectCode');
      bugsList = await Bug.find().populate('project', 'name projectCode');
    } else {
      projectsList = memoryProjects;
      bugsList = memoryBugs;
    }

    // Status counts
    const statusCounts = {
      New: 0,
      Assigned: 0,
      'In Progress': 0,
      Fixed: 0,
      Retest: 0,
      Closed: 0,
      Reopened: 0,
      Rejected: 0,
    };

    // Severity counts
    const severityCounts = {
      Blocker: 0,
      Critical: 0,
      Major: 0,
      Minor: 0,
      Trivial: 0,
    };

    bugsList.forEach((b) => {
      if (statusCounts[b.status] !== undefined) statusCounts[b.status]++;
      if (severityCounts[b.severity] !== undefined) severityCounts[b.severity]++;
    });

    const projectLabels = projectsList.map((p) => p.projectCode || p.name);
    const projectBugCounts = projectsList.map((p) => {
      return bugsList.filter((b) => {
        const pId = typeof b.project === 'object' ? b.project?._id?.toString() : b.project;
        const targetId = p._id?.toString();
        return pId === targetId || b.projectName === p.name;
      }).length;
    });

    const chartData = {
      bugStatusDistribution: {
        labels: Object.keys(statusCounts),
        datasets: [
          {
            label: 'Bugs by Status',
            data: Object.values(statusCounts),
            backgroundColor: [
              '#3b82f6', // New
              '#a855f7', // Assigned
              '#f59e0b', // In Progress
              '#10b981', // Fixed
              '#06b6d4', // Retest
              '#64748b', // Closed
              '#ef4444', // Reopened
              '#6b7280', // Rejected
            ],
            borderColor: '#18181b',
            borderWidth: 2,
          },
        ],
      },
      bugSeverityDistribution: {
        labels: Object.keys(severityCounts),
        datasets: [
          {
            label: 'Count',
            data: Object.values(severityCounts),
            backgroundColor: [
              '#dc2626', // Blocker
              '#ef4444', // Critical
              '#f97316', // Major
              '#eab308', // Minor
              '#3b82f6', // Trivial
            ],
            borderRadius: 6,
          },
        ],
      },
      projectWiseBugs: {
        labels: projectLabels.length > 0 ? projectLabels : ['EC-2026', 'MB-APP', 'HC-GATEWAY'],
        datasets: [
          {
            label: 'Total Bugs',
            data: projectBugCounts.length > 0 ? projectBugCounts : [1, 1, 1],
            backgroundColor: '#ef4444',
            borderRadius: 6,
          },
        ],
      },
      testExecution: {
        labels: ['Passed', 'Failed', 'Blocked', 'Not Run'],
        datasets: [
          {
            data: [292, 18, 5, 25],
            backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#64748b'],
            borderColor: '#18181b',
            borderWidth: 2,
          },
        ],
      },
    };

    return res.json(chartData);
  } catch (error) {
    console.error('[DASHBOARD CHARTS ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch chart data.' });
  }
};

/**
 * @desc    Get recent activity stream
 * @route   GET /api/dashboard/recent-activity
 * @access  Private
 */
const getRecentActivities = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const dbActivities = await Activity.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'name email role');

      const formatted = dbActivities.map((act) => ({
        _id: act._id ? act._id.toString() : 'act_' + Date.now(),
        action: act.action || 'SYSTEM',
        message: typeof act.message === 'string' ? act.message : 'System activity logged',
        userName: act.userName || (typeof act.user === 'object' && act.user ? act.user.name : '') || 'System User',
        createdAt: act.createdAt || new Date(),
      }));

      return res.json(formatted);
    }

    const formattedMemory = memoryActivities.slice(0, 10).map((act, i) => ({
      _id: act._id ? String(act._id) : `act_mem_${i}`,
      action: act.action || 'SYSTEM',
      message: typeof act.message === 'string' ? act.message : 'System activity logged',
      userName: act.userName || 'System User',
      createdAt: act.createdAt || new Date(),
    }));

    return res.json(formattedMemory);
  } catch (error) {
    console.error('[RECENT ACTIVITIES ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch activities.' });
  }
};

/**
 * @desc    Get recent bugs summary
 * @route   GET /api/dashboard/recent-bugs
 * @access  Private
 */
const getRecentBugs = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const bugs = await Bug.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('project', 'name projectCode')
        .populate('assignedTo', 'name');

      const formatted = bugs.map((b) => ({
        _id: b.bugId ? String(b.bugId) : (b._id ? String(b._id) : 'BUG-0000'),
        rawId: b._id ? String(b._id) : '',
        title: b.title || 'Untitled Defect',
        project: typeof b.project === 'object' && b.project ? (b.project.name || 'QA Project') : (b.project || 'QA Project'),
        severity: b.severity || 'Major',
        priority: b.priority || 'P3 - Medium',
        status: b.status || 'New',
        assignedTo: typeof b.assignedTo === 'object' && b.assignedTo ? (b.assignedTo.name || 'Unassigned') : (b.assignedTo || 'Unassigned'),
        createdAt: b.createdAt || new Date(),
      }));

      return res.json(formatted);
    }

    const formattedMemory = memoryBugs.slice(0, 6).map((b) => ({
      _id: b.bugId ? String(b.bugId) : (b._id ? String(b._id) : 'BUG-0000'),
      rawId: b._id ? String(b._id) : '',
      title: b.title || 'Untitled Defect',
      project: b.projectName || 'QA Project',
      severity: b.severity || 'Major',
      priority: b.priority || 'P3 - Medium',
      status: b.status || 'New',
      assignedTo: typeof b.assignedTo === 'object' && b.assignedTo ? (b.assignedTo.name || 'Unassigned') : (b.assignedTo || 'Unassigned'),
      createdAt: b.createdAt || new Date(),
    }));

    return res.json(formattedMemory);
  } catch (error) {
    console.error('[RECENT BUGS ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch recent bugs.' });
  }
};

module.exports = {
  getDashboardStats,
  getDashboardCharts,
  getRecentActivities,
  getRecentBugs,
};
