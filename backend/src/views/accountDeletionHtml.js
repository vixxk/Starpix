const { getWebHeader, getWebFooter, getCommonCss, STARPIX_LOGO_URI } = require('./webLayout');

const renderAccountDeletionPage = (req, res, options = {}) => {
  const {
    error = '',
    success = '',
    phoneNumber = '',
    user = null,
    token = '',
    step = 'input_phone', // 'input_phone' | 'verify_otp'
    otpSentMessage = '',
  } = options;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>Account &amp; Data Deletion Portal | Starpix</title>
  <link rel="icon" type="image/png" href="${STARPIX_LOGO_URI}">
  <link rel="shortcut icon" href="${STARPIX_LOGO_URI}" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap" rel="stylesheet">
  <style>
    ${getCommonCss()}

    .portal-wrapper {
      max-width: 580px;
      margin: 0 auto;
      width: 100%;
    }

    .brand-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .brand-logo-wrap-lg {
      width: 54px;
      height: 54px;
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

    .brand-title-lg {
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

    .deletion-card {
      background-color: #FFFFFF;
      border: 1px solid #F7E3D0;
      border-radius: 24px;
      padding: 36px 32px;
      box-shadow: 0 20px 40px rgba(43, 24, 10, 0.07);
    }

    h1.deletion-title {
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

    .alert-info {
      background-color: #EFF6FF;
      border: 1px solid #BFDBFE;
      color: #1D4ED8;
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
      border: 1px solid #F0CDAF;
      border-radius: 12px;
      font-family: inherit;
      font-size: 14.5px;
      color: #221608;
      transition: all 0.2s ease;
      outline: none;
    }

    input[type="text"]:focus, input[type="tel"]:focus, select:focus, textarea:focus {
      border-color: #EA580C;
      background-color: #FFFFFF;
      box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.15);
    }

    .btn-delete {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #EF4444, #DC2626);
      color: #FFFFFF;
      border: none;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(220, 38, 38, 0.25);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-delete:hover {
      background: linear-gradient(135deg, #DC2626, #B91C1C);
      transform: translateY(-1px);
      box-shadow: 0 10px 24px rgba(220, 38, 38, 0.35);
    }

    .btn-otp {
      width: 100%;
      padding: 15px;
      background: linear-gradient(135deg, #F97316, #EA580C);
      color: #FFFFFF;
      border: none;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 8px 20px rgba(249, 115, 22, 0.25);
      transition: all 0.2s ease;
    }

    .btn-otp:hover {
      background: linear-gradient(135deg, #EA580C, #C2410C);
      transform: translateY(-1px);
    }

    /* Modal Overlay */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(34, 22, 8, 0.6);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .modal-overlay.active {
      display: flex;
    }

    .modal-dialog {
      background: #FFFFFF;
      border-radius: 20px;
      max-width: 440px;
      width: 100%;
      padding: 28px 24px;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
      border: 1px solid #F7E3D0;
      text-align: center;
      animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes popIn {
      0% { transform: scale(0.92); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    .modal-icon-wrap {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #FEF2F2;
      color: #DC2626;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      margin: 0 auto 16px auto;
    }

    .modal-title {
      font-size: 19px;
      font-weight: 800;
      color: #221608;
      margin-bottom: 10px;
    }

    .modal-message {
      font-size: 14px;
      color: #615243;
      line-height: 1.55;
      margin-bottom: 24px;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
    }

    .btn-modal-cancel {
      flex: 1;
      padding: 13px;
      background: #FFF9F3;
      border: 1px solid #F0CDAF;
      border-radius: 12px;
      color: #524434;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
    }

    .btn-modal-confirm {
      flex: 1;
      padding: 13px;
      background: #DC2626;
      border: none;
      border-radius: 12px;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
    }

    @media (max-width: 540px) {
      .deletion-card { padding: 24px 18px; }
      h1.deletion-title { font-size: 20px; }
    }
  </style>
</head>
<body>
  ${getWebHeader('delete')}

  <main class="site-main">
    <div class="portal-wrapper">
      <div class="deletion-card">
        <h1 class="deletion-title">Account &amp; Data Deletion Portal</h1>
        <p class="subtext">
          In compliance with Google Play Data Safety policies, you can permanently delete your Starpix account and all associated personal data using this self-service portal.
        </p>

        ${error ? `<div class="alert-error">${error}</div>` : ''}
        ${otpSentMessage ? `<div class="alert-info">${otpSentMessage}</div>` : ''}

        ${
          success
            ? `
          <div class="alert-success">
            <div class="success-icon">&#10003;</div>
            <h3 style="margin-bottom: 8px; color: #166534; font-size: 18px; font-weight: 800;">Account Successfully Deleted</h3>
            <p>${success}</p>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <a href="/" class="btn-otp" style="text-decoration: none; display: inline-block;">Return to Home</a>
          </div>
        `
            : `
          ${
            user
              ? `
            <div class="user-card">
              <div class="user-avatar">
                ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div class="user-info">
                <div class="user-name">${user.name || 'Starpix User'}</div>
                <div class="user-phone">${user.phoneNumber}</div>
              </div>
              <span class="verified-pill">App Session Verified</span>
            </div>
          `
              : ''
          }

          <div class="notice-box">
            <strong>What happens when your account is deleted?</strong>
            <ul>
              <li>Your personal profile (name, phone number, saved business info, and frames) will be permanently erased.</li>
              <li>All your saved creations, rendered festival posts, and video reels will be purged.</li>
              <li>Any remaining VIP subscription access or AI credits will be immediately forfeited.</li>
              <li>This action is irreversible and cannot be recovered.</li>
            </ul>
          </div>

          <form id="deleteForm" method="POST" action="/delete${token ? `?token=${encodeURIComponent(token)}` : ''}">
            ${
              step === 'verify_otp'
                ? `
              <input type="hidden" name="action" value="verify_delete">
              <input type="hidden" name="phoneNumber" value="${phoneNumber}">
              ${token ? `<input type="hidden" name="token" value="${token}">` : ''}

              <div class="form-group">
                <label for="otp">Enter 6-Digit OTP Sent to ${phoneNumber}</label>
                <input 
                  type="text" 
                  id="otp" 
                  name="otp" 
                  placeholder="Enter 6-digit OTP code" 
                  maxlength="6"
                  pattern="[0-9]{4,6}"
                  inputmode="numeric"
                  required 
                  autofocus
                />
                <small style="display:block; margin-top:6px; color:#8A7A68; font-size:12px;">Development mode: Enter any 6-digit number (e.g. 123456)</small>
              </div>

              <div class="form-group">
                <label for="reason">Reason for Leaving (Required)</label>
                <select id="reason" name="reason" required>
                  <option value="No longer using the app">No longer using the app</option>
                  <option value="Found an alternative service">Found an alternative service</option>
                  <option value="Too many technical issues or bugs">Too many technical issues or bugs</option>
                  <option value="Privacy or data concerns">Privacy or data concerns</option>
                  <option value="Temporary pause / switching numbers">Temporary pause / switching numbers</option>
                  <option value="Other">Other (Please specify)</option>
                </select>
              </div>

              <div class="form-group" id="otherReasonWrap" style="display: none;">
                <label for="otherReason">Please specify your reason</label>
                <input 
                  type="text" 
                  id="otherReason" 
                  name="otherReason" 
                  placeholder="Tell us why you are deleting your account" 
                  maxlength="200"
                />
              </div>

              <div class="form-group">
                <label for="details">Additional Feedback (Optional)</label>
                <textarea 
                  id="details" 
                  name="details" 
                  rows="3" 
                  placeholder="Help us improve Starpix by sharing any feedback..."
                ></textarea>
              </div>

              <button type="submit" id="triggerBtn" class="btn-delete">
                <span>Verify OTP &amp; Permanently Delete Account</span>
              </button>
            `
                : `
              <input type="hidden" name="action" value="send_otp">
              ${token ? `<input type="hidden" name="token" value="${token}">` : ''}
              <div class="form-group">
                <label for="phoneNumber">Registered Mobile Number</label>
                <input 
                  type="tel" 
                  id="phoneNumber" 
                  name="phoneNumber" 
                  placeholder="e.g. +91 9876543210 or 9876543210" 
                  value="${user?.phoneNumber || phoneNumber}" 
                  required 
                  autofocus
                />
                <small style="display:block; margin-top:6px; color:#8A7A68; font-size:12px;">A one-time verification code will be sent to confirm your identity before deletion.</small>
              </div>
              <button type="submit" class="btn-otp">Send Verification OTP &rarr;</button>
            `
            }
          </form>
        `
        }
      </div>
    </div>
  </main>

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

  ${getWebFooter()}

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const deleteForm = document.getElementById('deleteForm');
      const confirmModal = document.getElementById('confirmModal');
      const cancelModalBtn = document.getElementById('cancelModalBtn');
      const confirmModalBtn = document.getElementById('confirmModalBtn');
      const reasonSelect = document.getElementById('reason');
      const otherReasonWrap = document.getElementById('otherReasonWrap');
      const otherReasonInput = document.getElementById('otherReason');
      const triggerBtn = document.getElementById('triggerBtn');
      let formIsConfirmed = false;

      function updateButtonState() {
        if (!reasonSelect || !triggerBtn) return;
        const selectedVal = reasonSelect.value;

        if (selectedVal === 'Other') {
          if (otherReasonWrap) otherReasonWrap.style.display = 'block';
          const customVal = (otherReasonInput ? otherReasonInput.value : '').trim();
          if (!customVal) {
            triggerBtn.disabled = true;
            triggerBtn.style.opacity = '0.5';
            triggerBtn.style.cursor = 'not-allowed';
          } else {
            triggerBtn.disabled = false;
            triggerBtn.style.opacity = '1';
            triggerBtn.style.cursor = 'pointer';
          }
        } else {
          if (otherReasonWrap) otherReasonWrap.style.display = 'none';
          triggerBtn.disabled = false;
          triggerBtn.style.opacity = '1';
          triggerBtn.style.cursor = 'pointer';
        }
      }

      if (reasonSelect) {
        reasonSelect.addEventListener('change', updateButtonState);
      }
      if (otherReasonInput) {
        otherReasonInput.addEventListener('input', updateButtonState);
      }
      updateButtonState();

      if (!deleteForm) return;

      deleteForm.addEventListener('submit', function(e) {
        if (formIsConfirmed) {
          return true;
        }

        const actionInput = deleteForm.querySelector('input[name="action"]');
        const actionVal = actionInput ? actionInput.value : '';

        // Allow direct submission for OTP request step
        if (actionVal === 'send_otp') {
          return true;
        }

        // For deletion actions, intercept and display modal confirmation first
        e.preventDefault();

        if (reasonSelect && reasonSelect.value === 'Other') {
          const customVal = (otherReasonInput ? otherReasonInput.value : '').trim();
          if (!customVal) {
            alert('Please specify your reason for account deletion.');
            if (otherReasonInput) otherReasonInput.focus();
            return false;
          }
        }

        const otpInput = document.getElementById('otp');
        if (otpInput && !otpInput.checkValidity()) {
          otpInput.reportValidity();
          return false;
        }

        if (confirmModal) {
          confirmModal.classList.add('active');
        } else {
          if (confirm('Are you sure you want to permanently delete your Starpix account? All personal profile data and creations will be erased.')) {
            formIsConfirmed = true;
            deleteForm.submit();
          }
        }
      });

      if (cancelModalBtn && confirmModal) {
        cancelModalBtn.addEventListener('click', function() {
          confirmModal.classList.remove('active');
        });
      }

      if (confirmModal) {
        confirmModal.addEventListener('click', function(e) {
          if (e.target === confirmModal) {
            confirmModal.classList.remove('active');
          }
        });
      }

      if (confirmModalBtn && deleteForm) {
        confirmModalBtn.addEventListener('click', function() {
          formIsConfirmed = true;
          confirmModalBtn.innerText = 'Deleting Account...';
          confirmModalBtn.style.opacity = '0.7';
          confirmModalBtn.style.pointerEvents = 'none';
          deleteForm.submit();
        });
      }

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && confirmModal && confirmModal.classList.contains('active')) {
          confirmModal.classList.remove('active');
        }
      });
    });
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
};

module.exports = { renderAccountDeletionPage };
