// PROTOTYPE helper: records a short walkthrough of both screens (webm), with a static server on :8765.
//   node prototypes/ui/record.cjs [outDir]          REDUCE=1 also checks the reduced-motion path for errors
const { chromium } = require('playwright');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:8765/prototypes/ui/';
const OUT = process.argv[2] || path.join(__dirname, 'video');

(async () => {
  const browser = await chromium.launch();
  const reduce = !!process.env.REDUCE;
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: reduce ? 'reduce' : 'no-preference',
    ...(reduce ? {} : { recordVideo: { dir: OUT, size: { width: 1440, height: 900 } } }),
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const wait = (ms) => page.waitForTimeout(reduce ? 50 : ms);
  const smooth = async (to, ms = 1400) => {
    await page.evaluate(([y, d]) => new Promise((res) => {
      const y0 = scrollY, t0 = performance.now();
      const f = (now) => { const t = Math.min(1, (now - t0) / d), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; scrollTo(0, y0 + (y - y0) * e); t < 1 ? requestAnimationFrame(f) : res(); };
      requestAnimationFrame(f);
    }), [to, reduce ? 1 : ms]);
  };
  const top = (sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY - 60, sel);

  // Landing
  await page.goto(BASE + 'landing.html', { waitUntil: 'networkidle' });
  await wait(2600);
  await smooth(await top('#demo'), 1600); await wait(2200);
  await smooth(await top('#how'), 1400); await wait(1400);
  await smooth(await top('.honest'), 1400); await wait(1600);
  await smooth(await top('#try'), 1400); await wait(800);
  const slider = page.locator('#rooms');
  const box = await slider.boundingBox();
  await page.mouse.move(box.x + box.width * 0.33, box.y + box.height / 2); await page.mouse.down();
  for (const f of [0.25, 0.15, 0.08, 0.15, 0.4, 0.6]) { await page.mouse.move(box.x + box.width * f, box.y + box.height / 2, { steps: 12 }); await wait(500); }
  await page.mouse.up();
  await page.click('[data-city="tozeur"]'); await wait(900);
  await page.click('[data-pool="0"]'); await wait(1100);
  await page.click('[data-pool="1"]'); await wait(900);
  await smooth(await top('.moves'), 1400); await wait(2200);
  await smooth(await top('#services'), 1400); await wait(1500);

  // Admin
  await page.goto(BASE + 'admin.html', { waitUntil: 'networkidle' });
  await wait(1800);
  await page.click('.st[data-st="quoted"]'); await wait(1200);
  await page.click('.st[data-st="quoted"]'); await wait(700);
  await page.click('#mine'); await wait(1300);
  await page.click('#mine'); await wait(600);
  await page.click('a[href="#/lead/L-1047"]'); await wait(2200);
  for (const t of ['notes', 'history', 'files', 'overview']) { await page.click(`.tabs a[data-t="${t}"]`); await wait(1200); }
  await page.click('#advance'); await wait(1400);
  await page.click('.tabs a[data-t="history"]'); await wait(1800);
  await page.click('.tabs a[data-t="notes"]'); await wait(600);
  await page.fill('#nt', 'Site visit confirmed for 26 Nov, 10:00. Bring the gas meter readings.'); await wait(500);
  await page.click('#addNote'); await wait(2000);
  await page.click('.back'); await wait(1600);

  await ctx.close(); await browser.close();
  console.log(reduce ? 'reduced-motion run' : 'recorded to ' + OUT, errors.length ? errors : 'no errors');
})();
