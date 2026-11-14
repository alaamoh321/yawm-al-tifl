// «ذكرياتنا»: the gallery shows only photos the owner uploads. Everyone can read;
// adding, replacing and deleting need the owner code (env MEMORIES_CODE).
const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { db, dataDir } = require('./db');

const uploads = path.join(dataDir, 'uploads');
const clean = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

const list = db.prepare('SELECT id, photo, caption, created_at FROM memories ORDER BY id DESC');
const get = db.prepare('SELECT id, photo, caption, created_at FROM memories WHERE id = ?');
const insert = db.prepare('INSERT INTO memories (photo, caption) VALUES (?, ?)');
const update = db.prepare('UPDATE memories SET photo = ?, caption = ? WHERE id = ?');
const remove = db.prepare('DELETE FROM memories WHERE id = ?');

function savePhoto(data) {
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(data || ''));
  if (!m) throw Object.assign(new Error('الصورة غير صالحة'), { status: 400 });
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 2.2 * 1024 * 1024) throw Object.assign(new Error('الصورة كبيرة جدًا'), { status: 400 });
  const file = `mem-${crypto.randomUUID()}.${m[1] === 'jpeg' ? 'jpg' : m[1]}`;
  fs.writeFileSync(path.join(uploads, file), buf);
  return `/uploads/${file}`;
}
function dropFile(url) {
  if (/^\/uploads\/mem-[\w-]+\.\w+$/.test(url || '')) fs.rmSync(path.join(dataDir, url), { force: true });
}

// failed code attempts are slowed down per address
const fails = new Map();
function owner(req, res, next) {
  const code = process.env.MEMORIES_CODE;
  if (!code) return res.status(503).json({ error: 'لم يُفعَّل رمز التحكم بعد' });
  const ip = req.ip;
  const f = fails.get(ip);
  if (f && f.n >= 8 && Date.now() - f.t < 60_000) return res.status(429).json({ error: 'محاولات كثيرة، انتظري دقيقة' });
  const given = Buffer.from(String(req.get('x-owner-code') || ''));
  const real = Buffer.from(code);
  const ok = given.length === real.length && crypto.timingSafeEqual(given, real);
  if (!ok) {
    fails.set(ip, { n: (f && Date.now() - f.t < 60_000 ? f.n : 0) + 1, t: Date.now() });
    return res.status(401).json({ error: 'الرمز غير صحيح' });
  }
  fails.delete(ip);
  next();
}

module.exports = (broadcast) => {
  const r = express.Router();

  r.get('/', (_req, res) => res.json(list.all()));
  r.get('/status', (_req, res) => res.json({ enabled: Boolean(process.env.MEMORIES_CODE) }));
  r.post('/check', owner, (_req, res) => res.json({ ok: true }));

  r.post('/', owner, (req, res) => {
    const photo = savePhoto(req.body?.photo);
    const info = insert.run(photo, clean(req.body?.caption, 80));
    broadcast('memories');
    res.status(201).json(get.get(Number(info.lastInsertRowid)));
  });

  r.put('/:id', owner, (req, res) => {
    const cur = get.get(Number(req.params.id));
    if (!cur) return res.status(404).json({ error: 'الصورة غير موجودة' });
    const photo = req.body?.photo ? savePhoto(req.body.photo) : cur.photo;
    const caption = req.body?.caption != null ? clean(req.body.caption, 80) : cur.caption;
    update.run(photo, caption, cur.id);
    if (photo !== cur.photo) dropFile(cur.photo);
    broadcast('memories');
    res.json(get.get(cur.id));
  });

  r.delete('/:id', owner, (req, res) => {
    const cur = get.get(Number(req.params.id));
    if (!cur) return res.status(404).json({ error: 'الصورة غير موجودة' });
    remove.run(cur.id);
    dropFile(cur.photo);
    broadcast('memories');
    res.json({ ok: true });
  });

  return r;
};
