const Bug = require('../models/Bug');
const Comment = require('../models/Comment');
const Project = require('../models/Project');
const Module = require('../models/Module');
const User = require('../models/User');
const { logActivity } = require('../models/Activity');
const { createNotification } = require('../models/Notification');
const mongoose = require('mongoose');

// In-memory fallback bug store
let memoryBugs = [
  {
    _id: 'bug_db_1001',
    bugId: 'BUG-0001',
    title: 'Authentication token expiration causes infinite loop redirect',
    description: 'When JWT token expires while browsing product catalog, application enters rapid refresh loop instead of redirecting gracefully to /login page.',
    project: 'proj_1',
    projectName: 'E-Commerce Platform Redesign',
    module: 'mod_101',
    moduleName: 'Login & Authentication',
    environment: 'Production',
    browser: 'Chrome 125',
    device: 'Desktop',
    operatingSystem: 'Windows 11',
    version: 'v1.4.2',
    reporter: { _id: 'demo_tester', name: 'John Doe', email: 'tester@bugsquad.qa', role: 'Tester' },
    assignedTo: { _id: 'demo_qa', name: 'Sarah Connor', email: 'qa@bugsquad.qa', role: 'QA Manager' },
    severity: 'Critical',
    priority: 'P1 - Highest',
    status: 'New',
    reproducibility: 'Always',
    preconditions: 'User is authenticated and session is idle for 60 minutes.',
    stepsToReproduce: '1. Log into portal\n2. Wait for token expiration (60m)\n3. Click on Cart link\n4. Observe URL bar flickering rapidly.',
    testData: 'Account: testuser@store.com',
    expectedResult: 'Clear toast error message and clean redirect to /login.',
    actualResult: 'Browser crashes after 50+ rapid page reload loops.',
    attachments: [{ name: 'console_err.log', url: '/demo_log.txt', fileType: 'document' }],
    beforeScreenshot: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=60',
    afterScreenshot: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    _id: 'bug_db_1002',
    bugId: 'BUG-0002',
    title: 'Dashboard metrics cards flickering on window resize',
    description: 'Re-rendering loop triggered by window resize handler in Dashboard component when browser width is under 768px.',
    project: 'proj_2',
    projectName: 'Mobile Banking iOS & Android',
    module: 'mod_104',
    moduleName: 'Biometric Login',
    environment: 'QA',
    browser: 'Safari Mobile',
    device: 'iPhone 15 Pro',
    operatingSystem: 'iOS 17.4',
    version: 'v2.1.0',
    reporter: { _id: 'demo_qa', name: 'Sarah Connor', email: 'qa@bugsquad.qa', role: 'QA Manager' },
    assignedTo: { _id: 'demo_dev', name: 'David Miller', email: 'dev@bugsquad.qa', role: 'Developer' },
    severity: 'Major',
    priority: 'P2 - High',
    status: 'In Progress',
    reproducibility: 'Sometimes',
    preconditions: 'Open dashboard on mobile device in landscape mode.',
    stepsToReproduce: '1. Open dashboard\n2. Rotate device to portrait\n3. Observe card container oscillation.',
    testData: 'Viewport: 375x812',
    expectedResult: 'Fluid grid layout transition without visible layout shift.',
    actualResult: 'UI flashes 3 times before stabilizing.',
    attachments: [],
    beforeScreenshot: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=60',
    afterScreenshot: '',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    _id: 'bug_db_1003',
    bugId: 'BUG-0003',
    title: 'Export PDF test result report drops background images',
    description: 'PDF generator utility strips custom header logos and canvas charts when generating downloadable QA telemetry reports.',
    project: 'proj_3',
    projectName: 'Healthcare Analytics API Gateway',
    module: 'mod_103',
    moduleName: 'Stripe Payment Gateway',
    environment: 'Staging',
    browser: 'Firefox 126',
    device: 'Desktop',
    operatingSystem: 'macOS Sonoma',
    version: 'v0.9.5',
    reporter: { _id: 'demo_admin', name: 'Alex Rivera', email: 'admin@bugsquad.qa', role: 'Admin' },
    assignedTo: { _id: 'demo_tester', name: 'John Doe', email: 'tester@bugsquad.qa', role: 'Tester' },
    severity: 'Minor',
    priority: 'P3 - Medium',
    status: 'Fixed',
    reproducibility: 'Always',
    preconditions: 'QA Report generated with dark theme charts.',
    stepsToReproduce: '1. Click Export PDF button\n2. Open downloaded PDF file\n3. Verify page 1 header.',
    testData: 'Report ID: REP-9941',
    expectedResult: 'PDF contains high resolution charts and company logo.',
    actualResult: 'Charts rendered as blank white boxes in PDF output.',
    attachments: [],
    beforeScreenshot: '',
    afterScreenshot: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60',
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

let memoryComments = [
  {
    _id: 'comm_1',
    bug: 'bug_db_1001',
    bugId: 'BUG-0001',
    user: 'demo_qa',
    userName: 'Sarah Connor',
    userRole: 'QA Manager',
    comment: 'Reproduced on Chrome 125 on Windows 11. Assigning to David Miller for immediate hotfix investigation.',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    _id: 'comm_2',
    bug: 'bug_db_1001',
    bugId: 'BUG-0001',
    user: 'demo_dev',
    userName: 'David Miller',
    userRole: 'Developer',
    comment: 'Identified root cause: authMiddleware token expiration missing 401 interceptor response check.',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
];

// Helper: Auto-generate Bug ID (BUG-0001, BUG-0002...)
const generateBugId = async () => {
  if (mongoose.connection.readyState === 1) {
    const lastBug = await Bug.findOne().sort({ createdAt: -1 });
    if (!lastBug || !lastBug.bugId) {
      return 'BUG-0001';
    }
    const match = lastBug.bugId.match(/BUG-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `BUG-${String(nextNum).padStart(4, '0')}`;
    }
    return `BUG-${String(Date.now()).slice(-4)}`;
  }

  // Memory calculation
  if (memoryBugs.length === 0) return 'BUG-0001';
  const nums = memoryBugs
    .map((b) => {
      const m = b.bugId?.match(/BUG-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  const maxNum = Math.max(...nums, 0);
  return `BUG-${String(maxNum + 1).padStart(4, '0')}`;
};

/**
 * @desc    Get all bugs with search, filtering, sorting & pagination
 * @route   GET /api/bugs
 * @access  Private
 */
const getBugs = async (req, res) => {
  try {
    const {
      search,
      project,
      module: moduleFilter,
      severity,
      priority,
      status,
      assignedTo,
      reporter,
      environment,
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
      if (severity && severity !== 'All') query.severity = severity;
      if (priority && priority !== 'All') query.priority = priority;
      if (status && status !== 'All') query.status = status;
      if (environment && environment !== 'All') query.environment = environment;
      if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) query.assignedTo = assignedTo;
      if (reporter && mongoose.Types.ObjectId.isValid(reporter)) query.reporter = reporter;

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { bugId: searchRegex },
          { title: searchRegex },
          { description: searchRegex },
        ];
      }

      let sortOptions = { createdAt: -1 };
      if (sort === 'oldest') sortOptions = { createdAt: 1 };
      else if (sort === 'updated') sortOptions = { updatedAt: -1 };
      else if (sort === 'severity') sortOptions = { severity: 1 };
      else if (sort === 'priority') sortOptions = { priority: 1 };

      const total = await Bug.countDocuments(query);
      const bugs = await Bug.find(query)
        .populate('project', 'name projectCode')
        .populate('module', 'name')
        .populate('reporter', 'name email role')
        .populate('assignedTo', 'name email role')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum);

      return res.json({
        bugs,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        total,
      });
    }

    // In-memory Store Filter & Search
    let filtered = [...memoryBugs];

    if (project && project !== 'All') {
      filtered = filtered.filter((b) => b.project === project || b.project?._id === project);
    }
    if (moduleFilter && moduleFilter !== 'All') {
      filtered = filtered.filter((b) => b.module === moduleFilter || b.module?._id === moduleFilter);
    }
    if (severity && severity !== 'All') {
      filtered = filtered.filter((b) => b.severity === severity);
    }
    if (priority && priority !== 'All') {
      filtered = filtered.filter((b) => b.priority === priority);
    }
    if (status && status !== 'All') {
      filtered = filtered.filter((b) => b.status === status);
    }
    if (environment && environment !== 'All') {
      filtered = filtered.filter((b) => b.environment === environment);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.bugId?.toLowerCase().includes(q) ||
          b.title?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sort === 'oldest') filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sort === 'updated') filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    else filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = filtered.length;
    const paginatedBugs = filtered.slice(skip, skip + limitNum);

    return res.json({
      bugs: paginatedBugs,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      total,
    });
  } catch (error) {
    console.error('[GET BUGS ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch bugs.' });
  }
};

