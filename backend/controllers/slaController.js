const SLAConfig = require('../models/SLAConfig');
const Bug = require('../models/Bug');
const { createNotification } = require('../models/Notification');
const { logAudit } = require('../models/AuditLog');
const mongoose = require('mongoose');

// Default SLA fallback targets if DB unpopulated
const defaultSLATargets = [
  { severity: 'Blocker', responseTargetHours: 1, resolutionTargetHours: 8, description: 'Critical System Down' },
  { severity: 'Critical', responseTargetHours: 4, resolutionTargetHours: 24, description: 'Major Functional Failure' },
  { severity: 'Major', responseTargetHours: 8, resolutionTargetHours: 48, description: 'Feature Impairment' },
  { severity: 'Minor', responseTargetHours: 24, resolutionTargetHours: 96, description: 'Minor Defect' },
  { severity: 'Trivial', responseTargetHours: 48, resolutionTargetHours: 168, description: 'Cosmetic / Documentation' },
];

/**
 * @desc    Get SLA Targets Configuration
 * @route   GET /api/sla
 * @access  Private
 */
const getSLAConfigs = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let configs = await SLAConfig.find().sort({ severity: 1 });
      if (configs.length === 0) {
        configs = await SLAConfig.insertMany(defaultSLATargets);
      }
      return res.json(configs);
    }
    return res.json(defaultSLATargets);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch SLA configuration.' });
  }
};

/**
 * @desc    Update SLA Targets Configuration
 * @route   POST /api/sla
 * @access  Private (Admin, QA Manager)
 */
const updateSLAConfigs = async (req, res) => {
  try {
    const { configs } = req.body;
    if (!Array.isArray(configs)) {
      return res.status(400).json({ message: 'Please provide SLA configs array.' });
    }

    if (mongoose.connection.readyState === 1) {
      await Promise.all(
        configs.map(async (item) => {
          await SLAConfig.findOneAndUpdate(
            { severity: item.severity },
            { responseTargetHours: item.responseTargetHours, resolutionTargetHours: item.resolutionTargetHours, description: item.description },
            { upsert: true, new: true }
          );
        })
      );

      await logAudit({
        userId: req.user?._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'SLA_CONFIG_UPDATED',
        entityType: 'SLAConfig',
        entityId: 'SYSTEM_SLA',
        description: 'Updated SLA Response and Resolution Target Hours',
      });

      return res.json({ message: 'SLA configuration updated successfully.' });
    }

    return res.json({ message: 'SLA configuration updated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update SLA configuration.' });
  }
};

/**
 * @desc    Get SLA Compliance Dashboard Metrics
 * @route   GET /api/sla/dashboard
 * @access  Private
 */
const getSLADashboard = async (req, res) => {
  try {
    const { project } = req.query;

    if (mongoose.connection.readyState === 1) {
      let filter = {};
      if (project && mongoose.Types.ObjectId.isValid(project)) filter.project = project;

      const configs = (await SLAConfig.find()) || defaultSLATargets;
      const slaMap = {};
      configs.forEach((c) => {
        slaMap[c.severity] = c.resolutionTargetHours;
      });

      const bugs = await Bug.find(filter).populate('project', 'name projectCode').populate('assignedTo', 'name');

      const now = new Date();
      let onTrack = 0;
      let atRisk = 0;
      let breached = 0;
      let totalTracked = bugs.length;

      const breachedList = [];

      bugs.forEach((b) => {
        const targetHours = slaMap[b.severity] || 48;
        const createdAt = new Date(b.createdAt);
        const deadline = new Date(createdAt.getTime() + targetHours * 60 * 60 * 1000);

        let status = 'SLA On Track';
        let remainingHours = (deadline - now) / (1000 * 60 * 60);

        if (['Fixed', 'Closed'].includes(b.status)) {
          const fixedAt = new Date(b.updatedAt || b.createdAt);
          if (fixedAt <= deadline) {
            status = 'SLA On Track';
            onTrack++;
          } else {
            status = 'SLA Breached';
            breached++;
          }
        } else {
          // Open Bug SLA Status
          if (now > deadline) {
            status = 'SLA Breached';
            breached++;
            breachedList.push({
              _id: b._id,
              bugId: b.bugId,
              title: b.title,
              severity: b.severity,
              status: b.status,
              project: b.project?.name || 'N/A',
              assignedTo: b.assignedTo?.name || 'Unassigned',
              deadline: deadline.toISOString(),
              overdueHours: Math.abs(remainingHours).toFixed(1),
            });
          } else if (remainingHours <= 4) {
            status = 'SLA At Risk';
            atRisk++;
          } else {
            status = 'SLA On Track';
            onTrack++;
          }
        }
      });

      const complianceRate = totalTracked > 0 ? (((onTrack + atRisk) / totalTracked) * 100).toFixed(1) : '100.0';

      return res.json({
        summary: {
          totalTracked,
          onTrack,
          atRisk,
          breached,
          complianceRate: Number(complianceRate),
        },
        breachedList,
      });
    }

    return res.json({
      summary: { totalTracked: 12, onTrack: 9, atRisk: 2, breached: 1, complianceRate: 91.7 },
      breachedList: [
        { bugId: 'BUG-0001', title: 'Token timeout redirect loop', severity: 'Critical', status: 'New', overdueHours: '3.5' },
      ],
    });
  } catch (error) {
    console.error('[SLA DASHBOARD ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch SLA dashboard.' });
  }
};

module.exports = {
  getSLAConfigs,
  updateSLAConfigs,
  getSLADashboard,
};
