const User = require('../models/User');
const { logAudit } = require('../models/AuditLog');
const mongoose = require('mongoose');

// Memory store fallback for users
let memoryUsersList = [
  {
    _id: 'demo_admin',
    name: 'Alex Rivera',
    email: 'admin@bugsquad.qa',
    role: 'Admin',
    status: 'Active',
    department: 'DevOps & Quality',
    phone: '+1 (555) 019-2831',
    assignedProjects: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 1440 * 30).toISOString(),
    lastLogin: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    _id: 'demo_qa',
    name: 'Sarah Connor',
    email: 'qa@bugsquad.qa',
    role: 'QA Manager',
    status: 'Active',
    department: 'Quality Assurance',
    phone: '+1 (555) 014-9921',
    assignedProjects: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 1440 * 20).toISOString(),
    lastLogin: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    _id: 'demo_tester',
    name: 'John Doe',
    email: 'tester@bugsquad.qa',
    role: 'Tester',
    status: 'Active',
    department: 'Manual & Automation Testing',
    phone: '+1 (555) 017-3829',
    assignedProjects: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 1440 * 10).toISOString(),
    lastLogin: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    _id: 'demo_dev',
    name: 'David Miller',
    email: 'dev@bugsquad.qa',
    role: 'Developer',
    status: 'Active',
    department: 'Backend Engineering',
    phone: '+1 (555) 012-7741',
    assignedProjects: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 1440 * 5).toISOString(),
    lastLogin: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
];

/**
 * @desc    Get all users with search, filter, and pagination
 * @route   GET /api/users
 * @access  Private
 */
const getUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (role && role !== 'All') query.role = role;
      if (status && status !== 'All') query.status = status;

      if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [{ name: regex }, { email: regex }];
      }

      const total = await User.countDocuments(query);
      const users = await User.find(query)
        .select('-password')
        .populate('assignedProjects', 'name projectCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      return res.json({
        users,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        total,
      });
    }

    let filtered = [...memoryUsersList];
    if (role && role !== 'All') filtered = filtered.filter((u) => u.role === role);
    if (status && status !== 'All') filtered = filtered.filter((u) => u.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limitNum);

    return res.json({
      users: paginated,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      total,
    });
  } catch (error) {
    console.error('[GET USERS ERROR]:', error);
    return res.status(500).json({ message: 'Unable to fetch users.' });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const user = await User.findById(id).select('-password').populate('assignedProjects', 'name projectCode');
      if (!user) return res.status(404).json({ message: 'User not found.' });
      return res.json(user);
    }

    const user = memoryUsersList.find((u) => u._id === id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch user details.' });
  }
};

