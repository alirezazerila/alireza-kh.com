// ===========================================================
// Radial "rosette" emblem ringing the portrait
// (echoes the sacred-geometry marker work)
//
// R_INNER clears the circular photo, which covers 49% of the
// stage — a radius of ~147 in this 600-unit viewBox — so no
// spoke or petal is drawn underneath it.
// ===========================================================
(function buildEmblem(){
  const spokes = document.getElementById('spokes');
  const petals = document.getElementById('petals');
  if(!spokes || !petals) return;

  const cx = 300, cy = 300, n = 12;
  const R_INNER = 158, R_OUTER = 284;
  const SVG = 'http://www.w3.org/2000/svg';

  for(let i = 0; i < n; i++){
    const angle = (360 / n) * i;

    const line = document.createElementNS(SVG, 'line');
    line.setAttribute('x1', cx); line.setAttribute('y1', cy - R_INNER);
    line.setAttribute('x2', cx); line.setAttribute('y2', cy - R_OUTER);
    line.setAttribute('transform', `rotate(${angle} ${cx} ${cy})`);
    spokes.appendChild(line);

    // Petal arc spanning the inner and mid rings
    const r1 = R_INNER, r2 = 232;
    const a1   = (Math.PI / 180) * (angle - 12);
    const a2   = (Math.PI / 180) * (angle + 12);
    const aMid = (Math.PI / 180) * angle;
    const xOuter = cx + r2 * Math.sin(aMid), yOuter = cy - r2 * Math.cos(aMid);
    const xA = cx + r1 * Math.sin(a1), yA = cy - r1 * Math.cos(a1);
    const xB = cx + r1 * Math.sin(a2), yB = cy - r1 * Math.cos(a2);

    const petal = document.createElementNS(SVG, 'path');
    petal.setAttribute('d', `M ${xA} ${yA} Q ${xOuter} ${yOuter} ${xB} ${yB}`);
    petals.appendChild(petal);
  }
})();

// ===========================================================
// Theme toggle — remembers the choice, defaults to the OS setting
// ===========================================================
(function themeToggle(){
  const btn = document.getElementById('theme-toggle');
  if(!btn) return;

  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');

  function current(){
    const set = root.getAttribute('data-theme');
    if(set) return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function paintMeta(){
    if(meta) meta.setAttribute('content', current() === 'dark' ? '#0E1216' : '#F7F3EB');
  }

  btn.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch(e) {}
    paintMeta();
  });

  paintMeta();
})();

// ===========================================================
// Mobile navigation
// ===========================================================
(function mobileNav(){
  const btn   = document.getElementById('nav-toggle');
  const panel = document.getElementById('nav-panel');
  if(!btn || !panel) return;

  function close(){
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open menu');
  }

  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    if(open){
      close();
    } else {
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close menu');
    }
  });

  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  document.addEventListener('keydown', e => {
    if(e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true'){
      close();
      btn.focus();
    }
  });

  // Panel is desktop-irrelevant — drop it if the viewport grows.
  window.matchMedia('(min-width: 901px)').addEventListener('change', ev => {
    if(ev.matches) close();
  });
})();

// ===========================================================
// Hairline under the nav once the page scrolls
// ===========================================================
(function navShadow(){
  const nav = document.getElementById('nav');
  if(!nav) return;
  const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// ===========================================================
// Project filtering
// ===========================================================
(function projectFilter(){
  const buttons = document.querySelectorAll('.filter');
  const cards   = document.querySelectorAll('.plate');
  const empty   = document.getElementById('plates-empty');
  if(!buttons.length || !cards.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      buttons.forEach(b => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });

      let shown = 0;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.cat === filter;
        card.hidden = !match;
        if(match) shown++;
      });

      if(empty) empty.hidden = shown > 0;
    });
  });
})();

// ===========================================================
// Scroll reveal
// ===========================================================
(function scrollReveal(){
  const items = document.querySelectorAll('.reveal');
  if(!items.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced || !('IntersectionObserver' in window)){
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

  items.forEach(el => io.observe(el));
})();
