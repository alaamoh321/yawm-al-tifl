import { createRequire } from 'node:module';
const { chromium } = createRequire('/opt/uttra-browser/')('playwright');
const base = process.argv[2] || 'http://127.0.0.1:3000';
const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto(base + '/#/game'); await page.waitForSelector('.gpic');
const ids = await page.$$eval('.gpic', (b) => b.map((x) => x.dataset.id));
console.log('pics', ids.length, 'slots', await page.locator('.gslot').count());
// wrong
const wrong = ids.find((i) => i !== ids[0]);
await page.locator(`.gpic[data-id=${ids[0]}]`).click();
await page.locator(`.gslot[data-id=${wrong}]`).click();
console.log('wrong ->', await page.textContent('#gMsg'), '| pics left', await page.locator('.gpic').count());
// tap correct
await page.locator(`.gpic[data-id=${ids[0]}]`).click();
await page.locator(`.gslot[data-id=${ids[0]}]`).click();
console.log('tap ok ->', await page.textContent('#gMsg'));
// drag correct with mouse (pointer events)
const id = ids[1]; await page.setViewportSize({ width: 360, height: 1500 }); await page.evaluate(()=>scrollTo(0,0)); await page.waitForTimeout(400);
const a = await page.locator(`.gpic[data-id=${id}]`).boundingBox();
const t = await page.locator(`.gslot[data-id=${id}]`).boundingBox();
await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
await page.mouse.move(t.x + 60, t.y + 20, { steps: 8 }); await page.mouse.up();
await page.setViewportSize({ width: 360, height: 740 });
console.log('drag ok ->', await page.textContent('#gMsg'), '| done', await page.textContent('#gPairs'));
await page.screenshot({ path: '/workspace/.browser/game-mid.png', fullPage: true });
for (const i of ids.slice(2)) {
  await page.locator(`.gpic[data-id=${i}]`).click(); await page.locator(`.gslot[data-id=${i}]`).click();
}
await page.waitForSelector('#gWin:not([hidden])');
console.log('win:', await page.textContent('#gWin'), '| reset visible', await page.locator('#gReset').isVisible());
await page.screenshot({ path: '/workspace/.browser/game-win.png', fullPage: true });
console.log('overflow', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
await page.click('#gReset');
console.log('after reset pics', await page.locator('.gpic').count(), 'win hidden', await page.locator('#gWin').isHidden());
console.log('errors', errs);
await br.close();
