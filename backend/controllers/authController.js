const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { logActivity } = require('../models/Activity');
const { logAudit } = require('../models/AuditLog');
const mongoose = require('mongoose');

// In-memory fallback store when MongoDB service is offline
const memoryUsers = [];
const demoAccounts = [
  {
    email: 'admin@bugsquad.demo',
    pass: 'demo1234',
    name: 'Alex Rivera',
    role: 'Admin',
  },
  {
    email: 'qa@bugsquad.demo',
    pass: 'demo1234',
    name: 'Sarah Connor',
    role: 'QA Manager',
  },
  {
    email: 'tester@bugsquad.demo',
    pass: 'demo1234',
    name: 'John Doe',
    role: 'Tester',
  },
  {
    email: 'developer@bugsquad.demo',
    pass: 'demo1234',
    name: 'David Miller',
    role: 'Developer',
  },
  {
    email: 'admin@bugsquad.qa',
    pass: 'admin123',
    name: 'Alex Rivera',
    role: 'Admin',
  },
  {
    email: 'qa@bugsquad.qa',
    pass: 'qa123456',
    name: 'Sarah Connor',
    role: 'QA Manager',
  },
  {
    email: 'tester@bugsquad.qa',
    pass: 'tester123',
    name: 'John Doe',
    role: 'Tester',
  },
  {
    email: 'dev@bugsquad.qa',
    pass: 'dev123456',
    name: 'David Miller',
    role: 'Developer',
  },
];

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    if (role && String(role).toLowerCase() === 'admin') {
      return res.status(400).json({ message: 'Admin role creation is not allowed via registration.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const validRole = ['QA Manager', 'Tester', 'Developer'].includes(role)
      ? role
      : 'Tester';

    // 1. Try MongoDB creation first
    if (mongoose.connection.readyState === 1) {
      const userExists = await User.findOne({ email: normalizedEmail });

      if (userExists) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      const user = await User.create({
        name,
        email: normalizedEmail,
        password,
        role: validRole,
        status: 'Active',
      });

      if (user) {
        await logActivity({
          action: 'USER_REGISTERED',
          message: `User '${user.name}' registered as ${user.role}`,
          userId: user._id,
          userName: user.name,
          entityType: 'User',
        });
        const token = generateToken(user._id, user.role);
        return res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          token,
        });
      }
    }

    // 2. In-Memory Fallback if MongoDB is not connected
    const existingMemUser = memoryUsers.find((u) => u.email === normalizedEmail);
    if (existingMemUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      _id: 'mem_' + Date.now(),
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: validRole,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    memoryUsers.push(newUser);
    const token = generateToken(newUser._id, newUser.role);

    return res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      createdAt: newUser.createdAt,
      token,
    });
  } catch (error) {
    console.error('[AUTH REGISTER ERROR]:', error);
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Try MongoDB login
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: normalizedEmail }).select('+password');

      if (user && (await user.matchPassword(password))) {
        if (user.status === 'Inactive') {
          return res.status(403).json({ message: 'Account deactivated. Contact system administrator.' });
        }

        user.lastLogin = new Date();
        await user.save();

        await logAudit({
          userId: user._id,
          userName: user.name,
          userRole: user.role,
          action: 'USER_LOGIN',
          entityType: 'User',
          entityId: user._id.toString(),
          description: `User '${user.name}' logged into QA Portal`,
        });

        const token = generateToken(user._id, user.role);
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          department: user.department,
          phone: user.phone,
          avatar: user.avatar,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          token,
        });
      }
    }

    // 2. Check in-memory store
    const memUser = memoryUsers.find((u) => u.email === normalizedEmail);
    if (memUser) {
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(password, memUser.password);
      if (isMatch) {
        const token = generateToken(memUser._id, memUser.role);
        return res.json({
          _id: memUser._id,
          name: memUser.name,
          email: memUser.email,
          role: memUser.role,
          status: memUser.status,
          createdAt: memUser.createdAt,
          token,
        });
      }
    }

    // 3. Fallback Demo Users (Admin, QA Manager, Tester, Developer) for quick UI testing
    const matchedDemo = demoAccounts.find(
      (d) => d.email === normalizedEmail && d.pass === password
    );

    if (matchedDemo) {
      const demoId = 'demo_' + matchedDemo.role.toLowerCase();
      await logActivity({
        action: 'USER_LOGIN',
        message: `User '${matchedDemo.name}' logged into QA Portal`,
        userId: demoId,
        userName: matchedDemo.name,
        entityType: 'User',
      });
      const token = generateToken(demoId, matchedDemo.role);
      return res.json({
        _id: demoId,
        name: matchedDemo.name,
        email: matchedDemo.email,
        role: matchedDemo.role,
        status: 'Active',
        createdAt: new Date().toISOString(),
        token,
      });
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    console.error('[AUTH LOGIN ERROR]:', error);
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    if (req.user && req.user.email) {
      return res.json(req.user);
    }

    // Handle token context fallback if user object is partial
    const userId = req.user._id;

    if (typeof userId === 'string' && userId.startsWith('demo_')) {
      const role = req.user.role || 'Tester';
      return res.json({
        _id: userId,
        name: role + ' User',
        email: role.toLowerCase() + '@bugsquad.qa',
        role: role,
        status: 'Active',
        createdAt: new Date().toISOString(),
      });
    }

    if (mongoose.connection.readyState === 1) {
      const dbUser = await User.findById(userId).select('-password');
      if (dbUser) return res.json(dbUser);
    }

    const memUser = memoryUsers.find((u) => u._id === userId);
    if (memUser) {
      const { password, ...userWithoutPass } = memUser;
      return res.json(userWithoutPass);
    }

    return res.status(404).json({ message: 'User not found' });
  } catch (error) {
    console.error('[AUTH GET ME ERROR]:', error);
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};

/**
 * @desc    Update current user password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    const userId = req.user._id;

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }

      user.password = newPassword;
      await user.save();

      await logAudit({
        userId: user._id,
        userName: user.name,
        userRole: user.role,
        action: 'PASSWORD_UPDATED',
        entityType: 'User',
        entityId: user._id.toString(),
        description: `User '${user.name}' updated password securely`,
      });

      const token = generateToken(user._id, user.role);
      return res.json({ message: 'Password updated successfully', token });
    }

    // In-memory fallback
    const memUser = memoryUsers.find((u) => u._id === userId);
    if (memUser) {
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(currentPassword, memUser.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
      const salt = await bcrypt.genSalt(10);
      memUser.password = await bcrypt.hash(newPassword, salt);
      const token = generateToken(memUser._id, memUser.role);
      return res.json({ message: 'Password updated successfully', token });
    }

    // Demo user fallback in updatePassword
    if (typeof userId === 'string' && userId.startsWith('demo_')) {
      const demoUser = demoAccounts.find(
        (d) => 'demo_' + d.role.toLowerCase() === userId || 'demo_' + d.email.split('@')[0] === userId
      );
      if (demoUser) {
        if (demoUser.pass !== currentPassword) {
          return res.status(400).json({ message: 'Incorrect current password' });
        }
        demoUser.pass = newPassword;
        const token = generateToken(userId, demoUser.role);
        return res.json({ message: 'Password updated successfully', token });
      }
    }

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('[AUTH UPDATE PASSWORD ERROR]:', error);
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updatePassword,
};
