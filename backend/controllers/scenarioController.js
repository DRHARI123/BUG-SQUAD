const Scenario = require('../models/Scenario');
const { logActivity } = require('../models/Activity');
const mongoose = require('mongoose');

// In-memory fallback scenario store
let memoryScenarios = [
  {
    _id: 'scn_101',
    scenarioId: 'SCN-0001',
    name: 'User Login & Session Persistence',
    description: 'Verify OAuth2 JWT authentication, password hashing, and token refresh mechanisms.',
    project: 'proj_1',
    module: 'mod_101',
    preconditions: 'User has an active account in system.',
    expectedBehavior: 'User logs in successfully and receives valid Bearer JWT.',
    createdAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
  },
  {
    _id: 'scn_102',
    scenarioId: 'SCN-0002',
    name: 'Checkout & Stripe Payment Authorization',
    description: 'Verify multi-item shopping cart pricing, tax calculations, and 3D Secure Stripe payment.',
    project: 'proj_1',
    module: 'mod_102',
    preconditions: 'User cart has at least 1 item.',
    expectedBehavior: 'Stripe tokenization succeeds and order confirmation email is queued.',
    createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
  },
];

const generateScenarioId = async () => {
  if (mongoose.connection.readyState === 1) {
    const lastScn = await Scenario.findOne().sort({ createdAt: -1 });
    if (!lastScn || !lastScn.scenarioId) return 'SCN-0001';
    const match = lastScn.scenarioId.match(/SCN-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `SCN-${String(nextNum).padStart(4, '0')}`;
    }
    return `SCN-${String(Date.now()).slice(-4)}`;
  }

  if (memoryScenarios.length === 0) return 'SCN-0001';
  const nums = memoryScenarios
    .map((s) => {
      const m = s.scenarioId?.match(/SCN-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  const maxNum = Math.max(...nums, 0);
  return `SCN-${String(maxNum + 1).padStart(4, '0')}`;
};

/**
 * @desc    Get scenarios (filtered by project & module)
 * @route   GET /api/scenarios
 * @access  Private
 */
const getScenarios = async (req, res) => {
  try {
    const { project, module: moduleFilter } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (project && mongoose.Types.ObjectId.isValid(project)) query.project = project;
      if (moduleFilter && mongoose.Types.ObjectId.isValid(moduleFilter)) query.module = moduleFilter;

      const scenarios = await Scenario.find(query)
        .populate('project', 'name projectCode')
        .populate('module', 'name')
        .sort({ createdAt: -1 });

      return res.json(scenarios);
    }

    let filtered = [...memoryScenarios];
    if (project && project !== 'All') {
      filtered = filtered.filter((s) => s.project === project || s.project?._id === project);
    }
    if (moduleFilter && moduleFilter !== 'All') {
      filtered = filtered.filter((s) => s.module === moduleFilter || s.module?._id === moduleFilter);
    }

    return res.json(filtered);
  } catch (error) {
    console.error('[GET SCENARIOS ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch scenarios.' });
  }
};

/**
 * @desc    Get scenario by ID
 * @route   GET /api/scenarios/:id
 * @access  Private
 */
const getScenarioById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const scenario = await Scenario.findById(id)
        .populate('project', 'name projectCode')
        .populate('module', 'name');
      if (!scenario) return res.status(404).json({ message: 'Scenario not found.' });
      return res.json(scenario);
    }

    const scn = memoryScenarios.find((s) => s._id === id || s.scenarioId === id.toUpperCase());
    if (!scn) return res.status(404).json({ message: 'Scenario not found.' });
    return res.json(scn);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch scenario.' });
  }
};

/**
 * @desc    Create new scenario
 * @route   POST /api/scenarios
 * @access  Private
 */
const createScenario = async (req, res) => {
  try {
    const { name, description, project, module: moduleInput, preconditions, expectedBehavior } = req.body;

    if (!name || !project || !moduleInput) {
      return res.status(400).json({ message: 'Please provide Scenario Name, Project, and Module.' });
    }

    const scnId = await generateScenarioId();

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(project)) {
      const scenario = await Scenario.create({
        scenarioId: scnId,
        name,
        description: description || '',
        project,
        module: moduleInput,
        preconditions: preconditions || '',
        expectedBehavior: expectedBehavior || '',
        createdBy: req.user?._id,
      });

      const populated = await Scenario.findById(scenario._id)
        .populate('project', 'name projectCode')
        .populate('module', 'name');

      await logActivity({
        action: 'SCENARIO_CREATED',
        message: `Created test scenario '${scnId}: ${name}'`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: project,
        entityType: 'System',
      });

      return res.status(201).json(populated);
    }

    const newScn = {
      _id: 'scn_' + Date.now(),
      scenarioId: scnId,
      name,
      description: description || '',
      project,
      module: moduleInput,
      preconditions: preconditions || '',
      expectedBehavior: expectedBehavior || '',
      createdAt: new Date().toISOString(),
    };

    memoryScenarios.unshift(newScn);

    await logActivity({
      action: 'SCENARIO_CREATED',
      message: `Created test scenario '${scnId}: ${name}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: project,
      entityType: 'System',
    });

    return res.status(201).json(newScn);
  } catch (error) {
    console.error('[CREATE SCENARIO ERROR]:', error);
    return res.status(500).json({ message: 'Unable to create scenario.' });
  }
};

/**
 * @desc    Update scenario
 * @route   PUT /api/scenarios/:id
 * @access  Private
 */
const updateScenario = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const scn = await Scenario.findById(id);
      if (!scn) return res.status(404).json({ message: 'Scenario not found.' });

      delete body.scenarioId;
      Object.assign(scn, body);
      await scn.save();

      return res.json(scn);
    }

    const index = memoryScenarios.findIndex((s) => s._id === id || s.scenarioId === id.toUpperCase());
    if (index === -1) return res.status(404).json({ message: 'Scenario not found.' });

    delete body.scenarioId;
    memoryScenarios[index] = {
      ...memoryScenarios[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return res.json(memoryScenarios[index]);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update scenario.' });
  }
};

/**
 * @desc    Delete scenario
 * @route   DELETE /api/scenarios/:id
 * @access  Private (Admin & QA Manager)
 */
const deleteScenario = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      await Scenario.findByIdAndDelete(id);
      return res.json({ message: 'Scenario deleted successfully.' });
    }

    const idx = memoryScenarios.findIndex((s) => s._id === id || s.scenarioId === id.toUpperCase());
    if (idx !== -1) memoryScenarios.splice(idx, 1);

    return res.json({ message: 'Scenario deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete scenario.' });
  }
};

module.exports = {
  getScenarios,
  getScenarioById,
  createScenario,
  updateScenario,
  deleteScenario,
  memoryScenarios,
};
