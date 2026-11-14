// Wishes + mothers' corner: render lists, submit forms, refresh on new data.
const Feed = (() => {
  const seen = { wishes: new Set(), moms: new Set() };
  const loaded = { wishes: false, moms: false };
  let photoData = null;

  function wishCard(w, isNew) {
    const c = el('article', `wcard k${w.id % 5}${isNew ? ' new' : ''}`);
    if (w.photo) {
      const img = el('img', 'av');
      img.src = w.photo; img.alt = `صورة ${w.name}`; img.loading = 'lazy';
      c.append(img);
    } else {
      c.append(el('div', 'av', [...w.name][0] || '؟'));
    }
    const head = el('div');
    head.append(el('div', 'nm', w.name), el('div', 'tm', timeAgo(w.created_at)));
    c.append(head, el('p', 'tx', w.wish), art(['star', 'heart', 'cloud', 'sun', 'balloon'][w.id % 5], 'stamp'));
    return c;
  }

  function momCard(m, isNew) {
    const c = el('article', `mcard${isNew ? ' new' : ''}`);
    c.append(art('heart', 'stamp'), el('div', 'to', `إلى ${m.child_name}`), el('p', null, m.message), el('div', 'tm', timeAgo(m.created_at)));
    return c;
  }

  function render(kind, items, listEl, build, emptyText) {
    const first = !loaded[kind];
    listEl.replaceChildren();
    if (!items.length) listEl.append(el('p', 'empty', emptyText));
    for (const it of items) {
      listEl.append(build(it, !first && !seen[kind].has(it.id)));
      seen[kind].add(it.id);
    }
    loaded[kind] = true;
  }

  async function loadWishes() {
    const items = await api('/api/wishes');
    render('wishes', items, $('#wishList'), wishCard, 'كن أول من يكتب أمنية!');
    $('#statWishes').textContent = nf.format(items.length);
  }
  async function loadMoms() {
    const items = await api('/api/moms');
    render('moms', items, $('#momList'), momCard, 'كوني أول من تكتب رسالة لطفلها!');
    $('#statMoms').textContent = nf.format(items.length);
  }

  function setMsg(id, text, kind) {
    const m = $(id); m.textContent = text; m.className = 'msg ' + (kind || '');
  }

  function bindForm(form, msgId, send, after) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true; setMsg(msgId, 'جارٍ الإرسال...');
      try {
        await send(Object.fromEntries(new FormData(form)));
        form.reset(); after?.();
        setMsg(msgId, 'وصلت مشاركتك، شكرًا لك!', 'ok');
      } catch (err) {
        setMsg(msgId, err.message, 'err');
      } finally { btn.disabled = false; }
    });
  }

  function clearPhoto() {
    photoData = null; $('#photoInput').value = ''; $('#photoPreview').hidden = true;
  }

  function init() {
    $('#photoInput').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        photoData = await shrinkImage(f);
        $('#photoPreview img').src = photoData; $('#photoPreview').hidden = false;
      } catch (err) { clearPhoto(); setMsg('#wishMsg', err.message, 'err'); }
    });
    $('#photoClear').addEventListener('click', clearPhoto);

    bindForm($('#wishForm'), '#wishMsg', async (d) => {
      await api('/api/wishes', { name: d.name, wish: d.wish, photo: photoData });
      await loadWishes();
    }, clearPhoto);
    bindForm($('#momForm'), '#momMsg', async (d) => {
      await api('/api/moms', d);
      await loadMoms();
    });

    loadWishes().catch(() => {}); loadMoms().catch(() => {});
    // new posts from anyone appear automatically
    if ('EventSource' in window) {
      const es = new EventSource('/api/stream');
      es.addEventListener('wishes', () => loadWishes().catch(() => {}));
      es.addEventListener('moms', () => loadMoms().catch(() => {}));
    }
    setInterval(() => { if (!document.hidden) { loadWishes().catch(() => {}); loadMoms().catch(() => {}); } }, 15000);
  }
  return { init };
})();
