const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protectAdmin = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'starpix_super_secret_jwt_key_2026_dev');
      req.admin = await Admin.findById(decoded.id).select('-passwordHash');
      if (!req.admin || !req.admin.isActive) {
        return res.status(401).json({ success: false, message: 'Admin account inactive or not found' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, admin token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no admin token provided' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Requires one of roles [${roles.join(', ')}]`,
      });
    }
    next();
  };
};

module.exports = { protectAdmin, requireRole };
