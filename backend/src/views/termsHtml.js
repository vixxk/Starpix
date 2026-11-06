/**
 * Terms of Service View for Starpix
 * Fully compliant with Google Play Store standards & merchant guidelines
 */
const { renderWebPage } = require('./webLayout');

const renderTermsPage = (req, res) => {
  const contentHtml = `
  <div class="doc-container">
    <div class="doc-card">
      <div class="doc-header">
        <span class="doc-badge-pill">
          Legal Agreement
        </span>
        <h1 class="doc-title">Terms of Service &amp; Conditions</h1>
        <p class="doc-meta">
          <strong>Effective Date:</strong> January 1, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> November 2026
        </p>
      </div>

      <div class="doc-content">
        <div class="callout-box">
          Please read these Terms of Service ("Terms") carefully before using the <strong>Starpix</strong> mobile application and website operated by Starpix Technologies. By installing, creating an account, or accessing our services, you agree to be bound by these Terms and our <a href="/privacy" style="color:#EA580C; font-weight:700;">Privacy Policy</a>.
        </div>

        <h2>1. Acceptance &amp; Eligibility</h2>
        <p>
          By accessing or using Starpix, you affirm that you are at least 13 years of age (or the minimum legal age required in your jurisdiction) and possess full legal capacity to enter into these Terms. If you are using Starpix on behalf of a company, partnership, or commercial entity, you represent that you possess the requisite authority to bind that entity to these Terms.
        </p>

        <h2>2. Account Registration &amp; Security</h2>
        <p>
          To access certain features of Starpix, you must register using a valid mobile phone number. You agree to:
        </p>
        <ul>
          <li>Provide accurate, current, and complete registration information.</li>
          <li>Safeguard your authentication OTP and not transfer or share your account credentials with unauthorized third parties.</li>
          <li>Promptly notify us at <a href="mailto:support@starpix.co">support@starpix.co</a> if you suspect any unauthorized access or security breach involving your account.</li>
          <li>Accept responsibility for all activities that occur under your registered account.</li>
        </ul>

        <h2>3. Intellectual Property Rights</h2>
        <h3>A. Starpix Intellectual Property</h3>
        <p>
          All graphic templates, festival backgrounds, typography presets, frame geometries, software algorithms, UI designs, trademarks, and logos contained in Starpix are the exclusive property of Starpix Technologies or its licensors. Starpix grants you a limited, non-exclusive, revocable, non-transferable license to customize and download posters for personal or business promotional purposes.
        </p>
        <h3>B. Your Content &amp; Media</h3>
        <p>
          You retain full ownership and intellectual property rights in any photos, logos, trademarks, or business details you upload to Starpix. By submitting content, you grant Starpix a worldwide, royalty-free license solely to host, process, resize, and render your images into requested posters or AI videos. We will not use your personal images or trademarks for marketing campaigns without your explicit prior written consent.
        </p>

        <h2>4. Permitted Use &amp; Prohibited Conduct</h2>
        <p>
          Starpix empowers individuals and businesses to share creative festival greetings, political milestones, and branding graphics. To maintain a safe and lawful environment, you expressly agree <strong>NOT</strong> to:
        </p>
        <ul>
          <li>Upload, generate, or distribute any content that is unlawful, defamatory, obscene, pornographic, harassing, hateful, or threatening.</li>
          <li>Generate deceptive, fraudulent, non-consensual deepfakes, or impersonations of individuals without their verifiable permission.</li>
          <li>Infringe upon the copyright, patent, trademark, trade secret, or privacy rights of any third party.</li>
          <li>Attempt to reverse engineer, decompile, crawl, or scrape our app, backend APIs, or server databases.</li>
          <li>Circumvent or tamper with digital watermarks, security protocols, license checks, or payment gateways.</li>
          <li>Use the app to distribute unsolicited spam or chain promotions.</li>
        </ul>

        <h2>5. Purchases, Subscriptions &amp; AI Credits</h2>
        <h3>A. Google Play In-App Billing</h3>
        <p>
          All digital subscriptions (e.g. 7-Day, 30-Day, or Annual VIP passes) and consumable AI credit packages offered inside the Android application are processed securely through Google Play In-App Billing. Prices are displayed in your local currency inclusive of applicable statutory taxes (e.g., GST).
        </p>
        <h3>B. VIP Subscriptions &amp; Benefits</h3>
        <p>
          An active VIP subscription unlocks watermark-free high-resolution downloads, unrestricted access to premium festival and business frames, and priority rendering speeds. Subscriptions purchased through Google Play will automatically renew unless canceled at least 24 hours prior to the end of the current billing cycle via your Google Play account settings.
        </p>
        <h3>C. AI Credits</h3>
        <p>
          AI Credits are virtual digital tokens utilized to generate compute-intensive AI video creations and stylized portraits. AI credits are consumed immediately upon rendering initiation. Unused credits remain in your balance while your account is in good standing.
        </p>
        <h3>D. Refunds</h3>
        <p>
          Refunds for subscriptions and purchases are subject to our <a href="/refund" style="color:#EA580C; font-weight:700;">Refund &amp; Cancellation Policy</a> and Google Play Refund Policies.
        </p>

        <h2>6. Termination &amp; Account Suspension</h2>
        <p>
          We reserve the right to suspend or permanently terminate your account without prior notice if you violate these Terms, engage in fraudulent behavior, or post content that infringes upon third-party rights. You may terminate your account at any time by utilizing the in-app deletion feature or the <a href="/delete-account" style="color:#EA580C; font-weight:700;">Starpix Account Deletion Web Portal</a>.
        </p>

        <h2>7. Disclaimer of Warranties</h2>
        <p>
          THE STARPIX SERVICE, TEMPLATES, SOFTWARE, AND CONTENT ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, STARPIX DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, BUG-FREE, OR FREE OF TEMPORARY DOWNTIME.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          TO THE FULLEST EXTENT PERMISSIBLE BY APPLICABLE LAW, IN NO EVENT SHALL STARPIX, ITS DIRECTORS, EMPLOYEES, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY YOU TO STARPIX IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
        </p>

        <h2>9. Governing Law &amp; Dispute Resolution</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles. Any legal disputes arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts in India.
        </p>

        <h2>10. Modifications to Terms</h2>
        <p>
          We reserve the right to revise or update these Terms at our discretion. If we make material modifications, we will notify you by updating the "Last Updated" date or through an in-app notice. Your continued use of Starpix after changes take effect constitutes your binding acceptance of the updated Terms.
        </p>

        <h2>11. Contact Information</h2>
        <p>
          If you have any questions or require clarifications regarding these Terms, please reach out to our legal and support team:
        </p>
        <div class="callout-box">
          <strong>Starpix Legal &amp; Support</strong><br>
          <strong>Email:</strong> <a href="mailto:support@starpix.co">support@starpix.co</a><br>
          <strong>Website:</strong> <a href="/">https://16.192.94.86.sslip.io</a><br>
          <strong>Help Center:</strong> <a href="/contact">https://16.192.94.86.sslip.io/contact</a>
        </div>
      </div>
    </div>
  </div>`;

  renderWebPage(res, {
    title: 'Terms of Service',
    activePage: 'terms',
    contentHtml,
  });
};

module.exports = { renderTermsPage };

