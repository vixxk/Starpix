const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const Creation = require('../models/Creation');
const Purchase = require('../models/Purchase');
const DeletionLog = require('../models/DeletionLog');
const generateToken = require('../utils/generateToken');

// @desc    Request OTP for phone number
// @route   POST /api/auth/request-otp
// @access  Public
const requestOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, countryCode = '+91', isNewUser } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  const fullPhone = `${countryCode}${phoneNumber}`.replace(/\s+/g, '');
  const existingUser = await User.findOne({ phoneNumber: fullPhone });

  console.log(`[OTP] Sent OTP request to ${countryCode} ${phoneNumber} (exists: ${Boolean(existingUser)})`);

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully (Development mode: Enter any 6-digit OTP)',
    data: {
      phoneNumber,
      countryCode,
      exists: Boolean(existingUser),
      devNote: 'Development mode active. Any 6-digit OTP will verify.',
    },
  });
});

// @desc    Verify OTP and log in / register
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, countryCode = '+91', otp, name, email, isNewUser } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  const fullPhone = `${countryCode}${phoneNumber}`.replace(/\s+/g, '');
  let user = await User.findOne({ phoneNumber: fullPhone });

  const isSigningUp = isNewUser === true || isNewUser === 'true' || Boolean(name && name.trim());

  let isBrandNew = false;
  if (!user || user.isDeleted) {
    // If user record existed as soft-deleted, remove old document before fresh creation
    if (user && user.isDeleted) {
      await User.deleteOne({ _id: user._id });
    }

    // Create a brand-new user account
    user = await User.create({
      phoneNumber: fullPhone,
      countryCode,
      name: name && name.trim() ? name.trim() : `Starpix User ${fullPhone.slice(-4)}`,
      email: email && email.trim() ? email.trim().toLowerCase() : '',
      lastLoginAt: new Date(),
    });
    isBrandNew = true;
  } else {
    user.lastLoginAt = new Date();
    if (name && name.trim()) user.name = name.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
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
        email: user.email || '',
        profilePhoto: user.profilePhoto,
        isPremium: user.isPremium,
        credits: user.credits !== undefined ? user.credits : 240,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        vipGrantedBy: user.vipGrantedBy,
        favorites: user.favorites,
        isNewUser: isBrandNew || !user.name || user.name.startsWith('Starpix User'),
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
  if (user && user.isPremium && user.subscriptionExpiresAt && new Date() > new Date(user.subscriptionExpiresAt)) {
    user.isPremium = false;
    user.subscriptionStatus = 'expired';
    await user.save();
  }
  if (user && (user.credits === undefined || user.credits === null)) {
    user.credits = 240;
    await user.save();
  }

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

  if (req.body.name !== undefined) user.name = req.body.name.trim();
  if (req.body.email !== undefined) user.email = req.body.email.trim().toLowerCase();
  if (req.body.profilePhoto !== undefined) {
    let photoVal = req.body.profilePhoto;
    if (typeof photoVal === 'string' && photoVal.startsWith('data:image/')) {
      try {
        const { uploadToS3 } = require('../services/s3Service');
        const mimeType = photoVal.match(/^data:(image\/[a-zA-Z+]+);base64,/)?.[1] || 'image/jpeg';
        const ext = mimeType.split('/')[1] || 'jpg';
        const base64Data = photoVal.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const s3Url = await uploadToS3(buffer, `user_${user._id}.${ext}`, mimeType, 'user-profiles');
        if (s3Url && (s3Url.startsWith('http://') || s3Url.startsWith('https://'))) {
          photoVal = s3Url;
        } else {
          photoVal = user.profilePhoto || '';
        }
      } catch (uploadErr) {
        console.error('[AuthController] Error saving base64 profile photo to S3:', uploadErr?.message);
        photoVal = user.profilePhoto || '';
      }
    } else if (typeof photoVal === 'string' && photoVal.includes('d3arutsevouzgm.cloudfront.net')) {
      photoVal = photoVal.replace('d3arutsevouzgm.cloudfront.net', 'starpix-media-production.s3.ap-south-1.amazonaws.com');
    }
    user.profilePhoto = photoVal;
  }
  if (req.body.isPremium !== undefined) user.isPremium = Boolean(req.body.isPremium);
  if (req.body.subscriptionStatus !== undefined) user.subscriptionStatus = req.body.subscriptionStatus;
  if (req.body.subscriptionPlan !== undefined) user.subscriptionPlan = req.body.subscriptionPlan;
  if (req.body.subscriptionExpiresAt !== undefined) user.subscriptionExpiresAt = req.body.subscriptionExpiresAt;
  if (req.body.subscriptionDurationDays !== undefined) user.subscriptionDurationDays = Number(req.body.subscriptionDurationDays);
  if (req.body.credits !== undefined) {
    const parsedCredits = Number(req.body.credits);
    if (!isNaN(parsedCredits) && parsedCredits >= 0) {
      user.credits = parsedCredits;
    }
  }

  await user.save();

  if (req.body.credits !== undefined) {
    try {
      const { broadcastBalanceUpdate } = require('../utils/balanceSSE');
      broadcastBalanceUpdate(user._id, { credits: user.credits, reason: 'profile_update' });
    } catch (sseErr) {
      console.warn('[Auth] SSE broadcast error:', sseErr.message);
    }
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Delete user account immediately
// @route   POST /api/auth/delete-account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Delete user document and associated user data permanently & immediately
  try {
    await DeletionLog.create({
      userId: user._id,
      userName: user.name || 'Starpix User',
      phoneNumber: user.phoneNumber,
      reason: req.body.reason || 'Mobile App User Request',
      deletedVia: 'mobile_app_api',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
    });
  } catch (e) {
    console.error('Failed to create DeletionLog in API:', e);
  }

  await User.deleteOne({ _id: userId });
  try {
    await Creation.deleteMany({ userId });
    await Purchase.deleteMany({ userId });
  } catch (e) {}

  res.status(200).json({
    success: true,
    message: 'Your account has been deleted immediately.',
  });
});

module.exports = {
  requestOtp,
  verifyOtp,
  getMe,
  updateProfile,
  deleteAccount,
};
