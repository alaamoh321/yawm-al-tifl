import { createRequire } from 'node:module';
const { chromium } = createRequire('/opt/uttra-browser/')('playwright');
const base = process.argv[2] || 'http://127.0.0.1:3000';
const br = await chromium.launch();
for (const [name, w, h] of [['phone', 360, 740], ['ipad', 768, 1024]]) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(base + '/#/game'); await page.waitForSelector('.gpic');
  const ids = await page.$$eval('.gpic', (b) => b.map((x) => x.dataset.id));
  await page.waitForTimeout(500);
  const area = await page.$eval('.gplay', (e) => { const r = e.getBoundingClientRect(); return { h: r.height, top: r.top, bottom: r.bottom }; });
  console.log(`[${name}] play area visible without scrolling: top`, Math.round(area.top), 'bottom', Math.round(area.bottom), 'viewport', h, '(tab bar ~70)');
  const sizes = await page.$$eval('.gpic,.gslot', (b) => b.map((x) => { const r = x.getBoundingClientRect(); return Math.min(r.width, r.height); }));
  console.log(`[${name}] pics`, ids.length, 'slots', await page.locator('.gslot').count(), '| play area h', Math.round(area.h), 'of', h, '| min target px', Math.round(Math.min(...sizes)));
  // wrong by tap
  const wrong = ids.find((i) => i !== ids[0]);
  await page.locator(`.gpic[data-id=${ids[0]}]`).tap(); await page.locator(`.gslot[data-id=${wrong}]`).tap();
  console.log(`[${name}] wrong ->`, await page.textContent('#gMsg'));
  // real touch drag via CDP, watch scrollY
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const drag = async (id) => {
    const a = await page.locator(`.gpic[data-id=${id}]`).boundingBox(), t = await page.locator(`.gslot[data-id=${id}]`).boundingBox();
    const ys = [];
    const sx = a.x + a.width / 2, sy = a.y + a.height / 2, ex = t.x + t.width / 2, ey = t.y + t.height / 2;
    await touch('touchStart', sx, sy);
    for (let i = 1; i <= 10; i++) { await touch('touchMove', sx + (ex - sx) * i / 10, sy + (ey - sy) * i / 10); ys.push(await page.evaluate(() => scrollY)); }
    await touch('touchEnd');
    return ys;
  };
  const before = await page.evaluate(() => scrollY);
  const ys = await drag(ids[1]);
  console.log(`[${name}] touch drag ->`, await page.textContent('#gMsg'), '| scrollY before', before, 'during', [...new Set(ys)]);
  // other pair
  const ys2 = await drag(ids[2]);
  console.log(`[${name}] drag 2 scroll during`, [...new Set(ys2)], 'done', await page.textContent('#gPairs'));
  await page.locator(`.gpic[data-id=${ids[0]}]`).tap(); await page.locator(`.gslot[data-id=${ids[0]}]`).tap();
  for (const i of ids.slice(3)) { await page.locator(`.gpic[data-id=${i}]`).tap(); await page.locator(`.gslot[data-id=${i}]`).tap(); }
  await page.waitForSelector('#gWin:not([hidden])');
  console.log(`[${name}] win:`, (await page.textContent('#gWin')).slice(0, 20), '| reset visible', await page.locator('#gReset').isVisible());
  await page.screenshot({ path: `/workspace/.browser/game-${name}-win.png` });
  console.log(`[${name}] overflowX`, await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await page.tap('#gReset');
  console.log(`[${name}] after reset pics`, await page.locator('.gpic:not(.gone)').count());
  // page scrolls normally after drag
  await page.evaluate(() => scrollTo(0, 0)); await page.mouse.wheel(0, 300); await page.waitForTimeout(300);
  console.log(`[${name}] scroll after play ->`, await page.evaluate(() => scrollY), 'errors', errs);
  await ctx.close();
}
await br.close();
