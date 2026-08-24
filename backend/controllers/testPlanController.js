const TestPlan = require('../models/TestPlan');
const { logAudit } = require('../models/AuditLog');
const mongoose = require('mongoose');

let memoryTestPlans = [];

const getTestPlans = async (req, res) => {
  try {
    const { project, status, search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (project && mongoose.Types.ObjectId.isValid(project)) query.project = project;
      if (status && status !== 'All') query.status = status;
      if (search) query.name = new RegExp(search, 'i');

      const total = await TestPlan.countDocuments(query);
      const testPlans = await TestPlan.find(query)
        .populate('project', 'name projectCode')
        .populate('owner', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      return res.json({ testPlans, page: pageNum, pages: Math.ceil(total / limitNum) || 1, total });
    }

    return res.json({ testPlans: memoryTestPlans, page: 1, pages: 1, total: memoryTestPlans.length });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch test plans.' });
  }
};

const getTestPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const plan = await TestPlan.findById(id)
        .populate('project', 'name projectCode')
        .populate('owner', 'name role')
        .populate('testers', 'name role email')
        .populate('testCases', 'testCaseId title status priority severity');

      if (!plan) return res.status(404).json({ message: 'Test Plan not found.' });
      return res.json(plan);
    }

    const plan = memoryTestPlans.find((tp) => tp._id === id || tp.testPlanId === id);
    if (!plan) return res.status(404).json({ message: 'Test Plan not found.' });
    return res.json(plan);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch test plan details.' });
  }
};

const createTestPlan = async (req, res) => {
  try {
    const { name, project, version, release, objective, scope, outOfScope, assumptions, risks, entryCriteria, exitCriteria, environment, startDate, endDate, owner, testers, testCases, status } = req.body;

    if (!name || !project) {
      return res.status(400).json({ message: 'Please provide Test Plan Name and Project.' });
    }

    if (mongoose.connection.readyState === 1) {
      const plan = await TestPlan.create({
        name,
        project,
        version: version || 'v1.0.0',
        release: release || null,
        objective: objective || '',
        scope: scope || '',
        outOfScope: outOfScope || '',
        assumptions: assumptions || '',
        risks: risks || '',
        entryCriteria: entryCriteria || '',
        exitCriteria: exitCriteria || '',
        environment: environment || 'QA Staging',
        startDate: startDate || null,
        endDate: endDate || null,
        owner: owner || req.user?._id,
        testers: Array.isArray(testers) ? testers : [],
        testCases: Array.isArray(testCases) ? testCases : [],
        status: status || 'Draft',
        createdBy: req.user?._id,
      });

      await logAudit({
        userId: req.user?._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'TEST_PLAN_CREATED',
        entityType: 'TestPlan',
        entityId: plan.testPlanId,
        description: `Created Test Plan '${plan.testPlanId}: ${plan.name}'`,
      });

      return res.status(201).json(plan);
    }

    const newPlan = {
      _id: 'tp_' + Date.now(),
      testPlanId: 'TP-000' + (memoryTestPlans.length + 1),
      name,
      project,
      status: status || 'Draft',
      createdAt: new Date().toISOString(),
    };
    memoryTestPlans.unshift(newPlan);
    return res.status(201).json(newPlan);
  } catch (error) {
    console.error('[CREATE TEST PLAN ERROR]:', error);
    return res.status(500).json({ message: 'Unable to create test plan.' });
  }
};

const updateTestPlan = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const plan = await TestPlan.findByIdAndUpdate(id, req.body, { new: true });
      if (!plan) return res.status(404).json({ message: 'Test Plan not found.' });
      return res.json(plan);
    }

    return res.json({ message: 'Test Plan updated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update test plan.' });
  }
};

const deleteTestPlan = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      await TestPlan.findByIdAndDelete(id);
      return res.json({ message: 'Test Plan deleted.' });
    }

    return res.json({ message: 'Test Plan deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete test plan.' });
  }
};

module.exports = {
  getTestPlans,
  getTestPlanById,
  createTestPlan,
  updateTestPlan,
  deleteTestPlan,
  memoryTestPlans,
};
