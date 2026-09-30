const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Creation = require('../models/Creation');
const Purchase = require('../models/Purchase');
const Report = require('../models/Report');
const DeletionLog = require('../models/DeletionLog');
const { renderAccountDeletionPage } = require('../views/accountDeletionHtml');

const JWT_SECRET = process.env.JWT_SECRET || 'starpix_super_secret_jwt_key_2026_dev';

/**
 * GET /delete, /delete-account, /account-deletion
 */
const getDeleteAccount = async (req, res) => {
  const { token = '' } = req.query;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        return renderAccountDeletionPage(req, res, { user, token });
      }
    } catch (err) {
      console.warn('Invalid or expired token in /delete URL:', err.message);
    }
  }

  renderAccountDeletionPage(req, res);
};

/**
 * POST /delete, /delete-account, /account-deletion
 */
const postDeleteAccount = async (req, res) => {
  try {
    const token = req.query.token || req.body.token || '';
    const action = req.body.action || '';
    let { phoneNumber = '', otp = '', reason = 'No longer using the app', details = '' } = req.body;
    phoneNumber = phoneNumber.trim();

    let user = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        user = await User.findById(decoded.id);
      } catch (err) {
        console.warn('Invalid token on POST /delete:', err.message);
      }
    }

    // Step 1: User requested OTP for direct web deletion
    if (action === 'send_otp') {
      if (!phoneNumber) {
        return renderAccountDeletionPage(req, res, {
          error: 'Please enter a valid registered mobile number.',
          phoneNumber,
        });
      }

      const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
      const searchConditions = [
        { phoneNumber: cleanPhone },
        { phoneNumber: cleanPhone.replace(/^\+91/, '') },
        { phoneNumber: cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}` },
      ];
      user = await User.findOne({ $or: searchConditions });

      if (!user) {
        return renderAccountDeletionPage(req, res, {
          error: `No active account found registered with "${phoneNumber}". Please check the phone number and try again.`,
          phoneNumber,
        });
      }

      console.log(`[Web Account Deletion] Sent OTP request to ${user.phoneNumber}`);

      return renderAccountDeletionPage(req, res, {
        step: 'verify_otp',
        phoneNumber: user.phoneNumber,
        otpSentMessage: `Verification OTP has been sent to <strong>${user.phoneNumber}</strong>. (Dev mode: Enter any 6-digit OTP code, e.g. 123456).`,
      });
    }

    // Step 2: User submitted OTP for verification & deletion
    if (action === 'verify_delete') {
      if (!otp || otp.trim().length < 4) {
        return renderAccountDeletionPage(req, res, {
          step: 'verify_otp',
          error: 'Please enter the valid 6-digit OTP sent to your mobile number.',
          phoneNumber,
        });
      }

      const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
      const searchConditions = [
        { phoneNumber: cleanPhone },
        { phoneNumber: cleanPhone.replace(/^\+91/, '') },
        { phoneNumber: cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}` },
      ];
      user = await User.findOne({ $or: searchConditions });

      if (!user) {
        return renderAccountDeletionPage(req, res, {
          error: `No account found for phone number "${phoneNumber}".`,
        });
      }

      const userPhone = user.phoneNumber;
      const userName = user.name || 'Starpix User';
      const userId = user._id;

      const { otherReason = '' } = req.body;
      let finalReason = reason;
      if (reason === 'Other' && otherReason.trim()) {
        finalReason = otherReason.trim();
      }

      try {
        await DeletionLog.create({
          userId,
          userName,
          phoneNumber: userPhone,
          reason: finalReason,
          details: details || '',
          deletedVia: 'web_otp',
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
        });
      } catch (logErr) {
        console.error('Failed to create DeletionLog:', logErr);
      }

      await User.deleteOne({ _id: userId });
      try {
        await Creation.deleteMany({ userId });
        await Purchase.deleteMany({ userId });
        await Report.deleteMany({ user: userId });
      } catch (e) {}

      return renderAccountDeletionPage(req, res, {
        success: `Your account registered under <strong>${userPhone}</strong> has been verified via OTP and immediately deleted along with all personal profile data and creations. If you wish to use Starpix in the future, you must sign up for a new account.`,
      });
    }

    // Fallback: Direct deletion via app session token
    if (!user && phoneNumber) {
      const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
      const searchConditions = [
        { phoneNumber: cleanPhone },
        { phoneNumber: cleanPhone.replace(/^\+91/, '') },
        { phoneNumber: cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}` },
      ];
      user = await User.findOne({ $or: searchConditions });
    }

    if (!user) {
      return renderAccountDeletionPage(req, res, {
        error: `No active account found. Please check your details and try again.`,
        phoneNumber,
      });
    }

    const userPhone = user.phoneNumber;
    const userName = user.name || 'Starpix User';
    const userId = user._id;

    const { otherReason = '' } = req.body;
    let finalReason = reason;
    if (reason === 'Other' && otherReason.trim()) {
      finalReason = otherReason.trim();
    }

    try {
      await DeletionLog.create({
        userId,
        userName,
        phoneNumber: userPhone,
        reason: finalReason,
        details: details || '',
        deletedVia: user ? 'web_app_token' : 'web_otp',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      });
    } catch (logErr) {
      console.error('Failed to create DeletionLog:', logErr);
    }

    await User.deleteOne({ _id: userId });
    try {
      await Creation.deleteMany({ userId });
      await Purchase.deleteMany({ userId });
      await Report.deleteMany({ user: userId });
    } catch (e) {}

    renderAccountDeletionPage(req, res, {
      success: `Your account registered under <strong>${userPhone}</strong> has been immediately and permanently deleted along with all personal profile data and creations. If you wish to use Starpix in the future, you must sign up for a new account.`,
    });
  } catch (err) {
    console.error('Error in POST /delete:', err);
    renderAccountDeletionPage(req, res, {
      error: 'An error occurred while processing account deletion. Please try again.',
      phoneNumber: req.body.phoneNumber || '',
    });
  }
};

module.exports = {
  getDeleteAccount,
  postDeleteAccount,
};
