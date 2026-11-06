/**
 * Contact Us & Help Center View for Starpix
 * Provides developer support information and comprehensive FAQs required by Google Play Console
 */
const { renderWebPage } = require('./webLayout');

const renderContactPage = (req, res) => {
  const contentHtml = `
  <div class="doc-container">
    <div class="doc-card">
      <div class="doc-header">
        <span class="doc-badge-pill">
          Support &amp; Help Desk
        </span>
        <h1 class="doc-title">Starpix Customer Support &amp; Help Center</h1>
        <p class="doc-meta">
          We are here to assist you with any questions regarding festival posters, business frames, VIP passes, or account security.
        </p>
      </div>

      <div class="doc-content">
        <!-- Contact Cards Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; margin: 24px 0 32px 0;">
          <div style="background: #FFF1E4; border: 1px solid #F0CDAF; border-radius: 16px; padding: 22px; text-align: center;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: #EA580C; color: #FFFFFF; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            </div>
            <h3 style="margin-top:0; margin-bottom: 6px; font-size: 16px; font-weight: 700;">Email Help Desk</h3>
            <p style="font-size: 13.5px; color: #615243; margin-bottom: 12px;">Direct assistance for technical &amp; billing queries.</p>
            <a href="mailto:support@starpix.co" style="display: inline-block; background: #EA580C; color: #FFFFFF; font-weight: 700; padding: 8px 18px; border-radius: 20px; font-size: 13px; text-decoration: none;">support@starpix.co</a>
          </div>

          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 16px; padding: 22px; text-align: center;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: #16A34A; color: #FFFFFF; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 5.5 4.5 10 10 10s10-4.5 10-10c0-5.5-4.5-10-10-10zm1 14.5h-2v-2h2v2zm0-4.5h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.2 1.8-4 4-4s4 1.8 4 4c0 2.5-3 2.75-3 5z"/></svg>
            </div>
            <h3 style="margin-top:0; margin-bottom: 6px; font-size: 16px; font-weight: 700;">Response SLA</h3>
            <p style="font-size: 13.5px; color: #166534; margin-bottom: 12px;">Standard Turnaround Time</p>
            <span style="display: inline-block; background: #DCFCE7; color: #15803D; font-weight: 700; padding: 6px 16px; border-radius: 20px; font-size: 13px;">Within 24–48 Hours</span>
          </div>

          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 16px; padding: 22px; text-align: center;">
            <div style="width: 48px; height: 48px; border-radius: 12px; background: #EF4444; color: #FFFFFF; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px auto;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </div>
            <h3 style="margin-top:0; margin-bottom: 6px; font-size: 16px; font-weight: 700;">Data Deletion Portal</h3>
            <p style="font-size: 13.5px; color: #991B1B; margin-bottom: 12px;">Instantly erase your account &amp; data.</p>
            <a href="/delete-account" style="display: inline-block; background: #DC2626; color: #FFFFFF; font-weight: 700; padding: 8px 18px; border-radius: 20px; font-size: 13px; text-decoration: none;">Delete Account Portal &rarr;</a>
          </div>
        </div>

        <h2>Frequently Asked Questions (FAQs)</h2>

        <h3>1. How do I add my business details and logo to festival posters?</h3>
        <p>
          Open the Starpix app, tap on <strong>Profile &rarr; Edit Profile</strong>. Here you can enter your business name, mobile number, WhatsApp, email, address, website, and upload your official logo. Whenever you select any festival template, your custom business frame will automatically populate with your branding.
        </p>

        <h3>2. What benefits do I get with Starpix VIP Pass?</h3>
        <p>
          With an active VIP subscription, you get:
        </p>
        <ul>
          <li>Unlimited 100% watermark-free poster downloads.</li>
          <li>Full access to all exclusive festival frames, greetings, and political banners.</li>
          <li>High-definition (HD) image export.</li>
          <li>Priority customer support and ad-free experience.</li>
        </ul>

        <h3>3. How does AI Video generation work?</h3>
        <p>
          Our AI Video feature allows you to choose an animated template, select a portrait photo, and let our generative AI apply animated styling and background effects with festive music. Each generation uses AI credits, which can be acquired in the <em>Buy AI Credits</em> section.
        </p>

        <h3>4. How do I restore my purchase on a new phone?</h3>
        <p>
          Simply log into Starpix using the same mobile number registered during your initial purchase, or ensure you are signed into the same Google Play account on your Android device. Tap <strong>Profile &rarr; Restore Purchases</strong> to instantly sync your active VIP entitlements.
        </p>

        <h3>5. How do I permanently delete my account and data?</h3>
        <p>
          You can delete your account at any time either directly inside the app (<em>Profile &rarr; Actions &rarr; Delete Account</em>) or via our public <a href="/delete-account" style="color:#EA580C; font-weight:700;">Web Deletion Portal</a>. Once verified via OTP, your account profile, personal info, custom frames, and creation history are permanently deleted from our active databases.
        </p>

        <h2>Submit an Inquiry</h2>
        <p>Have an unresolved issue? Send our technical support engineers a direct message:</p>
        
        <div style="background: #FFF9F3; border: 1px solid #F7E3D0; border-radius: 18px; padding: 28px; margin-top: 16px;">
          <form action="mailto:support@starpix.co" method="GET" enctype="text/plain">
            <div style="margin-bottom: 16px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#221608; text-transform:uppercase; margin-bottom:6px;">Your Name</label>
              <input type="text" name="name" placeholder="Enter your full name" required style="width:100%; padding:12px 14px; background:#FFFFFF; border:1px solid #F0CDAF; border-radius:10px; font-size:14px; font-family:inherit;">
            </div>
            <div style="margin-bottom: 16px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#221608; text-transform:uppercase; margin-bottom:6px;">Registered Mobile Number</label>
              <input type="tel" name="phone" placeholder="+91 9876543210" required style="width:100%; padding:12px 14px; background:#FFFFFF; border:1px solid #F0CDAF; border-radius:10px; font-size:14px; font-family:inherit;">
            </div>
            <div style="margin-bottom: 16px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#221608; text-transform:uppercase; margin-bottom:6px;">Issue Category</label>
              <select name="subject" style="width:100%; padding:12px 14px; background:#FFFFFF; border:1px solid #F0CDAF; border-radius:10px; font-size:14px; font-family:inherit;">
                <option value="[Starpix Help] Technical App Issue">Technical App Issue</option>
                <option value="[Starpix Help] Subscription & Billing Query">Subscription &amp; Billing Query</option>
                <option value="[Starpix Help] Business Framing Assistance">Business Framing Assistance</option>
                <option value="[Starpix Help] AI Video Generation Issue">AI Video Generation Issue</option>
                <option value="[Starpix Help] Content Report / Violation">Content Report / Violation</option>
                <option value="[Starpix Help] Account Deletion Request">Account Deletion Request</option>
                <option value="[Starpix Help] General Feedback">General Feedback</option>
              </select>
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display:block; font-size:12px; font-weight:700; color:#221608; text-transform:uppercase; margin-bottom:6px;">Describe Your Issue</label>
              <textarea name="body" rows="4" placeholder="Please provide details about what happened, error messages, or device model..." required style="width:100%; padding:12px 14px; background:#FFFFFF; border:1px solid #F0CDAF; border-radius:10px; font-size:14px; font-family:inherit;"></textarea>
            </div>
            <button type="submit" class="btn-action-primary" style="border:none; cursor:pointer; width:100%;">
              <span>Send Message to Support</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>`;

  renderWebPage(res, {
    title: 'Customer Support & Help Center',
    activePage: 'contact',
    contentHtml,
  });
};

module.exports = { renderContactPage };

