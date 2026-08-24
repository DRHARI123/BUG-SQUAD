const Requirement = require('../models/Requirement');
const TestCase = require('../models/TestCase');
const { logAudit } = require('../models/AuditLog');
const mongoose = require('mongoose');

let memoryRequirements = [];

const getRequirements = async (req, res) => {
  try {
    const { project, module: moduleVal, type, status, priority, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (project && mongoose.Types.ObjectId.isValid(project)) query.project = project;
      if (moduleVal && mongoose.Types.ObjectId.isValid(moduleVal)) query.module = moduleVal;
      if (type && type !== 'All') query.type = type;
      if (status && status !== 'All') query.status = status;
      if (priority && priority !== 'All') query.priority = priority;

      const total = await Requirement.countDocuments(query);
      const requirements = await Requirement.find(query)
        .populate('project', 'name projectCode')
        .populate('module', 'name')
        .populate('owner', 'name role')
        .populate('testCases', 'testCaseId title status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      return res.json({ requirements, page: pageNum, pages: Math.ceil(total / limitNum) || 1, total });
    }

    return res.json({ requirements: memoryRequirements, page: 1, pages: 1, total: memoryRequirements.length });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch requirements.' });
  }
};

const getRequirementById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const reqDoc = await Requirement.findById(id)
        .populate('project', 'name projectCode')
        .populate('module', 'name')
        .populate('owner', 'name role email')
        .populate('testCases');

      if (!reqDoc) return res.status(404).json({ message: 'Requirement not found.' });
      return res.json(reqDoc);
    }

    const reqDoc = memoryRequirements.find((r) => r._id === id || r.requirementId === id);
    if (!reqDoc) return res.status(404).json({ message: 'Requirement not found.' });
    return res.json(reqDoc);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch requirement details.' });
  }
};

const createRequirement = async (req, res) => {
  try {
    const { title, description, project, module: moduleVal, type, priority, status, acceptanceCriteria, owner, testCases } = req.body;

    if (!title || !project) {
      return res.status(400).json({ message: 'Please provide Requirement Title and Project.' });
    }

    if (mongoose.connection.readyState === 1) {
      const reqDoc = await Requirement.create({
        title,
        description: description || '',
        project,
        module: moduleVal || null,
        type: type || 'Functional',
        priority: priority || 'P3 - Medium',
        status: status || 'Draft',
        acceptanceCriteria: acceptanceCriteria || '',
        owner: owner || req.user?._id,
        testCases: Array.isArray(testCases) ? testCases : [],
        createdBy: req.user?._id,
      });

      await logAudit({
        userId: req.user?._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'REQUIREMENT_CREATED',
        entityType: 'Requirement',
        entityId: reqDoc.requirementId,
        description: `Created Requirement '${reqDoc.requirementId}: ${reqDoc.title}'`,
      });

      return res.status(201).json(reqDoc);
    }

    const newReq = {
      _id: 'req_' + Date.now(),
      requirementId: 'REQ-000' + (memoryRequirements.length + 1),
      title,
      project,
      status: status || 'Draft',
      createdAt: new Date().toISOString(),
    };
    memoryRequirements.unshift(newReq);
    return res.status(201).json(newReq);
  } catch (error) {
    console.error('[CREATE REQUIREMENT ERROR]:', error);
    return res.status(500).json({ message: 'Unable to create requirement.' });
  }
};

const updateRequirement = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const reqDoc = await Requirement.findByIdAndUpdate(id, req.body, { new: true });
      return res.json(reqDoc);
    }

    return res.json({ message: 'Requirement updated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update requirement.' });
  }
};

const deleteRequirement = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      await Requirement.findByIdAndDelete(id);
      return res.json({ message: 'Requirement deleted.' });
    }

    return res.json({ message: 'Requirement deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete requirement.' });
  }
};

module.exports = {
  getRequirements,
  getRequirementById,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  memoryRequirements,
};
