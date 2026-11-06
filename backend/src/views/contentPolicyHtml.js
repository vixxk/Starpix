/**
 * Generative AI & Community Content Policy View for Starpix
 * Specifically designed to fulfill Google Play Developer Program Generative AI & UGC compliance
 */
const { renderWebPage } = require('./webLayout');

const renderContentPolicyPage = (req, res) => {
  const contentHtml = `
  <div class="doc-container">
    <div class="doc-card">
      <div class="doc-header">
        <span class="doc-badge-pill">
          Safety &amp; Compliance
        </span>
        <h1 class="doc-title">AI &amp; Community Content Policy</h1>
        <p class="doc-meta">
          <strong>Effective Date:</strong> January 1, 2026 &nbsp;|&nbsp; <strong>Last Updated:</strong> November 2026
        </p>
      </div>

      <div class="doc-content">
        <div class="callout-box">
          Starpix empowers millions of users to express creativity and promote local businesses through festival graphics and AI-powered animations. To protect our community and fulfill our commitments under the <strong>Google Play Generative AI Policy</strong>, we maintain zero tolerance for malicious, abusive, or harmful content.
        </div>

        <h2>1. Scope of This Policy</h2>
        <p>
          This policy applies to all content uploaded, submitted, processed, generated, or shared through the Starpix platform, including user-uploaded photos, custom branding logos, text slogans, and artificial intelligence-generated media (AI portraits, face swaps, and AI greeting videos).
        </p>

        <h2>2. Strictly Prohibited Content &amp; Behaviors</h2>
        <p>Users are strictly prohibited from generating, uploading, or distributing any media that depicts or promotes:</p>
        
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Prohibited Content Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Child Exploitation (CSAM/CSAE)</strong></td>
                <td>Zero tolerance. Any depiction, generation, or upload of child sexual abuse material or child exploitation will result in immediate permanent account termination and referral to law enforcement agencies and NCMEC.</td>
              </tr>
              <tr>
                <td><strong>Non-Consensual Imagery &amp; Deepfakes</strong></td>
                <td>Generating sexually explicit, manipulated, or defamatory imagery of any person without their explicit, verifiable consent is strictly prohibited.</td>
              </tr>
              <tr>
                <td><strong>Hate Speech &amp; Discrimination</strong></td>
                <td>Content that attacks, denigrates, incites hatred, or dehumanizes individuals or groups on the basis of race, ethnicity, religion, caste, disability, age, nationality, veteran status, sexual orientation, or gender identity.</td>
              </tr>
              <tr>
                <td><strong>Violence &amp; Dangerous Activities</strong></td>
                <td>Graphic depictions of gratuitous violence, terrorist acts, self-harm, suicide encouragement, animal cruelty, or instructions for weapons manufacturing.</td>
              </tr>
              <tr>
                <td><strong>Electoral &amp; Political Deception</strong></td>
                <td>Using AI tools to generate demonstrably false or deceptive audio-visual material designed to mislead voters about election processes, candidacies, or political events.</td>
              </tr>
              <tr>
                <td><strong>Harassment &amp; Defamation</strong></td>
                <td>Targeted harassment, cyberbullying, doxxing, or malicious defamation of private individuals.</td>
              </tr>
              <tr>
                <td><strong>Intellectual Property Infringement</strong></td>
                <td>Uploading copyrighted graphic artwork, trademarks, or proprietary brand logos without proper licensing or authorization.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>3. Responsible AI Generation Principles</h2>
        <p>In accordance with industry standards and Google Play Guidelines:</p>
        <ul>
          <li><strong>Automated Pre-Generation Filtering:</strong> Our AI infrastructure incorporates automated content moderation filters that block harmful text prompts and detect flagged imagery before generation starts.</li>
          <li><strong>No Model Training on Private Data:</strong> Photos submitted for AI rendering are processed strictly for the requested output and are NOT retained to train public generative foundation models.</li>
          <li><strong>Watermarking &amp; Provenance:</strong> Starpix reserves the right to incorporate provenance metadata or digital watermarks on generated media to maintain transparency.</li>
        </ul>

        <h2>4. In-App Content Reporting Mechanism</h2>
        <p>
          In full accordance with Google Play's User Generated Content (UGC) policies, Starpix provides built-in mechanisms for any user to flag or report objectionable content:
        </p>
        <div class="callout-box callout-box-success">
          <strong>How to Report Content in Starpix:</strong>
          <ol style="margin-top:8px; margin-left:18px;">
            <li><strong>Inside the App:</strong> When viewing any template or creation, tap the <strong>Menu &rarr; Report Issue / Content</strong> button. Select the violation category (e.g., Inappropriate content, copyright infringement, offensive graphic) and submit.</li>
            <li><strong>Track Your Reports:</strong> You can review the live status of all submitted reports under <em>Profile &rarr; Issues &amp; Feedback &rarr; My Reports</em>.</li>
            <li><strong>Email Support:</strong> You can report urgent violations directly to <a href="mailto:support@starpix.co" style="font-weight:700; color:#166534;">support@starpix.co</a> with template details or screenshots.</li>
          </ol>
        </div>

        <h2>5. Moderation &amp; Enforcement Actions</h2>
        <p>
          Our safety operations team reviews reported content 24 hours a day. Depending on the nature and severity of the violation, we take immediate enforcement actions:
        </p>
        <ul>
          <li><strong>Content Removal:</strong> Immediate takedown of the offending template or user creation from our public catalog and media cache.</li>
          <li><strong>Feature Restriction:</strong> Revocation of AI video generation privileges or custom logo uploading rights.</li>
          <li><strong>Account Suspension &amp; Blacklisting:</strong> Temporary or permanent termination of the user account and associated phone number without refund.</li>
          <li><strong>Legal Reporting:</strong> Where required by law, reporting criminal content (such as child sexual abuse material) to the relevant judicial and law enforcement authorities.</li>
        </ul>

        <h2>6. Contact Our Safety Team</h2>
        <p>
          For questions, safety inquiries, or intellectual property takedown notices (DMCA / Copyright requests), contact our Trust &amp; Safety Officer:
        </p>
        <div class="callout-box">
          <strong>Starpix Trust &amp; Safety Division</strong><br>
          <strong>Email:</strong> <a href="mailto:support@starpix.co">support@starpix.co</a><br>
          <strong>Subject:</strong> <em>[Content Violation Report] &lt;Detail&gt;</em><br>
          <strong>Turnaround Time:</strong> Reported safety violations are evaluated within 24 hours.
        </div>
      </div>
    </div>
  </div>`;

  renderWebPage(res, {
    title: 'AI & Content Safety Guidelines',
    activePage: 'content',
    contentHtml,
  });
};

module.exports = { renderContentPolicyPage };

