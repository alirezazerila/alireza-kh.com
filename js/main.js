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

// ===========================================================
// Role rotator — one of the four shows at a time
//
// All four stay in the DOM and the wrapper carries an aria-label listing
// them, so assistive tech and search engines see the whole set; only the
// visual presentation cycles. Pauses while the tab is hidden.
// ===========================================================
(function roleRotator(){
  const roles = [].slice.call(document.querySelectorAll('.roles .role'));
  if(roles.length < 2) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const PERIOD = 4000;
  let i = 0, timer = null;

  function show(n){
    roles[i].classList.remove('is-on');
    i = n;
    roles[i].classList.add('is-on');
  }
  function start(){ if(timer === null) timer = setInterval(function(){ show((i + 1) % roles.length); }, PERIOD); }
  function stop(){ if(timer !== null){ clearInterval(timer); timer = null; } }

  document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });
  start();
})();

// ===========================================================
// I-81 model — ported from the ENVI-met study artifact
//
// Temporary feature. Inert unless the section says data-enabled="true",
// and even then three.js and the ~1 MB of textures are only fetched when
// the visitor presses Load. See the comment above the section in
// index.html for how to switch it off.
// ===========================================================
(function i81(){
  const section = document.getElementById('i81');
  const navLinks = [].slice.call(document.querySelectorAll('[data-i81-link]'));

  if(!section || section.dataset.enabled !== 'true'){
    navLinks.forEach(function(a){ a.hidden = true; });
    return;
  }

  const THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const ORBIT_SRC = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
  const BASE = 'assets/i81/';

  const poster  = document.getElementById('i81-poster');
  const loadBtn = document.getElementById('i81-load');
  const cv      = document.getElementById('i81-gl');
  const stage   = document.getElementById('i81-stage');

  function script(src){
    return new Promise(function(res, rej){
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = function(){ rej(new Error('could not load ' + src)); };
      document.head.appendChild(s);
    });
  }

  loadBtn.addEventListener('click', function(){
    loadBtn.disabled = true;
    loadBtn.textContent = 'Loading…';
    script(THREE_SRC)
      .then(function(){ return script(ORBIT_SRC); })
      .then(function(){
        if(!window.THREE) throw new Error('three.js unavailable');
        return fetch(BASE + 'meta.json').then(function(r){
          if(!r.ok) throw new Error('meta.json ' + r.status);
          return r.json();
        });
      })
      .then(function(meta){
        poster.hidden = true;
        ['i81-gl','i81-badge','i81-probe','i81-legend','i81-rail'].forEach(function(id){
          const el = document.getElementById(id); if(el) el.hidden = false;
        });
        boot(meta);
      })
      .catch(function(e){
        stage.innerHTML = '<div class="i81__fail">The 3D model could not load (' +
          e.message + '). The I-81 project above describes the same run.</div>';
      });
  }, { once: true });

  function boot(META){
    const THREE = window.THREE;
    const NX = META.nx, NY = META.ny, NT = META.times.length, NL = META.levels.length;
    const SPEC = ['NO2','NOx','PM25'];
    const SPLAB = { NO2:'NO<sub>2</sub>', NOx:'NO<sub>x</sub>', PM25:'PM<sub>2.5</sub>' };
    const times = META.times, levels = META.levels;
    const ranges = {};
    SPEC.forEach(function(s){ if(META.species[s]) ranges[s] = META.species[s].range; });

    let sp = 'NO2', li = 0, ti = 2, playing = false, lastT = 0, sliceOn = false;
    const atlas = {}, atlasData = {};

    const VX = 2.5, U = 0.1;
    const Wd = NX * 5 * U, Hd = NY * 5 * U;

    const ren = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
    ren.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(42, 1, 1, 4000);
    cam.position.set(Wd * 0.56, Hd * 0.50, Hd * 0.74);
    const ctl = new THREE.OrbitControls(cam, ren.domElement);
    ctl.enableDamping = true; ctl.dampingFactor = 0.08; ctl.maxPolarAngle = Math.PI * 0.49;
    ctl.minDistance = 28; ctl.maxDistance = 420; ctl.target.set(0, 4, 0);

    scene.add(new THREE.HemisphereLight(0xcfe2f2, 0x2a3440, 0.95));
    const dir = new THREE.DirectionalLight(0xffe9cf, 0.85);
    dir.position.set(-60, 90, 40);
    scene.add(dir);

    function rampTex(){
      const c = document.createElement('canvas'); c.width = 256; c.height = 1;
      const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 256, 0);
      g.addColorStop(0, '#fffceb'); g.addColorStop(0.30, '#fed98e');
      g.addColorStop(0.55, '#fe9929'); g.addColorStop(0.78, '#d94801');
      g.addColorStop(1, '#7f1e0a');
      x.fillStyle = g; x.fillRect(0, 0, 256, 1);
      const t = new THREE.CanvasTexture(c);
      t.minFilter = t.magFilter = THREE.LinearFilter;
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      t.generateMipmaps = false;
      return t;
    }
    const RAMP = rampTex();

    const VS = 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
    const FS = [
      'uniform sampler2D uA; uniform sampler2D uR; uniform vec2 uOff; uniform vec2 uSc;',
      'uniform float uAl; varying vec2 vUv;',
      'void main(){',
      ' vec2 uv=uOff+clamp(vUv,0.0015,0.9985)*uSc;',
      ' float q=texture2D(uA,uv).r;',
      ' if(q<0.002) discard;',
      ' float t=clamp((q*255.0-1.0)/254.0,0.0,1.0);',
      ' gl_FragColor=vec4(texture2D(uR,vec2(t,0.5)).rgb,uAl);',
      '}'
    ].join('\n');

    function concMat(alpha){
      return new THREE.ShaderMaterial({
        uniforms: {
          uA: { value: null }, uR: { value: RAMP },
          uOff: { value: new THREE.Vector2() },
          uSc: { value: new THREE.Vector2(1 / NT, 1 / NL) },
          uAl: { value: alpha }
        },
        vertexShader: VS, fragmentShader: FS,
        transparent: alpha < 1, depthWrite: alpha >= 1,
        side: THREE.DoubleSide
      });
    }
    const groundMat = concMat(1.0), sliceMat = concMat(0.42);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(Wd, Hd), groundMat);
    ground.rotation.x = -Math.PI / 2; ground.position.y = 0.05;
    scene.add(ground);

    const slice = new THREE.Mesh(new THREE.PlaneGeometry(Wd, Hd), sliceMat);
    slice.rotation.x = -Math.PI / 2; slice.visible = false;
    scene.add(slice);

    const base = new THREE.Mesh(new THREE.BoxGeometry(Wd, 1.2, Hd),
      new THREE.MeshBasicMaterial({ color: 0x121a22 }));
    base.position.y = -0.65;
    scene.add(base);

    let srcMesh = null, bldMesh = null;

    function loadTex(name, cb){
      const im = new Image();
      im.onload = function(){
        const c = document.createElement('canvas');
        c.width = im.width; c.height = im.height;
        const g = c.getContext('2d');
        g.drawImage(im, 0, 0);
        const t = new THREE.CanvasTexture(c);
        t.minFilter = t.magFilter = THREE.NearestFilter;
        t.generateMipmaps = false;
        t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
        let data = null;
        try { data = g.getImageData(0, 0, im.width, im.height); } catch(e) {}
        cb(t, data, im.width, im.height);
      };
      im.onerror = function(){ cb(null, null, 0, 0); };
      im.src = name;
    }

    function buildBuildings(data, w, h){
      const HM = META.buildingMaxHeight, hgt = [];
      let n = 0;
      for(let j = 0; j < h; j++){
        for(let i = 0; i < w; i++){
          const v = data.data[(j * w + i) * 4] / 255 * HM;
          hgt.push(v);
          if(v > 0.2) n++;
        }
      }
      if(!n) return;
      const mesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshLambertMaterial({ color: 0x8d9aa6 }), n);
      const m = new THREE.Matrix4();
      let k = 0;
      const cw = 5 * U;
      for(let j = 0; j < h; j++){
        for(let i = 0; i < w; i++){
          const v = hgt[j * w + i];
          if(v <= 0.2) continue;
          const hh = v * U * VX;
          m.makeScale(cw * 0.98, hh, cw * 0.98);
          m.setPosition(-Wd / 2 + (i + 0.5) * cw, hh / 2, -Hd / 2 + (j + 0.5) * cw);
          mesh.setMatrixAt(k++, m);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      bldMesh = mesh;
      scene.add(mesh);
    }

    function buildSources(tex){
      srcMesh = new THREE.Mesh(new THREE.PlaneGeometry(Wd, Hd),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.85,
          alphaTest: 0.02, side: THREE.DoubleSide }));
      srcMesh.rotation.x = -Math.PI / 2;
      srcMesh.position.y = 0.5;
      srcMesh.visible = false;
      scene.add(srcMesh);
    }

    const badge  = document.getElementById('i81-badge');
    const tnow   = document.getElementById('i81-tnow');
    const slider = document.getElementById('i81-time');

    function setTile(){
      const ox = ti / NT, oy = 1 - (li + 1) / NL;
      groundMat.uniforms.uOff.value.set(ox, oy);
      sliceMat.uniforms.uOff.value.set(ox, oy);
      groundMat.uniforms.uA.value = atlas[sp] || null;
      sliceMat.uniforms.uA.value = atlas[sp] || null;
      const z = levels[li] ? levels[li].z : 0.4;
      slice.position.y = z * U * VX;
      slice.visible = sliceOn && li > 0;
      const pb = document.getElementById('i81-tP');
      pb.disabled = (li === 0);
      pb.title = li === 0 ? 'Pick a height above 0.4 m' : '';
      pb.style.opacity = li === 0 ? '0.45' : '1';
      badge.innerHTML = SPLAB[sp] + ' · ' + z.toFixed(1) + ' m · ' + (times[ti] || '');
      tnow.textContent = times[ti] || '';
      const r = ranges[sp] || [0, 1];
      document.getElementById('i81-lo').textContent = r[0].toFixed(1);
      document.getElementById('i81-hi').innerHTML = r[1].toFixed(1) + ' µg/m³';
    }

    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const probe = document.getElementById('i81-probe');

    cv.addEventListener('mousemove', function(ev){
      const r = cv.getBoundingClientRect();
      ndc.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ndc, cam);
      const hit = ray.intersectObject(ground, false);
      if(!hit.length || !atlasData[sp]){ probe.innerHTML = '<span>hover the ground</span>'; return; }
      const p = hit[0].point;
      const i = Math.floor((p.x + Wd / 2) / (5 * U));
      const j = Math.floor((p.z + Hd / 2) / (5 * U));
      if(i < 0 || j < 0 || i >= NX || j >= NY){ probe.innerHTML = '<span>hover the ground</span>'; return; }
      const d = atlasData[sp], W = d.width;
      const q = d.data[((li * NY + j) * W + (ti * NX + i)) * 4];
      const r2 = ranges[sp] || [0, 1];
      if(q === 0){
        probe.innerHTML = '<b>building</b><br><span>no concentration</span>';
      } else {
        const val = r2[0] + ((q - 1) / 254) * (r2[1] - r2[0]);
        probe.innerHTML = '<b>' + val.toFixed(2) + '</b> µg/m³<br>' +
          '<span>' + SPLAB[sp] + ' at ' + (levels[li] ? levels[li].z.toFixed(1) : '0.4') + ' m</span><br>' +
          '<span>' + (META.x0 + (i + 0.5) * 5).toFixed(0) + ' E  ' +
          (META.y0 + (NY - j - 0.5) * 5).toFixed(0) + ' N</span>';
      }
    });
    cv.addEventListener('mouseleave', function(){ probe.innerHTML = '<span>hover the ground</span>'; });

    function chips(host, items, get, set){
      host.innerHTML = '';
      items.forEach(function(label, ix){
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = label;
        b.setAttribute('aria-pressed', get() === ix ? 'true' : 'false');
        b.onclick = function(){
          set(ix);
          Array.prototype.forEach.call(host.children, function(c, cx){
            c.setAttribute('aria-pressed', cx === ix ? 'true' : 'false');
          });
          setTile();
        };
        host.appendChild(b);
      });
    }

    slider.max = NT - 1;
    slider.oninput = function(){ ti = +slider.value; setTile(); };

    const playBtn = document.getElementById('i81-play');
    playBtn.onclick = function(){
      playing = !playing;
      playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
      playBtn.innerHTML = playing ? '❙❙ Pause' : '▶ Play';
    };

    function toggle(id, fn){
      const b = document.getElementById(id);
      b.onclick = function(){
        const on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        fn(on);
      };
    }
    toggle('i81-tB', function(on){ if(bldMesh) bldMesh.visible = on; });
    toggle('i81-tS', function(on){ if(srcMesh) srcMesh.visible = on; });
    toggle('i81-tP', function(on){ sliceOn = on; slice.visible = on && li > 0; });

    let sizedW = 0, sizedH = 0;
    function resize(){
      const w = cv.clientWidth, h = cv.clientHeight;
      if(!w || !h || (w === sizedW && h === sizedH)) return;
      sizedW = w; sizedH = h;
      ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      ren.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize, { passive: true });

    // The canvas can be laid out at zero width (a collapsed pane, a section
    // still off-screen), which would leave the drawing buffer at its 300x150
    // default forever. Watch the element so it corrects itself the moment it
    // has a real size.
    if(window.ResizeObserver){
      new ResizeObserver(resize).observe(cv);
    }

    function tick(now){
      requestAnimationFrame(tick);
      if(playing && now - lastT > 780){
        lastT = now;
        ti = (ti + 1) % NT;
        slider.value = ti;
        setTile();
      }
      ctl.update();
      ren.render(scene, cam);
    }

    groundMat.uniforms.uSc.value.set(1 / NT, 1 / NL);
    sliceMat.uniforms.uSc.value.set(1 / NT, 1 / NL);

    chips(document.getElementById('i81-spc'),
      SPEC.filter(function(s){ return META.species[s]; }).map(function(s){ return SPLAB[s]; }),
      function(){ return SPEC.indexOf(sp); },
      function(ix){ sp = SPEC[ix]; });

    chips(document.getElementById('i81-lvl'),
      levels.map(function(l){ return l.z.toFixed(1) + ' m'; }),
      function(){ return li; },
      function(ix){ li = ix; });

    let pending = SPEC.length + 2;
    function done(){ if(--pending <= 0){ resize(); setTile(); requestAnimationFrame(tick); } }

    SPEC.forEach(function(s){
      loadTex(BASE + 'tex/' + s + '.png', function(t, d){
        if(t){ atlas[s] = t; atlasData[s] = d; }
        done();
      });
    });
    loadTex(BASE + 'tex/buildings.png', function(t, d, w, h){ if(d) buildBuildings(d, w, h); done(); });
    loadTex(BASE + 'tex/sources.png', function(t){ if(t) buildSources(t); done(); });
  }
})();
