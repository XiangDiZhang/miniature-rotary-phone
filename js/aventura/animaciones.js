// Aventura: Pokémon que vuelan entre las fichas y la ruleta, y destellos shiny
// estrellitas desde un punto de la pantalla (por defecto, el centro de la ruleta)
function shinyBurst(x, y) {
  if (reduceMotion) return;
  if (x == null) { const r = $('advWheel').getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
  const b = document.createElement('div'); b.className = 'shiny-burst'; b.style.left = x + 'px'; b.style.top = y + 'px';
  let h = '<b></b>';
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + Math.random() * .3, d = 70 + Math.random() * 110;
    h += `<i style="--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--fs:${12 + Math.random() * 16}px;--dl:${Math.random() * .25}s">✦</i>`; }
  b.innerHTML = h; document.body.appendChild(b); setTimeout(() => b.remove(), 1600);
}

// Pokémon tuyos que ahora mismo están «subidos» a la ruleta (en su ficha del equipo no se ven)
const onWheel = new Set();
// los que vuelven volando a su ficha: su ficha sigue vacía hasta que aterrizan (si no, se verían dos veces)
const flyingHome = new Set();
const offTile = m => onWheel.has(m) || flyingHome.has(m);
// cada Pokémon solo puede tener un sprite volando a la vez: si empieza otro vuelo, el anterior desaparece (así nunca se ve dos veces)
const flights = new Map();
function flight(m, f) { const old = flights.get(m); if (old && old !== f) old.remove(); flights.set(m, f); return f; }
function landedFly(m, f) { if (flights.get(m) === f) flights.delete(m); f.remove(); }
// los Pokémon que están en la ruleta vuelven volando a su ficha (desde su quesito o desde el centro)
function wheelRelease(keep) {
  let any = false;
  const W = advWheel, cr = W && W.cv.getBoundingClientRect(), k = cr && cr.width / W.size;
  [...onWheel].forEach((m, j) => { if (m === keep) return; onWheel.delete(m); flyingHome.add(m); any = true;
    const t = [...$('advTeam').querySelectorAll('.tmw')].find(x => x._m === m);
    // al aterrizar se busca su ficha otra vez (el equipo puede haberse vuelto a dibujar mientras volaba)
    const done = () => { flyingHome.delete(m); const t2 = [...$('advTeam').querySelectorAll('.tmw')].find(x => x._m === m);
      if (t2) { t2.classList.remove('on-wheel'); t2.classList.add('landed'); setTimeout(() => t2.classList.remove('landed'), 450); } };
    if (!t || reduceMotion || !cr || !cr.width || !W.cv.offsetParent) return done();
    const seg = W.segs.find(x => x.m === m && x._sp && !x.hideImg), atC = W.centerM === m;
    if (!seg && !atC) return done();
    const rec = monSprite(m); if (!rec) return done();
    const from = atC ? { x: cr.left + cr.width / 2, y: cr.top + cr.height / 2, s: cr.width * .27 } : { x: cr.left + seg._sp.x * k, y: cr.top + seg._sp.y * k, s: seg._sp.sz * k };
    if (seg) seg.hideImg = true; if (atC) { W.centerImg = null; W.centerM = null; } W.draw();
    const to = (t.querySelector('.sp') || t).getBoundingClientRect(), f = document.createElement('div'); f.className = 'fly-mon';
    f.innerHTML = `<img src="${rec.u}" alt="">`; f.style.width = f.style.height = from.s + 'px'; f.style.left = (from.x - from.s / 2) + 'px'; f.style.top = (from.y - from.s / 2) + 'px'; document.body.appendChild(flight(m, f));
    const dx = to.left + to.width / 2 - from.x, dy = to.top + to.height / 2 - from.y, sc = Math.max(.4, to.height / from.s);
    f.animate([{ transform: 'none' }, { transform: `translate(${dx * .55}px, ${dy * .55 - 70}px) scale(${(1 + sc) / 2}) rotate(8deg)`, offset: .5 }, { transform: `translate(${dx}px, ${dy}px) scale(${sc})` }],
      { duration: 620, delay: j * 90, easing: 'cubic-bezier(.3,.6,.35,1)', fill: 'forwards' }).onfinish = () => { landedFly(m, f); done(); beep(620 + j * 70, .04, .02); };
  });
  return any;
}
// el Pokémon elegido deja su quesito vacío y salta al centro de la ruleta, con su nombre
function pickToCenter(m, W) {
  const seg = W.segs.find(x => x.m === m), cr = W.cv.getBoundingClientRect(), k = cr.width / W.size;
  const from = seg && seg._sp && !seg.hideImg ? { left: cr.left + seg._sp.x * k - seg._sp.sz * k / 2, top: cr.top + seg._sp.y * k - seg._sp.sz * k / 2, width: seg._sp.sz * k, height: seg._sp.sz * k } : null;
  if (seg) { seg.hideImg = true; W.draw(); }
  flyToCenter(m, from);
}
// ---- Ruleta con tus Pokémon: aparece solo con los nombres y cada uno salta desde su ficha a su quesito ----
function flyIntoSlices(wheel) {
  const segs = wheel.segs.filter(s => s.m && s.hideImg);
  if (!segs.length) return;
  const cr = wheel.cv.getBoundingClientRect(), k = cr.width / wheel.size, gen = wheel.gen;
  segs.forEach((s, j) => setTimeout(() => {
    // si mientras tanto ha salido otra ruleta, este salto ya no toca (si no, volaría a una ruleta que ya no está)
    if (wheel.gen !== gen) return;
    const reveal = () => { if (wheel.gen !== gen) return; s.hideImg = false; wheel.draw(); };
    const rec = monSprite(s.m), sp = s._sp;
    const tile = [...$('advTeam').querySelectorAll('.tmw')].find(x => x._m === s.m);
    if (reduceMotion || !rec || !sp || !wheel.cv.isConnected) return reveal();
    let from;
    if (tile && tile.offsetParent) { const t = tile.querySelector('.sp') || tile; from = t.getBoundingClientRect(); tile.classList.add('picked'); setTimeout(() => tile.classList.remove('picked'), 650); }
    onWheel.add(s.m); if (tile) tile.classList.add('on-wheel');
    const tx = cr.left + sp.x * k, ty = cr.top + sp.y * k, S = Math.max(24, sp.sz * k);
    const f = document.createElement('div'); f.className = 'fly-mon'; f.innerHTML = `<img src="${rec.u}" alt="">`;
    f.style.width = f.style.height = S + 'px'; f.style.left = (tx - S / 2) + 'px'; f.style.top = (ty - S / 2) + 'px';
    document.body.appendChild(flight(s.m, f));
    const kf = from ? (() => { const dx = from.left + from.width / 2 - tx, dy = from.top + from.height / 2 - ty, sc = Math.max(.4, from.height / S);
      return [{ transform: `translate(${dx}px, ${dy}px) scale(${sc})`, opacity: .9 },
        { transform: `translate(${dx * .4}px, ${dy * .4 - 90}px) scale(${(sc + 1) / 2 + .2}) rotate(-10deg)`, opacity: 1, offset: .55 },
        { transform: 'translate(0, 0) scale(1.18) rotate(4deg)', opacity: 1, offset: .88 },
        { transform: 'none', opacity: 1 }]; })()
      : [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: .7 }, { transform: 'none', opacity: 1 }];
    f.animate(kf, { duration: from ? 680 : 380, easing: 'cubic-bezier(.3,.6,.35,1)', fill: 'forwards' }).onfinish = () => { if (flights.get(s.m) === f) reveal(); landedFly(s.m, f); beep(700 + j * 90, .05, .025); };
    beep(420 + j * 60, .04, .02);
  }, 120 + j * 140));
}

