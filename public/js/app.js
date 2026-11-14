const MEMORIES = [
  ['m1.jpg', 'قراءة ممتعة تحت الشجرة'],
  ['m2.jpg', 'ركضنا تحت رذاذ الماء'],
  ['m3.jpg', 'ألوان على الوجوه والقلوب'],
  ['m4.jpg', 'مصوّرتنا الصغيرة'],
  ['m5.jpg', 'لوحة الفرح الكبيرة'],
  ['m6.jpg', 'نرسم معًا في الصف'],
  ['m7.jpg', 'أقلام ملونة وأفكار جميلة'],
];

function buildGallery() {
  const g = $('#gallery');
  for (const [file, cap] of MEMORIES) {
    const b = el('button');
    b.type = 'button';
    const img = el('img'); img.src = `/memories/${file}`; img.alt = cap; img.loading = 'lazy';
    b.append(img, el('span', null, cap));
    b.addEventListener('click', () => {
      const lb = $('#lightbox');
      $('img', lb).src = img.src; $('img', lb).alt = cap; $('p', lb).textContent = cap; lb.hidden = false;
    });
    g.append(b);
  }
  const lb = $('#lightbox');
  lb.addEventListener('click', () => { lb.hidden = true; });
}

const ROUTES = ['', 'wishes', 'moms', 'game', 'memories', 'teacher'];
function route() {
  let r = location.hash.replace(/^#\/?/, '');
  if (!ROUTES.includes(r)) r = '';
  for (const name of ROUTES) $(`#page-${name || 'home'}`).hidden = name !== r;
  $('#backBtn').hidden = r === '';
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === r));
  document.title = (r ? $(`#page-${r}`).dataset.title + ' - ' : '') + 'اليوم العالمي للطفل';
  window.scrollTo(0, 0);
}

buildGallery();
Feed.init();
Game.init();
window.addEventListener('hashchange', route);
route();
