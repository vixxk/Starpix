/**
 * Shared layout component for Starpix public website pages
 * Matches Starpix brutalist/warm brand styling and provides full responsiveness across all screen sizes
 */

const fs = require('fs');
const path = require('path');

let STARPIX_LOGO_URI = '/uploads/starpix.png';
try {
  const logoPath = path.join(__dirname, '../../uploads/starpix-logo.png');
  if (fs.existsSync(logoPath)) {
    const base64Data = fs.readFileSync(logoPath).toString('base64');
    STARPIX_LOGO_URI = `data:image/png;base64,${base64Data}`;
  }
} catch (e) {
  console.warn('Failed to load inline logo:', e);
}

const getWebHeader = (activePage = '') => {
  const navItems = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'privacy', label: 'Privacy Policy', href: '/privacy' },
    { id: 'terms', label: 'Terms of Service', href: '/terms' },
    { id: 'refund', label: 'Refund Policy', href: '/refund' },
    { id: 'content', label: 'AI & Content Policy', href: '/content-policy' },
    { id: 'contact', label: 'Contact Us', href: '/contact' },
    { id: 'delete', label: 'Delete Account', href: '/delete-account', isDanger: true },
  ];

  return `
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="brand-link" title="Starpix Home">
        <div class="brand-logo-wrap">
          <img src="${STARPIX_LOGO_URI}" alt="Starpix Logo" class="brand-logo-img">
        </div>
        <div class="brand-text-wrap">
          <span class="brand-name">STARPIX</span>
          <span class="brand-sub">Poster & Branding</span>
        </div>
      </a>

      <nav class="desktop-nav" aria-label="Main Navigation">
        ${navItems
          .map(
            (item) => `
          <a href="${item.href}" class="nav-link ${activePage === item.id ? 'active' : ''} ${item.isDanger ? 'nav-link-danger' : ''}">
            ${item.label}
          </a>`
          )
          .join('')}
      </nav>

      <div class="header-actions">
        <a href="https://play.google.com/store/apps/details?id=com.starpix.app" target="_blank" rel="noopener noreferrer" class="btn-playstore-pill">
          <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.609 1.814L13.792 12 3.61 22.186a2.02 2.02 0 0 1-.61-1.48V3.294c0-.58.225-1.11.609-1.48zm11.604 11.607l2.25 2.25-11.83 6.74 9.58-8.99zm2.97-1.74l2.67 1.52c.86.49.86 1.29 0 1.78l-2.67 1.52-2.3-2.3 2.3-2.52zm-2.97-1.74l-9.58-8.99 11.83 6.74-2.25 2.25z"/>
          </svg>
          <span>Get App</span>
        </a>
      </div>
    </div>
  </header>`;
};

const getWebFooter = () => {
  return `
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-top-grid">
        <div class="footer-col footer-col-brand">
          <div class="brand-link">
            <div class="brand-logo-wrap">
              <img src="${STARPIX_LOGO_URI}" alt="Starpix Logo" class="brand-logo-img">
            </div>
            <div class="brand-text-wrap">
              <span class="brand-name">STARPIX</span>
              <span class="brand-sub">Poster & Branding</span>
            </div>
          </div>
          <p class="footer-desc">
            Your all-in-one AI festival poster maker, political banner creator, and business branding solution. Choose from 10,000+ templates with instant 1-click personal and business frames.
          </p>
          <div class="footer-badge-wrap">
            <span class="google-compliance-badge">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="#16A34A"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
              Google Play Compliant &amp; Secure
            </span>
          </div>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading">Legal &amp; Policies</h4>
          <ul class="footer-links">
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/terms">Terms of Service</a></li>
            <li><a href="/refund">Refund Policy</a></li>
            <li><a href="/content-policy">AI &amp; Content Guidelines</a></li>
            <li><a href="/delete-account">Account &amp; Data Deletion</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading">Support &amp; Help</h4>
          <ul class="footer-links">
            <li><a href="/contact">Help Center &amp; FAQs</a></li>
            <li><a href="mailto:support@starpix.co">support@starpix.co</a></li>
            <li><a href="/delete-account">Request Data Purge</a></li>
            <li><span class="support-hours">Turnaround: 24–48 Hours</span></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4 class="footer-heading">10+ Supported Languages</h4>
          <p class="lang-pills">
            <span>English</span> <span>हिन्दी</span> <span>ગુજરાતી</span> <span>मराठी</span> <span>বাংলা</span> <span>ಕನ್ನಡ</span> <span>മലയാളം</span> <span>ਪੰਜਾਬੀ</span> <span>தமிழ்</span> <span>తెలుగు</span>
          </p>
        </div>
      </div>

      <div class="footer-divider"></div>

      <div class="footer-bottom">
        <p class="copyright">
          &copy; ${new Date().getFullYear()} Starpix. All rights reserved. Google Play and the Google Play logo are trademarks of Google LLC.
        </p>
        <div class="footer-bottom-links">
          <a href="/privacy">Privacy</a>
          <span class="sep">&bull;</span>
          <a href="/terms">Terms</a>
          <span class="sep">&bull;</span>
          <a href="/refund">Refunds</a>
          <span class="sep">&bull;</span>
          <a href="/delete-account">Data Deletion</a>
        </div>
      </div>
    </div>
  </footer>`;
};

