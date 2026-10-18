// Aventura: cinemáticas de derrota, Hall de la Fama y evolución
// ---- Escenario de las dos salas (assets/img/hall-fama.jpg y hall-derrota.jpg, 1408 × 768) ----
// Todo se coloca en % de la imagen, así encaja con el dibujo en cualquier pantalla. La imagen cubre la pantalla
// sin recortar el podio: en pantallas estrechas se ve un poco más pequeña, con su propio fondo difuminado alrededor.
const HALL = {
  frames: [27.13, 36.29, 45.45, 54.55, 63.71, 72.8],   // centro de los 6 marcos de la pared (Hall de la Fama)
  slots: [26.7, 36.1, 45.4, 54.7, 64, 73.4],           // sitio de cada Pokémon encima del podio
  top: 71,                                              // altura de los pies sobre el podio
  stairs: { l: [[17.6, 79], [20.6, 71]], r: [[82.4, 79], [79.4, 71]] },   // escalones de los lados del podio: abajo y arriba
};
// los Pokémon ocupan los sitios del centro (con 3, los 3 de en medio)
const hallSlots = n => { const s = Math.floor((6 - Math.min(6, n)) / 2); return Array.from({ length: Math.min(6, n) }, (_, i) => s + i); };
// sprite apoyado en el suelo: se baja lo que mide el hueco vacío bajo los pies
function hallSprite(m, cls) {
  const r = monSprite(m), ty = mtypes(m), c1 = TYPE_COLORS[ty[0]] || '#8592ab', c2 = TYPE_COLORS[ty[1] || ty[0]] || c1;
  return r ? `<img class="${cls}" src="${r.u}" alt=""${r.px ? '' : ' data-hd="1"'} style="--fb:${(r.fb || 0).toFixed(3)}">` : `<span class="${cls} ph-wrap"><i class="ph" style="--c1:${c1};--c2:${c2}"></i></span>`;
}

function loseScreen(who, done, team) {
  team = (team || run.team.concat(stolenList())).slice(0, 6);
  if (!team.length && run) team = [...boxList()].slice(0, 6);
  const sh = document.createElement('div'); sh.className = 'lose';
  let rain = ''; for (let i = 0; i < 70; i++) rain += `<i style="--x:${Math.random() * 100}%;--d:${.5 + Math.random() * .5}s;--dl:${Math.random() * 2}s;--h:${30 + Math.random() * 50}px"></i>`;
  const at = hallSlots(team.length);
  sh.innerHTML = `<div class="hall-blur lose-blur"></div><div class="hall-stage lose-stage">
      ${team.map((m, i) => `<div class="hall-mon lose-mon" style="--x:${HALL.slots[at[i]]}%;--y:${HALL.top}%;--i:${i}"><div class="lose-sp">${hallSprite(m, 'spr')}</div><span class="hall-tag">${dname(m)}</span></div>`).join('')}
    </div><div class="lose-rain">${rain}</div>
    <div class="lose-txt"><small>${who ? 'Contra ' + who : 'Fin del viaje'}</small><span>Tus Pokémon se han debilitado…</span>${done && run ? `<em>${run.points} puntos · rango ${rank(run.points)}${run.record ? ' · ¡nuevo récord!' : ''}</em>` : ''}</div>
    <div class="lose-end"><button class="btn" type="button">Continuar</button></div><span class="hof-skip">Toca para saltar</span>`;
  document.body.appendChild(sh);
  loseMusic();
  const mons = [...sh.querySelectorAll('.lose-mon')];
  mons.forEach((el, i) => setTimeout(() => { el.classList.add('down'); beep(150 - i * 8, .25, .05, 'sine'); }, 1400 + i * 650));
  const finale = () => { mons.forEach(el => el.classList.add('down')); sh.classList.add('done'); };
  const tm = setTimeout(finale, 1400 + mons.length * 650 + 600);
  const close = () => { clearTimeout(tm); sh.classList.add('out'); setTimeout(() => { sh.remove(); done && done(true); }, 500); };   // true: se ha visto la cinemática
  sh.querySelector('.lose-end button').onclick = e => { e.stopPropagation(); close(); };
  sh.addEventListener('click', () => { if (!sh.classList.contains('done')) finale(); });
}

