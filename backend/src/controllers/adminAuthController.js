const asyncHandler = require('../utils/asyncHandler');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');

// @desc    Admin login
// @route   POST /api/admin/auth/login
// @access  Public
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  let admin = await Admin.findOne({ email: email.toLowerCase() });

  // Auto-provision admin from environment variables if DB was freshly created
  const envEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@statuzzz.com';
  const envPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

  if (!admin && email.toLowerCase() === envEmail.toLowerCase() && password === envPass) {
    admin = await Admin.create({
      email: envEmail,
      passwordHash: envPass,
      role: 'super_admin',
      isActive: true,
    });
  }

  if (admin && (await admin.matchPassword(password))) {
    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Admin account is deactivated' });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = generateToken(admin._id, admin.role);

    return res.status(200).json({
      success: true,
      message: 'Admin authentication successful',
      data: {
        admin: {
          id: admin._id,
          email: admin.email,
          role: admin.role,
        },
        token,
      },
    });
  }

  res.status(401).json({ success: false, message: 'Invalid email or password' });
});

// @desc    Get current admin user
// @route   GET /api/admin/auth/me
// @access  Private (Admin)
const getAdminMe = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id).select('-passwordHash');
  res.status(200).json({
    success: true,
    data: admin,
  });
});

// @desc    Admin logout
// @route   POST /api/admin/auth/logout
// @access  Private (Admin)
const adminLogout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin logged out successfully',
  });
});

module.exports = {
  adminLogin,
  getAdminMe,
  adminLogout,
};
