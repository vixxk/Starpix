const jwt = require('jsonwebtoken');

const generateToken = (id, role = 'user') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'statuzzz_super_secret_jwt_key_2026_dev', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

module.exports = generateToken;
