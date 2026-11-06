/**
 * Refund & Cancellation Policy View for Starpix
 * Built according to Google Play Merchant & Consumer Protection regulations
 */
const { renderWebPage } = require('./webLayout');

const renderRefundPage = (req, res) => {
  const contentHtml = `
  <div class="doc-container">
    <div class="doc-card">
      <div class="doc-header">
        <span class="doc-badge-pill">
          Consumer Protection
        </span>
        <h1 class="doc-title">Refund &amp; Cancellation Policy</h1>
        <p class="doc-meta">
          <strong>Effective Date:</strong> January 1, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> November 2026
        </p>
      </div>

      <div class="doc-content">
        <div class="callout-box">
          At <strong>Starpix</strong>, customer satisfaction is our top priority. We strive to provide the highest quality festival templates, personalized branding frames, and AI media services. This policy details how cancellations, subscription renewals, and refunds are handled for purchases made within the Starpix Android application and platform.
        </div>

        <h2>1. In-App Subscriptions (VIP Passes)</h2>
        <p>
          Starpix offers recurring and time-based VIP subscription passes (such as 7-Day, 30-Day, or 365-Day plans) that unlock premium festival frames, remove all watermarks, and enable high-resolution downloads.
        </p>
        <ul>
          <li><strong>Immediate Activation:</strong> VIP benefits take effect immediately upon confirmation of payment.</li>
          <li><strong>Transparent Billing:</strong> Prices and plan durations are clearly displayed prior to purchase confirmation.</li>
          <li><strong>No Hidden Fees:</strong> All prices shown include statutory goods and service taxes.</li>
        </ul>

        <h2>2. How to Cancel Your VIP Subscription</h2>
        <p>
          Subscriptions purchased through Google Play are managed directly through your Google account. You may cancel your subscription at any time without penalty:
        </p>
        <div class="callout-box callout-box-success">
          <strong>Steps to Cancel on Your Android Device:</strong>
          <ol style="margin-top:8px; margin-left:18px;">
            <li>Open the <strong>Google Play Store</strong> app on your Android phone or tablet.</li>
            <li>Tap on your <strong>Profile icon</strong> at the top right corner.</li>
            <li>Select <strong>Payments &amp; subscriptions</strong> &rarr; <strong>Subscriptions</strong>.</li>
            <li>Locate and tap on <strong>Starpix</strong>.</li>
            <li>Tap <strong>Cancel subscription</strong> and follow the on-screen prompts to confirm.</li>
          </ol>
        </div>
        <p>
          <em>Note:</em> When you cancel a subscription, your VIP benefits will remain active until the end of the current paid billing cycle. You will not be charged for subsequent billing cycles. Uninstalling the app does NOT automatically cancel your subscription with Google Play.
        </p>

        <h2>3. Google Play Store Purchase Refunds</h2>
        <p>
          Because in-app purchases on Android are processed through Google Play In-App Billing, refunds are governed in accordance with <strong>Google Play Refund Policies</strong>:
        </p>
        <h3>A. Within 48 Hours of Purchase</h3>
        <p>
          If less than 48 hours have elapsed since you made the in-app purchase, you can request a direct refund through Google Play:
        </p>
        <ol>
          <li>Open your web browser and visit: <a href="https://play.google.com/store/account/orderhistory" target="_blank" rel="noopener noreferrer" style="color:#EA580C; font-weight:700;">Google Play Order History</a>.</li>
          <li>Find the order you want to return.</li>
          <li>Select <strong>Request a refund</strong> or <strong>Report a problem</strong> and choose the option that describes your situation.</li>
          <li>Complete the form and note that you would like a refund. Google usually decides within 1 business day (up to 4 business days).</li>
        </ol>

        <h3>B. After 48 Hours &amp; Direct Support Assistance</h3>
        <p>
          If more than 48 hours have passed and you encountered a technical defect, duplicate charge, or billing malfunction, contact our support team at <a href="mailto:support@starpix.co">support@starpix.co</a> with:
        </p>
        <ul>
          <li>Your registered mobile phone number.</li>
          <li>Google Play Order ID (format: <code>GPA.XXXX-XXXX-XXXX-XXXXX</code> found in your Google email receipt).</li>
          <li>A brief description of the technical issue encountered.</li>
        </ul>

        <h2>4. Eligible Circumstances for Refunds</h2>
        <p>We review direct refund requests fairly on a case-by-case basis. You are generally entitled to a full or prorated refund under the following conditions:</p>
        <ul>
          <li><strong>Duplicate Billing:</strong> You were charged more than once for the same subscription or credit pack due to a network timeout or system glitch.</li>
          <li><strong>Technical Failure / Non-Delivery:</strong> You were billed but the system failed to unlock your VIP pass or AI credits, and our support team could not manually restore your entitlement within 24 hours.</li>
          <li><strong>Unusable Service:</strong> A prolonged backend service outage rendered the app inaccessible for an extended duration during an active paid period.</li>
        </ul>

        <h2>5. Non-Refundable Situations</h2>
        <p>To prevent fraud and abuse, refunds are typically not granted under the following circumstances:</p>
        <ul>
          <li><strong>Consumed AI Credits:</strong> AI credit packages where credits have already been utilized to compute and render AI videos.</li>
          <li><strong>Change of Mind:</strong> Voluntary change of mind after extensive use and multiple downloads of watermark-free festival templates.</li>
          <li><strong>Account Termination for Abuse:</strong> Accounts terminated due to violation of our Terms of Service (e.g., generating illegal or infringing content).</li>
          <li><strong>Failure to Cancel Auto-Renewal:</strong> Forgetting to cancel an auto-renewing subscription prior to the renewal date (though you can always cancel future renewals).</li>
        </ul>

        <h2>6. Processing Time &amp; Reimbursement</h2>
        <p>
          Once an approved refund is processed by Starpix or Google Play, the funds are credited back to the original payment method used during checkout (e.g. UPI, credit card, debit card, or Google Play balance). Typical turnaround times are:
        </p>
        <ul>
          <li><strong>UPI / Net Banking:</strong> 3 to 5 business days.</li>
          <li><strong>Credit / Debit Card:</strong> 5 to 10 business days depending on your bank's processing cycle.</li>
          <li><strong>Google Play Balance:</strong> Within 24 hours.</li>
        </ul>

        <h2>7. Contact Our Billing Support</h2>
        <p>
          If you have any questions or require assistance with any transaction, please get in touch with our billing help desk:
        </p>
        <div class="callout-box">
          <strong>Starpix Billing &amp; Refunds Help Desk</strong><br>
          <strong>Email:</strong> <a href="mailto:support@starpix.co">support@starpix.co</a><br>
          <strong>Subject Line Template:</strong> <em>[Billing Inquiry] GPA.XXXX-XXXX-XXXX-XXXXX</em><br>
          <strong>Response Time:</strong> Within 24–48 business hours.
        </div>
      </div>
    </div>
  </div>`;

  renderWebPage(res, {
    title: 'Refund & Cancellation Policy',
    activePage: 'refund',
    contentHtml,
  });
};

module.exports = { renderRefundPage };

