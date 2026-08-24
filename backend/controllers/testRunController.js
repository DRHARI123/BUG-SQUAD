const TestRun = require('../models/TestRun');
const TestCase = require('../models/TestCase');
const { logAudit } = require('../models/AuditLog');
const mongoose = require('mongoose');

let memoryTestRuns = [];

const getTestRuns = async (req, res) => {
  try {
    const { project, status, environment, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (project && mongoose.Types.ObjectId.isValid(project)) query.project = project;
      if (status && status !== 'All') query.status = status;
      if (environment && environment !== 'All') query.environment = environment;

      const total = await TestRun.countDocuments(query);
      const testRuns = await TestRun.find(query)
        .populate('project', 'name projectCode')
        .populate('testPlan', 'name testPlanId')
        .populate('testSuite', 'name suiteId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      return res.json({ testRuns, page: pageNum, pages: Math.ceil(total / limitNum) || 1, total });
    }

    return res.json({ testRuns: memoryTestRuns, page: 1, pages: 1, total: memoryTestRuns.length });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch test runs.' });
  }
};

const getTestRunById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const run = await TestRun.findById(id)
        .populate('project', 'name projectCode')
        .populate('testPlan', 'name testPlanId')
        .populate('testSuite', 'name suiteId')
        .populate('assignedTesters', 'name role')
        .populate('testCases.testCase')
        .populate('testCases.executedBy', 'name role')
        .populate('testCases.linkedBug');

      if (!run) return res.status(404).json({ message: 'Test Run not found.' });
      return res.json(run);
    }

    const run = memoryTestRuns.find((tr) => tr._id === id || tr.testRunId === id);
    if (!run) return res.status(404).json({ message: 'Test Run not found.' });
    return res.json(run);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch test run details.' });
  }
};

const createTestRun = async (req, res) => {
  try {
    const { name, project, testPlan, testSuite, version, environment, browser, device, buildVersion, assignedTesters, testCases, status } = req.body;

    if (!name || !project) {
      return res.status(400).json({ message: 'Please provide Test Run Name and Project.' });
    }

    let initialCases = [];
    if (Array.isArray(testCases)) {
      initialCases = testCases.map((tcId) => ({
        testCase: tcId,
        result: 'Not Run',
        actualResult: '',
        executionNotes: '',
      }));
    }

    if (mongoose.connection.readyState === 1) {
      const run = await TestRun.create({
        name,
        project,
        testPlan: testPlan || null,
        testSuite: testSuite || null,
        version: version || 'v1.0.0',
        environment: environment || 'QA',
        browser: browser || 'Chrome',
        device: device || 'Desktop',
        buildVersion: buildVersion || 'b1.0.0',
        assignedTesters: Array.isArray(assignedTesters) ? assignedTesters : [],
        testCases: initialCases,
        status: status || 'Not Started',
        createdBy: req.user?._id,
      });

      await logAudit({
        userId: req.user?._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'TEST_RUN_CREATED',
        entityType: 'TestRun',
        entityId: run.testRunId,
        description: `Created Test Run '${run.testRunId}: ${run.name}'`,
      });

      return res.status(201).json(run);
    }

    const newRun = {
      _id: 'tr_' + Date.now(),
      testRunId: 'TR-000' + (memoryTestRuns.length + 1),
      name,
      project,
      status: 'Not Started',
      createdAt: new Date().toISOString(),
    };
    memoryTestRuns.unshift(newRun);
    return res.status(201).json(newRun);
  } catch (error) {
    console.error('[CREATE TEST RUN ERROR]:', error);
    return res.status(500).json({ message: 'Unable to create test run.' });
  }
};

/**
 * @desc    Execute individual test case in a test run
 * @route   POST /api/test-runs/:id/execute
 * @access  Private
 */
const executeTestCaseInRun = async (req, res) => {
  try {
    const { id } = req.params;
    const { testCaseId, result, actualResult, executionNotes, linkedBugId } = req.body;

    if (!testCaseId || !result) {
      return res.status(400).json({ message: 'Please provide testCaseId and result verdict.' });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const run = await TestRun.findById(id);
      if (!run) return res.status(404).json({ message: 'Test Run not found.' });

      const tcIndex = run.testCases.findIndex((tcItem) => tcItem.testCase.toString() === testCaseId);
      if (tcIndex === -1) {
        // Add case if not present
        run.testCases.push({
          testCase: testCaseId,
          result,
          actualResult: actualResult || '',
          executionNotes: executionNotes || '',
          linkedBug: linkedBugId || null,
          executedBy: req.user?._id,
          executedAt: new Date(),
        });
      } else {
        run.testCases[tcIndex].result = result;
        run.testCases[tcIndex].actualResult = actualResult || '';
        run.testCases[tcIndex].executionNotes = executionNotes || '';
        if (linkedBugId) run.testCases[tcIndex].linkedBug = linkedBugId;
        run.testCases[tcIndex].executedBy = req.user?._id;
        run.testCases[tcIndex].executedAt = new Date();
      }

      // Update test run status to Running if Not Started
      if (run.status === 'Not Started') run.status = 'Running';

      await run.save();

      // Update global TestCase status as well
      await TestCase.findByIdAndUpdate(testCaseId, { status: result === 'Passed' ? 'Passed' : result === 'Failed' ? 'Failed' : 'Blocked' });

      return res.json({ message: 'Test Case execution recorded in Test Run.', testRun: run });
    }

    return res.json({ message: 'Test Case execution recorded.' });
  } catch (error) {
    console.error('[EXECUTE RUN ERROR]:', error);
    return res.status(500).json({ message: 'Unable to record test execution.' });
  }
};

const updateTestRun = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const run = await TestRun.findByIdAndUpdate(id, req.body, { new: true });
      return res.json(run);
    }

    return res.json({ message: 'Test Run updated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update test run.' });
  }
};

const deleteTestRun = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      await TestRun.findByIdAndDelete(id);
      return res.json({ message: 'Test Run deleted.' });
    }

    return res.json({ message: 'Test Run deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete test run.' });
  }
};

module.exports = {
  getTestRuns,
  getTestRunById,
  createTestRun,
  executeTestCaseInRun,
  updateTestRun,
  deleteTestRun,
  memoryTestRuns,
};