// el Pokémon salta al centro de la ruleta y se queda ahí mientras gira
function flyToCenter(m, from) {
  const rec = monSprite(m);
  onWheel.add(m); const tile = [...$('advTeam').querySelectorAll('.tmw')].find(x => x._m === m); if (tile) tile.classList.add('on-wheel');
  if (!rec) return;
  const W = advWheel; W.centerM = m; W.centerName = dname(m);
  const set = () => { const x = new Image(); x.onload = () => { if (W.centerM !== m) return; W.centerImg = x; W.draw(); }; x.src = rec.u; };
  const cr = W.cv.getBoundingClientRect(), cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2;
  if (reduceMotion || !from) return set();
  const S = cr.width * .27, f = document.createElement('div'); f.className = 'fly-mon'; f.innerHTML = `<img src="${rec.u}" alt="">`;
  f.style.width = f.style.height = S + 'px'; f.style.left = (cx - S / 2) + 'px'; f.style.top = (cy - S / 2) + 'px'; document.body.appendChild(flight(m, f));
  const dx = from.left + from.width / 2 - cx, dy = from.top + from.height / 2 - cy, sc = Math.max(.3, from.height / S);
  f.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${sc})` }, { transform: `translate(${dx * .4}px, ${dy * .4 - 80}px) scale(${(sc + 1) / 2 + .15}) rotate(-8deg)`, offset: .55 },
    { transform: 'scale(1.15)', offset: .85 }, { transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.3,.6,.35,1)', fill: 'forwards' }).onfinish = () => { if (flights.get(m) === f) set(); setTimeout(() => landedFly(m, f), 60); beep(880, .07, .03); };
}
