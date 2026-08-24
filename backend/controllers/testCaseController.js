const TestCase = require('../models/TestCase');
const TestExecution = require('../models/TestExecution');
const Scenario = require('../models/Scenario');
const Bug = require('../models/Bug');
const { logActivity } = require('../models/Activity');
const { createNotification } = require('../models/Notification');
const { memoryBugs } = require('./bugController');
const mongoose = require('mongoose');

// In-memory fallback test case store
let memoryTestCases = [
  {
    _id: 'tc_1001',
    testCaseId: 'TC-0001',
    title: 'Verify OAuth2 JWT Authentication with Valid Credentials',
    description: 'Ensure user can authenticate with valid email and password and receive JWT token.',
    project: 'proj_1',
    projectName: 'E-Commerce Platform Redesign',
    module: 'mod_101',
    moduleName: 'Login & Authentication',
    scenario: 'scn_101',
    scenarioName: 'User Login & Session Persistence',
    preconditions: 'User account registered and active in database.',
    testSteps: [
      { stepNumber: 1, action: 'Navigate to login portal /login' },
      { stepNumber: 2, action: 'Enter email admin@bugsquad.qa' },
      { stepNumber: 3, action: 'Enter valid password admin123' },
      { stepNumber: 4, action: 'Click Submit Login button' },
    ],
    testData: 'Email: admin@bugsquad.qa, Pass: admin123',
    expectedResult: 'User receives HTTP 200 with JWT token and redirects to /dashboard.',
    actualResult: 'User authenticated successfully.',
    priority: 'P1 - Highest',
    severity: 'Critical',
    status: 'Passed',
    tester: { _id: 'demo_qa', name: 'Sarah Connor', email: 'qa@bugsquad.qa', role: 'QA Manager' },
    createdBy: { _id: 'demo_admin', name: 'Alex Rivera', role: 'Admin' },
    createdAt: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
  },
  {
    _id: 'tc_1002',
    testCaseId: 'TC-0002',
    title: 'Verify Multi-Currency Cart Price Rounding on Mobile Viewport',
    description: 'Check item total calculation when adding multiple items with discount vouchers on mobile screen.',
    project: 'proj_1',
    projectName: 'E-Commerce Platform Redesign',
    module: 'mod_102',
    moduleName: 'Shopping Cart & Checkout',
    scenario: 'scn_102',
    scenarioName: 'Checkout & Stripe Payment Authorization',
    preconditions: 'Cart contains 3 items.',
    testSteps: [
      { stepNumber: 1, action: 'Open cart page' },
      { stepNumber: 2, action: 'Apply coupon code SAVE20' },
      { stepNumber: 3, action: 'Verify subtotal and final tax calculation' },
    ],
    testData: 'Coupon: SAVE20, Items: [Product A, Product B]',
    expectedResult: 'Total accurately rounds to 2 decimal places without floating point error.',
    actualResult: 'Total displays 3 decimal places $19.999',
    priority: 'P2 - High',
    severity: 'Major',
    status: 'Failed',
    tester: { _id: 'demo_tester', name: 'John Doe', email: 'tester@bugsquad.qa', role: 'Tester' },
    createdBy: { _id: 'demo_qa', name: 'Sarah Connor', role: 'QA Manager' },
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  {
    _id: 'tc_1003',
    testCaseId: 'TC-0003',
    title: 'Verify Biometric TouchID Challenge Timeout',
    description: 'Verify security prompt automatically locks vault after 3 failed biometric scan attempts.',
    project: 'proj_2',
    projectName: 'Mobile Banking iOS & Android',
    module: 'mod_104',
    moduleName: 'Biometric Login',
    scenario: null,
    preconditions: 'Biometric scanning enabled in settings.',
    testSteps: [
      { stepNumber: 1, action: 'Trigger biometric prompt' },
      { stepNumber: 2, action: 'Provide invalid fingerprint 3 times' },
      { stepNumber: 3, action: 'Verify fallback password input appears' },
    ],
    testData: 'Device: iOS 17 Simulator',
    expectedResult: 'System falls back to Master PIN challenge after 3 attempts.',
    actualResult: 'Pending test execution.',
    priority: 'P3 - Medium',
    severity: 'Major',
    status: 'Not Run',
    tester: { _id: 'demo_dev', name: 'David Miller', email: 'dev@bugsquad.qa', role: 'Developer' },
    createdBy: { _id: 'demo_admin', name: 'Alex Rivera', role: 'Admin' },
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
];

let memoryExecutions = [
  {
    _id: 'exec_1001',
    executionId: 'EXEC-0001',
    testCase: 'tc_1001',
    tester: 'demo_qa',
    testerName: 'Sarah Connor',
    result: 'Passed',
    actualResult: 'User authenticated cleanly with HTTP 200.',
    executionNotes: 'Verified on Chrome v125 and Safari v17.',
    executedAt: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
  },
  {
    _id: 'exec_1002',
    executionId: 'EXEC-0002',
    testCase: 'tc_1002',
    tester: 'demo_tester',
    testerName: 'John Doe',
    result: 'Failed',
    actualResult: 'Total displays 3 decimal places $19.999',
    executionNotes: 'Floating point calculation error in cart Total widget.',
    executedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
];

// Helper: Auto-generate Test Case ID (TC-0001, TC-0002...)
const generateTestCaseId = async () => {
  if (mongoose.connection.readyState === 1) {
    const lastTc = await TestCase.findOne().sort({ createdAt: -1 });
    if (!lastTc || !lastTc.testCaseId) return 'TC-0001';
    const match = lastTc.testCaseId.match(/TC-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `TC-${String(nextNum).padStart(4, '0')}`;
    }
    return `TC-${String(Date.now()).slice(-4)}`;
  }

  if (memoryTestCases.length === 0) return 'TC-0001';
  const nums = memoryTestCases
    .map((tc) => {
      const m = tc.testCaseId?.match(/TC-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  const maxNum = Math.max(...nums, 0);
  return `TC-${String(maxNum + 1).padStart(4, '0')}`;
};

/**
 * @desc    Get test cases with search, filter, sort & pagination
 * @route   GET /api/test-cases
 * @access  Private
 */
const getTestCases = async (req, res) => {
  try {
    const {
      search,
      project,
      module: moduleFilter,
      scenario,
      priority,
      severity,
      status,
      tester,
      sort = 'newest',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (project && mongoose.Types.ObjectId.isValid(project)) query.project = project;
      if (moduleFilter && mongoose.Types.ObjectId.isValid(moduleFilter)) query.module = moduleFilter;
      if (scenario && mongoose.Types.ObjectId.isValid(scenario)) query.scenario = scenario;
      if (priority && priority !== 'All') query.priority = priority;
      if (severity && severity !== 'All') query.severity = severity;
      if (status && status !== 'All') query.status = status;
      if (tester && mongoose.Types.ObjectId.isValid(tester)) query.tester = tester;

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { testCaseId: searchRegex },
          { title: searchRegex },
          { description: searchRegex },
        ];
      }

      let sortOptions = { createdAt: -1 };
      if (sort === 'oldest') sortOptions = { createdAt: 1 };
      else if (sort === 'updated') sortOptions = { updatedAt: -1 };
      else if (sort === 'priority') sortOptions = { priority: 1 };
      else if (sort === 'severity') sortOptions = { severity: 1 };

      const total = await TestCase.countDocuments(query);
      const testCases = await TestCase.find(query)
        .populate('project', 'name projectCode')
        .populate('module', 'name')
        .populate('scenario', 'name scenarioId')
        .populate('tester', 'name email role')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum);

      return res.json({
        testCases,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        total,
      });
    }

    // In-memory Filter & Search
    let filtered = [...memoryTestCases];

    if (project && project !== 'All') {
      filtered = filtered.filter((tc) => tc.project === project || tc.project?._id === project);
    }
    if (moduleFilter && moduleFilter !== 'All') {
      filtered = filtered.filter((tc) => tc.module === moduleFilter || tc.module?._id === moduleFilter);
    }
    if (scenario && scenario !== 'All') {
      filtered = filtered.filter((tc) => tc.scenario === scenario || tc.scenario?._id === scenario);
    }
    if (priority && priority !== 'All') {
      filtered = filtered.filter((tc) => tc.priority === priority);
    }
    if (severity && severity !== 'All') {
      filtered = filtered.filter((tc) => tc.severity === severity);
    }
    if (status && status !== 'All') {
      filtered = filtered.filter((tc) => tc.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (tc) =>
          tc.testCaseId?.toLowerCase().includes(q) ||
          tc.title?.toLowerCase().includes(q) ||
          tc.description?.toLowerCase().includes(q)
      );
    }

    if (sort === 'oldest') filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sort === 'updated') filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    else filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limitNum);

    return res.json({
      testCases: paginated,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      total,
    });
  } catch (error) {
    console.error('[GET TEST CASES ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch test cases.' });
  }
};

