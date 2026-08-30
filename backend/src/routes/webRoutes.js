const express = require('express');
const router = express.Router();
const User = require('../models/User');

const renderAccountDeletionPage = (req, res, state = {}) => {
  const { error = '', success = '', phoneNumber = '' } = state;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Starpix - Account & Data Deletion Request</title>
  <link rel="icon" type="image/png" href="/uploads/starpix-logo.png">
  <link rel="shortcut icon" href="/uploads/starpix-logo.png" type="image/png">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #0d131a;
      color: #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background-color: #17212b;
      border: 1px solid #2b394a;
      border-radius: 16px;
      max-width: 520px;
      width: 100%;
      padding: 36px 28px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .brand-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      object-fit: cover;
      box-shadow: 0 4px 12px rgba(255, 94, 58, 0.4);
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #ffffff;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #ffffff;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 20px;
    }
    .info-box {
      background-color: #0f172a;
      border-left: 4px solid #ff5e3a;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #cbd5e1;
    }
    .info-box ul {
      margin-top: 8px;
      margin-left: 18px;
    }
    .info-box li {
      margin-bottom: 4px;
    }
    .alert-error {
      background-color: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #f87171;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
    }
    .alert-success {
      background-color: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.4);
      color: #4ade80;
      padding: 16px;
      border-radius: 10px;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 8px;
    }
    input[type="text"], input[type="tel"], select, textarea {
      width: 100%;
      padding: 12px 16px;
      background-color: #0d131a;
      border: 1px solid #2b394a;
      border-radius: 8px;
      color: #ffffff;
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="text"]:focus, input[type="tel"]:focus, select:focus, textarea:focus {
      border-color: #ff5e3a;
    }
    button[type="submit"] {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
      transition: transform 0.1s, opacity 0.2s;
    }
    button[type="submit"]:hover {
      opacity: 0.95;
    }
    button[type="submit"]:active {
      transform: scale(0.98);
    }
    .footer-note {
      text-align: center;
      margin-top: 24px;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <img src="/uploads/starpix-logo.png" alt="Starpix Logo" class="brand-icon" />
      <div class="brand-title">Starpix</div>
    </div>

    <h1>Account & Data Deletion Request</h1>
    <p>Submit your registered phone number below to initiate permanent account deletion and data purge for your Starpix account.</p>

    <div class="info-box">
      <strong>Data Safety & Retention Notice:</strong>
      <ul>
        <li><strong>Deleted Immediately:</strong> Profile info, personal preferences, custom images, and saved quotes.</li>
        <li><strong>Retained for Compliance:</strong> Financial transaction receipts retained per statutory tax and fraud prevention laws.</li>
      </ul>
    </div>

    ${success ? `
      <div class="alert-success">
        ✓ <strong>Request Submitted Successfully</strong><br>
        ${success}
      </div>
      <p style="text-align: center;"><a href="/delete-account" style="color: #ff5e3a; text-decoration: none; font-weight: 600;">Submit another request</a></p>
    ` : `
      ${error ? `<div class="alert-error">${error}</div>` : ''}

      <form action="/delete-account" method="POST">
        <div class="form-group">
          <label for="phoneNumber">Registered Phone Number (with Country Code)</label>
          <input 
            type="tel" 
            id="phoneNumber" 
            name="phoneNumber" 
            placeholder="e.g. +91 9876543210 or 9876543210" 
            value="${phoneNumber}" 
            required 
          />
        </div>

        <div class="form-group">
          <label for="reason">Reason for Deletion (Optional)</label>
          <select id="reason" name="reason">
            <option value="No longer using the app">No longer using the app</option>
            <option value="Privacy concerns">Privacy concerns</option>
            <option value="Creating a new account">Creating a new account</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div class="form-group">
          <label for="details">Additional Notes (Optional)</label>
          <textarea id="details" name="details" rows="3" placeholder="Tell us if you experienced any issues..."></textarea>
        </div>

        <button type="submit">Submit Account Deletion Request</button>
      </form>
    `}

    <div class="footer-note">
      © ${new Date().getFullYear()} Starpix Inc. All rights reserved. • Google Play Data Safety Compliance
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
};

// GET /delete-account and GET /account-deletion
router.get(['/delete-account', '/account-deletion'], (req, res) => {
  renderAccountDeletionPage(req, res);
});

// POST /delete-account and POST /account-deletion
router.post(['/delete-account', '/account-deletion'], async (req, res) => {
  try {
    let { phoneNumber = '', reason = 'No longer using the app', details = '' } = req.body;
    phoneNumber = phoneNumber.trim();

    if (!phoneNumber) {
      return renderAccountDeletionPage(req, res, {
        error: 'Please enter a valid phone number registered with Starpix.',
        phoneNumber,
      });
    }

    // Clean phone number (strip spaces/dashes)
    let cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
    let searchConditions = [
      { phoneNumber: cleanPhone },
      { phoneNumber: cleanPhone.replace(/^\+91/, '') },
      { phoneNumber: cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}` },
    ];

    const user = await User.findOne({ $or: searchConditions });

    if (!user) {
      return renderAccountDeletionPage(req, res, {
        error: `No active account found registered with number "${phoneNumber}". Please double check your registered phone number.`,
        phoneNumber,
      });
    }

    if (user.isDeleted) {
      return renderAccountDeletionPage(req, res, {
        success: `Account associated with ${user.phoneNumber} has already been deleted.`,
        phoneNumber,
      });
    }

    // Process deletion
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletionReason = `Web Request: ${reason}${details ? ` (${details})` : ''}`;
    await user.save();

    renderAccountDeletionPage(req, res, {
      success: `Your account registered under ${user.phoneNumber} has been successfully deactivated and scheduled for complete data purge. You will no longer be able to log in with this number.`,
      phoneNumber: '',
    });
  } catch (err) {
    console.error('Error handling web account deletion:', err);
    renderAccountDeletionPage(req, res, {
      error: 'An unexpected server error occurred while processing your request. Please try again later.',
      phoneNumber: req.body.phoneNumber || '',
    });
  }
});

module.exports = router;
