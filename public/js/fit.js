// Keeps names on ONE line: shrinks the text a little (never wraps) until it fits.
const Fit = {
  run(root = document) {
    root.querySelectorAll('.fit').forEach((e) => {
      e.style.fontSize = '';
      let size = parseFloat(getComputedStyle(e).fontSize);
      const min = 9;
      while (e.scrollWidth > e.clientWidth + 0.5 && size > min) {
        size -= 0.5;
        e.style.fontSize = size + 'px';
      }
    });
  },
  init() {
    this.run();
    if (document.fonts) document.fonts.ready.then(() => this.run());
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => this.run(), 80); });
    window.addEventListener('hashchange', () => setTimeout(() => this.run(), 0));
  },
};
