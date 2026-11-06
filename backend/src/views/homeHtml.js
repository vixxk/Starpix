/**
 * Official Website Landing / Showcase View for Starpix
 * Modern, responsive presentation matching Starpix brand identity
 */
const { renderWebPage } = require('./webLayout');

const renderHomePage = (req, res) => {
  const contentHtml = `
  <div style="max-width: 1120px; margin: 0 auto; width: 100%;">
    <!-- HERO SECTION -->
    <section style="text-align: center; padding: 48px 16px 56px 16px;">
      <div style="display: inline-flex; align-items: center; gap: 8px; background: #FFF1E4; border: 1px solid #F0CDAF; padding: 6px 16px; border-radius: 30px; margin-bottom: 24px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #16A34A; display: inline-block;"></span>
        <span style="font-size: 12.5px; font-weight: 700; color: #EA580C; letter-spacing: 0.5px; text-transform: uppercase;">Official Android App &bull; Google Play Verified</span>
      </div>

      <h1 style="font-size: clamp(32px, 5vw, 54px); font-weight: 800; line-height: 1.15; letter-spacing: -1.2px; color: #221608; max-width: 860px; margin: 0 auto 20px auto;">
        Create Festival Posters &amp; Business Branding in <span style="background: linear-gradient(135deg, #F97316, #EA580C); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Seconds</span>
      </h1>

      <p style="font-size: clamp(16px, 2vw, 19px); color: #615243; max-width: 680px; margin: 0 auto 36px auto; line-height: 1.6;">
        Choose from over 10,000+ festival templates, daily status greetings, political milestones, and AI-powered animated greeting videos with your custom business frames, logo, and phone number.
      </p>

      <div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 14px; margin-bottom: 40px;">
        <a href="https://play.google.com/store/apps/details?id=com.starpix.app" target="_blank" rel="noopener noreferrer" class="btn-action-primary" style="font-size: 16px; padding: 16px 32px; border-radius: 32px;">
          <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.609 1.814L13.792 12 3.61 22.186a2.02 2.02 0 0 1-.61-1.48V3.294c0-.58.225-1.11.609-1.48zm11.604 11.607l2.25 2.25-11.83 6.74 9.58-8.99zm2.97-1.74l2.67 1.52c.86.49.86 1.29 0 1.78l-2.67 1.52-2.3-2.3 2.3-2.52zm-2.97-1.74l-9.58-8.99 11.83 6.74-2.25 2.25z"/>
          </svg>
          <span>Get it on Google Play</span>
        </a>
        <a href="/privacy" style="display: inline-flex; align-items: center; gap: 8px; background: #FFFFFF; border: 1px solid #F0CDAF; color: #221608; font-size: 15px; font-weight: 700; padding: 15px 28px; border-radius: 32px; text-decoration: none; box-shadow: 0 4px 12px rgba(43, 24, 10, 0.04);">
          <span>Read Privacy Policy</span>
        </a>
      </div>

      <!-- Trust Badges -->
      <div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 24px; font-size: 13.5px; color: #615243; font-weight: 600;">
        <span style="display: flex; align-items: center; gap: 6px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#16A34A"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          100% Secure &amp; TLS Encrypted
        </span>
        <span style="display: flex; align-items: center; gap: 6px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#16A34A"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          10+ Regional Languages
        </span>
        <span style="display: flex; align-items: center; gap: 6px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#16A34A"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          Instant Self-Service Account Deletion
        </span>
      </div>
    </section>

    <!-- CORE FEATURES GRID -->
    <section style="padding: 24px 16px 64px 16px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="font-size: 28px; font-weight: 800; color: #221608; letter-spacing: -0.6px; margin-bottom: 8px;">Everything You Need For Social &amp; Business Presence</h2>
        <p style="font-size: 15px; color: #8A7A68;">Built specifically for entrepreneurs, creators, local shops, and festival enthusiasts.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
        <!-- Feature 1 -->
        <div style="background: #FFFFFF; border: 1px solid #F7E3D0; border-radius: 20px; padding: 28px; box-shadow: 0 10px 28px rgba(43, 24, 10, 0.04);">
          <div style="width: 52px; height: 52px; border-radius: 14px; background: #FFF1E4; color: #EA580C; display: flex; align-items: center; justify-content: center; margin-bottom: 18px;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/></svg>
          </div>
          <h3 style="font-size: 18px; font-weight: 800; color: #221608; margin-bottom: 8px;">10,000+ Festival &amp; Greeting Posters</h3>
          <p style="font-size: 14px; color: #615243; line-height: 1.6;">
            Celebrate Diwali, Holi, Eid, Christmas, Navratri, Independence Day, Guru Nanak Jayanti, and 365 daily status designs with fresh templates updated daily.
          </p>
        </div>

        <!-- Feature 2 -->
        <div style="background: #FFFFFF; border: 1px solid #F7E3D0; border-radius: 20px; padding: 28px; box-shadow: 0 10px 28px rgba(43, 24, 10, 0.04);">
          <div style="width: 52px; height: 52px; border-radius: 14px; background: #FFF1E4; color: #EA580C; display: flex; align-items: center; justify-content: center; margin-bottom: 18px;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
          </div>
          <h3 style="font-size: 18px; font-weight: 800; color: #221608; margin-bottom: 8px;">1-Click Automatic Business Frames</h3>
          <p style="font-size: 14px; color: #615243; line-height: 1.6;">
            Input your business details once. Starpix automatically formats and overlays your business logo, contact number, address, website, and social handles.
          </p>
        </div>

        <!-- Feature 3 -->
        <div style="background: #FFFFFF; border: 1px solid #F7E3D0; border-radius: 20px; padding: 28px; box-shadow: 0 10px 28px rgba(43, 24, 10, 0.04);">
          <div style="width: 52px; height: 52px; border-radius: 14px; background: #FFF1E4; color: #EA580C; display: flex; align-items: center; justify-content: center; margin-bottom: 18px;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
          </div>
          <h3 style="font-size: 18px; font-weight: 800; color: #221608; margin-bottom: 8px;">AI Video &amp; Reels Generator</h3>
          <p style="font-size: 14px; color: #615243; line-height: 1.6;">
            Turn static photos into dynamic video reels with lively motion, festive background music, and AI face styling suitable for WhatsApp Status and Instagram Reels.
          </p>
        </div>

        <!-- Feature 4 -->
        <div style="background: #FFFFFF; border: 1px solid #F7E3D0; border-radius: 20px; padding: 28px; box-shadow: 0 10px 28px rgba(43, 24, 10, 0.04);">
          <div style="width: 52px; height: 52px; border-radius: 14px; background: #FFF1E4; color: #EA580C; display: flex; align-items: center; justify-content: center; margin-bottom: 18px;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </div>
          <h3 style="font-size: 18px; font-weight: 800; color: #221608; margin-bottom: 8px;">10 Regional Indian Languages</h3>
          <p style="font-size: 14px; color: #615243; line-height: 1.6;">
            Native multilingual support for Hindi, Gujarati, Marathi, Bengali, Kannada, Malayalam, Punjabi, Tamil, Telugu, and English.
          </p>
        </div>

        <!-- Feature 5 -->
        <div style="background: #FFFFFF; border: 1px solid #F7E3D0; border-radius: 20px; padding: 28px; box-shadow: 0 10px 28px rgba(43, 24, 10, 0.04);">
          <div style="width: 52px; height: 52px; border-radius: 14px; background: #FFF1E4; color: #EA580C; display: flex; align-items: center; justify-content: center; margin-bottom: 18px;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          </div>
          <h3 style="font-size: 18px; font-weight: 800; color: #221608; margin-bottom: 8px;">Watermark-Free HD Export</h3>
          <p style="font-size: 14px; color: #615243; line-height: 1.6;">
            Download ultra-crisp high-resolution poster images directly to your photo album without any third-party logos or watermarks with Starpix VIP.
          </p>
        </div>

        <!-- Feature 6 -->
        <div style="background: #FFFFFF; border: 1px solid #F7E3D0; border-radius: 20px; padding: 28px; box-shadow: 0 10px 28px rgba(43, 24, 10, 0.04);">
          <div style="width: 52px; height: 52px; border-radius: 14px; background: #FFF1E4; color: #EA580C; display: flex; align-items: center; justify-content: center; margin-bottom: 18px;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
          </div>
          <h3 style="font-size: 18px; font-weight: 800; color: #221608; margin-bottom: 8px;">Google Play Policy Compliant</h3>
          <p style="font-size: 14px; color: #615243; line-height: 1.6;">
            Full adherence to Google Play Data Safety standards, transparent privacy policy, prompt content moderation, and self-service account deletion.
          </p>
        </div>
      </div>
    </section>

    <!-- COMPLIANCE & LEGAL QUICK LINKS -->
    <section style="background: #FFFFFF; border: 1px solid #F7E3D0; border-radius: 24px; padding: 36px 32px; margin: 0 16px 48px 16px; box-shadow: 0 12px 32px rgba(43, 24, 10, 0.05);">
      <h3 style="font-size: 20px; font-weight: 800; color: #221608; margin-bottom: 12px;">Google Play Console Official Policies</h3>
      <p style="font-size: 14.5px; color: #615243; margin-bottom: 24px;">
        For Google Play reviewers, enterprise partners, and end users, our complete legal documents and policies are accessible below:
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
        <a href="/privacy" style="display: block; background: #FFF9F3; border: 1px solid #F0CDAF; border-radius: 12px; padding: 14px 18px; text-decoration: none; color: #221608; font-weight: 700; font-size: 14px;">
          &rarr; Privacy Policy
        </a>
        <a href="/terms" style="display: block; background: #FFF9F3; border: 1px solid #F0CDAF; border-radius: 12px; padding: 14px 18px; text-decoration: none; color: #221608; font-weight: 700; font-size: 14px;">
          &rarr; Terms of Service
        </a>
        <a href="/refund" style="display: block; background: #FFF9F3; border: 1px solid #F0CDAF; border-radius: 12px; padding: 14px 18px; text-decoration: none; color: #221608; font-weight: 700; font-size: 14px;">
          &rarr; Refund &amp; Cancellation
        </a>
        <a href="/content-policy" style="display: block; background: #FFF9F3; border: 1px solid #F0CDAF; border-radius: 12px; padding: 14px 18px; text-decoration: none; color: #221608; font-weight: 700; font-size: 14px;">
          &rarr; AI &amp; Content Safety
        </a>
        <a href="/contact" style="display: block; background: #FFF9F3; border: 1px solid #F0CDAF; border-radius: 12px; padding: 14px 18px; text-decoration: none; color: #221608; font-weight: 700; font-size: 14px;">
          &rarr; Contact Us &amp; Support
        </a>
        <a href="/delete-account" style="display: block; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 14px 18px; text-decoration: none; color: #DC2626; font-weight: 700; font-size: 14px;">
          &rarr; Delete Account Portal
        </a>
      </div>
    </section>
  </div>`;

  renderWebPage(res, {
    title: 'Festival Posters & Business Branding Platform',
    activePage: 'home',
    contentHtml,
  });
};

module.exports = { renderHomePage };

