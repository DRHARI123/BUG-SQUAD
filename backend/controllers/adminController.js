const User = require('../models/User');
const Project = require('../models/Project');
const Bug = require('../models/Bug');
const TestCase = require('../models/TestCase');
const { AuditLog, memoryAuditLogs } = require('../models/AuditLog');
const { memoryUsersList } = require('./userController');
const { memoryProjects } = require('./projectController');
const { memoryBugs } = require('./bugController');
const { memoryTestCases } = require('./testCaseController');
const mongoose = require('mongoose');

// In-memory system settings
let memorySystemSettings = {
  appName: 'BUG SQUAD',
  appTagline: 'Enterprise QA Defect Tracking & Test Management System',
  defaultBugPriority: 'P3 - Medium',
  defaultBugSeverity: 'Major',
  defaultBugStatus: 'New',
  defaultTestCaseStatus: 'Not Run',
  requireTwoFactor: false,
  sessionTimeoutMinutes: 60,
};

/**
 * @desc    Get aggregate stats & system health for Admin Dashboard
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
const getAdminStats = async (req, res) => {
  try {
    let totalUsers = 0;
    let activeUsers = 0;
    let inactiveUsers = 0;
    let totalProjects = 0;
    let totalBugs = 0;
    let openBugs = 0;
    let criticalBugs = 0;
    let totalTestCases = 0;
    let failedTests = 0;

    const dbConnected = mongoose.connection.readyState === 1;

    if (dbConnected) {
      totalUsers = await User.countDocuments();
      activeUsers = await User.countDocuments({ status: 'Active' });
      inactiveUsers = await User.countDocuments({ status: 'Inactive' });

      totalProjects = await Project.countDocuments();
      totalBugs = await Bug.countDocuments();
      openBugs = await Bug.countDocuments({ status: { $in: ['New', 'Assigned', 'In Progress', 'Reopened'] } });
      criticalBugs = await Bug.countDocuments({ severity: { $in: ['Critical', 'Blocker'] } });

      totalTestCases = await TestCase.countDocuments();
      failedTests = await TestCase.countDocuments({ status: 'Failed' });
    } else {
      totalUsers = memoryUsersList.length;
      activeUsers = memoryUsersList.filter((u) => u.status === 'Active').length;
      inactiveUsers = memoryUsersList.filter((u) => u.status === 'Inactive').length;

      totalProjects = memoryProjects.length;
      totalBugs = memoryBugs.length;
      openBugs = memoryBugs.filter((b) => ['New', 'Assigned', 'In Progress', 'Reopened'].includes(b.status)).length;
      criticalBugs = memoryBugs.filter((b) => ['Critical', 'Blocker'].includes(b.severity)).length;

      totalTestCases = memoryTestCases.length;
      failedTests = memoryTestCases.filter((tc) => tc.status === 'Failed').length;
    }

    const systemHealth = {
      backendApi: 'Healthy',
      database: dbConnected ? 'Connected' : 'Standalone / Mock Store Active',
      environment: process.env.NODE_ENV || 'development',
      serverStatus: 'Running',
      uptimeSeconds: process.uptime(),
    };

    return res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalProjects,
        totalBugs,
        openBugs,
        criticalBugs,
        totalTestCases,
        failedTests,
      },
      systemHealth,
    });
  } catch (error) {
    console.error('[ADMIN STATS ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch admin statistics.' });
  }
};

/**
 * @desc    Get system audit logs
 * @route   GET /api/admin/activity
 * @access  Private (Admin)
 */
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    if (mongoose.connection.readyState === 1) {
      const total = await AuditLog.countDocuments();
      const logs = await AuditLog.find()
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      return res.json({
        logs,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        total,
      });
    }

    const total = memoryAuditLogs.length;
    const paginated = memoryAuditLogs.slice(skip, skip + limitNum);

    return res.json({
      logs: paginated,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      total,
    });
  } catch (error) {
    console.error('[GET AUDIT LOGS ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch audit logs.' });
  }
};

/**
 * @desc    Get system settings
 * @route   GET /api/admin/settings
 * @access  Private (Admin)
 */
const getAdminSettings = async (req, res) => {
  return res.json(memorySystemSettings);
};

/**
 * @desc    Update system settings
 * @route   PUT /api/admin/settings
 * @access  Private (Admin)
 */
const updateAdminSettings = async (req, res) => {
  memorySystemSettings = {
    ...memorySystemSettings,
    ...req.body,
  };
  return res.json({ message: 'System settings saved successfully.', settings: memorySystemSettings });
};

const AISettings = require('../models/AISettings');

/**
 * @desc    Get AI System Settings
 * @route   GET /api/admin/ai-settings
 * @access  Private (Admin)
 */
const getAISettings = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let settings = await AISettings.findOne();
      if (!settings) {
        settings = await AISettings.create({});
      }
      return res.json(settings);
    }
    return res.json({ aiEnabled: true, aiProvider: 'Google Gemini AI Engine', model: 'gemini-1.5-pro', dailyUserLimit: 50, monthlyUserLimit: 1000 });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch AI settings.' });
  }
};

/**
 * @desc    Update AI System Settings
 * @route   PUT /api/admin/ai-settings
 * @access  Private (Admin)
 */
const updateAISettings = async (req, res) => {
  try {
    const { aiEnabled, aiProvider, model, dailyUserLimit, monthlyUserLimit } = req.body;

    if (mongoose.connection.readyState === 1) {
      let settings = await AISettings.findOne();
      if (!settings) {
        settings = await AISettings.create(req.body);
      } else {
        settings.aiEnabled = aiEnabled !== undefined ? aiEnabled : settings.aiEnabled;
        settings.aiProvider = aiProvider || settings.aiProvider;
        settings.model = model || settings.model;
        settings.dailyUserLimit = dailyUserLimit || settings.dailyUserLimit;
        settings.monthlyUserLimit = monthlyUserLimit || settings.monthlyUserLimit;
        await settings.save();
      }
      return res.json({ message: 'AI system settings saved.', settings });
    }
    return res.json({ message: 'AI system settings saved.', settings: req.body });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update AI settings.' });
  }
};

module.exports = {
  getAdminStats,
  getAuditLogs,
  getAdminSettings,
  updateAdminSettings,
  getAISettings,
  updateAISettings,
};
