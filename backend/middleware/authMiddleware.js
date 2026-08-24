const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'bugsquad_secret_fallback'
      );

      // Fetch user from database if available
      try {
        req.user = await User.findById(decoded.id).select('-password');
      } catch (dbErr) {
        // Fallback context if DB isn't reachable
        req.user = { _id: decoded.id, name: decoded.name || 'QA User', role: decoded.role || 'Admin', status: 'Active' };
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User account not found.' });
      }

      // Account status active check
      if (req.user.status && req.user.status === 'Inactive') {
        return res.status(403).json({ message: 'Account deactivated. Contact your system administrator.' });
      }

      next();
    } catch (error) {
      console.error('[AUTH MIDDLEWARE] Token error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user?.role || 'Guest'}' is forbidden from accessing this resource.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
