// لعبة الأزواج: ٦ أزواج من الأشكال الملونة
const Game = (() => {
  const SHAPES = [
    { c: '#FFC93C', d: 'M32 6l7.5 15.5 17 2.3-12.4 11.8 3 16.9L32 44.5l-15.1 8 3-16.9L7.5 23.8l17-2.3z' },
    { c: '#FF6B6B', d: 'M32 56S8 41 8 24a13 13 0 0124-6 13 13 0 0124 6c0 17-24 32-24 32z' },
    { c: '#4CC9F0', d: 'M32 6c10 14 20 22 20 34a20 20 0 01-40 0C12 28 22 20 32 6z' },
    { c: '#6BCB77', d: 'M32 8a24 24 0 0124 24 24 24 0 01-24 24C12 56 8 36 8 36s14 4 24-4C28 24 20 16 8 20A24 24 0 0132 8z' },
    { c: '#B388EB', d: 'M32 6l22 13v26L32 58 10 45V19z' },
    { c: '#FF9F45', d: 'M32 4a28 28 0 100 56 28 28 0 000-56zm0 12l5 11h12l-9 8 3 12-11-7-11 7 3-12-9-8h12z' },
  ];
  let first = null, lock = false, moves = 0, pairs = 0;

  const svg = (s) => `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="${s.d}" fill="${s.c}"/></svg>`;

  function start() {
    const deck = [...SHAPES, ...SHAPES].map((s, i) => ({ s, k: SHAPES.indexOf(s), r: Math.random() + i * 0 }))
      .sort((a, b) => a.r - b.r);
    first = null; lock = false; moves = 0; pairs = 0; update(); $('#gWin').hidden = true;
    const board = $('#board'); board.replaceChildren();
    deck.forEach((d, i) => {
      const b = el('button', 'card-flip');
      b.type = 'button'; b.dataset.k = d.k; b.setAttribute('aria-label', `بطاقة ${nf.format(i + 1)}`);
      b.innerHTML = `<span class="in"><span class="f">؟</span><span class="b">${svg(d.s)}</span></span>`;
      b.addEventListener('click', () => flip(b));
      board.append(b);
    });
  }

  function update() {
    $('#gMoves').textContent = nf.format(moves);
    $('#gPairs').textContent = nf.format(pairs);
  }

  function flip(b) {
    if (lock || b === first || b.classList.contains('done')) return;
    b.classList.add('open');
    if (!first) { first = b; return; }
    moves++;
    if (first.dataset.k === b.dataset.k) {
      first.classList.replace('open', 'done'); b.classList.replace('open', 'done');
      first = null; pairs++;
      if (pairs === SHAPES.length) $('#gWin').hidden = false;
    } else {
      lock = true;
      const a = first; first = null;
      setTimeout(() => { a.classList.remove('open'); b.classList.remove('open'); lock = false; }, 800);
    }
    update();
  }

  function init() { $('#gReset').addEventListener('click', start); start(); }
  return { init };
})();
