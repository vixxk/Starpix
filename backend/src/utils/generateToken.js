const jwt = require('jsonwebtoken');

const generateToken = (id, role = 'user', expiresIn) => {
  const defaultDuration = role === 'admin' || role === 'super_admin' ? '7d' : '3650d';
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'starpix_super_secret_jwt_key_2026_dev', {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || defaultDuration,
  });
};

module.exports = generateToken;

