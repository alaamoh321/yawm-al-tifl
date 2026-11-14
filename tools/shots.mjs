import { createRequire } from 'node:module';
const { chromium } = createRequire('/opt/uttra-browser/')('playwright');
const base = process.argv[2] || 'http://127.0.0.1:3000';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true })).newPage();
for (const [h, f] of [['', 'home'], ['memories', 'memories'], ['teacher', 'teacher']]) {
  await p.goto(`${base}/#/${h}`); await p.waitForTimeout(900);
  await p.screenshot({ path: `/workspace/.browser/s-${f}.png`, fullPage: f === 'teacher' });
}
await b.close();
