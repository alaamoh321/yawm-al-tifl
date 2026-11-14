// Manual end-to-end check: node tools/e2e.mjs <baseUrl>  (needs playwright resolvable via NODE_PATH)
import { createRequire } from 'node:module';
const require = createRequire('/opt/uttra-browser/');
const { chromium } = require('playwright');

const base = process.argv[2] || 'http://127.0.0.1:3000';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const other = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();

const tag = Date.now().toString().slice(-5);
await page.goto(base + '/#/wishes');
await other.goto(base + '/#/wishes');
await page.fill('[name=name]', 'ريم' + tag);
await page.fill('[name=wish]', 'أتمنى أن أزور القمر ' + tag);
await page.setInputFiles('#photoInput', { name: 'a.png', mimeType: 'image/png', buffer: png });
await page.click('#wishForm button[type=submit]');
await page.waitForSelector(`#wishList .wcard:has-text("ريم${tag}")`, { timeout: 5000 });
console.log('wish card shown immediately: OK, has photo img:', await page.locator(`#wishList .wcard:has-text("ريم${tag}") img.av`).count());
await other.waitForSelector(`#wishList .wcard:has-text("ريم${tag}")`, { timeout: 5000 });
console.log('wish appeared in other session automatically: OK');
await page.reload();
await page.waitForSelector(`#wishList .wcard:has-text("ريم${tag}")`);
console.log('wish persisted after reload: OK');
await page.screenshot({ path: '/workspace/.browser/wishes.png' });

await page.goto(base + '/#/moms');
await other.goto(base + '/#/moms');
await page.fill('[name=child_name]', 'يوسف' + tag);
await page.fill('[name=message]', 'أنت فخري وسعادتي ' + tag);
await page.click('#momForm button[type=submit]');
await page.waitForSelector(`#momList .mcard:has-text("يوسف${tag}")`, { timeout: 5000 });
await other.waitForSelector(`#momList .mcard:has-text("يوسف${tag}")`, { timeout: 5000 });
console.log('mom message shown + appeared in other session: OK');
await page.reload();
await page.waitForSelector(`#momList .mcard:has-text("يوسف${tag}")`);
console.log('mom message persisted: OK');
await page.screenshot({ path: '/workspace/.browser/moms.png' });

await page.screenshot({ path: '/workspace/.browser/game.png' });

for (const r of ['', 'memories', 'teacher']) {
  await page.goto(base + '/#/' + r);
  await page.waitForTimeout(400);
  const dir = await page.evaluate(() => getComputedStyle(document.body).direction);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  console.log(`page "${r || 'home'}": dir=${dir} overflowX=${overflow}`);
  await page.screenshot({ path: `/workspace/.browser/${r || 'home'}.png` });
}
console.log('page errors:', errors.length ? errors : 'none');
await browser.close();
