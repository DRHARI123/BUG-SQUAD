const Project = require('../models/Project');
const Module = require('../models/Module');
const { logActivity } = require('../models/Activity');
const mongoose = require('mongoose');

// Fallback in-memory project store
let memoryProjects = [
  {
    _id: 'proj_1',
    name: 'E-Commerce Platform Redesign',
    projectCode: 'EC-2026',
    description: 'Full-stack online storefront QA test suite, payment gateway integration, and inventory sync.',
    client: 'Apex Retail Inc.',
    startDate: '2026-01-15T00:00:00.000Z',
    endDate: '2026-11-30T00:00:00.000Z',
    status: 'Active',
    projectManager: { _id: 'demo_qa', name: 'Sarah Connor', email: 'qa@bugsquad.qa', role: 'QA Manager' },
    teamMembers: [
      { _id: 'demo_tester', name: 'John Doe', email: 'tester@bugsquad.qa', role: 'Tester' },
      { _id: 'demo_dev', name: 'David Miller', email: 'dev@bugsquad.qa', role: 'Developer' },
    ],
    bugCount: 24,
    testCaseCount: 110,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'proj_2',
    name: 'Mobile Banking iOS & Android',
    projectCode: 'MB-APP',
    description: 'Biometric login, fund transfers, check deposit OCR, and security penetration testing.',
    client: 'FinSecure Global',
    startDate: '2026-02-01T00:00:00.000Z',
    endDate: '2026-09-15T00:00:00.000Z',
    status: 'Active',
    projectManager: { _id: 'demo_admin', name: 'Alex Rivera', email: 'admin@bugsquad.qa', role: 'Admin' },
    teamMembers: [
      { _id: 'demo_qa', name: 'Sarah Connor', email: 'qa@bugsquad.qa', role: 'QA Manager' },
      { _id: 'demo_tester', name: 'John Doe', email: 'tester@bugsquad.qa', role: 'Tester' },
    ],
    bugCount: 18,
    testCaseCount: 95,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'proj_3',
    name: 'Healthcare Analytics API Gateway',
    projectCode: 'HC-GATEWAY',
    description: 'HIPAA compliant patient telemetry streaming API and diagnostic report generator.',
    client: 'BioHealth Systems',
    startDate: '2026-03-10T00:00:00.000Z',
    endDate: '2026-12-20T00:00:00.000Z',
    status: 'Planning',
    projectManager: { _id: 'demo_qa', name: 'Sarah Connor', email: 'qa@bugsquad.qa', role: 'QA Manager' },
    teamMembers: [
      { _id: 'demo_dev', name: 'David Miller', email: 'dev@bugsquad.qa', role: 'Developer' },
    ],
    bugCount: 5,
    testCaseCount: 40,
    createdAt: new Date().toISOString(),
  },
];

/**
 * @desc    Get all projects with search & status filter
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res) => {
  try {
    const { search, status } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};

      if (status && status !== 'All') {
        query.status = status;
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { name: searchRegex },
          { projectCode: searchRegex },
          { client: searchRegex },
        ];
      }

      const projects = await Project.find(query)
        .populate('projectManager', 'name email role')
        .populate('teamMembers', 'name email role')
        .sort({ createdAt: -1 });

      return res.json(projects);
    }

    // Memory Store filtering
    let filtered = [...memoryProjects];

    if (status && status !== 'All') {
      filtered = filtered.filter((p) => p.status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.projectCode.toLowerCase().includes(q) ||
          (p.client && p.client.toLowerCase().includes(q))
      );
    }

    return res.json(filtered);
  } catch (error) {
    console.error('[GET PROJECTS ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch projects.' });
  }
};

/**
 * @desc    Get single project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const project = await Project.findById(id)
        .populate('projectManager', 'name email role')
        .populate('teamMembers', 'name email role')
        .populate('createdBy', 'name email');

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Fetch modules count
      const moduleCount = await Module.countDocuments({ project: id });

      return res.json({
        ...project.toObject(),
        moduleCount,
        bugCount: 12, // Integrated in Phase 3
        testCaseCount: 45, // Integrated in Phase 4
      });
    }

    const project = memoryProjects.find((p) => p._id === id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.json({
      ...project,
      moduleCount: 4,
      bugCount: project.bugCount || 10,
      testCaseCount: project.testCaseCount || 35,
    });
  } catch (error) {
    console.error('[GET PROJECT BY ID ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch project details.' });
  }
};

/**
 * @desc    Create new project
 * @route   POST /api/projects
 * @access  Private (Admin & QA Manager)
 */
