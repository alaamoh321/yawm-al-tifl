// لعبة الأزواج: ٦ أزواج من الأشكال الملونة
const Game = (() => {
  const SHAPES = [
    { id: 'star' }, { id: 'heart' }, { id: 'balloon', style: '--c:#4CC9F0' },
    { id: 'flower' }, { id: 'cloud' }, { id: 'sun' },
  ];
  let first = null, lock = false, moves = 0, pairs = 0;

  const svg = (s) => `<svg aria-hidden="true"><use href="/art.svg#${s.id}"${s.style ? ` style="${s.style}"` : ''}/></svg>`;
  const back = '<svg aria-hidden="true"><use href="/art.svg#star" style="--c:#fff"/></svg>';

  function start() {
    const deck = [...SHAPES, ...SHAPES].map((s, i) => ({ s, k: SHAPES.indexOf(s), r: Math.random() + i * 0 }))
      .sort((a, b) => a.r - b.r);
    first = null; lock = false; moves = 0; pairs = 0; update(); $('#gWin').hidden = true;
    const board = $('#board'); board.replaceChildren();
    deck.forEach((d, i) => {
      const b = el('button', 'card-flip');
      b.type = 'button'; b.dataset.k = d.k; b.setAttribute('aria-label', `بطاقة ${nf.format(i + 1)}`);
      b.innerHTML = `<span class="in"><span class="f">${back}</span><span class="b">${svg(d.s)}</span></span>`;
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
