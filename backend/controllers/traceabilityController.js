const Requirement = require('../models/Requirement');
const TestCase = require('../models/TestCase');
const TestRun = require('../models/TestRun');
const Bug = require('../models/Bug');
const mongoose = require('mongoose');

/**
 * @desc    Get complete Requirement Traceability Matrix
 * @route   GET /api/traceability
 * @access  Private
 */
const getTraceabilityMatrix = async (req, res) => {
  try {
    const { project } = req.query;

    if (mongoose.connection.readyState === 1) {
      let reqQuery = {};
      if (project && mongoose.Types.ObjectId.isValid(project)) reqQuery.project = project;

      const requirements = await Requirement.find(reqQuery)
        .populate('project', 'name projectCode')
        .populate('module', 'name')
        .populate('testCases')
        .sort({ requirementId: 1 });

      const matrixRows = await Promise.all(
        requirements.map(async (reqItem) => {
          const tcList = reqItem.testCases || [];
          const tcIds = tcList.map((tc) => tc._id);

          // Find Test Runs containing any of these test cases
          const testRuns = await TestRun.find({ 'testCases.testCase': { $in: tcIds } })
            .select('testRunId name status');

          // Find Bugs linked to these test cases or requirements
          const bugs = await Bug.find({
            $or: [{ testCase: { $in: tcIds } }, { requirement: reqItem._id }],
          }).select('bugId title status severity');

          const passedCount = tcList.filter((tc) => tc.status === 'Passed').length;
          const failedCount = tcList.filter((tc) => tc.status === 'Failed').length;
          const blockedCount = tcList.filter((tc) => tc.status === 'Blocked').length;

          const isCovered = tcList.length > 0;

          return {
            requirementId: reqItem.requirementId,
            requirementTitle: reqItem.title,
            project: reqItem.project?.name || 'N/A',
            projectCode: reqItem.project?.projectCode || 'PROJ',
            type: reqItem.type,
            priority: reqItem.priority,
            status: reqItem.status,
            testCases: tcList.map((tc) => ({ id: tc._id, testCaseId: tc.testCaseId, title: tc.title, status: tc.status })),
            testRuns: testRuns.map((tr) => ({ id: tr._id, testRunId: tr.testRunId, name: tr.name, status: tr.status })),
            bugs: bugs.map((b) => ({ id: b._id, bugId: b.bugId, title: b.title, status: b.status, severity: b.severity })),
            passedCount,
            failedCount,
            blockedCount,
            isCovered,
          };
        })
      );

      const totalReqs = matrixRows.length;
      const coveredReqs = matrixRows.filter((r) => r.isCovered).length;
      const uncoveredReqs = totalReqs - coveredReqs;
      const coveragePercentage = totalReqs > 0 ? ((coveredReqs / totalReqs) * 100).toFixed(1) : '0.0';

      return res.json({
        summary: {
          totalReqs,
          coveredReqs,
          uncoveredReqs,
          coveragePercentage: Number(coveragePercentage),
        },
        matrix: matrixRows,
      });
    }

    // Memory Fallback
    return res.json({
      summary: { totalReqs: 1, coveredReqs: 1, uncoveredReqs: 0, coveragePercentage: 100 },
      matrix: [
        {
          requirementId: 'REQ-0001',
          requirementTitle: 'User Authentication Lifecycle Verification',
          project: 'E-Commerce QA Suite',
          projectCode: 'PROJ-EC',
          type: 'Functional',
          priority: 'P1 - Highest',
          status: 'Ready for Testing',
          testCases: [{ testCaseId: 'TC-0001', title: 'Verify JWT Expiration', status: 'Passed' }],
          testRuns: [{ testRunId: 'TR-0001', name: 'Regression Suite', status: 'Completed' }],
          bugs: [{ bugId: 'BUG-0001', title: 'Token Timeout Error', status: 'Fixed', severity: 'Major' }],
          passedCount: 1,
          failedCount: 0,
          blockedCount: 0,
          isCovered: true,
        },
      ],
    });
  } catch (error) {
    console.error('[GET TRACEABILITY MATRIX ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch traceability matrix.' });
  }
};

module.exports = {
  getTraceabilityMatrix,
};