/**
 * @desc    Get single test case with linked bugs
 * @route   GET /api/test-cases/:id
 * @access  Private
 */
const getTestCaseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let tc;
      if (mongoose.Types.ObjectId.isValid(id)) {
        tc = await TestCase.findById(id)
          .populate('project', 'name projectCode')
          .populate('module', 'name')
          .populate('scenario', 'name scenarioId')
          .populate('tester', 'name email role')
          .populate('createdBy', 'name email role');
      } else {
        tc = await TestCase.findOne({ testCaseId: id.toUpperCase() })
          .populate('project', 'name projectCode')
          .populate('module', 'name')
          .populate('scenario', 'name scenarioId')
          .populate('tester', 'name email role')
          .populate('createdBy', 'name email role');
      }

      if (!tc) return res.status(404).json({ message: 'Test Case not found.' });

      // Fetch linked bugs
      const linkedBugs = await Bug.find({ testCase: tc._id }).select('bugId title status severity priority');

      return res.json({
        ...tc.toObject(),
        linkedBugs,
      });
    }

    const tc = memoryTestCases.find((t) => t._id === id || t.testCaseId === id.toUpperCase());
    if (!tc) return res.status(404).json({ message: 'Test Case not found.' });

    const linkedBugs = memoryBugs
      .filter((b) => b.testCase === tc._id || b.testCase === tc.testCaseId)
      .map((b) => ({ _id: b._id, bugId: b.bugId, title: b.title, status: b.status, severity: b.severity }));

    return res.json({
      ...tc,
      linkedBugs,
    });
  } catch (error) {
    console.error('[GET TEST CASE BY ID ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch test case details.' });
  }
};

