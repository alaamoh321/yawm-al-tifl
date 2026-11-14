import { createRequire } from 'node:module';
const { chromium } = createRequire('/opt/uttra-browser/')('playwright');
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
await p.goto('http://127.0.0.1:3000/#/'); await p.waitForTimeout(800);
await p.evaluate(() => window.scrollTo(0, 700)); await p.waitForTimeout(300);
await p.screenshot({ path: '/workspace/.browser/home2.png' });
await p.goto('http://127.0.0.1:3000/#/moms'); await p.waitForTimeout(800);
await p.evaluate(() => window.scrollTo(0, 560)); await p.waitForTimeout(300);
await p.screenshot({ path: '/workspace/.browser/moms2.png' });
const w = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await w.goto('http://127.0.0.1:3000/#/'); await w.waitForTimeout(800);
await w.screenshot({ path: '/workspace/.browser/wide.png' });
// each home tile opens the right section
const q = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
for (const [href, id] of [['wishes','wishes'],['moms','moms'],['game','game'],['memories','memories'],['teacher','teacher']]) {
  await q.goto('http://127.0.0.1:3000/#/'); await q.click(`.menu a[href="#/${href}"]`); await q.waitForTimeout(300);
  console.log(href, 'visible:', await q.isVisible(`#page-${id}`), 'home hidden:', await q.isHidden('#page-home'));
}
await b.close();
