const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Request OTP for phone number
// @route   POST /api/auth/request-otp
// @access  Public
const requestOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, countryCode = '+91' } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  // TODO: Replace development OTP bypass with actual OTP provider before production.
  // In development, OTP is always sent instantly and accepted.
  console.log(`[OTP] Sent OTP request to ${countryCode} ${phoneNumber}`);

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully (Development mode: Enter any 6-digit OTP)',
    data: {
      phoneNumber,
      countryCode,
      devNote: 'Development mode active. Any 6-digit OTP will verify.',
    },
  });
});

// @desc    Verify OTP and log in / register
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, countryCode = '+91', otp, name, isNewUser } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  const fullPhone = `${countryCode}${phoneNumber}`.replace(/\s+/g, '');

  let user = await User.findOne({ phoneNumber: fullPhone });
  const isSigningUp = isNewUser === true || isNewUser === 'true' || Boolean(name && name.trim());

  if (user && user.isDeleted) {
    if (isSigningUp) {
      // Reactivate deleted user account on Sign Up request
      user.isDeleted = false;
      user.deletedAt = null;
      user.deletionReason = '';
      if (name) user.name = name;
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Block standard Log In for deleted accounts
      return res.status(403).json({
        success: false,
        message: 'This account has been deleted. Please sign up to reactivate your account.',
      });
    }
  } else if (!user) {
    user = await User.create({
      phoneNumber: fullPhone,
      countryCode,
      name: name || `Starpix User ${fullPhone.slice(-4)}`,
      lastLoginAt: new Date(),
    });
  } else {
    user.lastLoginAt = new Date();
    if (name) user.name = name;
    await user.save();
  }

  const token = generateToken(user._id, 'user', '3650d');

  res.status(200).json({
    success: true,
    message: 'Authentication successful',
    data: {
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        profilePhoto: user.profilePhoto,
        isPremium: user.isPremium,
        subscriptionStatus: user.subscriptionStatus,
        favorites: user.favorites,
      },
      token,
    },
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('favorites');
  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (req.body.name) user.name = req.body.name;
  if (req.body.profilePhoto) user.profilePhoto = req.body.profilePhoto;

  await user.save();

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Delete user account
// @route   POST /api/auth/delete-account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.deletionReason = req.body.reason || 'User requested account deletion';
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Your account has been deleted successfully.',
  });
});

module.exports = {
  requestOtp,
  verifyOtp,
  getMe,
  updateProfile,
  deleteAccount,
};
