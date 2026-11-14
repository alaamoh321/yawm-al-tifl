const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { db, dataDir } = require('./db');

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '3mb' }));
app.use('/uploads', express.static(path.join(dataDir, 'uploads'), { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

// ---- live updates (SSE) ----
const clients = new Set();
function broadcast(type) {
  for (const res of clients) res.write(`event: ${type}\ndata: {}\n\n`);
}
app.get('/api/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  clients.add(res);
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => { clearInterval(ping); clients.delete(res); });
});

// ---- wishes ----
const listWishes = db.prepare('SELECT id, name, wish, photo, created_at FROM wishes ORDER BY id DESC LIMIT 200');
const insertWish = db.prepare('INSERT INTO wishes (name, wish, photo) VALUES (?, ?, ?)');

app.get('/api/wishes', (_req, res) => res.json(listWishes.all()));

app.post('/api/wishes', (req, res) => {
  const name = clean(req.body?.name, 40);
  const wish = clean(req.body?.wish, 300);
  if (!name || !wish) return res.status(400).json({ error: 'اكتب اسمك وأمنيتك من فضلك' });
  let photo = null;
  const data = req.body?.photo;
  if (data) {
    const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(data));
    if (!m) return res.status(400).json({ error: 'الصورة غير صالحة' });
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 2 * 1024 * 1024) return res.status(400).json({ error: 'الصورة كبيرة جدًا' });
    const file = `${crypto.randomUUID()}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
    fs.writeFileSync(path.join(dataDir, 'uploads', file), buf);
    photo = `/uploads/${file}`;
  }
  const info = insertWish.run(name, wish, photo);
  broadcast('wishes');
  res.status(201).json({ id: Number(info.lastInsertRowid), name, wish, photo });
});

// ---- mothers' corner ----
const listMoms = db.prepare('SELECT id, child_name, message, created_at FROM mom_messages ORDER BY id DESC LIMIT 200');
const insertMom = db.prepare('INSERT INTO mom_messages (child_name, message) VALUES (?, ?)');

app.get('/api/moms', (_req, res) => res.json(listMoms.all()));

app.post('/api/moms', (req, res) => {
  const child_name = clean(req.body?.child_name, 40);
  const message = clean(req.body?.message, 500);
  if (!child_name || !message) return res.status(400).json({ error: 'اكتبي اسم طفلك ورسالتك من فضلك' });
  const info = insertMom.run(child_name, message);
  broadcast('moms');
  res.status(201).json({ id: Number(info.lastInsertRowid), child_name, message });
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'غير موجود' }));
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: status === 413 ? 'الحجم كبير جدًا' : 'حدث خطأ، حاول مرة أخرى' });
});

module.exports = app;
