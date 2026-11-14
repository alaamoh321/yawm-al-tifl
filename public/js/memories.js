// «ذكرياتنا»: shows only photos the owner uploaded. Controls appear after the owner code is entered.
const Memories = {
  items: [],
  code: localStorage.getItem('ownerCode') || '',
  unlocked: false,
  enabled: true,

  async init() {
    this.grid = $('#gallery');
    this.empty = $('#memEmpty');
    this.bar = $('#memOwner');
    this.msg = $('#memMsg');
    const lb = $('#lightbox');
    lb.addEventListener('click', () => { lb.hidden = true; });

    $('#memLock').addEventListener('click', () => this.askCode());
    $('#memLogout').addEventListener('click', () => this.lock());
    $('#memCodeForm').addEventListener('submit', (e) => { e.preventDefault(); this.tryCode($('#memCode').value.trim()); });
    $('#memAdd').addEventListener('change', (e) => this.addMany([...e.target.files]).finally(() => { e.target.value = ''; }));

    try { this.enabled = (await api('/api/memories/status')).enabled; } catch {}
    if (this.code && this.enabled) await this.tryCode(this.code, true);
    this.syncBar();
    await this.load();
  },

  say(text, bad) { this.msg.textContent = text; this.msg.classList.toggle('bad', Boolean(bad)); },

  async load() {
    try { this.items = await api('/api/memories'); } catch { return; }
    this.render();
  },

  syncBar() {
    $('#memLock').hidden = this.unlocked;
    $('#memTools').hidden = !this.unlocked;
    if (this.unlocked) $('#memCodeForm').hidden = true;
  },

  askCode() {
    if (!this.enabled) return this.say('رمز التحكم بالصور لم يُفعَّل بعد.', true);
    const f = $('#memCodeForm');
    f.hidden = !f.hidden;
    if (!f.hidden) $('#memCode').focus();
  },

  async tryCode(code, silent) {
    if (!code) return;
    try {
      await api('/api/memories/check', {}, { code });
      this.code = code; this.unlocked = true;
      localStorage.setItem('ownerCode', code);
      $('#memCode').value = '';
      this.say('');
    } catch (e) {
      this.unlocked = false;
      if (!silent) this.say(e.message, true);
      else { localStorage.removeItem('ownerCode'); this.code = ''; }
    }
    this.syncBar();
    this.render();
  },

  lock() {
    this.unlocked = false; this.code = '';
    localStorage.removeItem('ownerCode');
    this.say('');
    this.syncBar(); this.render();
  },

  async call(path, body, method) {
    try { return await api(path, body, { method, code: this.code }); }
    catch (e) {
      if (/الرمز/.test(e.message)) this.lock();
      throw e;
    }
  },

  async addMany(files) {
    const pics = files.filter((f) => f.type.startsWith('image/'));
    if (!pics.length) return;
    let ok = 0;
    for (const [i, f] of pics.entries()) {
      this.say(`جارٍ رفع الصورة ${nf.format(i + 1)} من ${nf.format(pics.length)}...`);
      try { await this.call('/api/memories', { photo: await shrinkImage(f, 1280) }); ok++; }
      catch (e) { this.say(e.message, true); }
    }
    if (ok) this.say(ok === 1 ? 'تمت إضافة الصورة.' : `تمت إضافة ${nf.format(ok)} صور.`);
    await this.load();
  },

  async replace(item, file) {
    if (!file) return;
    try {
      this.say('جارٍ استبدال الصورة...');
      await this.call(`/api/memories/${item.id}`, { photo: await shrinkImage(file, 1280) }, 'PUT');
      this.say('تم استبدال الصورة.');
      await this.load();
    } catch (e) { this.say(e.message, true); }
  },

  async caption(item) {
    const text = prompt('اكتب وصفًا قصيرًا للصورة (يمكن تركه فارغًا):', item.caption);
    if (text === null) return;
    try {
      await this.call(`/api/memories/${item.id}`, { caption: text }, 'PUT');
      this.say('تم حفظ الوصف.');
      await this.load();
    } catch (e) { this.say(e.message, true); }
  },

  async remove(item) {
    if (!confirm('هل تريدين حذف هذه الصورة؟')) return;
    try {
      await this.call(`/api/memories/${item.id}`, null, 'DELETE');
      this.say('تم حذف الصورة.');
      await this.load();
    } catch (e) { this.say(e.message, true); }
  },

  tool(label, icon, fn) {
    const b = el('button', 'mini');
    b.type = 'button';
    b.setAttribute('aria-label', label);
    b.innerHTML = `<svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><path d="${icon}"/></svg>`;
    b.append(label);
    b.addEventListener('click', fn);
    return b;
  },

  render() {
    this.empty.hidden = this.items.length > 0;
    this.grid.replaceChildren();
    for (const it of this.items) {
      const card = el('figure', 'ph');
      const b = el('button', 'ph-img');
      b.type = 'button';
      const img = el('img');
      img.src = it.photo; img.alt = it.caption || 'صورة من ذكرياتنا'; img.loading = 'lazy';
      b.append(img);
      if (it.caption) b.append(el('span', null, it.caption));
      b.addEventListener('click', () => {
        const lb = $('#lightbox');
        $('img', lb).src = it.photo; $('img', lb).alt = img.alt; $('p', lb).textContent = it.caption || ''; lb.hidden = false;
      });
      card.append(b);
      if (this.unlocked) {
        const row = el('div', 'ph-tools');
        const file = el('input'); file.type = 'file'; file.accept = 'image/*'; file.hidden = true;
        file.addEventListener('change', () => this.replace(it, file.files[0]));
        row.append(
          this.tool('استبدال', 'M3 12a9 9 0 019-9 9 9 0 016.4 2.6L21 8M21 3v5h-5M21 12a9 9 0 01-9 9 9 9 0 01-6.4-2.6L3 16M3 21v-5h5', () => file.click()),
          this.tool('وصف', 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z', () => this.caption(it)),
          this.tool('حذف', 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3', () => this.remove(it)),
          file,
        );
        card.append(row);
      }
      this.grid.append(card);
    }
    Fit.run(this.grid);
  },

  // live refresh when another device changes the gallery
  refresh() { this.load(); },
};
