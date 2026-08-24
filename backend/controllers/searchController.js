const Bug = require('../models/Bug');
const TestCase = require('../models/TestCase');
const Requirement = require('../models/Requirement');
const Project = require('../models/Project');
const TestPlan = require('../models/TestPlan');
const TestRun = require('../models/TestRun');
const Release = require('../models/Release');
const mongoose = require('mongoose');

/**
 * @desc    Global Search across Bugs, Test Cases, Requirements, Projects, Test Plans, Test Runs, Releases
 * @route   GET /api/search
 * @access  Private
 */
const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.json({
        bugs: [],
        testCases: [],
        requirements: [],
        projects: [],
        testPlans: [],
        testRuns: [],
        releases: [],
        total: 0,
      });
    }

    const regex = new RegExp(q.trim(), 'i');

    if (mongoose.connection.readyState === 1) {
      const [bugs, testCases, requirements, projects, testPlans, testRuns, releases] = await Promise.all([
        Bug.find({ $or: [{ bugId: regex }, { title: regex }, { description: regex }] }).limit(5).select('bugId title status severity'),
        TestCase.find({ $or: [{ testCaseId: regex }, { title: regex }] }).limit(5).select('testCaseId title status priority'),
        Requirement.find({ $or: [{ requirementId: regex }, { title: regex }] }).limit(5).select('requirementId title status type'),
        Project.find({ $or: [{ projectCode: regex }, { name: regex }] }).limit(5).select('projectCode name status'),
        TestPlan.find({ $or: [{ testPlanId: regex }, { name: regex }] }).limit(5).select('testPlanId name status'),
        TestRun.find({ $or: [{ testRunId: regex }, { name: regex }] }).limit(5).select('testRunId name status'),
        Release.find({ $or: [{ releaseId: regex }, { name: regex }, { version: regex }] }).limit(5).select('releaseId name version status'),
      ]);

      const total = bugs.length + testCases.length + requirements.length + projects.length + testPlans.length + testRuns.length + releases.length;

      return res.json({
        bugs,
        testCases,
        requirements,
        projects,
        testPlans,
        testRuns,
        releases,
        total,
      });
    }

    return res.json({
      bugs: [],
      testCases: [],
      requirements: [],
      projects: [],
      testPlans: [],
      testRuns: [],
      releases: [],
      total: 0,
    });
  } catch (error) {
    console.error('[GLOBAL SEARCH ERROR]:', error);
    return res.status(500).json({ message: 'Unable to perform global search.' });
  }
};

module.exports = {
  globalSearch,
};
