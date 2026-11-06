/**
 * Privacy Policy View for Starpix
 * Built strictly to satisfy Google Play Console Data Safety & User Data Policy standards
 */
const { renderWebPage } = require('./webLayout');

const renderPrivacyPage = (req, res) => {
  const contentHtml = `
  <div class="doc-container">
    <div class="doc-card">
      <div class="doc-header">
        <span class="doc-badge-pill">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
          Google Play Verified &amp; Compliant
        </span>
        <h1 class="doc-title">Starpix Privacy Policy</h1>
        <p class="doc-meta">
          <strong>Effective Date:</strong> January 1, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> November 2026
        </p>
      </div>

      <div class="doc-content">
        <div class="callout-box">
          <strong>Summary for Google Play Users:</strong> Starpix is committed to transparent, privacy-first data practices. We collect only the minimal data required to deliver customized festival posters, business branding graphics, and user-initiated AI videos. Your personal images and business details are never sold, rented, or used to train public AI foundation models. You can purge your account and all associated data at any time via our in-app settings or our <a href="/delete-account" style="color:#EA580C; font-weight:700;">Account Deletion Portal</a>.
        </div>

        <h2>1. Introduction &amp; Developer Identity</h2>
        <p>
          Welcome to <strong>Starpix</strong> ("Starpix", "we", "our", or "us"). Starpix provides a mobile application available on Android via the Google Play Store (Package Name: <code>com.starpix.app</code>) that enables users to create personalized festival posters, business banners, social media status graphics, and AI-powered video greetings.
        </p>
        <p>
          This Privacy Policy explains how we collect, use, process, store, and safeguard your information when you access or use our mobile application and related web services.
        </p>
        <p>
          <strong>Developer &amp; Data Controller:</strong> Starpix Technologies<br>
          <strong>Official Contact &amp; Privacy Officer Email:</strong> <a href="mailto:support@starpix.co">support@starpix.co</a>
        </p>

        <h2>2. Information We Collect</h2>
        <p>We collect information in the following categories:</p>

        <h3>A. Account &amp; Profile Information</h3>
        <ul>
          <li><strong>Phone Number:</strong> Collected during registration to authenticate your identity via One-Time Password (OTP) and secure your account.</li>
          <li><strong>User Name &amp; Profile Photo:</strong> Provided optionally by you to customize your poster designs and user account profile.</li>
          <li><strong>Preferred Language:</strong> Stored locally and synced to display the app interface and poster templates in your chosen regional language.</li>
        </ul>

        <h3>B. Business Branding Information</h3>
        <p>If you use Starpix for commercial or business branding, you may choose to input business metadata to automatically generate branded frames:</p>
        <ul>
          <li>Business name, designation, and tagline</li>
          <li>Business logo or trademark graphics</li>
          <li>Contact details (phone number, WhatsApp number, business email, address, and website URL)</li>
          <li>Social media handles (Instagram, Facebook, YouTube, X/Twitter, etc.)</li>
        </ul>

        <h3>C. Photos, Media &amp; User Creations</h3>
        <ul>
          <li><strong>User-Selected Photos:</strong> Images you pick from your device gallery or capture via your camera to overlay into poster frames or use in AI video generation.</li>
          <li><strong>Generated Creations:</strong> Finished poster graphics, personalized banners, and videos rendered by the service at your request.</li>
          <li><strong>Processing Disclosure:</strong> Your photos are transmitted securely to our cloud infrastructure over TLS/HTTPS solely to process and render your requested artwork. We do NOT scan your entire device gallery, nor do we access photos without your explicit user selection.</li>
        </ul>

        <h3>D. Device, Diagnostics &amp; Usage Information</h3>
        <ul>
          <li><strong>Technical Metadata:</strong> Device model, operating system version (Android), unique device identifiers, app version, network state, and preferred system locale.</li>
          <li><strong>Diagnostics &amp; Crash Logs:</strong> Performance metrics, crash reports, and error stack traces utilized strictly for stability debugging and quality improvement.</li>
        </ul>

        <h3>E. Payment &amp; Purchase Data</h3>
        <p>
          When you purchase a VIP subscription or AI Credit pack, your payment transaction is handled directly and securely by the <strong>Google Play In-App Billing</strong> system or certified payment gateways. <strong>Starpix never sees, handles, or stores your credit/debit card numbers, UPI PINs, or banking credentials.</strong> We receive only a cryptographic purchase token confirming successful activation.
        </p>

        <h2>3. Google Play Device Permissions Explained</h2>
        <p>In accordance with Google Play Console policies, we explicitly describe each requested runtime permission and its exact purpose:</p>

        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Android Permission</th>
                <th>Classification</th>
                <th>Exact Purpose in Starpix</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>READ_MEDIA_IMAGES</code><br><code>READ_EXTERNAL_STORAGE</code></td>
                <td>Photos &amp; Storage</td>
                <td>Allows you to select personal photos or business logos from your gallery to insert into festival frames. Access is limited strictly to files you select.</td>
              </tr>
              <tr>
                <td><code>WRITE_EXTERNAL_STORAGE</code><br>(Android &le; 9)</td>
                <td>Storage Write</td>
                <td>Enables saving your finalized festival poster or greeting video directly into your device's photo gallery / Downloads album.</td>
              </tr>
              <tr>
                <td><code>CAMERA</code></td>
                <td>Camera (Optional)</td>
                <td>Enables capturing a new photo directly within the app to place on your poster or profile without exiting the app.</td>
              </tr>
              <tr>
                <td><code>INTERNET</code> &amp;<br><code>ACCESS_NETWORK_STATE</code></td>
                <td>Network Access</td>
                <td>Required to download high-resolution festival templates, synchronize user frames, and verify OTP login.</td>
              </tr>
              <tr>
                <td><code>POST_NOTIFICATIONS</code></td>
                <td>Notifications (Optional)</td>
                <td>Used to send timely daily reminders about upcoming festivals, holidays, and trending frames. You can disable this anytime in system settings.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>4. Generative AI &amp; Media Processing Disclosures</h2>
        <p>
          Starpix incorporates artificial intelligence features (such as automated photo cutout, background blending, and AI animated greeting videos).
        </p>
        <ul>
          <li><strong>Strict Purpose Limitation:</strong> Any portrait or image you submit for AI processing is used solely to generate the specific video or poster you requested.</li>
          <li><strong>No Model Training:</strong> We do NOT use your personal photos, faces, or business assets to train, fine-tune, or improve publicly available artificial intelligence models.</li>
          <li><strong>Temporary Processing Buffers:</strong> Intermediate AI processing files are held in secure temporary storage buffers and automatically flushed.</li>
          <li><strong>Content Safety:</strong> Our AI processing pipelines enforce automated safety filters to prevent the generation of harmful, abusive, sexually explicit, or unlawful content.</li>
        </ul>

        <h2>5. How We Use Your Information</h2>
        <p>We process your data exclusively for lawful purposes:</p>
        <ul>
          <li>To create and manage your user account.</li>
          <li>To render high-resolution posters, banners, and greeting videos customized with your branding.</li>
          <li>To process transactions and grant digital entitlements (VIP status, AI credits).</li>
          <li>To provide responsive customer support and investigate user-reported issues.</li>
          <li>To prevent fraudulent activities, abuse, and unauthorized access.</li>
          <li>To comply with applicable legal obligations and Google Play Developer Program Policies.</li>
        </ul>

        <h2>6. Third-Party Service Providers</h2>
        <p>We partner only with vetted, enterprise-grade service providers who adhere to strict data security standards:</p>
        <ul>
          <li><strong>Google Play Services:</strong> In-app billing, authentication services, and app update distribution.</li>
          <li><strong>Amazon Web Services (AWS S3 &amp; CloudFront):</strong> Encrypted cloud storage for festival template graphics and user-rendered media.</li>
          <li><strong>Expo &amp; React Native:</strong> Modern client application framework.</li>
          <li><strong>SMS / OTP Gateways:</strong> Delivering secure mobile login verification codes.</li>
        </ul>
        <p>We do NOT sell, lease, or monetize your personal data to data brokers, ad networks, or unaffiliated third parties.</p>

        <h2>7. Data Security &amp; Storage Practices</h2>
        <p>
          We employ industry-standard administrative, physical, and technical security safeguards:
        </p>
        <ul>
          <li><strong>Encryption in Transit:</strong> All data transmitted between the Starpix app and our backend servers is encrypted using Transport Layer Security (TLS 1.2 / 1.3 / HTTPS).</li>
          <li><strong>Encryption at Rest:</strong> Cloud data and file stores utilize AES-256 bit encryption.</li>
          <li><strong>Strict Access Controls:</strong> Internal access to server environments is restricted to authorized personnel using multi-factor authentication.</li>
        </ul>

        <h2>8. Data Retention &amp; Your Right to Erasure (Account Deletion)</h2>
        <p>
          In full accordance with <strong>Google Play Data Safety guidelines</strong>, users possess the absolute right to request the deletion of their account and all associated personal data:
        </p>
        <div class="callout-box callout-box-danger">
          <strong>How to Delete Your Account and Data:</strong>
          <ol style="margin-top:8px; margin-left:18px;">
            <li><strong>Inside the App:</strong> Navigate to <em>Profile / Settings &rarr; Actions &rarr; Delete Account</em>. Confirm your request to immediately erase your account.</li>
            <li><strong>Web Deletion Portal (No app required):</strong> Visit our public deletion webpage at <a href="/delete-account" style="font-weight:700; color:#DC2626;">https://16.192.94.86.sslip.io/delete-account</a>. Enter your registered mobile number, verify the 6-digit OTP, and your account and data will be permanently wiped.</li>
          </ol>
        </div>
        <p>
          <strong>What gets deleted immediately:</strong> Your profile records, registered phone number, customized business cards/frames, uploaded profile pictures, user creations, and report history.
        </p>
        <p>
          <strong>What may be retained:</strong> Non-personally identifiable billing transaction receipts (e.g. tax invoice IDs, order timestamps) retained solely for statutory taxation and accounting obligations for the period prescribed by law.
        </p>

        <h2>9. Children's Privacy</h2>
        <p>
          Starpix is designed for general audiences and commercial business operators. The application is <strong>NOT directed at children under the age of 13</strong> (or under 16 in the European Economic Area). We do not knowingly solicit or collect personal information from children. If we become aware that personal information of a child under 13 has been inadvertently collected, we will take immediate steps to delete such data from our records.
        </p>

        <h2>10. Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy periodically to reflect enhancements in our services or changes in legal regulations. When updates are published, we will revise the "Last Updated" date at the top of this page. Substantial updates will be highlighted via in-app notifications.
        </p>

        <h2>11. Contact Us &amp; Grievance Redressal</h2>
        <p>
          If you have questions, feedback, or data privacy requests concerning this Privacy Policy, please contact our dedicated Privacy &amp; Compliance Officer:
        </p>
        <div class="callout-box">
          <strong>Starpix Compliance &amp; Support Team</strong><br>
          <strong>Email:</strong> <a href="mailto:support@starpix.co">support@starpix.co</a><br>
          <strong>Website:</strong> <a href="/">https://16.192.94.86.sslip.io</a><br>
          <strong>Account Deletion Tool:</strong> <a href="/delete-account">https://16.192.94.86.sslip.io/delete-account</a><br>
          <strong>Response Timeframe:</strong> Within 24–48 business hours.
        </div>
      </div>
    </div>
  </div>`;

  renderWebPage(res, {
    title: 'Privacy Policy',
    activePage: 'privacy',
    contentHtml,
  });
};

module.exports = { renderPrivacyPage };

