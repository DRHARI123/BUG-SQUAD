const Release = require('../models/Release');
const Bug = require('../models/Bug');
const TestCase = require('../models/TestCase');
const Requirement = require('../models/Requirement');
const { logAudit } = require('../models/AuditLog');
const mongoose = require('mongoose');

let memoryReleases = [];

const getReleases = async (req, res) => {
  try {
    const { project, status } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (project && mongoose.Types.ObjectId.isValid(project)) query.project = project;
      if (status && status !== 'All') query.status = status;

      const releases = await Release.find(query)
        .populate('project', 'name projectCode')
        .populate('owner', 'name role')
        .populate('signOff.signedOffBy', 'name role')
        .sort({ createdAt: -1 });

      return res.json(releases);
    }

    return res.json(memoryReleases);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch releases.' });
  }
};

const getReleaseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const release = await Release.findById(id)
        .populate('project', 'name projectCode')
        .populate('owner', 'name role email')
        .populate('signOff.signedOffBy', 'name role');

      if (!release) return res.status(404).json({ message: 'Release not found.' });

      // Compute Quality Metrics & Evaluate Quality Gates
      const projId = release.project._id || release.project;
      const totalBugs = await Bug.countDocuments({ project: projId });
      const openBugs = await Bug.countDocuments({ project: projId, status: { $in: ['New', 'Assigned', 'In Progress', 'Reopened'] } });
      const criticalBugs = await Bug.countDocuments({ project: projId, severity: 'Critical' });
      const blockerBugs = await Bug.countDocuments({ project: projId, severity: 'Blocker' });
      const resolvedBugs = await Bug.countDocuments({ project: projId, status: { $in: ['Fixed', 'Closed'] } });

      const totalTestCases = await TestCase.countDocuments({ project: projId });
      const passedTestCases = await TestCase.countDocuments({ project: projId, status: 'Passed' });
      const failedTestCases = await TestCase.countDocuments({ project: projId, status: 'Failed' });
      const blockedTestCases = await TestCase.countDocuments({ project: projId, status: 'Blocked' });
      const executedCount = passedTestCases + failedTestCases + blockedTestCases;

      const totalReqs = await Requirement.countDocuments({ project: projId });
      const coveredReqs = await Requirement.countDocuments({ project: projId, 'testCases.0': { $exists: true } });

      const passRate = executedCount > 0 ? ((passedTestCases / executedCount) * 100).toFixed(1) : '0.0';
      const executionRate = totalTestCases > 0 ? ((executedCount / totalTestCases) * 100).toFixed(1) : '0.0';
      const reqCoverage = totalReqs > 0 ? ((coveredReqs / totalReqs) * 100).toFixed(1) : '0.0';

      const cfg = release.qualityGateConfig || {};
      const gatePass =
        criticalBugs <= (cfg.maxCriticalBugs ?? 0) &&
        blockerBugs <= (cfg.maxBlockerBugs ?? 0) &&
        Number(passRate) >= (cfg.minPassRate ?? 85) &&
        Number(executionRate) >= (cfg.minExecutionRate ?? 90) &&
        Number(reqCoverage) >= (cfg.minRequirementCoverage ?? 80);

      // Quality Score formula = (PassRate * 0.4) + (ReqCoverage * 0.4) + (100 - OpenBugsRatio * 0.2)
      const qualityScore = (Number(passRate) * 0.4 + Number(reqCoverage) * 0.4 + Math.max(0, 100 - openBugs * 5) * 0.2).toFixed(1);

      return res.json({
        release,
        metrics: {
          totalBugs,
          openBugs,
          criticalBugs,
          blockerBugs,
          resolvedBugs,
          totalTestCases,
          passedTestCases,
          failedTestCases,
          blockedTestCases,
          executedCount,
          passRate: Number(passRate),
          executionRate: Number(executionRate),
          totalReqs,
          coveredReqs,
          reqCoverage: Number(reqCoverage),
          qualityScore: Number(qualityScore),
          qualityGateStatus: gatePass ? 'PASS' : 'FAIL',
        },
      });
    }

    const release = memoryReleases.find((r) => r._id === id || r.releaseId === id);
    if (!release) return res.status(404).json({ message: 'Release not found.' });
    return res.json({ release, metrics: {} });
  } catch (error) {
    console.error('[GET RELEASE ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch release details.' });
  }
};

const createRelease = async (req, res) => {
  try {
    const { name, version, project, description, releaseDate, status, owner, qualityGateConfig } = req.body;

    if (!name || !version || !project) {
      return res.status(400).json({ message: 'Please provide Release Name, Version, and Project.' });
    }

    if (mongoose.connection.readyState === 1) {
      const release = await Release.create({
        name,
        version,
        project,
        description: description || '',
        releaseDate: releaseDate || null,
        status: status || 'Planned',
        owner: owner || req.user?._id,
        qualityGateConfig: qualityGateConfig || {},
        createdBy: req.user?._id,
      });

      await logAudit({
        userId: req.user?._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'RELEASE_CREATED',
        entityType: 'Release',
        entityId: release.releaseId,
        description: `Created Release '${release.releaseId}: ${release.name} (${release.version})'`,
      });

      return res.status(201).json(release);
    }

    const newRelease = {
      _id: 'rel_' + Date.now(),
      releaseId: 'REL-000' + (memoryReleases.length + 1),
      name,
      version,
      project,
      status: status || 'Planned',
      createdAt: new Date().toISOString(),
    };
    memoryReleases.unshift(newRelease);
    return res.status(201).json(newRelease);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create release.' });
  }
};

/**
 * @desc    QA Manager Release Sign-Off
 * @route   POST /api/releases/:id/sign-off
 * @access  Private (Admin, QA Manager)
 */
const signOffRelease = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Sign-off status must be Approved or Rejected.' });
    }

    if (status === 'Rejected' && (!comments || !comments.trim())) {
      return res.status(400).json({ message: 'Rejection requires a comment reason.' });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const release = await Release.findById(id);
      if (!release) return res.status(404).json({ message: 'Release not found.' });

      release.signOff = {
        status,
        signedOffBy: req.user?._id,
        signedOffAt: new Date(),
        comments: comments || '',
      };

      if (status === 'Approved') release.status = 'Ready';
      await release.save();

      await logAudit({
        userId: req.user?._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'RELEASE_SIGN_OFF',
        entityType: 'Release',
        entityId: release.releaseId,
        description: `Release '${release.releaseId}' sign-off set to '${status}'`,
      });

      return res.json({ message: `Release sign-off status updated to ${status}`, release });
    }

    return res.json({ message: 'Sign-off completed.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to sign off release.' });
  }
};

const updateRelease = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const release = await Release.findByIdAndUpdate(id, req.body, { new: true });
      return res.json(release);
    }

    return res.json({ message: 'Release updated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update release.' });
  }
};

const deleteRelease = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      await Release.findByIdAndDelete(id);
      return res.json({ message: 'Release deleted.' });
    }

    return res.json({ message: 'Release deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete release.' });
  }
};

module.exports = {
  getReleases,
  getReleaseById,
  createRelease,
  signOffRelease,
  updateRelease,
  deleteRelease,
};
