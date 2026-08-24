const TestSuite = require('../models/TestSuite');
const mongoose = require('mongoose');

let memoryTestSuites = [];

const getTestSuites = async (req, res) => {
  try {
    const { project, module: moduleFilter } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (project && mongoose.Types.ObjectId.isValid(project)) query.project = project;
      if (moduleFilter && mongoose.Types.ObjectId.isValid(moduleFilter)) query.module = moduleFilter;

      const suites = await TestSuite.find(query)
        .populate('project', 'name projectCode')
        .populate('module', 'name')
        .populate('testCases', 'testCaseId title status priority')
        .sort({ createdAt: -1 });

      return res.json(suites);
    }

    return res.json(memoryTestSuites);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch test suites.' });
  }
};

const getTestSuiteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const suite = await TestSuite.findById(id)
        .populate('project', 'name projectCode')
        .populate('module', 'name')
        .populate('testCases');

      if (!suite) return res.status(404).json({ message: 'Test Suite not found.' });
      return res.json(suite);
    }

    const suite = memoryTestSuites.find((s) => s._id === id);
    if (!suite) return res.status(404).json({ message: 'Test Suite not found.' });
    return res.json(suite);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch test suite.' });
  }
};

const createTestSuite = async (req, res) => {
  try {
    const { name, description, project, module: moduleVal, testPlan, testCases } = req.body;

    if (!name || !project) {
      return res.status(400).json({ message: 'Please provide Test Suite Name and Project.' });
    }

    if (mongoose.connection.readyState === 1) {
      const suite = await TestSuite.create({
        name,
        description: description || '',
        project,
        module: moduleVal || null,
        testPlan: testPlan || null,
        testCases: Array.isArray(testCases) ? testCases : [],
        createdBy: req.user?._id,
      });

      return res.status(201).json(suite);
    }

    const newSuite = {
      _id: 'suite_' + Date.now(),
      suiteId: 'SUITE-000' + (memoryTestSuites.length + 1),
      name,
      project,
      createdAt: new Date().toISOString(),
    };
    memoryTestSuites.unshift(newSuite);
    return res.status(201).json(newSuite);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create test suite.' });
  }
};

const updateTestSuite = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const suite = await TestSuite.findByIdAndUpdate(id, req.body, { new: true });
      return res.json(suite);
    }

    return res.json({ message: 'Test Suite updated.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update test suite.' });
  }
};

const deleteTestSuite = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      await TestSuite.findByIdAndDelete(id);
      return res.json({ message: 'Test Suite deleted.' });
    }

    return res.json({ message: 'Test Suite deleted.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete test suite.' });
  }
};

module.exports = {
  getTestSuites,
  getTestSuiteById,
  createTestSuite,
  updateTestSuite,
  deleteTestSuite,
};
