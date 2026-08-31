const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'starpix_super_secret_jwt_key_2026_dev';

const renderAccountDeletionPage = (req, res, options = {}) => {
  const {
    error = '',
    success = '',
    phoneNumber = '',
    user = null,
    token = '',
  } = options;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Starpix - Account & Data Deletion Portal</title>
  <link rel="icon" type="image/png" href="/uploads/starpix.png">
  <link rel="shortcut icon" href="/uploads/starpix.png" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #FFF9F3;
      background-image: 
        radial-gradient(at 10% 10%, rgba(249, 115, 22, 0.08) 0px, transparent 50%),
        radial-gradient(at 90% 90%, rgba(234, 88, 12, 0.06) 0px, transparent 50%);
      background-attachment: fixed;
      color: #221608;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px 16px;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 520px;
      width: 100%;
    }

    .brand-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 28px;
    }

    .brand-logo-wrap {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: #FFFFFF;
      box-shadow: 0 8px 24px rgba(249, 115, 22, 0.18), 0 0 0 1px #F7E3D0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .brand-logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .brand-title {
      font-size: 26px;
      font-weight: 800;
      color: #221608;
      letter-spacing: -0.6px;
    }

    .brand-badge {
      background: #FFF1E4;
      border: 1px solid #F0CDAF;
      color: #EA580C;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-left: 4px;
    }

    .card {
      background-color: #FFFFFF;
      border: 1px solid #F7E3D0;
      border-radius: 24px;
      padding: 36px 32px;
      box-shadow: 0 20px 40px rgba(43, 24, 10, 0.07);
    }

    h1 {
      font-size: 22px;
      font-weight: 800;
      color: #221608;
      letter-spacing: -0.4px;
      margin-bottom: 8px;
    }

    .subtext {
      font-size: 14px;
      line-height: 1.6;
      color: #8A7A68;
      margin-bottom: 24px;
      font-weight: 500;
    }

    .user-card {
      background-color: #FFF1E4;
      border: 1px solid #F0CDAF;
      border-radius: 16px;
      padding: 16px 18px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .user-avatar {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: linear-gradient(135deg, #F97316, #EA580C);
      color: #FFFFFF;
      font-size: 20px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
    }

    .user-info { flex: 1; }
    
    .user-name {
      font-size: 16px;
      font-weight: 700;
      color: #221608;
    }

    .user-phone {
      font-size: 13.5px;
      color: #8A7A68;
      margin-top: 2px;
      font-weight: 500;
    }

    .verified-pill {
      font-size: 11px;
      font-weight: 700;
      background: #16A34A;
      color: #FFFFFF;
      padding: 3px 8px;
      border-radius: 12px;
    }

    .notice-box {
      background-color: #FFF9F3;
      border-left: 4px solid #F97316;
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 24px;
      font-size: 13.5px;
      line-height: 1.6;
      color: #524434;
      border-top: 1px solid #F7E3D0;
      border-right: 1px solid #F7E3D0;
      border-bottom: 1px solid #F7E3D0;
    }

    .notice-box strong { color: #221608; }
    .notice-box ul { margin-top: 8px; margin-left: 18px; }
    .notice-box li { margin-bottom: 4px; }

    .alert-error {
      background-color: #FEF2F2;
      border: 1px solid #FCA5A5;
      color: #DC2626;
      padding: 14px 16px;
      border-radius: 12px;
      font-size: 13.5px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .alert-success {
      background-color: #F0FDF4;
      border: 1px solid #86EFAC;
      color: #166534;
      padding: 24px;
      border-radius: 16px;
      font-size: 14.5px;
      line-height: 1.6;
      margin-bottom: 20px;
      text-align: center;
    }

    .success-icon {
      width: 56px;
      height: 56px;
      background: #DCFCE7;
      color: #16A34A;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      margin: 0 auto 16px auto;
      font-weight: bold;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      font-size: 13px;
      font-weight: 700;
      color: #221608;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    input[type="text"], input[type="tel"], select, textarea {
      width: 100%;
      padding: 14px 16px;
      background-color: #FFF9F3;
      border: 1.5px solid #F7E3D0;
      border-radius: 12px;
      color: #221608;
      font-size: 14.5px;
      font-family: inherit;
      font-weight: 500;
      outline: none;
      transition: all 0.2s ease;
    }

    input[type="text"]:focus, input[type="tel"]:focus, select:focus, textarea:focus {
      border-color: #F97316;
      background-color: #FFFFFF;
      box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12);
    }

    .btn-delete {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #EF4444, #DC2626);
      color: #FFFFFF;
      border: none;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.35);
      transition: all 0.2s ease;
    }

    .btn-delete:hover {
      background: linear-gradient(135deg, #DC2626, #B91C1C);
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.45);
    }

    .btn-delete:active {
      transform: translateY(1px);
    }

    .footer-note {
      text-align: center;
      margin-top: 28px;
      font-size: 12.5px;
      color: #8A7A68;
      font-weight: 500;
    }

    .footer-note a {
      color: #F97316;
      text-decoration: none;
      font-weight: 700;
    }

    .footer-note a:hover {
      text-decoration: underline;
    }

    /* Modal Confirmation Popup Styling */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(34, 22, 8, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
    }

    .modal-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    .modal-dialog {
      background-color: #FFFFFF;
      border: 1px solid #F7E3D0;
      border-radius: 20px;
      max-width: 440px;
      width: 100%;
      padding: 28px 24px;
      box-shadow: 0 24px 48px rgba(34, 22, 8, 0.25);
      transform: scale(0.92);
      transition: transform 0.2s ease;
      text-align: center;
    }

    .modal-overlay.active .modal-dialog {
      transform: scale(1);
    }

    .modal-icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background-color: #FEF2F2;
      color: #EF4444;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px auto;
      font-size: 26px;
      font-weight: bold;
      border: 1px solid #FCA5A5;
    }

    .modal-title {
      font-size: 19px;
      font-weight: 800;
      color: #221608;
      margin-bottom: 10px;
    }

    .modal-message {
      font-size: 14px;
      line-height: 1.6;
      color: #64748B;
      margin-bottom: 24px;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
    }

    .btn-modal-cancel {
      flex: 1;
      padding: 14px;
      background-color: #FFF1E4;
      border: 1px solid #F0CDAF;
      border-radius: 12px;
      color: #221608;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-modal-cancel:hover {
      background-color: #FCE8D5;
    }

    .btn-modal-confirm {
      flex: 1;
      padding: 14px;
      background: linear-gradient(135deg, #EF4444, #DC2626);
      border: none;
      border-radius: 12px;
      color: #FFFFFF;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
      transition: opacity 0.2s;
    }

    .btn-modal-confirm:hover {
      opacity: 0.95;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand-bar">
      <div class="brand-logo-wrap">
        <img src="/uploads/starpix.png" alt="Starpix Logo" class="brand-logo-img" onerror="this.onerror=null; this.src='/uploads/starpix-logo.png';" />
      </div>
      <div class="brand-title">Starpix</div>
      <div class="brand-badge">Account Portal</div>
    </div>

    <div class="card">
      <h1>Account & Data Deletion</h1>
      <p class="subtext">Request permanent deletion of your Starpix account and associated personal data per Google Play Developer Policy.</p>

      ${success ? `
        <div class="alert-success">
          <div class="success-icon">✓</div>
          <strong style="font-size: 17px; color: #15803D;">Deletion Request Confirmed</strong><br><br>
          ${success}
        </div>
        <p style="text-align: center; font-size: 13.5px;">
          <a href="/delete" style="color: #EA580C; text-decoration: none; font-weight: 700;">Submit Another Deletion Request</a>
        </p>
      ` : `
        ${error ? `<div class="alert-error">${error}</div>` : ''}

        <div class="notice-box">
          <strong>Data Safety & Purge Summary:</strong>
          <ul>
            <li><strong>Immediate Data Removal:</strong> Profile information, personal preferences, custom creations, and favorites are permanently deleted.</li>
            <li><strong>Regulatory Compliance:</strong> Financial transaction history (if applicable) is retained securely to meet statutory tax and legal requirements.</li>
          </ul>
        </div>

        <form id="deleteForm" action="/delete${token ? `?token=${encodeURIComponent(token)}` : ''}" method="POST">
          ${token ? `<input type="hidden" name="token" value="${token}" />` : ''}

          ${user ? `
            <div class="user-card">
              <div class="user-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
              <div class="user-info">
                <div class="user-name">${user.name || 'Starpix User'}</div>
                <div class="user-phone">${user.phoneNumber}</div>
              </div>
              <div class="verified-pill">App Session</div>
            </div>
          ` : `
            <div class="form-group">
              <label for="phoneNumber">Registered Phone Number</label>
              <input 
                type="tel" 
                id="phoneNumber" 
                name="phoneNumber" 
                placeholder="e.g. +91 9876543210 or 9876543210" 
                value="${phoneNumber}" 
                required 
              />
            </div>
          `}

          <div class="form-group">
            <label for="reason">Reason for Deletion (Optional)</label>
            <select id="reason" name="reason">
              <option value="No longer using the app">No longer using the app</option>
              <option value="Privacy concerns">Privacy concerns</option>
              <option value="Creating a new account">Creating a new account</option>
              <option value="Too many notifications">Too many notifications</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div class="form-group">
            <label for="details">Additional Notes (Optional)</label>
            <textarea id="details" name="details" rows="3" placeholder="Please share any feedback or reasons..."></textarea>
          </div>

          <button type="button" id="triggerBtn" class="btn-delete">Permanently Delete Account</button>
        </form>
      `}

      <div class="footer-note">
        © ${new Date().getFullYear()} Starpix Inc. • <a href="/delete">Starpix Account Portal</a>
      </div>
    </div>
  </div>

  <!-- Confirmation Modal Popup -->
  <div id="confirmModal" class="modal-overlay">
    <div class="modal-dialog">
      <div class="modal-icon-wrap">⚠️</div>
      <h2 class="modal-title">Confirm Account Deletion</h2>
      <p class="modal-message">
        Are you sure you want to permanently delete your Starpix account? All profile information, saved creations, and favorites will be permanently erased. <strong>This action cannot be undone.</strong>
      </p>
      <div class="modal-actions">
        <button type="button" id="cancelModalBtn" class="btn-modal-cancel">Cancel</button>
        <button type="button" id="confirmModalBtn" class="btn-modal-confirm">Yes, Delete Account</button>
      </div>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const deleteForm = document.getElementById('deleteForm');
      const triggerBtn = document.getElementById('triggerBtn');
      const confirmModal = document.getElementById('confirmModal');
      const cancelModalBtn = document.getElementById('cancelModalBtn');
      const confirmModalBtn = document.getElementById('confirmModalBtn');

      if (!deleteForm || !triggerBtn || !confirmModal) return;

      // Show confirmation popup
      triggerBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Native form validity check if phone field exists
        const phoneInput = document.getElementById('phoneNumber');
        if (phoneInput && !phoneInput.checkValidity()) {
          phoneInput.reportValidity();
          return;
        }

        confirmModal.classList.add('active');
      });

      // Close popup on Cancel click
      cancelModalBtn.addEventListener('click', function() {
        confirmModal.classList.remove('active');
      });

      // Close popup on backdrop click
      confirmModal.addEventListener('click', function(e) {
        if (e.target === confirmModal) {
          confirmModal.classList.remove('active');
        }
      });

      // Submit form on Confirm click
      confirmModalBtn.addEventListener('click', function() {
        confirmModalBtn.disabled = true;
        confirmModalBtn.innerText = 'Deleting...';
        deleteForm.submit();
      });

      // Close on Escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && confirmModal.classList.contains('active')) {
          confirmModal.classList.remove('active');
        }
      });
    });
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};

