const jwt = require('jsonwebtoken');

const generateToken = (id, role = 'user', expiresIn = '7d') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'statuzzz_super_secret_jwt_key_2026_dev', {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;