// ---- Hall de la Fama: cada Pokémon sube por la alfombra, trepa por los escalones del podio y se coloca en su sitio;
// al llegar, su retrato (quieto) aparece en el marco de la pared que tiene detrás, con su nombre en la placa ----
function hallOfFame(done, data) {
  if (!data && run) saveHistory(true);
  if (window.__noCine) return done && done();   // (pruebas automáticas)
  data = data || saveHof();
  const team = data.team.slice(0, 6), at = hallSlots(team.length);
  const sh = document.createElement('div'); sh.className = 'hof';
  let conf = ''; for (let i = 0; i < 46; i++) conf += `<i style="--x:${Math.random() * 100}%;--d:${3 + Math.random() * 3}s;--dl:${Math.random() * 3}s;--r:${Math.random() * 360}deg;--c:${['#ffd84a', '#ff5a46', '#5ad1c8', '#fff3c4', '#b46cff'][i % 5]}"></i>`;
  sh.innerHTML = `<div class="hall-blur hof-blur"></div><div class="hall-stage hof-stage"><div class="hof-shafts"></div>
      ${team.map((m, i) => `<div class="hof-frame${m.shiny ? ' shiny' : ''}" style="--x:${HALL.frames[at[i]]}%;--c:${TYPE_COLORS[mtypes(m)[0]]}">${hallSprite(m, 'pic')}</div><span class="hof-name" style="--x:${HALL.frames[at[i]]}%">${dname(m)}</span>`).join('')}
      ${team.map((m, i) => `<div class="hall-mon hof-mon${m.shiny ? ' shiny' : ''}" style="--x:${HALL.slots[at[i]]}%;--y:${HALL.top}%;--i:${i};--c:${TYPE_COLORS[mtypes(m)[0]]}"><div class="hof-walk">${hallSprite(m, 'spr')}</div></div>`).join('')}
    </div>
    <div class="hof-confetti">${conf}</div>
    <div class="hof-end"><small>${data.name} · Liga Pokémon</small><b>¡Nuevo Campeón de ${data.name}!</b><span>${data.points} puntos · rango ${data.rank} · ${data.badges} medallas</span><button class="btn" type="button">Continuar</button></div>
    <span class="hof-skip">Toca para saltar</span>`;
  document.body.appendChild(sh);
  const crownIn = hofMusic() || 8.4;
  const mons = [...sh.querySelectorAll('.hof-mon')], frames = [...sh.querySelectorAll('.hof-frame')], names = [...sh.querySelectorAll('.hof-name')];
  // al llegar a su sitio: deja de andar, celebra y su retrato aparece en el marco
  const arrive = i => { if (mons[i].classList.contains('arrived')) return; mons[i].classList.add('arrived'); frames[i].classList.add('lit'); names[i].classList.add('lit'); beep(660 + i * 80, .08, .03); };
  // recorrido (en % del escenario): sube por la alfombra, va a los escalones de su lado, sube al podio y camina hasta su sitio
  const walk = (el, i) => {
    if (sh.classList.contains('crowned')) return;   // si se ha saltado la cinemática, ya está en su sitio
    const x = HALL.slots[at[i]], side = x < 50 ? HALL.stairs.l : HALL.stairs.r;
    const pts = [[50, 104, 1.25], [50, 84, 1.1], [side[0][0], side[0][1], 1.05], [side[1][0], side[1][1], 1], [x, HALL.top, 1]];
    el.classList.add('go');
    if (reduceMotion || !el.animate) return arrive(i);
    const kf = pts.map(([px, py, s], k) => ({ left: px + '%', top: py + '%', scale: s, offset: [0, .32, .55, .72, 1][k] }));
    el.animate(kf, { duration: 3400, easing: 'linear', fill: 'backwards' }).onfinish = () => arrive(i);
  };
  mons.forEach((el, i) => setTimeout(() => walk(el, i), 1200 + i * 900));
  const finale = () => {
    if (sh.classList.contains('crowned')) return;
    mons.forEach((el, i) => { el.getAnimations().forEach(a => a.cancel()); el.classList.add('go'); arrive(i); });
    sh.classList.add('crowned');
    const r = sh.querySelector('.hof-end b').getBoundingClientRect(); setTimeout(() => shinyBurst(r.left + r.width / 2, r.top + r.height / 2), 500);
  };
  const tm = setTimeout(finale, Math.max(1200 + team.length * 900 + 3600, crownIn * 1000));
  const close = () => { clearTimeout(tm); sh.classList.add('out'); setTimeout(() => { sh.remove(); done && done(true); }, 500); };   // true: se ha visto la cinemática
  sh.querySelector('.hof-end button').onclick = e => { e.stopPropagation(); close(); };
  sh.addEventListener('click', () => { if (!sh.classList.contains('crowned')) finale(); });
}