/**
 * @desc    Get bug by ID or bugId string (e.g., BUG-0001)
 * @route   GET /api/bugs/:id
 * @access  Private
 */
const getBugById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      let bug;
      if (mongoose.Types.ObjectId.isValid(id)) {
        bug = await Bug.findById(id)
          .populate('project', 'name projectCode')
          .populate('module', 'name')
          .populate('reporter', 'name email role')
          .populate('assignedTo', 'name email role');
      } else {
        bug = await Bug.findOne({ bugId: id.toUpperCase() })
          .populate('project', 'name projectCode')
          .populate('module', 'name')
          .populate('reporter', 'name email role')
          .populate('assignedTo', 'name email role');
      }

      if (!bug) return res.status(404).json({ message: 'Bug not found.' });
      return res.json(bug);
    }

    const bug = memoryBugs.find((b) => b._id === id || b.bugId === id.toUpperCase());
    if (!bug) return res.status(404).json({ message: 'Bug not found.' });
    return res.json(bug);
  } catch (error) {
    console.error('[GET BUG BY ID ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch bug details.' });
  }
};

/**
 * @desc    Create new bug
 * @route   POST /api/bugs
 * @access  Private
 */
const createBug = async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      module: moduleInput,
      environment,
      browser,
      device,
      operatingSystem,
      version,
      assignedTo,
      severity,
      priority,
      reproducibility,
      preconditions,
      stepsToReproduce,
      testData,
      expectedResult,
      actualResult,
      attachments,
      beforeScreenshot,
      afterScreenshot,
    } = req.body;

    if (!title || !description || !project || !moduleInput) {
      return res.status(400).json({
        message: 'Please provide Project, Module, Bug Title, and Description.',
      });
    }

    const nextBugId = await generateBugId();

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(project)) {
      const bug = await Bug.create({
        bugId: nextBugId,
        title,
        description,
        project,
        module: moduleInput,
        environment: environment || 'QA',
        browser: browser || 'Chrome',
        device: device || 'Desktop',
        operatingSystem: operatingSystem || 'Windows 11',
        version: version || 'v1.0.0',
        reporter: req.user?._id,
        assignedTo: mongoose.Types.ObjectId.isValid(assignedTo) ? assignedTo : null,
        severity: severity || 'Major',
        priority: priority || 'P3 - Medium',
        status: assignedTo ? 'Assigned' : 'New',
        reproducibility: reproducibility || 'Always',
        preconditions: preconditions || '',
        stepsToReproduce: stepsToReproduce || '',
        testData: testData || '',
        expectedResult: expectedResult || '',
        actualResult: actualResult || '',
        attachments: Array.isArray(attachments) ? attachments : [],
        beforeScreenshot: beforeScreenshot || '',
        afterScreenshot: afterScreenshot || '',
      });

      const populatedBug = await Bug.findById(bug._id)
        .populate('project', 'name projectCode')
        .populate('module', 'name')
        .populate('reporter', 'name email role')
        .populate('assignedTo', 'name email role');

      await logActivity({
        action: 'BUG_REPORTED',
        message: `Reported bug '${nextBugId}: ${title}'`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: project,
        entityType: 'Bug',
      });

      if (assignedTo) {
        await createNotification({
          recipient: assignedTo,
          sender: req.user?._id,
          message: `You were assigned bug ${nextBugId}: '${title}'`,
          type: 'BUG_ASSIGNED',
          relatedBug: nextBugId,
        });
      }

      return res.status(201).json(populatedBug);
    }

    // Memory creation fallback
    const newBug = {
      _id: 'bug_' + Date.now(),
      bugId: nextBugId,
      title,
      description,
      project: typeof project === 'object' ? project._id : project,
      projectName: 'QA Project Workspace',
      module: typeof moduleInput === 'object' ? moduleInput._id : moduleInput,
      moduleName: 'General Module',
      environment: environment || 'QA',
      browser: browser || 'Chrome',
      device: device || 'Desktop',
      operatingSystem: operatingSystem || 'Windows 11',
      version: version || 'v1.0.0',
      reporter: {
        _id: req.user?._id || 'demo_tester',
        name: req.user?.name || 'Sarah Connor',
        email: req.user?.email || 'qa@bugsquad.qa',
        role: req.user?.role || 'QA Manager',
      },
      assignedTo: assignedTo
        ? { _id: assignedTo, name: 'Assigned Engineer', role: 'Developer' }
        : null,
      severity: severity || 'Major',
      priority: priority || 'P3 - Medium',
      status: assignedTo ? 'Assigned' : 'New',
      reproducibility: reproducibility || 'Always',
      preconditions: preconditions || '',
      stepsToReproduce: stepsToReproduce || '',
      testData: testData || '',
      expectedResult: expectedResult || '',
      actualResult: actualResult || '',
      attachments: Array.isArray(attachments) ? attachments : [],
      beforeScreenshot: beforeScreenshot || '',
      afterScreenshot: afterScreenshot || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    memoryBugs.unshift(newBug);

    await logActivity({
      action: 'BUG_REPORTED',
      message: `Reported bug '${nextBugId}: ${title}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: project,
      entityType: 'Bug',
    });

    return res.status(201).json(newBug);
  } catch (error) {
    console.error('[CREATE BUG ERROR]:', error);
    return res.status(500).json({ message: 'Unable to create bug.' });
  }
};

/**
 * @desc    Update bug
 * @route   PUT /api/bugs/:id
 * @access  Private
 */
const updateBug = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const bug = await Bug.findById(id);
      if (!bug) return res.status(404).json({ message: 'Bug not found.' });

      // Update fields (prevent bugId mutation)
      delete body.bugId;
      Object.assign(bug, body);
      await bug.save();

      const updated = await Bug.findById(id)
        .populate('project', 'name projectCode')
        .populate('module', 'name')
        .populate('reporter', 'name email role')
        .populate('assignedTo', 'name email role');

      await logActivity({
        action: 'BUG_UPDATED',
        message: `Updated bug '${bug.bugId}: ${bug.title}'`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: bug.project,
        entityType: 'Bug',
      });

      return res.json(updated);
    }

    const index = memoryBugs.findIndex((b) => b._id === id || b.bugId === id.toUpperCase());
    if (index === -1) return res.status(404).json({ message: 'Bug not found.' });

    delete body.bugId;
    memoryBugs[index] = {
      ...memoryBugs[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await logActivity({
      action: 'BUG_UPDATED',
      message: `Updated bug '${memoryBugs[index].bugId}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: memoryBugs[index].project,
      entityType: 'Bug',
    });

    return res.json(memoryBugs[index]);
  } catch (error) {
    console.error('[UPDATE BUG ERROR]:', error);
    return res.status(500).json({ message: 'Unable to update bug.' });
  }
};

