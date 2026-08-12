// Expo's web export emits the JS bundle as a classic <script defer> tag, but the
// bundle uses `import.meta` (Metro output), which browsers only allow inside a
// module script. Without this patch the exported web build throws
// "Cannot use 'import.meta' outside a module" and renders a blank page.
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[fix-web-export] dist/index.html not found — run `npx expo export --platform web` first.');
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
const patched = html.replace(/<script\s+src="([^"]+)"\s+defer>/g, '<script type="module" src="$1" defer>');

if (patched === html) {
  console.log('[fix-web-export] No classic script tag found to patch (already module).');
} else {
  fs.writeFileSync(indexPath, patched);
  console.log('[fix-web-export] Patched dist/index.html — bundle now loads as a module.');
}
