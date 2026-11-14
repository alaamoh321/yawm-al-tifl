const $ = (s, r = document) => r.querySelector(s);
const nf = new Intl.NumberFormat('ar-EG');
const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });

function timeAgo(sqlDate) {
  const t = new Date(sqlDate.replace(' ', 'T') + 'Z').getTime();
  const s = Math.round((t - Date.now()) / 1000);
  if (Math.abs(s) < 60) return 'الآن';
  if (Math.abs(s) < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (Math.abs(s) < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  return rtf.format(Math.round(s / 86400), 'day');
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// an illustration from the shared sprite (/art.svg)
function art(id, cls, style) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', `/art.svg#${id}`);
  if (style) use.setAttribute('style', style);
  svg.append(use);
  return svg;
}

// api(path) reads; api(path, body) posts; api(path, body, { method, code }) for the owner calls
async function api(path, body, opts = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (opts.code) headers['x-owner-code'] = opts.code;
  const method = opts.method || (body ? 'POST' : 'GET');
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'حدث خطأ، حاول مرة أخرى');
  return data;
}

// shrink a photo to a small JPEG before sending
function shrinkImage(file, max = 720) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('تعذّر قراءة الصورة')); };
    img.src = url;
  });
}