/**
 * @desc    Create new test case
 * @route   POST /api/test-cases
 * @access  Private
 */
const createTestCase = async (req, res) => {
  try {
    const {
      title,
      project,
      module: moduleInput,
      scenario,
      description,
      preconditions,
      testSteps,
      testData,
      expectedResult,
      priority,
      severity,
      tester,
    } = req.body;

    if (!title || !project || !moduleInput || !testSteps || !expectedResult || !priority || !tester) {
      return res.status(400).json({
        message: 'Please provide Project, Module, Title, Test Steps, Expected Result, Priority, and Tester.',
      });
    }

    const nextTcId = await generateTestCaseId();

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(project)) {
      const tc = await TestCase.create({
        testCaseId: nextTcId,
        title,
        project,
        module: moduleInput,
        scenario: mongoose.Types.ObjectId.isValid(scenario) ? scenario : null,
        description: description || '',
        preconditions: preconditions || '',
        testSteps: Array.isArray(testSteps) ? testSteps : [],
        testData: testData || '',
        expectedResult,
        priority: priority || 'P3 - Medium',
        severity: severity || 'Major',
        status: 'Not Run',
        tester,
        createdBy: req.user?._id,
      });

      const populated = await TestCase.findById(tc._id)
        .populate('project', 'name projectCode')
        .populate('module', 'name')
        .populate('scenario', 'name scenarioId')
        .populate('tester', 'name email role');

      await logActivity({
        action: 'TEST_CASE_CREATED',
        message: `Created test case '${nextTcId}: ${title}'`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: project,
        entityType: 'TestCase',
      });

      return res.status(201).json(populated);
    }

    // Memory creation
    const newTc = {
      _id: 'tc_' + Date.now(),
      testCaseId: nextTcId,
      title,
      project,
      projectName: 'QA Project Workspace',
      module: moduleInput,
      moduleName: 'General Module',
      scenario,
      description: description || '',
      preconditions: preconditions || '',
      testSteps: Array.isArray(testSteps) ? testSteps : [],
      testData: testData || '',
      expectedResult,
      actualResult: '',
      priority: priority || 'P3 - Medium',
      severity: severity || 'Major',
      status: 'Not Run',
      tester: { _id: tester, name: 'Assigned Tester', role: 'Tester' },
      createdBy: { _id: req.user?._id || 'demo_admin', name: req.user?.name || 'Alex Rivera' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryTestCases.unshift(newTc);

    await logActivity({
      action: 'TEST_CASE_CREATED',
      message: `Created test case '${nextTcId}: ${title}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: project,
      entityType: 'TestCase',
    });

    return res.status(201).json(newTc);
  } catch (error) {
    console.error('[CREATE TEST CASE ERROR]:', error);
    return res.status(500).json({ message: 'Unable to create test case.' });
  }
};

/**
 * @desc    Update test case
 * @route   PUT /api/test-cases/:id
 * @access  Private
 */
const updateTestCase = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const tc = await TestCase.findById(id);
      if (!tc) return res.status(404).json({ message: 'Test Case not found.' });

      delete body.testCaseId;
      Object.assign(tc, body);
      await tc.save();

      const updated = await TestCase.findById(id)
        .populate('project', 'name projectCode')
        .populate('module', 'name')
        .populate('scenario', 'name scenarioId')
        .populate('tester', 'name email role');

      await logActivity({
        action: 'TEST_CASE_EDITED',
        message: `Updated test case '${tc.testCaseId}'`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: tc.project,
        entityType: 'TestCase',
      });

      return res.json(updated);
    }

    const index = memoryTestCases.findIndex((t) => t._id === id || t.testCaseId === id.toUpperCase());
    if (index === -1) return res.status(404).json({ message: 'Test Case not found.' });

    delete body.testCaseId;
    memoryTestCases[index] = {
      ...memoryTestCases[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await logActivity({
      action: 'TEST_CASE_EDITED',
      message: `Updated test case '${memoryTestCases[index].testCaseId}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: memoryTestCases[index].project,
      entityType: 'TestCase',
    });

    return res.json(memoryTestCases[index]);
  } catch (error) {
    console.error('[UPDATE TEST CASE ERROR]:', error);
    return res.status(500).json({ message: 'Unable to update test case.' });
  }
};

/**
 * @desc    Delete test case
 * @route   DELETE /api/test-cases/:id
 * @access  Private (Admin & QA Manager)
 */
const deleteTestCase = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const tc = await TestCase.findById(id);
      if (!tc) return res.status(404).json({ message: 'Test Case not found.' });

      await TestCase.findByIdAndDelete(id);

      await logActivity({
        action: 'TEST_CASE_DELETED',
        message: `Deleted test case '${tc.testCaseId}'`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: tc.project,
        entityType: 'TestCase',
      });

      return res.json({ message: `Test case ${tc.testCaseId} deleted successfully.` });
    }

    const index = memoryTestCases.findIndex((t) => t._id === id || t.testCaseId === id.toUpperCase());
    if (index === -1) return res.status(404).json({ message: 'Test Case not found.' });

    const deleted = memoryTestCases[index];
    memoryTestCases.splice(index, 1);

    await logActivity({
      action: 'TEST_CASE_DELETED',
      message: `Deleted test case '${deleted.testCaseId}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: deleted.project,
      entityType: 'TestCase',
    });

    return res.json({ message: `Test case ${deleted.testCaseId} deleted successfully.` });
  } catch (error) {
    console.error('[DELETE TEST CASE ERROR]:', error);
    return res.status(500).json({ message: 'Unable to delete test case.' });
  }
};

/**
 * @desc    Duplicate test case
 * @route   POST /api/test-cases/:id/duplicate
 * @access  Private
 */
const duplicateTestCase = async (req, res) => {
  try {
    const { id } = req.params;
    const nextTcId = await generateTestCaseId();

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const existing = await TestCase.findById(id);
      if (!existing) return res.status(404).json({ message: 'Test Case not found.' });

      const newTc = await TestCase.create({
        testCaseId: nextTcId,
        title: `${existing.title} (Copy)`,
        project: existing.project,
        module: existing.module,
        scenario: existing.scenario,
        description: existing.description,
        preconditions: existing.preconditions,
        testSteps: existing.testSteps,
        testData: existing.testData,
        expectedResult: existing.expectedResult,
        priority: existing.priority,
        severity: existing.severity,
        status: 'Not Run',
        tester: existing.tester,
        createdBy: req.user?._id,
      });

      await logActivity({
        action: 'TEST_CASE_DUPLICATED',
        message: `Duplicated test case '${existing.testCaseId}' to '${nextTcId}'`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: existing.project,
        entityType: 'TestCase',
      });

      return res.status(201).json(newTc);
    }

    const existingMem = memoryTestCases.find((t) => t._id === id || t.testCaseId === id.toUpperCase());
    if (!existingMem) return res.status(404).json({ message: 'Test Case not found.' });

    const newMemTc = {
      ...existingMem,
      _id: 'tc_' + Date.now(),
      testCaseId: nextTcId,
      title: `${existingMem.title} (Copy)`,
      status: 'Not Run',
      actualResult: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryTestCases.unshift(newMemTc);

    await logActivity({
      action: 'TEST_CASE_DUPLICATED',
      message: `Duplicated test case '${existingMem.testCaseId}' to '${nextTcId}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: existingMem.project,
      entityType: 'TestCase',
    });

    return res.status(201).json(newMemTc);
  } catch (error) {
    console.error('[DUPLICATE TEST CASE ERROR]:', error);
    return res.status(500).json({ message: 'Unable to duplicate test case.' });
  }
};