// GET /delete, GET /delete-account, GET /account-deletion
router.get(['/delete', '/delete-account', '/account-deletion'], async (req, res) => {
  const { token = '' } = req.query;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && !user.isDeleted) {
        return renderAccountDeletionPage(req, res, { user, token });
      } else if (user && user.isDeleted) {
        return renderAccountDeletionPage(req, res, {
          success: `Account associated with <strong>${user.phoneNumber}</strong> has already been deleted.`,
        });
      }
    } catch (err) {
      console.warn('Invalid or expired token in /delete URL:', err.message);
    }
  }

  renderAccountDeletionPage(req, res);
});

// POST /delete, POST /delete-account, POST /account-deletion
router.post(['/delete', '/delete-account', '/account-deletion'], async (req, res) => {
  try {
    const token = req.query.token || req.body.token || '';
    let { phoneNumber = '', reason = 'No longer using the app', details = '' } = req.body;
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
      if (token) {
        return renderAccountDeletionPage(req, res, {
          error: 'Your session has expired or is invalid. Please enter your registered phone number below.',
          phoneNumber,
        });
      }
      return renderAccountDeletionPage(req, res, {
        error: `No active account found registered with "${phoneNumber}". Please check the phone number and try again.`,
        phoneNumber,
      });
    }

    if (user.isDeleted) {
      return renderAccountDeletionPage(req, res, {
        success: `Account associated with <strong>${user.phoneNumber}</strong> has already been deleted.`,
      });
    }

    // Perform account soft-deletion
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletionReason = `Web Request: ${reason}${details ? ` (${details})` : ''}`;
    await user.save();

    renderAccountDeletionPage(req, res, {
      success: `Your account registered under <strong>${user.phoneNumber}</strong> has been successfully deleted. All personal profile data has been scheduled for permanent removal. You will no longer be able to log in with this account.`,
    });
  } catch (err) {
    console.error('Error in POST /delete:', err);
    renderAccountDeletionPage(req, res, {
      error: 'An error occurred while processing account deletion. Please try again.',
      phoneNumber: req.body.phoneNumber || '',
    });
  }
});

module.exports = router;