// ---- Desde dónde sale un Pokémon del equipo hacia una cinemática: el centro de la ruleta, su quesito o su ficha ----
function monRect(m) {
  const W = advWheel, cr = W && W.cv.getBoundingClientRect(), k = cr && cr.width / W.size;
  if (W && W.centerM === m && cr.width) return { ...centerBox(W), wheel: 'center' };
  const seg = W && W.segs.find(x => x.m === m && x._sp && !x.hideImg);
  if (seg && cr.width && W.cv.offsetParent) { const s = seg._sp.sz * k; return { left: cr.left + seg._sp.x * k - s / 2, top: cr.top + seg._sp.y * k - s / 2, width: s, height: s, wheel: seg }; }
  const tile = [...$('advTeam').querySelectorAll('.tmw')].find(x => x._m === m);
  return tile && tile.offsetParent ? (tile.querySelector('.sp') || tile).getBoundingClientRect() : null;
}
// el Pokémon deja su sitio en la ruleta (su quesito se queda vacío, o el centro sin él) mientras dura la cinemática
function leaveWheel(r) {
  if (!r || !r.wheel) return; const W = advWheel;
  if (r.wheel === 'center') { W.centerImg = null; W.centerName = null; W.centerM = null; } else r.wheel.hideImg = true;
  W.draw();
}
// el sprite vuela desde la cinemática hasta su hueco del equipo y aterriza (sin cortes: el hueco ya tiene el sprite nuevo)
function flyHome(m, from, url, done) {
  const tile = [...$('advTeam').querySelectorAll('.tmw')].find(x => x._m === m), land = () => {
    onWheel.delete(m); const t = [...$('advTeam').querySelectorAll('.tmw')].find(x => x._m === m);
    if (t) { t.classList.remove('on-wheel'); t.classList.add('landed'); setTimeout(() => t.classList.remove('landed'), 450); }
    done && done();
  };
  const to = tile && tile.offsetParent && (tile.querySelector('.sp') || tile).getBoundingClientRect();
  if (!to || !from || !url || reduceMotion) return land();
  const S = Math.max(40, Math.min(from.width, from.height)), f = document.createElement('div'); f.className = 'fly-mon';
  f.innerHTML = `<img src="${url}" alt="">`; f.style.width = f.style.height = S + 'px';
  f.style.left = (from.left + from.width / 2 - S / 2) + 'px'; f.style.top = (from.top + from.height / 2 - S / 2) + 'px'; document.body.appendChild(flight(m, f));
  const dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2), sc = Math.max(.2, to.height / S);
  f.animate([{ transform: 'none' }, { transform: `translate(${dx * .5}px, ${dy * .5 - 60}px) scale(${(1 + sc) / 2}) rotate(-6deg)`, offset: .55 }, { transform: `translate(${dx}px, ${dy}px) scale(${sc})` }],
    { duration: 640, easing: 'cubic-bezier(.3,.6,.35,1)', fill: 'forwards' }).onfinish = () => { land(); landedFly(m, f); beep(760, .05, .03); };
}
const sprUrl = (id, n, shiny) => { const r = (shiny && SPR.shiny.get(id)) || SPR.normal.get(id) || SPR.normal.get(n || id); return r ? r.u : null; };
function picHTML(x, shiny, cls) {
  const u = sprUrl(x.id, x.n, shiny), c1 = TYPE_COLORS[x.ty[0]] || '#8592ab', c2 = TYPE_COLORS[x.ty[1] || x.ty[0]] || c1;
  return u ? `<img class="${cls}" src="${u}" alt="">` : `<span class="${cls}" style="display:grid;place-items:center"><i class="ph" style="--c1:${c1};--c2:${c2}"></i></span>`;
}
// los Pokémon de la cinemática se ven «fuera» de su hueco del equipo mientras dura
function hideTiles(list) {
  list.forEach(m => onWheel.add(m)); renderAdv();
  list.forEach(m => { const t = [...$('advTeam').querySelectorAll('.tmw')].find(el => el._m === m); if (t) t.classList.add('on-wheel'); });
}