/**
 * @desc    Create new user (Admin only)
 * @route   POST /api/users
 * @access  Private (Admin)
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, status, department, phone, assignedProjects } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide Name, Email, Password, and Role.' });
    }

    if (role && String(role).toLowerCase() === 'admin') {
      return res.status(400).json({ message: 'Admin role creation is restricted.' });
    }

    // Password strength check (min 8 chars)
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({ message: 'User with this email already exists.' });
      }

      const user = await User.create({
        name,
        email: normalizedEmail,
        password,
        role,
        status: status || 'Active',
        department: department || 'QA',
        phone: phone || '',
        assignedProjects: Array.isArray(assignedProjects) ? assignedProjects : [],
      });

      await logAudit({
        userId: req.user?._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: user._id.toString(),
        description: `Created user '${user.name}' (${user.email}) as '${user.role}'`,
      });

      const sanitized = user.toObject();
      delete sanitized.password;

      return res.status(201).json(sanitized);
    }

    // Memory creation
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      _id: 'usr_' + Date.now(),
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      status: status || 'Active',
      department: department || 'QA',
      phone: phone || '',
      assignedProjects: [],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    memoryUsersList.unshift(newUser);

    await logAudit({
      userId: req.user?._id,
      userName: req.user?.name,
      userRole: req.user?.role,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser._id,
      description: `Created user '${newUser.name}' (${newUser.email}) as '${newUser.role}'`,
    });

    const { password: _, ...userWithoutPass } = newUser;
    return res.status(201).json(userWithoutPass);
  } catch (error) {
    console.error('[CREATE USER ERROR]:', error);
    return res.status(500).json({ message: 'Unable to create user.' });
  }
};

/**
 * @desc    Update user details
 * @route   PUT /api/users/:id
 * @access  Private
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, department, phone, avatar, assignedProjects } = req.body;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: 'User not found.' });

      if (name) user.name = name;
      if (email) user.email = email.toLowerCase();
      if (role && req.user?.role === 'Admin') user.role = role;
      if (status && req.user?.role === 'Admin') user.status = status;
      if (department) user.department = department;
      if (phone !== undefined) user.phone = phone;
      if (avatar !== undefined) user.avatar = avatar;
      if (Array.isArray(assignedProjects) && req.user?.role === 'Admin') user.assignedProjects = assignedProjects;

      await user.save();

      await logAudit({
        userId: req.user?._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'USER_EDITED',
        entityType: 'User',
        entityId: id,
        description: `Updated profile details for '${user.name}'`,
      });

      const updated = await User.findById(id).select('-password');
      return res.json(updated);
    }

    const index = memoryUsersList.findIndex((u) => u._id === id);
    if (index === -1) return res.status(404).json({ message: 'User not found.' });

    memoryUsersList[index] = {
      ...memoryUsersList[index],
      name: name || memoryUsersList[index].name,
      email: email || memoryUsersList[index].email,
      role: role && req.user?.role === 'Admin' ? role : memoryUsersList[index].role,
      status: status && req.user?.role === 'Admin' ? status : memoryUsersList[index].status,
      department: department || memoryUsersList[index].department,
      phone: phone !== undefined ? phone : memoryUsersList[index].phone,
    };

    return res.json(memoryUsersList[index]);
  } catch (error) {
    console.error('[UPDATE USER ERROR]:', error);
    return res.status(500).json({ message: 'Unable to update user.' });
  }
};

/**
 * @desc    Toggle user status (Active / Inactive)
 * @route   PATCH /api/users/:id/status
 * @access  Private (Admin)
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Active or Inactive.' });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: 'User not found.' });

      user.status = status;
      await user.save();

      await logAudit({
        userId: req.user?._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: status === 'Active' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: id,
        description: `Set status of user '${user.name}' to '${status}'`,
      });

      return res.json({ message: `User status changed to ${status}`, status });
    }

    const index = memoryUsersList.findIndex((u) => u._id === id);
    if (index === -1) return res.status(404).json({ message: 'User not found.' });

    memoryUsersList[index].status = status;
    return res.json({ message: `User status changed to ${status}`, status });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update user status.' });
  }
};

/**
 * @desc    Reset user password (Admin only)
 * @route   POST /api/users/:id/reset-password
 * @access  Private (Admin)
 */
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: 'User not found.' });

      user.password = newPassword;
      await user.save();

      await logAudit({
        userId: req.user?._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'PASSWORD_RESET',
        entityType: 'User',
        entityId: id,
        description: `Reset password for user '${user.name}'`,
      });

      return res.json({ message: `Password for ${user.name} reset successfully.` });
    }

    return res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to reset password.' });
  }
};

/**
 * @desc    Delete/Deactivate user (Admin only, preserves historical references)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: 'User not found.' });

      // Mark user as inactive to preserve historical bug/test case references
      user.status = 'Inactive';
      await user.save();

      await logAudit({
        userId: req.user?._id,
        userName: req.user?.name,
        userRole: req.user?.role,
        action: 'USER_DEACTIVATED',
        entityType: 'User',
        entityId: id,
        description: `Deactivated user '${user.name}' (Historical records preserved)`,
      });

      return res.json({ message: `User ${user.name} deactivated and historical data preserved.` });
    }

    const index = memoryUsersList.findIndex((u) => u._id === id);
    if (index !== -1) memoryUsersList[index].status = 'Inactive';

    return res.json({ message: 'User deactivated successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete user.' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetPassword,
  deleteUser,
  memoryUsersList,
};
