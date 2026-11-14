const test = require('node:test');
const assert = require('node:assert');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kids-mem-'));
process.env.DATA_DIR = tmp;
process.env.MEMORIES_CODE = 'test-code-123';
const app = require('../server/app');

let server, base;
test.before(async () => {
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const call = (method, p, body, code = 'test-code-123') => fetch(base + p, {
  method,
  headers: { 'Content-Type': 'application/json', ...(code ? { 'x-owner-code': code } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});
const list = async () => (await fetch(base + '/api/memories')).json();

test('gallery starts empty', async () => {
  assert.deepStrictEqual(await list(), []);
});

test('changes without the right code are refused', async () => {
  assert.strictEqual((await call('POST', '/api/memories', { photo: PNG }, null)).status, 401);
  assert.strictEqual((await call('POST', '/api/memories', { photo: PNG }, 'wrong')).status, 401);
  assert.deepStrictEqual(await list(), []);
});

test('add, edit caption, replace and delete', async () => {
  const a = await call('POST', '/api/memories', { photo: PNG, caption: 'الأولى' });
  assert.strictEqual(a.status, 201);
  const first = await a.json();
  await call('POST', '/api/memories', { photo: PNG });
  assert.strictEqual((await list()).length, 2);
  assert.strictEqual((await fetch(base + first.photo)).status, 200);

  const cap = await (await call('PUT', `/api/memories/${first.id}`, { caption: 'جديدة' })).json();
  assert.strictEqual(cap.caption, 'جديدة');
  assert.strictEqual(cap.photo, first.photo);

  const rep = await (await call('PUT', `/api/memories/${first.id}`, { photo: PNG })).json();
  assert.notStrictEqual(rep.photo, first.photo);
  assert.strictEqual((await fetch(base + first.photo)).status, 404);
  assert.strictEqual((await fetch(base + rep.photo)).status, 200);

  assert.strictEqual((await call('DELETE', `/api/memories/${first.id}`)).status, 200);
  assert.strictEqual((await fetch(base + rep.photo)).status, 404);
  assert.strictEqual((await list()).length, 1);
  assert.strictEqual((await call('DELETE', `/api/memories/${first.id}`)).status, 404);
});

test('bad images are rejected with a clear message', async () => {
  const r = await call('POST', '/api/memories', { photo: 'data:text/html;base64,AAAA' });
  assert.strictEqual(r.status, 400);
  assert.match((await r.json()).error, /الصورة/);
});
