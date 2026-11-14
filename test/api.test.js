const test = require('node:test');
const assert = require('node:assert');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kids-'));
process.env.DATA_DIR = tmp;
const app = require('../server/app');

let server, base;
test.before(async () => {
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const post = (p, body) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test('wish with photo is saved and listed', async () => {
  const r = await post('/api/wishes', { name: 'سارة', wish: 'أتمنى أن أصبح طبيبة', photo: PNG });
  assert.strictEqual(r.status, 201);
  const list = await (await fetch(base + '/api/wishes')).json();
  assert.strictEqual(list[0].name, 'سارة');
  assert.match(list[0].photo, /^\/uploads\/.+\.png$/);
  assert.strictEqual((await fetch(base + list[0].photo)).status, 200);
});

test('wish validation', async () => {
  assert.strictEqual((await post('/api/wishes', { name: '', wish: 'x' })).status, 400);
  assert.strictEqual((await post('/api/wishes', { name: 'a', wish: 'b', photo: 'data:text/html;base64,AAAA' })).status, 400);
});

test('mother message is saved and listed newest first', async () => {
  await post('/api/moms', { child_name: 'عمر', message: 'الأولى' });
  await post('/api/moms', { child_name: 'ليلى', message: 'الثانية' });
  const list = await (await fetch(base + '/api/moms')).json();
  assert.deepStrictEqual(list.map((m) => m.child_name), ['ليلى', 'عمر']);
  assert.strictEqual((await post('/api/moms', { child_name: 'x' })).status, 400);
});
