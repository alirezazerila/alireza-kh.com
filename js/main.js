// ===========================================================
// Build the radial "rosette" emblem (inspired by rose-window art)
// ===========================================================
(function buildEmblem(){
  const spokes = document.getElementById('spokes');
  const petals = document.getElementById('petals');
  if(!spokes || !petals) return;

  const cx = 300, cy = 300, n = 12;

  for(let i=0; i<n; i++){
    const angle = (360/n) * i;
    // spoke line
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', cx); line.setAttribute('y1', cy - 60);
    line.setAttribute('x2', cx); line.setAttribute('y2', cy - 280);
    line.setAttribute('transform', `rotate(${angle} ${cx} ${cy})`);
    spokes.appendChild(line);

    // petal arc between the mid and outer rings
    const petal = document.createElementNS('http://www.w3.org/2000/svg','path');
    const r1 = 150, r2 = 230;
    const a1 = (Math.PI/180) * (angle - 12);
    const a2 = (Math.PI/180) * (angle + 12);
    const aMid = (Math.PI/180) * angle;
    const xOuter = cx + r2*Math.sin(aMid);
    const yOuter = cy - r2*Math.cos(aMid);
    const xA = cx + r1*Math.sin(a1), yA = cy - r1*Math.cos(a1);
    const xB = cx + r1*Math.sin(a2), yB = cy - r1*Math.cos(a2);
    const d = `M ${xA} ${yA} Q ${xOuter} ${yOuter} ${xB} ${yB}`;
    petal.setAttribute('d', d);
    petals.appendChild(petal);
  }
})();

// ===========================================================
// Project filtering
// ===========================================================
(function projectFilter(){
  const buttons = document.querySelectorAll('.filter');
  const cards = document.querySelectorAll('.work-card');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const filter = btn.dataset.filter;

      cards.forEach(card => {
        if(filter === 'all' || card.dataset.cat === filter){
          card.hidden = false;
        } else {
          card.hidden = true;
        }
      });
    });
  });
})();