const createProject = async (req, res) => {
  try {
    const { name, projectCode, description, client, startDate, endDate, status, projectManager, teamMembers } = req.body;

    // Field Validation
    if (!name || !projectCode || !startDate || !status) {
      return res.status(400).json({
        message: 'Please provide Project Name, Project Code, Start Date, and Status.',
      });
    }

    const upperCode = projectCode.toUpperCase().trim();

    if (mongoose.connection.readyState === 1) {
      const existing = await Project.findOne({ projectCode: upperCode });
      if (existing) {
        return res.status(400).json({ message: `Project code '${upperCode}' already exists.` });
      }

      const project = await Project.create({
        name,
        projectCode: upperCode,
        description,
        client,
        startDate,
        endDate: endDate || null,
        status,
        projectManager: mongoose.Types.ObjectId.isValid(projectManager) ? projectManager : req.user?._id,
        teamMembers: Array.isArray(teamMembers)
          ? teamMembers.filter((t) => mongoose.Types.ObjectId.isValid(t))
          : [],
        createdBy: req.user?._id,
      });

      const populatedProject = await Project.findById(project._id)
        .populate('projectManager', 'name email role')
        .populate('teamMembers', 'name email role');

      await logActivity({
        action: 'PROJECT_CREATED',
        message: `Created project '${name}' (${upperCode})`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: project._id,
        entityType: 'Project',
      });

      return res.status(201).json(populatedProject);
    }

    // In-memory creation
    if (memoryProjects.some((p) => p.projectCode === upperCode)) {
      return res.status(400).json({ message: `Project code '${upperCode}' already exists.` });
    }

    const newProject = {
      _id: 'proj_' + Date.now(),
      name,
      projectCode: upperCode,
      description,
      client: client || 'Internal QA',
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || null,
      status: status || 'Active',
      projectManager: { _id: req.user?._id || 'demo_qa', name: req.user?.name || 'Sarah Connor', role: req.user?.role || 'QA Manager' },
      teamMembers: [],
      bugCount: 0,
      testCaseCount: 0,
      createdAt: new Date().toISOString(),
    };

    memoryProjects.unshift(newProject);

    await logActivity({
      action: 'PROJECT_CREATED',
      message: `Created project '${name}' (${upperCode})`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: newProject._id,
      entityType: 'Project',
    });

    return res.status(201).json(newProject);
  } catch (error) {
    console.error('[CREATE PROJECT ERROR]:', error);
    return res.status(500).json({ message: 'Unable to create project.' });
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private (Admin & QA Manager)
 */
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, projectCode, description, client, startDate, endDate, status, projectManager, teamMembers } = req.body;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const project = await Project.findById(id);

      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }

      if (projectCode && projectCode.toUpperCase() !== project.projectCode) {
        const existing = await Project.findOne({ projectCode: projectCode.toUpperCase() });
        if (existing) {
          return res.status(400).json({ message: `Project code '${projectCode}' is taken.` });
        }
      }

      project.name = name || project.name;
      project.projectCode = projectCode ? projectCode.toUpperCase() : project.projectCode;
      project.description = description !== undefined ? description : project.description;
      project.client = client !== undefined ? client : project.client;
      project.startDate = startDate || project.startDate;
      project.endDate = endDate !== undefined ? endDate : project.endDate;
      project.status = status || project.status;
      if (projectManager && mongoose.Types.ObjectId.isValid(projectManager)) {
        project.projectManager = projectManager;
      }
      if (Array.isArray(teamMembers)) {
        project.teamMembers = teamMembers.filter((t) => mongoose.Types.ObjectId.isValid(t));
      }

      await project.save();

      const updated = await Project.findById(id)
        .populate('projectManager', 'name email role')
        .populate('teamMembers', 'name email role');

      await logActivity({
        action: 'PROJECT_UPDATED',
        message: `Updated project '${project.name}' (${project.projectCode})`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: id,
        entityType: 'Project',
      });

      return res.json(updated);
    }

    const index = memoryProjects.findIndex((p) => p._id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    memoryProjects[index] = {
      ...memoryProjects[index],
      name: name || memoryProjects[index].name,
      projectCode: projectCode ? projectCode.toUpperCase() : memoryProjects[index].projectCode,
      description: description !== undefined ? description : memoryProjects[index].description,
      client: client !== undefined ? client : memoryProjects[index].client,
      startDate: startDate || memoryProjects[index].startDate,
      endDate: endDate !== undefined ? endDate : memoryProjects[index].endDate,
      status: status || memoryProjects[index].status,
      updatedAt: new Date().toISOString(),
    };

    await logActivity({
      action: 'PROJECT_UPDATED',
      message: `Updated project '${memoryProjects[index].name}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: id,
      entityType: 'Project',
    });

    return res.json(memoryProjects[index]);
  } catch (error) {
    console.error('[UPDATE PROJECT ERROR]:', error);
    return res.status(500).json({ message: 'Unable to update project.' });
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private (Admin & QA Manager)
 */
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const project = await Project.findById(id);

      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }

      await Project.findByIdAndDelete(id);
      await Module.deleteMany({ project: id });

      await logActivity({
        action: 'PROJECT_DELETED',
        message: `Deleted project '${project.name}' (${project.projectCode})`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: id,
        entityType: 'Project',
      });

      return res.json({ message: 'Project deleted successfully.' });
    }

    const index = memoryProjects.findIndex((p) => p._id === id);
    if (index === -1) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const deletedProj = memoryProjects[index];
    memoryProjects.splice(index, 1);

    await logActivity({
      action: 'PROJECT_DELETED',
      message: `Deleted project '${deletedProj.name}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: id,
      entityType: 'Project',
    });

    return res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    console.error('[DELETE PROJECT ERROR]:', error);
    return res.status(500).json({ message: 'Unable to delete project.' });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  memoryProjects,
};
