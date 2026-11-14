// لعبة المطابقة: صورة كرتونية ← الحق المناسب (سحب أو نقر)
const Game = (() => {
  const RIGHTS = [
    { id: 'edu', text: 'حقّي في التعليم', alt: 'طفل في المدرسة' },
    { id: 'play', text: 'حقّي في اللعب', alt: 'طفل يلعب بالكرة' },
    { id: 'love', text: 'حقّي في الحب والرعاية', alt: 'أسرة تحتضن طفلًا' },
    { id: 'health', text: 'حقّي في الصحة', alt: 'طبيب يعالج طفلًا' },
    { id: 'food', text: 'حقّي في الغذاء', alt: 'طفل يتناول طعامًا صحيًا' },
    { id: 'safe', text: 'حقّي في الأمان والحماية', alt: 'طفل في مكان آمن' },
    { id: 'voice', text: 'حقّي في التعبير عن رأيي', alt: 'طفل يعبّر عن رأيه' },
  ];
  const CHEER = ['أحسنت! 🌟', 'رائع! 🌟', 'ممتاز! 🎉', 'برافو! 🌟', 'أنت بطل! 🏅'];
  const TRY = ['حاول مرة أخرى، أنت تستطيع! 💪', 'قريب! جرّب حقًّا آخر 😊', 'لا بأس، حاول من جديد 🌈'];
  let selected = null, done = 0, cheerIdx = 0;

  const pic = (id) => `<svg viewBox="0 0 120 120" aria-hidden="true"><use href="/rights.svg#r-${id}"/></svg>`;
  const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  const say = (t, ok) => { const m = $('#gMsg'); m.textContent = t; m.className = 'gmsg ' + (ok ? 'ok' : 'no'); };

  function start() {
    selected = null; done = 0; cheerIdx = 0;
    $('#gWin').hidden = true; $('#gReset').hidden = true;
    say('اختر صورة ثم اضغط على الحق المناسب لها، أو اسحبها إليه', true);
    $('#gMsg').className = 'gmsg';
    const tray = $('#tray'); tray.replaceChildren();
    shuffle(RIGHTS).forEach((r) => {
      const b = el('button', 'gpic'); b.type = 'button'; b.dataset.id = r.id; b.setAttribute('aria-label', r.alt);
      b.innerHTML = pic(r.id); bindDrag(b); tray.append(b);
    });
    const slots = $('#slots'); slots.replaceChildren();
    shuffle(RIGHTS).forEach((r) => {
      const s = el('button', 'gslot'); s.type = 'button'; s.dataset.id = r.id;
      s.innerHTML = `<span class="sp"></span><span class="st">${r.text}</span>`;
      s.addEventListener('click', () => { if (selected) tryMatch(selected, s); else say('اختر صورة أولًا 👆', false); });
      slots.append(s);
    });
    update();
  }

  function update() { $('#gPairs').textContent = nf.format(done); }

  function select(b) {
    if (selected) selected.classList.remove('sel');
    selected = b; if (b) b.classList.add('sel');
  }

  function tryMatch(p, s) {
    if (s.classList.contains('done')) return say('هذا الحق له صورته بالفعل ✅', false);
    if (p.dataset.id === s.dataset.id) {
      s.classList.add('done'); s.disabled = true; s.querySelector('.sp').innerHTML = pic(p.dataset.id);
      p.remove(); selected = null; done++; update();
      if (done === RIGHTS.length) {
        say('', true); $('#gWin').hidden = false; $('#gReset').hidden = false;
        $('#gWin').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else say(CHEER[cheerIdx++ % CHEER.length], true);
    } else {
      p.classList.remove('sel'); selected = null;
      p.classList.add('shake'); setTimeout(() => p.classList.remove('shake'), 500);
      say(TRY[Math.floor(Math.random() * TRY.length)], false);
    }
  }

  // سحب باللمس أو الفأرة؛ الحركة القصيرة تُعدّ نقرًا للاختيار
  function bindDrag(b) {
    let sx, sy, ghost = null, moved = false, scroller = 0;
    b.addEventListener('pointerdown', (e) => {
      sx = e.clientX; sy = e.clientY; moved = false; b.setPointerCapture(e.pointerId);
    });
    b.addEventListener('pointermove', (e) => {
      if (sx === undefined) return;
      if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) {
        moved = true; select(b);
        ghost = b.cloneNode(true); ghost.classList.add('ghost'); document.body.append(ghost); b.classList.add('lift');
      }
      if (ghost) {
        ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
        clearInterval(scroller); // تمرير الصفحة عند السحب قرب الحافة
        const edge = e.clientY < 90 ? -14 : e.clientY > innerHeight - 90 ? 14 : 0;
        if (edge) scroller = setInterval(() => scrollBy(0, edge), 30);
      }
    });
    const end = (e) => {
      if (sx === undefined) return; sx = undefined; clearInterval(scroller);
      if (moved) {
        if (ghost) { ghost.remove(); ghost = null; }
        b.classList.remove('lift');
        const t = document.elementFromPoint(e.clientX, e.clientY);
        const s = t && t.closest && t.closest('.gslot');
        if (s) tryMatch(b, s); else select(null);
      } else select(selected === b ? null : b);
    };
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', () => { sx = undefined; clearInterval(scroller); if (ghost) { ghost.remove(); ghost = null; } b.classList.remove('lift'); });
    b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(selected === b ? null : b); } });
  }

  function init() { $('#gReset').addEventListener('click', start); start(); }
  return { init };
})();
