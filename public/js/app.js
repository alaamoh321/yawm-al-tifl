const ROUTES = ['', 'wishes', 'moms', 'game', 'memories', 'teacher'];
function route() {
  let r = location.hash.replace(/^#\/?/, '');
  if (!ROUTES.includes(r)) r = '';
  for (const name of ROUTES) $(`#page-${name || 'home'}`).hidden = name !== r;
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === r));
  document.title = (r ? $(`#page-${r}`).dataset.title + ' - ' : '') + 'اليوم العالمي للطفل';
  window.scrollTo(0, 0);
}

Memories.init();
Feed.init();
Game.init();
window.addEventListener('hashchange', route);
route();
Fit.init();
