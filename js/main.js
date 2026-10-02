// ===========================================================
// Particle field — drifting nodes linked by lines, behind the page
//
// Native canvas rather than particles.js: no third-party request, and
// it can be told about the theme. Density scales with viewport area so
// a phone is not asked to animate a desktop's worth of nodes, the loop
// stops while the tab is hidden, and reduced-motion gets one static
// frame instead of movement.
// ===========================================================
(function particleField(){
  const canvas = document.getElementById('particles');
  if(!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  // Tuned to match the reference field: grab reach 231px at 0.85 line
  // opacity, 3 nodes added per click, and a live drift rather than a crawl.
  const LINK_DIST   = 170;     // px at which two nodes are linked
  const AREA_PER_PT = 11000;   // one node per this many css px²
  const MAX_POINTS  = 130;     // ceiling for the generated field
  const HARD_CAP    = 260;     // ceiling once clicks have added nodes
  const SPEED       = 0.8;     // px per frame
  const CURSOR_DIST = 231;     // cursor-link reach
  const GRAB_ALPHA  = 0.85;    // cursor-link opacity at zero distance
  const PUSH_COUNT  = 3;       // nodes added per click

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let w = 0, h = 0, dpr = 1, points = [], raf = null, running = false;
  let accent = '80,235,236', pAlpha = 0.55, lAlpha = 0.22;
  const cursor = { x: null, y: null };

  function readTheme(){
    const cs = getComputedStyle(document.documentElement);
    const col = cs.getPropertyValue('--accent').trim();
    const m = col.match(/^#?([0-9a-f]{6})$/i);
    if(m){
      const n = parseInt(m[1], 16);
      accent = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
    }
    pAlpha = parseFloat(cs.getPropertyValue('--particle-alpha')) || 0.55;
    lAlpha = parseFloat(cs.getPropertyValue('--link-alpha')) || 0.22;
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const target = Math.min(MAX_POINTS, Math.max(26, Math.round((w * h) / AREA_PER_PT)));
    points = [];
    for(let i = 0; i < target; i++){
      const a = Math.random() * Math.PI * 2;
      points.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(a) * SPEED,
        vy: Math.sin(a) * SPEED,
        r: 1.1 + Math.random() * 1.5
      });
    }
  }

  function draw(){
    ctx.clearRect(0, 0, w, h);

    for(let i = 0; i < points.length; i++){
      const p = points[i];
      for(let j = i + 1; j < points.length; j++){
        const q = points[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d = Math.hypot(dx, dy);
        if(d < LINK_DIST){
          ctx.strokeStyle = `rgba(${accent},${lAlpha * (1 - d / LINK_DIST)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
      // link toward the cursor — the "grab" effect, and the main reason the
      // field feels responsive, so it is bright and reaches further than
      // the node-to-node links.
      let near = 0;
      if(cursor.x !== null){
        const dx = p.x - cursor.x, dy = p.y - cursor.y;
        const d = Math.hypot(dx, dy);
        if(d < CURSOR_DIST){
          near = 1 - d / CURSOR_DIST;
          ctx.strokeStyle = `rgba(${accent},${GRAB_ALPHA * near})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(cursor.x, cursor.y);
          ctx.stroke();
        }
      }
      // Nodes brighten and swell slightly as the cursor nears them.
      ctx.fillStyle = `rgba(${accent},${Math.min(1, pAlpha + near * 0.45)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 + near * 0.9), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step(){
    for(const p of points){
      p.x += p.vx; p.y += p.vy;
      if(p.x < -20) p.x = w + 20; else if(p.x > w + 20) p.x = -20;
      if(p.y < -20) p.y = h + 20; else if(p.y > h + 20) p.y = -20;
    }
    draw();
    raf = requestAnimationFrame(step);
  }

  function start(){
    if(running || reduced.matches) return;
    running = true;
    raf = requestAnimationFrame(step);
  }
  function stop(){
    running = false;
    if(raf !== null){ cancelAnimationFrame(raf); raf = null; }
  }

  function init(){
    readTheme();
    resize();
    draw();                       // always paint one frame
    if(!reduced.matches) start(); // then animate, unless asked not to
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { const was = running; stop(); init(); if(!was) stop(); }, 180);
  }, { passive: true });

  window.addEventListener('pointermove', e => { cursor.x = e.clientX; cursor.y = e.clientY; }, { passive: true });
  window.addEventListener('pointerleave', () => { cursor.x = cursor.y = null; }, { passive: true });

  // Clicking the backdrop spawns new nodes, which immediately join the
  // link network. Clicks on anything interactive are left alone so this
  // never competes with a real control. Oldest spawned nodes are pruned
  // at the cap so the field cannot grow without bound.
  function spawn(x, y){
    for(let i = 0; i < PUSH_COUNT; i++){
      const a = Math.random() * Math.PI * 2;
      points.push({
        x: x + (Math.random() - 0.5) * 24,
        y: y + (Math.random() - 0.5) * 24,
        vx: Math.cos(a) * SPEED,
        vy: Math.sin(a) * SPEED,
        r: 1.3 + Math.random() * 1.6
      });
    }
    if(points.length > HARD_CAP) points.splice(0, points.length - HARD_CAP);
    if(!running) draw();   // keep it responsive under reduced-motion
  }

  window.addEventListener('pointerdown', e => {
    if(e.target.closest('a, button, input, textarea, select, label, summary')) return;
    spawn(e.clientX, e.clientY);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if(document.hidden) stop(); else start();
  });

  reduced.addEventListener('change', () => { stop(); init(); });

  // The theme toggle repaints the palette; pick the new accent up.
  const toggle = document.getElementById('theme-toggle');
  if(toggle) toggle.addEventListener('click', () => setTimeout(() => { readTheme(); draw(); }, 50));

  init();
})();

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
