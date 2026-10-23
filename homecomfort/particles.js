/* ---------------------------------------------------------------------------
   Particle field — the same drifting-node backdrop as alireza-kh.com.

   Ported from that site's js/main.js so the portal's background behaves
   identically: nodes link to each other and to the cursor, clicking the
   backdrop spawns more, density scales with viewport area, the loop stops
   while the tab is hidden, and reduced-motion gets a single static frame.

   It reads --accent, --particle-alpha and --link-alpha from the page, so it
   follows the theme toggle rather than hard-coding either palette.
--------------------------------------------------------------------------- */
(function particleField(){
  const canvas = document.getElementById('particles');
  if(!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');

  const LINK_DIST   = 170;   // px at which two nodes are linked
  const AREA_PER_PT = 11000; // one node per this many css px²
  const MAX_POINTS  = 130;
  const HARD_CAP    = 260;   // ceiling once clicks have added nodes
  const SPEED       = 0.8;
  const CURSOR_DIST = 231;
  const GRAB_ALPHA  = 0.85;
  const PUSH_COUNT  = 3;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let w=0, h=0, dpr=1, points=[], raf=null, running=false;
  let accent='80,235,236', pAlpha=0.55, lAlpha=0.22;
  const cursor = { x:null, y:null };

  function readTheme(){
    const cs = getComputedStyle(document.documentElement);
    const m = cs.getPropertyValue('--accent').trim().match(/^#?([0-9a-f]{6})$/i);
    if(m){
      const n = parseInt(m[1],16);
      accent = `${(n>>16)&255},${(n>>8)&255},${n&255}`;
    }
    pAlpha = parseFloat(cs.getPropertyValue('--particle-alpha')) || 0.55;
    lAlpha = parseFloat(cs.getPropertyValue('--link-alpha'))     || 0.22;
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const target = Math.min(MAX_POINTS, Math.max(26, Math.round((w*h)/AREA_PER_PT)));
    points = [];
    for(let i=0;i<target;i++){
      const a = Math.random()*Math.PI*2;
      points.push({ x:Math.random()*w, y:Math.random()*h,
                    vx:Math.cos(a)*SPEED, vy:Math.sin(a)*SPEED,
                    r:1.1+Math.random()*1.5 });
    }
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    for(let i=0;i<points.length;i++){
      const p = points[i];
      for(let j=i+1;j<points.length;j++){
        const q = points[j];
        const d = Math.hypot(p.x-q.x, p.y-q.y);
        if(d < LINK_DIST){
          ctx.strokeStyle = `rgba(${accent},${lAlpha*(1-d/LINK_DIST)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
        }
      }
      let near = 0;
      if(cursor.x !== null){
        const d = Math.hypot(p.x-cursor.x, p.y-cursor.y);
        if(d < CURSOR_DIST){
          near = 1 - d/CURSOR_DIST;
          ctx.strokeStyle = `rgba(${accent},${GRAB_ALPHA*near})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(cursor.x,cursor.y); ctx.stroke();
        }
      }
      ctx.fillStyle = `rgba(${accent},${Math.min(1, pAlpha + near*0.45)})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r*(1+near*0.9), 0, Math.PI*2); ctx.fill();
    }
  }

  function step(){
    for(const p of points){
      p.x += p.vx; p.y += p.vy;
      if(p.x < -20) p.x = w+20; else if(p.x > w+20) p.x = -20;
      if(p.y < -20) p.y = h+20; else if(p.y > h+20) p.y = -20;
    }
    draw();
    raf = requestAnimationFrame(step);
  }
  function start(){ if(running || reduced.matches) return; running = true; raf = requestAnimationFrame(step); }
  function stop(){ running = false; if(raf !== null){ cancelAnimationFrame(raf); raf = null; } }

  function init(){ readTheme(); resize(); draw(); if(!reduced.matches) start(); }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { const was = running; stop(); init(); if(!was) stop(); }, 180);
  }, { passive:true });

  window.addEventListener('pointermove',  e => { cursor.x = e.clientX; cursor.y = e.clientY; }, { passive:true });
  window.addEventListener('pointerleave', () => { cursor.x = cursor.y = null; }, { passive:true });

  function spawn(x,y){
    for(let i=0;i<PUSH_COUNT;i++){
      const a = Math.random()*Math.PI*2;
      points.push({ x:x+(Math.random()-0.5)*24, y:y+(Math.random()-0.5)*24,
                    vx:Math.cos(a)*SPEED, vy:Math.sin(a)*SPEED,
                    r:1.3+Math.random()*1.6 });
    }
    if(points.length > HARD_CAP) points.splice(0, points.length - HARD_CAP);
    if(!running) draw();
  }
  window.addEventListener('pointerdown', e => {
    /* Never compete with a real control, and leave the charts alone so a
       click meant for a tooltip does not also drop nodes. */
    if(e.target.closest('a, button, input, textarea, select, label, summary, canvas#particles ~ * canvas, .chartbox, table')) return;
    spawn(e.clientX, e.clientY);
  }, { passive:true });

  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
  reduced.addEventListener('change', () => { stop(); init(); });

  /* Exposed so the portal's theme button can repaint the field's palette. */
  window.__particlesRetheme = () => { readTheme(); if(!running) draw(); };

  init();
})();