/**
 * @desc    Delete bug
 * @route   DELETE /api/bugs/:id
 * @access  Private (Admin & QA Manager)
 */
const deleteBug = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const bug = await Bug.findById(id);
      if (!bug) return res.status(404).json({ message: 'Bug not found.' });

      await Bug.findByIdAndDelete(id);

      await logActivity({
        action: 'BUG_DELETED',
        message: `Deleted bug '${bug.bugId}'`,
        userId: req.user?._id,
        userName: req.user?.name,
        projectId: bug.project,
        entityType: 'Bug',
      });

      return res.json({ message: `Bug ${bug.bugId} deleted successfully.` });
    }

    const index = memoryBugs.findIndex((b) => b._id === id || b.bugId === id.toUpperCase());
    if (index === -1) return res.status(404).json({ message: 'Bug not found.' });

    const deletedBug = memoryBugs[index];
    memoryBugs.splice(index, 1);

    await logActivity({
      action: 'BUG_DELETED',
      message: `Deleted bug '${deletedBug.bugId}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: deletedBug.project,
      entityType: 'Bug',
    });

    return res.json({ message: `Bug ${deletedBug.bugId} deleted successfully.` });
  } catch (error) {
    console.error('[DELETE BUG ERROR]:', error);
    return res.status(500).json({ message: 'Unable to delete bug.' });
  }
};

/**
 * @desc    Change Bug Status with lifecycle validation
 * @route   PATCH /api/bugs/:id/status
 * @access  Private
 */
const changeBugStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    const validStatuses = [
      'New',
      'Assigned',
      'In Progress',
      'Fixed',
      'Retest',
      'Closed',
      'Reopened',
      'Rejected',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status '${status}'.` });
    }

    let bugObj;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      bugObj = await Bug.findById(id);
    } else {
      bugObj = memoryBugs.find((b) => b._id === id || b.bugId === id.toUpperCase());
    }

    if (!bugObj) return res.status(404).json({ message: 'Bug not found.' });

    const currentStatus = bugObj.status;
    const userRole = req.user?.role || 'Tester';

    // Role-based lifecycle enforcement
    if (userRole === 'Developer') {
      const devAllowed = ['In Progress', 'Fixed'];
      if (!devAllowed.includes(status)) {
        return res.status(403).json({
          message: `Developers are allowed to transition status to 'In Progress' or 'Fixed'.`,
        });
      }
    } else if (userRole === 'Tester') {
      const testerAllowed = ['Assigned', 'Retest', 'Closed', 'Reopened'];
      if (!testerAllowed.includes(status)) {
        return res.status(403).json({
          message: `Testers can set status to 'Assigned', 'Retest', 'Closed', or 'Reopened'.`,
        });
      }
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      bugObj.status = status;
      await bugObj.save();
    } else {
      bugObj.status = status;
      bugObj.updatedAt = new Date().toISOString();
    }

    await logActivity({
      action: 'BUG_STATUS_CHANGED',
      message: `Changed status of '${bugObj.bugId}' from '${currentStatus}' to '${status}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: bugObj.project,
      entityType: 'Bug',
    });

    if (bugObj.assignedTo) {
      const recipientId = typeof bugObj.assignedTo === 'object' ? bugObj.assignedTo._id : bugObj.assignedTo;
      await createNotification({
        recipient: recipientId,
        sender: req.user?._id,
        message: `Status of bug ${bugObj.bugId} changed to ${status}`,
        type: 'BUG_STATUS_CHANGED',
        relatedBug: bugObj.bugId,
      });
    }

    return res.json({
      message: `Bug status updated to ${status}.`,
      bug: bugObj,
    });
  } catch (error) {
    console.error('[CHANGE BUG STATUS ERROR]:', error);
    return res.status(500).json({ message: 'Unable to change bug status.' });
  }
};

/**
 * @desc    Assign bug to user
 * @route   PATCH /api/bugs/:id/assign
 * @access  Private
 */
const assignBug = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ message: 'Assigned User ID is required.' });
    }

    let bugObj;
    let targetUser;

    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        bugObj = await Bug.findById(id);
      }
      if (mongoose.Types.ObjectId.isValid(assignedTo)) {
        targetUser = await User.findById(assignedTo).select('name email role');
      }

      if (bugObj) {
        bugObj.assignedTo = assignedTo;
        if (bugObj.status === 'New') bugObj.status = 'Assigned';
        await bugObj.save();

        const updated = await Bug.findById(id)
          .populate('project', 'name projectCode')
          .populate('module', 'name')
          .populate('reporter', 'name email role')
          .populate('assignedTo', 'name email role');

        await logActivity({
          action: 'BUG_ASSIGNED',
          message: `Assigned bug '${bugObj.bugId}' to ${targetUser?.name || 'User'}`,
          userId: req.user?._id,
          userName: req.user?.name,
          projectId: bugObj.project,
          entityType: 'Bug',
        });

        await createNotification({
          recipient: assignedTo,
          sender: req.user?._id,
          message: `You were assigned bug ${bugObj.bugId}`,
          type: 'BUG_ASSIGNED',
          relatedBug: bugObj.bugId,
        });

        return res.json(updated);
      }
    }

    const index = memoryBugs.findIndex((b) => b._id === id || b.bugId === id.toUpperCase());
    if (index === -1) return res.status(404).json({ message: 'Bug not found.' });

    memoryBugs[index].assignedTo = {
      _id: assignedTo,
      name: 'Assigned Team Member',
      role: 'Developer',
    };
    if (memoryBugs[index].status === 'New') memoryBugs[index].status = 'Assigned';
    memoryBugs[index].updatedAt = new Date().toISOString();

    await logActivity({
      action: 'BUG_ASSIGNED',
      message: `Assigned bug '${memoryBugs[index].bugId}'`,
      userId: req.user?._id,
      userName: req.user?.name,
      projectId: memoryBugs[index].project,
      entityType: 'Bug',
    });

    return res.json(memoryBugs[index]);
  } catch (error) {
    console.error('[ASSIGN BUG ERROR]:', error);
    return res.status(500).json({ message: 'Unable to assign bug.' });
  }
};

/**
 * @desc    Get bug timeline history
 * @route   GET /api/bugs/:id/history
 * @access  Private
 */
const getBugHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Seed initial history entries
    const history = [
      {
        _id: 'hist_1',
        action: 'BUG_REPORTED',
        message: 'Bug created and submitted',
        userName: 'Sarah Connor',
        userRole: 'QA Manager',
        status: 'New',
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
      {
        _id: 'hist_2',
        action: 'BUG_ASSIGNED',
        message: 'Assigned bug to David Miller (Developer)',
        userName: 'Sarah Connor',
        userRole: 'QA Manager',
        status: 'Assigned',
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      {
        _id: 'hist_3',
        action: 'BUG_STATUS_CHANGED',
        message: "Status changed from 'Assigned' to 'In Progress'",
        userName: 'David Miller',
        userRole: 'Developer',
        status: 'In Progress',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ];

    return res.json(history);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch bug history.' });
  }
};

/**
 * @desc    Get comments for a bug
 * @route   GET /api/bugs/:id/comments
 * @access  Private
 */
const getBugComments = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const comments = await Comment.find({ bug: id }).sort({ createdAt: 1 });
      return res.json(comments);
    }

    const filtered = memoryComments.filter(
      (c) => c.bug === id || c.bugId === id.toUpperCase()
    );
    return res.json(filtered);
  } catch (error) {
    console.error('[GET COMMENTS ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch comments.' });
  }
};

/**
 * @desc    Add comment to bug
 * @route   POST /api/bugs/:id/comments
 * @access  Private
 */
const addBugComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment content is required.' });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const newComment = await Comment.create({
        bug: id,
        user: req.user?._id,
        userName: req.user?.name || 'QA Engineer',
        userRole: req.user?.role || 'Tester',
        comment: comment.trim(),
      });

      await logActivity({
        action: 'COMMENT_ADDED',
        message: `Added comment on bug`,
        userId: req.user?._id,
        userName: req.user?.name,
        entityType: 'Bug',
      });

      return res.status(201).json(newComment);
    }

    const newMemComment = {
      _id: 'comm_' + Date.now(),
      bug: id,
      bugId: id.toUpperCase(),
      user: req.user?._id || 'demo_user',
      userName: req.user?.name || 'Alex Rivera',
      userRole: req.user?.role || 'Admin',
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    memoryComments.push(newMemComment);

    return res.status(201).json(newMemComment);
  } catch (error) {
    console.error('[ADD COMMENT ERROR]:', error);
    return res.status(500).json({ message: 'Unable to post comment.' });
  }
};

/**
 * @desc    Delete comment
 * @route   DELETE /api/bugs/:id/comments/:commentId
 * @access  Private
 */
const deleteBugComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(commentId)) {
      await Comment.findByIdAndDelete(commentId);
      return res.json({ message: 'Comment deleted successfully.' });
    }

    const idx = memoryComments.findIndex((c) => c._id === commentId);
    if (idx !== -1) memoryComments.splice(idx, 1);

    return res.json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete comment.' });
  }
};

module.exports = {
  getBugs,
  getBugById,
  createBug,
  updateBug,
  deleteBug,
  changeBugStatus,
  assignBug,
  getBugHistory,
  getBugComments,
  addBugComment,
  deleteBugComment,
  memoryBugs,
};