// ---- Animación de evolución: sale de la ruleta (o de la ficha) como al abrir su ficha, la energía se concentra,
// las siluetas se funden y estalla en estrellas. items = [{ m, A: { id, ty, name }, B: { id, n, ty, name } }]:
// uno, o dos a la vez con el Repartir Exp. onSwap cambia los datos justo antes de volver; onEnd sigue cuando todos han aterrizado.
function evoAnim(items, onSwap, onEnd) {
  if (reduceMotion || document.hidden) { onSwap(); items.forEach(x => onWheel.delete(x.m)); renderAdv(); return onEnd(); }
  const duo = items.length > 1, B0 = items[0].B;
  const starts = items.map(x => monRect(x.m));
  starts.forEach(leaveWheel); hideTiles(items.map(x => x.m));
  const shade = document.createElement('div'); shade.className = 'evo-shade';
  const pop = document.createElement('div'); pop.className = 'evo-pop' + (duo ? ' duo' : ''); pop.style.setProperty('--c', TYPE_COLORS[B0.ty[0]] || '#5ad1c8'); pop.style.setProperty('--p', 0);
  let sparks = ''; for (let i = 0; i < 14; i++) sparks += `<span class="spark" style="--x0:${(Math.random() - .5) * 220}px;--x1:${(Math.random() - .5) * 260}px;--d:${1.2 + Math.random()}s;--dl:${Math.random() * 1.5}s"></span>`;
  let orbit = ''; for (let i = 0; i < 10; i++) orbit += `<i style="--a:${i * 36}deg;--r:${92 + (i % 3) * 18}px;--fs:${10 + (i % 3) * 5}px;--dl:${i * .16}s">✦</i>`;
  pop.innerHTML = `<div class="rays"></div><div class="rays r2"></div><div class="glow"></div>${sparks}<div class="orbit">${orbit}</div><div class="energy"></div>
    <div class="pillar"></div>${items.map((x, i) => `<div class="stage2 s${i}">${picHTML(x.A, x.m.shiny, 'a')}${picHTML(x.B, x.m.shiny, 'b hide')}</div>`).join('')}<div class="waves"></div><div class="stars-out"></div>
    <p class="cap"><small>${duo ? 'Evolución · Repartir Exp.' : 'Evolución'}</small>¿Eh? ¡${listJoin(items.map(x => x.A.name))} ${duo ? 'están' : 'está'} evolucionando!</p><span class="skip">Toca para acelerar</span>`;
  shade.appendChild(pop); document.body.appendChild(shade);
  const as = [...pop.querySelectorAll('.stage2 .a')], bs = [...pop.querySelectorAll('.stage2 .b')], cap = pop.querySelector('.cap'), energy = pop.querySelector('.energy');
  // nace desde el sitio del Pokémon (su quesito, el centro o su ficha), igual que se abre una ficha
  const pr = pop.getBoundingClientRect(), tr = starts[0];
  if (tr) pop.animate([{ transform: `translate(${tr.left + tr.width / 2 - (pr.left + pr.width / 2)}px, ${tr.top + tr.height / 2 - (pr.top + pr.height / 2)}px) scale(${tr.width / pr.width})`, opacity: .4, borderRadius: '8px' }, { transform: 'none', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.2,.9,.25,1.1)' });
  const snd = evoAudio();
  // partículas de energía que van hacia el Pokémon
  const gather = n => { let h = ''; for (let i = 0; i < n; i++) { const an = Math.random() * Math.PI * 2, d = 140 + Math.random() * 60;
      h += `<i style="--x:${Math.cos(an) * d}px;--y:${Math.sin(an) * d}px;--dl:${Math.random() * .3}s;--s:${.5 + Math.random()}"></i>`; }
    const w = document.createElement('div'); w.className = 'burst-in'; w.innerHTML = h; energy.appendChild(w); setTimeout(() => w.remove(), 1300); };
  let stage = 0, timer = null, gap = 950, flips = 0, showB = false;
  const flick = () => {
    if (stage !== 1) return;
    showB = !showB; flips++;
    as.forEach(a => a.classList.toggle('hide', showB)); bs.forEach(b => b.classList.toggle('hide', !showB));
    pop.style.setProperty('--p', Math.min(1, flips / 9).toFixed(2));
    snd.pulse(); gather(6 + flips);
    if (flips === 4) pop.classList.add('fast');
    if (flips === 7) cap.innerHTML = `<small>Evolución</small>¡Algo increíble está pasando!`;
    gap = Math.max(480, gap * .86);
    if (flips >= 9) return timer = setTimeout(reveal, 520);
    timer = setTimeout(flick, gap);
  };
  const start = () => { stage = 1; [...as, ...bs].forEach(e => e.classList.add('w')); pop.classList.add('glowing'); gather(10); timer = setTimeout(flick, 700); };
  const reveal = () => {
    if (stage >= 2) return; stage = 2; clearTimeout(timer);
    snd.climax();
    pop.classList.add('climax');
    pop.animate([{ transform: 'none' }, { transform: 'translate(-4px, 2px)' }, { transform: 'translate(4px, -3px)' }, { transform: 'translate(-3px, -2px)' }, { transform: 'translate(2px, 3px)' }, { transform: 'none' }], { duration: 380, easing: 'ease-out' });
    pop.querySelector('.waves').innerHTML = '<i></i><i></i><i></i>';
    let st = ''; for (let i = 0; i < 26; i++) { const an = i / 26 * Math.PI * 2, d = 120 + Math.random() * 90; st += `<i style="--x:${Math.cos(an) * d}px;--y:${Math.sin(an) * d}px;--fs:${12 + Math.random() * 16}px;--dl:${Math.random() * .2}s">✦</i>`; }
    pop.querySelector('.stars-out').innerHTML = st;
    as.forEach(a => a.classList.add('hide')); bs.forEach(b => { b.classList.remove('hide', 'w'); b.classList.add('new-in'); });
    pop.classList.remove('fast', 'glowing'); pop.querySelector('.orbit').style.opacity = '0';
    cap.innerHTML = `<small>¡Enhorabuena!</small>${items.map(x => `¡${x.A.name} ha evolucionado a <b>${x.B.name}</b>!`).join('<br>')}`; cap.classList.add('win');
    const r = pop.getBoundingClientRect(); setTimeout(() => shinyBurst(r.left + r.width / 2, r.top + r.height * .42), 250);
    timer = setTimeout(close, 2700);
  };
  // al cerrar: los datos cambian (el hueco del equipo ya tiene el sprite nuevo, oculto), la ventana se desvanece
  // y cada Pokémon vuela desde la cinemática hasta su hueco
  const close = () => {
    if (stage >= 3) return; stage = 3; clearTimeout(timer);
    const from = bs.map(b => b.getBoundingClientRect());
    onSwap(); renderAdv();
    shade.classList.add('out'); pop.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.96)' }], { duration: 380, easing: 'ease-in', fill: 'forwards' });
    let left = items.length;
    items.forEach((x, i) => setTimeout(() => flyHome(x.m, from[i], sprUrl(x.B.id, x.B.n, x.m.shiny), () => { if (--left === 0) { shade.remove(); onEnd(); } }), 120 + i * 110));
  };
  shade.addEventListener('click', () => { if (stage === 0) { clearTimeout(timer); start(); } else if (stage === 1) { clearTimeout(timer); reveal(); } else if (stage === 2) close(); });
  timer = setTimeout(start, 700);
}

// ---- Intercambio: tu Pokémon sale del centro de la ruleta, se despide, entra en su Poké Ball y se va volando;
// llega otra Poké Ball, se abre con un destello y aparece el nuevo. give = el que das (sale de la ruleta si está en ella),
// get = { n, shiny } el que recibes. Toca para saltar. ----
function tradeAnim(give, get, done) {
  const W = advWheel, clearCenter = () => { onWheel.delete(give); if (W && W.centerM === give) { W.centerM = null; W.centerImg = null; W.centerName = null; W.draw(); } };
  if (reduceMotion || document.hidden || window.__noCine) { clearCenter(); renderAdv(); return done && done(); }
  const start = monRect(give); clearCenter();
  const A = { id: mid(give), n: give.n, ty: mtypes(give), name: mname(give) }, B = { id: get.n, n: get.n, ty: ptypes(get.n), name: pname(get.n) };
  const ball = SPR.item && SPR.item.get('poke-ball'), ballImg = ball ? `<img class="px" src="${ball.u}" alt="">` : '<i class="tr-ball-css"></i>';
  const shade = document.createElement('div'); shade.className = 'evo-shade tr-shade';
  const pop = document.createElement('div'); pop.className = 'evo-pop tr-pop'; pop.style.setProperty('--c', TYPE_COLORS[A.ty[0]] || '#5ad1c8'); pop.style.setProperty('--c2', TYPE_COLORS[B.ty[0]] || '#ffd84a');
  pop.innerHTML = `<div class="rays"></div><div class="tr-link"><i></i><i></i><i></i></div>
    <div class="stage2 tr-out">${picHTML(A, give.shiny, 'a')}</div><div class="tr-ball out">${ballImg}</div>
    <div class="tr-ball in">${ballImg}</div><div class="tr-flash"></div><div class="stage2 tr-in">${picHTML(B, get.shiny, 'b')}</div><div class="stars-out"></div>
    <p class="cap"><small>Intercambio</small>¡Adiós, ${A.name}! ¡Cuídate mucho!</p><span class="skip">Toca para saltar</span>`;
  shade.appendChild(pop); document.body.appendChild(shade);
  const pr = pop.getBoundingClientRect();
  if (start) pop.animate([{ transform: `translate(${start.left + start.width / 2 - (pr.left + pr.width / 2)}px, ${start.top + start.height / 2 - (pr.top + pr.height / 2)}px) scale(${start.width / pr.width})`, opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.9,.25,1.1)' });
  const cap = pop.querySelector('.cap'), T = [];
  const at = (ms, f) => T.push(setTimeout(f, ms));
  chord([523, 659, 784]);
  // 1) se despide y entra en la Poké Ball, que sale volando hacia arriba a la izquierda
  at(900, () => { pop.classList.add('s1'); beep(880, .1, .04); beep(440, .18, .03, 'square'); });
  at(1500, () => { pop.classList.add('s2'); [660, 520, 400].forEach((f, i) => setTimeout(() => beep(f, .08, .03), i * 90)); cap.innerHTML = `<small>Intercambio</small>${A.name} se va a su nuevo hogar…`; });
  // 2) llega otra Poké Ball desde arriba a la derecha, rebota y se abre
  at(2500, () => { pop.classList.add('s3'); [400, 520, 660].forEach((f, i) => setTimeout(() => beep(f, .08, .03), i * 90)); cap.innerHTML = '<small>Intercambio</small>¡Llega una Poké Ball!'; });
  at(3400, () => reveal());
  let stage = 0;
  const reveal = () => {
    if (stage) return; stage = 1; T.forEach(clearTimeout); pop.classList.add('s1', 's2', 's3', 's4');
    pop.style.setProperty('--c', TYPE_COLORS[B.ty[0]] || '#ffd84a');   // la ventana toma el color del que llega
    chord([784, 988, 1318, 1568]); if (get.shiny) shinySfx();
    let st = ''; for (let i = 0; i < 20; i++) { const an = i / 20 * Math.PI * 2, d = 110 + Math.random() * 80; st += `<i style="--x:${Math.cos(an) * d}px;--y:${Math.sin(an) * d}px;--fs:${12 + Math.random() * 14}px;--dl:${Math.random() * .2}s">✦</i>`; }
    pop.querySelector('.stars-out').innerHTML = st;
    cap.innerHTML = `<small>¡Intercambio completado!</small>¡Ha llegado <b>${B.name}${get.shiny ? ' ★' : ''}</b>!`; cap.classList.add('win');
    T.push(setTimeout(close, 2000));
  };
  const close = () => {
    if (stage > 1) return; stage = 2; T.forEach(clearTimeout);
    shade.classList.add('out'); pop.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.96)' }], { duration: 340, easing: 'ease-in', fill: 'forwards' });
    setTimeout(() => { shade.remove(); renderAdv(); done && done(); }, 380);
  };
  shade.addEventListener('click', () => stage === 0 ? reveal() : close());
}

// ---- Megaevolución y Gigamax: cada una con su animación propia (más corta que la de evolución) ----
// Mega: la megapiedra reacciona, una esfera arcoíris envuelve al Pokémon, se resquebraja y aparece con el símbolo Mega.
// Gigamax: nubes rojas, el Pokémon crece hasta llenar la ventana y aparece su forma Gigamax entre relámpagos.
function transformAnim(m, kind, A, B, onSwap, onEnd) {
  if (reduceMotion || document.hidden || window.__noCine) { onSwap(); renderAdv(); return onEnd(); }
  const start = monRect(m); hideTiles([m]);
  const mega = kind === 'mega', shade = document.createElement('div'); shade.className = 'evo-shade';
  const pop = document.createElement('div'); pop.className = `evo-pop tf-pop ${mega ? 'tf-mega' : 'tf-gmax'}`; pop.style.setProperty('--c', mega ? (TYPE_COLORS[B.ty[0]] || '#b46cff') : '#ff2d55');
  let fx = '';
  if (mega) for (let i = 0; i < 12; i++) fx += `<i style="--a:${i * 30}deg;--dl:${(i * .05).toFixed(2)}s"></i>`;
  else for (let i = 0; i < 9; i++) fx += `<i style="--x:${(Math.random() * 100).toFixed(0)}%;--y:${(Math.random() * 100).toFixed(0)}%;--s:${(.7 + Math.random() * .9).toFixed(2)};--dl:${(Math.random() * .8).toFixed(2)}s"></i>`;
  pop.innerHTML = `<div class="tf-bg"></div><div class="tf-fx">${fx}</div>${mega ? '<div class="tf-orb"></div><div class="tf-sym"></div>' : '<div class="tf-bolt"></div>'}
    <div class="stage2">${picHTML(A, m.shiny, 'a')}${picHTML(B, m.shiny, 'b hide')}</div>
    <p class="cap"><small>${mega ? 'Megaevolución' : 'Gigamax'}</small>${mega ? `¡La ${stoneName(m.stone)} de ${A.name} reacciona!` : `¡${A.name} absorbe la energía Dinamax!`}</p><span class="skip">Toca para saltar</span>`;
  shade.appendChild(pop); document.body.appendChild(shade);
  const pr = pop.getBoundingClientRect();
  if (start) pop.animate([{ transform: `translate(${start.left + start.width / 2 - (pr.left + pr.width / 2)}px, ${start.top + start.height / 2 - (pr.top + pr.height / 2)}px) scale(${start.width / pr.width})`, opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.9,.25,1.1)' });
  chord(mega ? [523, 659, 784] : [196, 247, 294]);
  const a = pop.querySelector('.stage2 .a'), b = pop.querySelector('.stage2 .b'), cap = pop.querySelector('.cap');
  let stage = 0, timer;
  const reveal = () => {
    if (stage) return; stage = 1; clearTimeout(timer);
    pop.classList.add('done'); a.classList.add('hide'); b.classList.remove('hide'); b.classList.add('new-in');
    chord(mega ? [784, 988, 1318, 1568] : [262, 330, 392, 523]);
    cap.innerHTML = `<small>${mega ? 'Megaevolución' : 'Gigamax'}</small>¡${A.name} ${mega ? 'ha megaevolucionado en' : 'se ha convertido en'} <b>${B.name}</b>!`; cap.classList.add('win');
    const r = pop.getBoundingClientRect(); setTimeout(() => shinyBurst(r.left + r.width / 2, r.top + r.height * .42), 150);
    timer = setTimeout(close, 1700);
  };
  const close = () => {
    if (stage > 1) return; stage = 2; clearTimeout(timer);
    const from = b.getBoundingClientRect(); onSwap(); renderAdv();
    shade.classList.add('out'); pop.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.96)' }], { duration: 340, easing: 'ease-in', fill: 'forwards' });
    setTimeout(() => flyHome(m, from, sprUrl(B.id, B.n, m.shiny), () => { shade.remove(); onEnd(); }), 100);
  };
  requestAnimationFrame(() => pop.classList.add('go'));
  shade.addEventListener('click', () => stage === 0 ? reveal() : close());
  timer = setTimeout(reveal, 1900);
}