const getCommonCss = () => {
  return `
    :root {
      --bg-color: #FFF9F3;
      --card-bg: #FFFFFF;
      --text-main: #221608;
      --text-muted: #8A7A68;
      --text-body: #4A3B2C;
      --brand-primary: #F97316;
      --brand-dark: #EA580C;
      --brand-light: #FFF1E4;
      --border-color: #F7E3D0;
      --border-hover: #F0CDAF;
      --shadow-sm: 0 4px 12px rgba(43, 24, 10, 0.04);
      --shadow-md: 0 12px 32px rgba(43, 24, 10, 0.06);
      --shadow-lg: 0 20px 48px rgba(43, 24, 10, 0.09);
      --radius-sm: 8px;
      --radius-md: 16px;
      --radius-lg: 24px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    html {
      scroll-behavior: smooth;
      font-size: 16px;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg-color);
      background-image: 
        radial-gradient(at 10% 10%, rgba(249, 115, 22, 0.08) 0px, transparent 50%),
        radial-gradient(at 90% 90%, rgba(234, 88, 12, 0.06) 0px, transparent 50%);
      background-attachment: fixed;
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
      line-height: 1.65;
    }

    /* HEADER */
    .site-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(255, 249, 243, 0.94);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      width: 100%;
    }

    .header-inner {
      max-width: 1120px;
      margin: 0 auto;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .brand-link {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: inherit;
    }

    .brand-logo-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #FFFFFF;
      box-shadow: 0 4px 14px rgba(249, 115, 22, 0.16), 0 0 0 1px var(--border-color);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }

    .brand-logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .brand-text-wrap {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--text-main);
      line-height: 1.1;
    }

    .brand-sub {
      font-size: 11px;
      font-weight: 600;
      color: var(--brand-primary);
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    .desktop-nav {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .nav-link {
      font-size: 13.5px;
      font-weight: 600;
      color: #615243;
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 10px;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .nav-link:hover {
      color: var(--brand-dark);
      background-color: var(--brand-light);
    }

    .nav-link.active {
      color: var(--brand-dark);
      background-color: var(--brand-light);
      font-weight: 700;
    }

    .nav-link.nav-link-danger {
      color: #DC2626;
    }
    .nav-link.nav-link-danger:hover, .nav-link.nav-link-danger.active {
      background-color: #FEF2F2;
      color: #B91C1C;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-playstore-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #221608, #3D2B17);
      color: #FFFFFF;
      font-size: 13px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 30px;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(34, 22, 8, 0.2);
      transition: transform 0.15s ease, background 0.2s ease;
      flex-shrink: 0;
    }

    .btn-playstore-pill:hover {
      transform: translateY(-1px);
      background: linear-gradient(135deg, #F97316, #EA580C);
    }

    .play-icon {
      width: 14px;
      height: 14px;
    }

    /* MAIN CONTENT */
    .site-main {
      flex: 1;
      width: 100%;
      padding: 32px 16px 64px 16px;
    }

    .doc-container {
      max-width: 880px;
      margin: 0 auto;
    }

    .doc-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 44px 40px;
      box-shadow: var(--shadow-md);
    }

    .doc-header {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .doc-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--brand-light);
      border: 1px solid var(--border-hover);
      color: var(--brand-dark);
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .doc-title {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.8px;
      color: var(--text-main);
      line-height: 1.2;
      margin-bottom: 10px;
    }

    .doc-meta {
      font-size: 14px;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* TYPOGRAPHY IN DOCUMENTS */
    .doc-content h2 {
      font-size: 22px;
      font-weight: 800;
      color: var(--text-main);
      letter-spacing: -0.4px;
      margin-top: 36px;
      margin-bottom: 12px;
      padding-top: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .doc-content h3 {
      font-size: 17px;
      font-weight: 700;
      color: var(--text-main);
      margin-top: 24px;
      margin-bottom: 8px;
    }

    .doc-content p {
      font-size: 15px;
      color: var(--text-body);
      margin-bottom: 16px;
      line-height: 1.7;
    }

    .doc-content ul, .doc-content ol {
      margin-left: 24px;
      margin-bottom: 20px;
      color: var(--text-body);
      font-size: 15px;
    }

    .doc-content li {
      margin-bottom: 8px;
      line-height: 1.6;
    }

    .doc-content strong {
      color: var(--text-main);
    }

    .callout-box {
      background: var(--bg-color);
      border-left: 4px solid var(--brand-primary);
      border-top: 1px solid var(--border-color);
      border-right: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 18px 20px;
      margin: 24px 0;
      font-size: 14.5px;
      color: #3C2E21;
    }

    .callout-box-danger {
      background: #FEF2F2;
      border-left-color: #EF4444;
      border-top-color: #FCA5A5;
      border-right-color: #FCA5A5;
      border-bottom-color: #FCA5A5;
      color: #991B1B;
    }

    .callout-box-success {
      background: #F0FDF4;
      border-left-color: #22C55E;
      border-top-color: #86EFAC;
      border-right-color: #86EFAC;
      border-bottom-color: #86EFAC;
      color: #166534;
    }

    .data-table-wrap {
      overflow-x: auto;
      margin: 24px 0;
      border-radius: 14px;
      border: 1px solid var(--border-color);
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      text-align: left;
    }

    .data-table th {
      background: var(--brand-light);
      padding: 14px 16px;
      font-weight: 700;
      color: var(--text-main);
      border-bottom: 1px solid var(--border-color);
    }

    .data-table td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-body);
      background: #FFFFFF;
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    .btn-action-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(135deg, #F97316, #EA580C);
      color: #FFFFFF;
      font-size: 15px;
      font-weight: 700;
      padding: 14px 28px;
      border-radius: 14px;
      text-decoration: none;
      box-shadow: 0 8px 24px rgba(249, 115, 22, 0.28);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .btn-action-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(249, 115, 22, 0.38);
    }

    .btn-action-danger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: #EF4444;
      color: #FFFFFF;
      font-size: 15px;
      font-weight: 700;
      padding: 14px 28px;
      border-radius: 14px;
      text-decoration: none;
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.25);
    }

    /* FOOTER */
    .site-footer {
      background: #FFFFFF;
      border-top: 1px solid var(--border-color);
      width: 100%;
      margin-top: auto;
    }

    .footer-inner {
      max-width: 1120px;
      margin: 0 auto;
      padding: 48px 20px 32px 20px;
    }

    .footer-top-grid {
      display: grid;
      grid-template-columns: 2fr 1.2fr 1.2fr 1.4fr;
      gap: 36px;
      margin-bottom: 36px;
    }

    .footer-col-brand .footer-desc {
      font-size: 13.5px;
      color: var(--text-muted);
      margin: 14px 0 18px 0;
      line-height: 1.6;
      max-width: 340px;
    }

    .google-compliance-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      color: #166534;
      font-size: 11.5px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 20px;
    }

    .footer-heading {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--text-main);
      margin-bottom: 16px;
    }

    .footer-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .footer-links a {
      font-size: 13.5px;
      color: var(--text-body);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .footer-links a:hover {
      color: var(--brand-dark);
    }

    .support-hours {
      font-size: 12px;
      color: var(--text-muted);
    }

    .lang-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .lang-pills span {
      background: var(--bg-color);
      border: 1px solid var(--border-color);
      font-size: 11.5px;
      padding: 4px 8px;
      border-radius: 8px;
      color: var(--text-body);
    }

    .footer-divider {
      height: 1px;
      background-color: var(--border-color);
      margin-bottom: 24px;
    }

    .footer-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 13px;
      color: var(--text-muted);
    }

    .footer-bottom-links {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .footer-bottom-links a {
      color: var(--text-muted);
      text-decoration: none;
    }

    .footer-bottom-links a:hover {
      color: var(--brand-dark);
    }

    .footer-bottom-links .sep {
      color: var(--border-hover);
    }

    /* RESPONSIVE BREAKPOINTS */
    @media (max-width: 960px) {
      .footer-top-grid {
        grid-template-columns: 1fr 1fr;
        gap: 28px;
      }
      .desktop-nav {
        display: none;
      }
    }

    @media (max-width: 600px) {
      .header-inner {
        padding: 12px 16px;
      }
      .brand-sub {
        display: none;
      }
      .doc-card {
        padding: 24px 18px;
        border-radius: 18px;
      }
      .doc-title {
        font-size: 24px;
      }
      .footer-top-grid {
        grid-template-columns: 1fr;
        gap: 24px;
      }
      .footer-bottom {
        flex-direction: column;
        align-items: flex-start;
      }
      .btn-playstore-pill {
        padding: 6px 12px;
        font-size: 12px;
      }
    }
  `;
};

/**
 * Render a complete HTML5 web document wrapped in the shared Starpix layout
 */
const renderWebPage = (res, { title, activePage, contentHtml, extraCss = '' }) => {
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${title} | Starpix</title>
  <link rel="icon" type="image/png" href="${STARPIX_LOGO_URI}">
  <link rel="shortcut icon" href="${STARPIX_LOGO_URI}" type="image/png">
  <meta name="description" content="Starpix official policies, terms, refund guide, account deletion portal, and customer help center.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&display=swap" rel="stylesheet">
  <style>
    ${getCommonCss()}
    ${extraCss}
  </style>
</head>
<body>
  ${getWebHeader(activePage)}
  <main class="site-main">
    ${contentHtml}
  </main>
  ${getWebFooter()}
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(fullHtml);
};

module.exports = {
  renderWebPage,
  getWebHeader,
  getWebFooter,
  getCommonCss,
  STARPIX_LOGO_URI,
};