/**
 * @desc    Get execution history for a test case
 * @route   GET /api/test-cases/:id/executions
 * @access  Private
 */
const getTestExecutions = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const executions = await TestExecution.find({ testCase: id })
        .populate('tester', 'name email role')
        .sort({ executedAt: -1 });
      return res.json(executions);
    }

    const filtered = memoryExecutions.filter(
      (e) => e.testCase === id || e.testCase === id.toUpperCase()
    );
    return res.json(filtered);
  } catch (error) {
    console.error('[GET EXECUTIONS ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch execution history.' });
  }
};

/**
 * @desc    Record test execution
 * @route   POST /api/test-cases/:id/executions
 * @access  Private
 */
const executeTestCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { result, actualResult, executionNotes } = req.body;

    if (!result) {
      return res.status(400).json({ message: 'Execution result status is required.' });
    }

    const execId = `EXEC-${String(Date.now()).slice(-4)}`;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const tc = await TestCase.findById(id);
      if (!tc) return res.status(404).json({ message: 'Test Case not found.' });

      const execution = await TestExecution.create({
        executionId: execId,
        testCase: id,
        tester: req.user?._id,
        testerName: req.user?.name,
        result,
        actualResult: actualResult || tc.actualResult || '',
        executionNotes: executionNotes || '',
        executedAt: new Date(),
      });

      tc.status = result;
      if (actualResult) tc.actualResult = actualResult;
      await tc.save();

      await logActivity({
        action: 'TEST_EXECUTED',
        message: `Executed test case '${tc.testCaseId}' with result '${result}'`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: tc.project,
        entityType: 'TestCase',
      });

      return res.status(201).json(execution);
    }

    const index = memoryTestCases.findIndex((t) => t._id === id || t.testCaseId === id.toUpperCase());
    if (index === -1) return res.status(404).json({ message: 'Test Case not found.' });

    memoryTestCases[index].status = result;
    if (actualResult) memoryTestCases[index].actualResult = actualResult;
    memoryTestCases[index].updatedAt = new Date().toISOString();

    const newExec = {
      _id: 'exec_' + Date.now(),
      executionId: execId,
      testCase: id,
      tester: req.user?._id || 'demo_tester',
      testerName: req.user?.name || 'Sarah Connor',
      result,
      actualResult: actualResult || memoryTestCases[index].actualResult || '',
      executionNotes: executionNotes || '',
      executedAt: new Date().toISOString(),
    };

    memoryExecutions.unshift(newExec);

    await logActivity({
      action: 'TEST_EXECUTED',
      message: `Executed test case '${memoryTestCases[index].testCaseId}' with result '${result}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: memoryTestCases[index].project,
      entityType: 'TestCase',
    });

    return res.status(201).json(newExec);
  } catch (error) {
    console.error('[EXECUTE TEST CASE ERROR]:', error);
    return res.status(500).json({ message: 'Unable to record test execution.' });
  }
};

module.exports = {
  getTestCases,
  getTestCaseById,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  duplicateTestCase,
  getTestExecutions,
  executeTestCase,
  memoryTestCases,
  memoryExecutions,
};
