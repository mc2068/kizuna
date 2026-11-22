// PROTOTYPE helper: screenshots every screen. Run from the repo root with a static server on :8765
//   python3 -m http.server 8765 &   then   node prototypes/ui/screenshot.cjs
const { chromium } = require('playwright');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:8765/prototypes/ui/';
const OUT = process.env.OUT || path.join(__dirname, 'screenshots');
const SHOTS = [
  { name: 'landing-hero', url: 'landing.html', w: 1440, h: 900 },
  { name: 'landing-full', url: 'landing.html', w: 1440, h: 900, full: true },
  { name: 'landing-mobile', url: 'landing.html', w: 390, h: 844, full: true },
  { name: 'admin-pipeline', url: 'admin.html', w: 1440, h: 1000, full: true },
  { name: 'admin-mine', url: 'admin.html#/leads?mine=1', w: 1440, h: 1000, full: true },
  { name: 'admin-lead-overview', url: 'admin.html#/lead/L-1047', w: 1440, h: 1000, full: true },
  { name: 'admin-lead-notes', url: 'admin.html#/lead/L-1047/notes', w: 1440, h: 1000, full: true },
  { name: 'admin-lead-history', url: 'admin.html#/lead/L-1047/history', w: 1440, h: 1000, full: true },
  { name: 'admin-lead-files', url: 'admin.html#/lead/L-1047/files', w: 1440, h: 1000, full: true },
  { name: 'admin-mobile', url: 'admin.html', w: 390, h: 844, full: true },
];

(async () => {
  const only = process.argv.slice(2);
  const browser = await chromium.launch();
  for (const s of SHOTS.filter((x) => !only.length || only.includes(x.name))) {
    const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: Number(process.env.DSF || 1) });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(BASE + s.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1900);
    await page.addStyleTag({ content: '.proto{display:none!important}' });
    await page.screenshot({ path: path.join(OUT, s.name + '.png'), fullPage: !!s.full });
    console.log(s.name, errors.length ? errors : 'ok');
    await page.close();
  }
  await browser.close();
})();
