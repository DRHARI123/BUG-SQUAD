const Module = require('../models/Module');
const Project = require('../models/Project');
const { logActivity } = require('../models/Activity');
const mongoose = require('mongoose');

// Fallback in-memory module store
let memoryModules = [
  {
    _id: 'mod_101',
    name: 'Login & Authentication',
    description: 'OAuth2, JWT session validation, and 2FA SMS challenge',
    project: 'proj_1',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'mod_102',
    name: 'Shopping Cart & Checkout',
    description: 'Item reservation, discount codes, and multi-currency calculation',
    project: 'proj_1',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'mod_103',
    name: 'Stripe Payment Gateway',
    description: '3D Secure payment tokenization and refund handling',
    project: 'proj_1',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'mod_104',
    name: 'Biometric Login',
    description: 'FaceID and fingerprint token vault access',
    project: 'proj_2',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
];

/**
 * @desc    Get modules (optionally filtered by project)
 * @route   GET /api/modules
 * @access  Private
 */
const getModules = async (req, res) => {
  try {
    const { project } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (project && mongoose.Types.ObjectId.isValid(project)) {
        query.project = project;
      }

      const modules = await Module.find(query)
        .populate('project', 'name projectCode')
        .sort({ createdAt: -1 });

      return res.json(modules);
    }

    let filtered = [...memoryModules];
    if (project) {
      filtered = filtered.filter((m) => m.project === project);
    }

    return res.json(filtered);
  } catch (error) {
    console.error('[GET MODULES ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch modules.' });
  }
};

/**
 * @desc    Get single module
 * @route   GET /api/modules/:id
 * @access  Private
 */
const getModuleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const moduleItem = await Module.findById(id).populate('project', 'name projectCode');
      if (!moduleItem) return res.status(404).json({ message: 'Module not found.' });
      return res.json(moduleItem);
    }

    const mod = memoryModules.find((m) => m._id === id);
    if (!mod) return res.status(404).json({ message: 'Module not found.' });
    return res.json(mod);
  } catch (error) {
    console.error('[GET MODULE BY ID ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch module details.' });
  }
};

/**
 * @desc    Create new module
 * @route   POST /api/modules
 * @access  Private (Admin & QA Manager)
 */
const createModule = async (req, res) => {
  try {
    const { name, description, project, status } = req.body;

    if (!name || !project) {
      return res.status(400).json({ message: 'Module name and target project are required.' });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(project)) {
      const moduleItem = await Module.create({
        name,
        description,
        project,
        status: status || 'Active',
        createdBy: req.user?._id,
      });

      const populated = await Module.findById(moduleItem._id).populate('project', 'name projectCode');

      await logActivity({
        action: 'MODULE_CREATED',
        message: `Created module '${name}'`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: project,
        entityType: 'Module',
      });

      return res.status(201).json(populated);
    }

    // Memory creation
    const newModule = {
      _id: 'mod_' + Date.now(),
      name,
      description,
      project,
      status: status || 'Active',
      createdAt: new Date().toISOString(),
    };

    memoryModules.unshift(newModule);

    await logActivity({
      action: 'MODULE_CREATED',
      message: `Created module '${name}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: project,
      entityType: 'Module',
    });

    return res.status(201).json(newModule);
  } catch (error) {
    console.error('[CREATE MODULE ERROR]:', error);
    return res.status(500).json({ message: 'Unable to create module.' });
  }
};

/**
 * @desc    Update module
 * @route   PUT /api/modules/:id
 * @access  Private (Admin & QA Manager)
 */
const updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const moduleItem = await Module.findById(id);
      if (!moduleItem) return res.status(404).json({ message: 'Module not found.' });

      moduleItem.name = name || moduleItem.name;
      moduleItem.description = description !== undefined ? description : moduleItem.description;
      moduleItem.status = status || moduleItem.status;

      await moduleItem.save();

      await logActivity({
        action: 'MODULE_UPDATED',
        message: `Updated module '${moduleItem.name}'`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: moduleItem.project,
        entityType: 'Module',
      });

      return res.json(moduleItem);
    }

    const index = memoryModules.findIndex((m) => m._id === id);
    if (index === -1) return res.status(404).json({ message: 'Module not found.' });

    memoryModules[index] = {
      ...memoryModules[index],
      name: name || memoryModules[index].name,
      description: description !== undefined ? description : memoryModules[index].description,
      status: status || memoryModules[index].status,
      updatedAt: new Date().toISOString(),
    };

    await logActivity({
      action: 'MODULE_UPDATED',
      message: `Updated module '${memoryModules[index].name}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: memoryModules[index].project,
      entityType: 'Module',
    });

    return res.json(memoryModules[index]);
  } catch (error) {
    console.error('[UPDATE MODULE ERROR]:', error);
    return res.status(500).json({ message: 'Unable to update module.' });
  }
};

/**
 * @desc    Delete module
 * @route   DELETE /api/modules/:id
 * @access  Private (Admin & QA Manager)
 */
const deleteModule = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const moduleItem = await Module.findById(id);
      if (!moduleItem) return res.status(404).json({ message: 'Module not found.' });

      await Module.findByIdAndDelete(id);

      await logActivity({
        action: 'MODULE_DELETED',
        message: `Deleted module '${moduleItem.name}'`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: moduleItem.project,
        entityType: 'Module',
      });

      return res.json({ message: 'Module deleted successfully.' });
    }

    const index = memoryModules.findIndex((m) => m._id === id);
    if (index === -1) return res.status(404).json({ message: 'Module not found.' });

    const deletedMod = memoryModules[index];
    memoryModules.splice(index, 1);

    await logActivity({
      action: 'MODULE_DELETED',
      message: `Deleted module '${deletedMod.name}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: deletedMod.project,
      entityType: 'Module',
    });

    return res.json({ message: 'Module deleted successfully.' });
  } catch (error) {
    console.error('[DELETE MODULE ERROR]:', error);
    return res.status(500).json({ message: 'Unable to delete module.' });
  }
};

module.exports = {
  getModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  memoryModules,
};
