// Phone-size check: node tools/e2e-mem.mjs <baseUrl> <ownerCode> [width]
// Run it against a throwaway server (temp DATA_DIR), never the real data.
import { createRequire } from 'node:module';
const require = createRequire('/opt/uttra-browser/');
const { chromium } = require('playwright');

const [base = 'http://127.0.0.1:3101', code = 'test-code', w = '360'] = process.argv.slice(2);
const width = Number(w);
const fail = [];
const ok = (cond, msg) => { console.log(cond ? 'ok  ' : 'FAIL', msg); if (!cond) fail.push(msg); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height: 740 }, isMobile: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('dialog', (d) => d.accept(d.type() === 'prompt' ? 'وصف تجريبي' : undefined));

const colors = process.env.TEST_IMGS.split(',');
const nav = (h) => page.evaluate((x) => { location.hash = x; }, h);

await page.goto(base + '/', { waitUntil: 'load' }); await page.waitForTimeout(600);
await page.evaluate(() => document.fonts.ready);

// header: one line each, no avatars, butterflies, logo
const lines = await page.evaluate(() => [...document.querySelectorAll('.top .fit, .staff .fit')].map((e) => ({
  t: e.textContent, oneLine: e.scrollWidth <= e.clientWidth + 1, h: e.getBoundingClientRect().height, fs: getComputedStyle(e).fontSize,
})));
for (const l of lines) ok(l.oneLine && l.h < 40, `one line (${l.fs}): ${l.t}`);
ok(lines.some((l) => l.t.includes('عايشة جازي بن دابس')), 'principal full name');
ok(await page.locator('.staff .bf').count() === 2, 'two butterflies in staff strip');
ok(await page.locator('.staff .av, use[href$="#teacher"]').evaluateAll((n) => n.filter((e) => e.closest('.staff, .letter')).length) === 0, 'no cartoon avatars beside names');
ok(await page.locator('.logo-chip img').evaluate((i) => i.complete && i.naturalWidth > 0), 'MoE logo loaded');
ok((await page.evaluate(() => document.fonts.check('16px "Playpen Sans Arabic"'))), 'childlike font loaded');
const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

for (const r of ['', 'wishes', 'moms', 'game', 'memories', 'teacher']) {
  await nav('#/' + r); await page.waitForTimeout(350);
  ok((await overflow()) <= 0, `no horizontal overflow on /${r}`);
  const clipped = await page.evaluate(() => [...document.querySelectorAll('.fit')].filter((e) => e.offsetParent && e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent));
  ok(clipped.length === 0, `no clipped names on /${r}`);
}

// memories: empty first
await nav('#/memories'); await page.waitForTimeout(300);
ok(await page.locator('#memEmpty').isVisible(), 'empty message shown');
ok(await page.locator('#gallery img').count() === 0, 'no photos before upload');
ok(!(await page.locator('#memTools').isVisible()), 'upload hidden before unlock');

// wrong then right code
await page.click('#memLock'); await page.fill('#memCode', 'wrong'); await page.click('#memCodeForm button');
await page.waitForTimeout(400);
ok((await page.textContent('#memMsg')).includes('غير صحيح'), 'wrong code refused');
await page.fill('#memCode', code); await page.click('#memCodeForm button');
await page.waitForSelector('#memTools:not([hidden])');
ok(true, 'unlocked');

// add several
await page.setInputFiles('#memAdd', colors);
await page.waitForFunction((n) => document.querySelectorAll('#gallery img').length === n, colors.length);
ok(await page.locator('#memEmpty').isHidden(), 'empty message hidden after upload');
ok(await page.locator('#gallery img').count() === colors.length, `${colors.length} photos added`);
ok((await overflow()) <= 0, 'no overflow with photos and tools');

// caption, replace, delete
await page.locator('.ph-tools .mini').nth(1).click();
await page.waitForFunction(() => document.querySelector('#gallery .ph-img span'));
ok(true, 'caption edited');
const before = await page.locator('#gallery img').first().getAttribute('src');
await page.locator('.ph-tools input[type=file]').first().setInputFiles(colors[colors.length - 1]);
await page.waitForFunction((b) => document.querySelector('#gallery img').getAttribute('src') !== b, before);
ok(true, 'photo replaced');
await page.locator('.ph-tools .mini').nth(2).click();
await page.waitForFunction((n) => document.querySelectorAll('#gallery img').length === n - 1, colors.length);
ok(true, 'photo deleted');

// persistence
await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(500); await nav('#/memories'); await page.waitForTimeout(500);
ok(await page.locator('#gallery img').count() === colors.length - 1, 'photos persist after reload');
ok(await page.locator('#gallery img').evaluateAll((n) => n.every((i) => i.complete && i.naturalWidth > 0)), 'all photos render');
await page.screenshot({ path: `/workspace/.browser/mem-${width}.png` });

// a visitor (no saved code) sees photos but no controls
const v = await (await browser.newContext({ viewport: { width, height: 740 }, isMobile: true })).newPage();
await v.goto(base + '/#/memories', { waitUntil: 'load' });
ok(await v.locator('#gallery img').count() === colors.length - 1 && await v.locator('.ph-tools').count() === 0, 'visitor sees photos without controls');

ok(errors.length === 0, 'no page errors ' + errors.join('|'));
await browser.close();
console.log(fail.length ? `\n${fail.length} FAILED` : '\nALL OK');
process.exit(fail.length ? 1 : 0);
