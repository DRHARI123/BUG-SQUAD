const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'bugsquad_secret_fallback', {
    expiresIn: '30d',
  });
};

module.exports = generateToken;
