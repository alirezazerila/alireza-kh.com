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
  const ticks  = document.getElementById('ticks');
  if(!spokes || !petals) return;

  const cx = 300, cy = 300, n = 12;
  const R_INNER = 158, R_OUTER = 284;
  const SVG = 'http://www.w3.org/2000/svg';

  // Fine tick dial just inside the outer ring.
  if(ticks){
    for(let i = 0; i < 72; i++){
      const angle = (360 / 72) * i;
      const long = i % 6 === 0;
      const t = document.createElementNS(SVG, 'line');
      t.setAttribute('x1', cx); t.setAttribute('y1', cy - R_OUTER + (long ? 18 : 9));
      t.setAttribute('x2', cx); t.setAttribute('y2', cy - R_OUTER);
      t.setAttribute('transform', `rotate(${angle} ${cx} ${cy})`);
      t.setAttribute('opacity', long ? '0.85' : '0.4');
      ticks.appendChild(t);
    }
  }

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
    if(meta) meta.setAttribute('content', current() === 'dark' ? '#0B1418' : '#B3EBF2');
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
  window.matchMedia('(min-width: 1041px)').addEventListener('change', ev => {
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
// Scrollspy — marks the nav link for the section you are in
// ===========================================================
(function scrollSpy(){
  const links = [...document.querySelectorAll('.nav__links a[href^="#"]')];
  if(!links.length) return;

  const targets = links
    .map(a => ({ link: a, el: document.getElementById(a.getAttribute('href').slice(1)) }))
    .filter(t => t.el);
  if(!targets.length) return;

  let ticking = false;
  function update(){
    ticking = false;
    const line = window.scrollY + (window.innerHeight * 0.3);
    let active = null;
    targets.forEach(t => { if(t.el.offsetTop <= line) active = t; });
    // Past the last section, keep the final link lit.
    if(!active && window.scrollY + window.innerHeight >= document.body.scrollHeight - 4){
      active = targets[targets.length - 1];
    }
    targets.forEach(t => t.link.classList.toggle('is-current', t === active));
  }
  function schedule(){ if(!ticking){ ticking = true; requestAnimationFrame(update); } }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  update();
})();

// ===========================================================
// Stat counters — count up the first time each card is reached
//
// The final value is the HTML text; this only animates toward it, so a
// failure here leaves the real number on screen rather than a blank.
// ===========================================================
(function statCounters(){
  const stats = [...document.querySelectorAll('.stat-row strong')];
  if(!stats.length) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Only numeric stats animate; "ESP32", "Wiley", "50×50×16" are left alone.
  const targets = stats.map(el => {
    const raw = el.textContent.trim();
    const m = raw.match(/^([\d.]+)(.*)$/);
    if(!m) return null;
    return { el, value: parseFloat(m[1]), suffix: m[2], decimals: (m[1].split('.')[1] || '').length, raw, done: false };
  }).filter(Boolean);
  if(!targets.length) return;

  function run(t){
    if(t.done) return;
    t.done = true;
    const duration = 900;
    const start = performance.now();
    function step(now){
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      t.el.textContent = (t.value * eased).toFixed(t.decimals) + t.suffix;
      if(p < 1) requestAnimationFrame(step);
      else t.el.textContent = t.raw;   // restore the exact original string
    }
    requestAnimationFrame(step);
  }

  let ticking = false;
  function sweep(){
    ticking = false;
    const limit = window.innerHeight * 0.9;
    targets.forEach(t => {
      if(!t.done && t.el.getBoundingClientRect().top < limit) run(t);
    });
    if(targets.every(t => t.done)){
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    }
  }
  function schedule(){ if(!ticking){ ticking = true; requestAnimationFrame(sweep); } }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  sweep();
})();

// ===========================================================
// No scroll-reveal animation here, deliberately.
//
// An earlier version hid every section at opacity 0 and faded it in from
// JavaScript. Every scheduling strategy tried leaked the same failure: an
// IntersectionObserver silently skipped elements on an instant jump, and a
// requestAnimationFrame sweep never ran while the tab was not painting. In
// both cases real content — whole projects — stayed invisible. Gating
// content visibility on a cosmetic fade is not a trade worth making, so
// the content is simply always visible.
// ===========================================================
