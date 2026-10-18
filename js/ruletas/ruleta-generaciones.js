// Ruleta de generaciones (Jugar) y ruleta mini del menú
// Una casilla por generación, repetidas hasta tener al menos 8; la flecha está a la derecha
const SEGS = GENS.length * Math.ceil(8 / GENS.length);
const ARC = TAU / SEGS;
const segGen = i => GENS[i % GENS.length];
let rot = 0, glow = -1, centerLabel = null;          // giro actual, casilla iluminada y generación del centro
let spinning = false, landed = null, drag = null;
let spinToken = 0;                                   // cada giro nuevo invalida el anterior
let pointerKick = 0;                                 // lengüeta de la flecha: golpea en cada casilla y vuelve

function paintWheel(ctx, size, r0, opts = {}) {
  const dpr = ctx.canvas.width / size;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  const c = size / 2, R = size / 2 - (opts.mini ? 2 : 18);
  const inner = R * 0.42;
  ctx.lineCap = 'round';

  // marcas fijas alrededor
  if (!opts.mini) {
    for (let i = 0; i < 96; i++) {
      const a = i / 96 * TAU, long = i % 12 === 0;
      const r1 = R + 6, r2 = R + (long ? 14 : 9);
      ctx.strokeStyle = long ? W.tickStrong : W.tick;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1); ctx.lineTo(c + Math.sin(a) * r2, c - Math.cos(a) * r2); ctx.stroke();
    }
  }

  // casillas
  for (let s = 0; s < SEGS; s++) {
    const g = segGen(s);
    const a0 = r0 + s * ARC - Math.PI / 2, a1 = a0 + ARC;
    const lit = s === glow;
    // relleno suave
    const grad = ctx.createRadialGradient(c, c, inner, c, c, R);
    grad.addColorStop(0, hexA(g.color, 0));
    grad.addColorStop(1, hexA(g.color, lit ? 0.32 : 0.09));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(c, c, R, a0, a1); ctx.arc(c, c, inner, a1, a0, true); ctx.closePath(); ctx.fill();
    // banda de color en el borde
    ctx.strokeStyle = g.color; ctx.lineWidth = opts.mini ? 3 : (lit ? 5 : 3);
    ctx.shadowColor = g.color; ctx.shadowBlur = lit ? 18 : (opts.mini ? 4 : 8);
    const gap = opts.mini ? 0.08 : 0.035;
    ctx.beginPath(); ctx.arc(c, c, R - (opts.mini ? 2 : 3), a0 + gap, a1 - gap); ctx.stroke();
    ctx.shadowBlur = 0;
    // separador
    ctx.strokeStyle = W.div; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(c + Math.cos(a0) * inner, c + Math.sin(a0) * inner); ctx.lineTo(c + Math.cos(a0) * (R - 8), c + Math.sin(a0) * (R - 8)); ctx.stroke();
    // número romano de la generación, a lo largo del radio (como todos los textos de las ruletas): con la flecha a la derecha se lee recto
    if (!opts.mini) {
      const am = a0 + ARC / 2, rl = (R + inner) / 2 + 6;
      ctx.save();
      ctx.translate(c + Math.cos(am) * rl, c + Math.sin(am) * rl);
      ctx.rotate(am);
      ctx.fillStyle = lit ? W.labelLit : W.label;
      ctx.font = `500 ${Math.round(R * 0.13)}px "Chakra Petch", system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(g.roman, 0, 0);
      ctx.restore();
    }
  }

  // anillos interiores
  ctx.strokeStyle = W.ring; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(c, c, inner, 0, TAU); ctx.stroke();
  if (!opts.mini) {
    ctx.setLineDash([2, 6]);
    ctx.beginPath(); ctx.arc(c, c, inner - 10, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    // centro: «GEN» o la generación que ha salido
    ctx.fillStyle = W.hub;
    ctx.beginPath(); ctx.arc(c, c, inner - 18, 0, TAU); ctx.fill();
    ctx.strokeStyle = W.glow;
    ctx.beginPath(); ctx.arc(c, c, inner - 18, 0, TAU); ctx.stroke();
    ctx.fillStyle = opts.center ? opts.centerColor : W.center;
    ctx.font = `300 ${Math.round(R * (opts.center ? 0.2 : 0.075))}px "Chakra Petch", system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(opts.center || 'GEN', c, c + 1);
    // flecha
    ctx.save(); ctx.translate(size - 4, c); ctx.rotate(pointerKick); ctx.translate(-(size - 4), -c);
    ctx.fillStyle = W.cyan; ctx.shadowColor = W.cyan; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(size - 24, c); ctx.lineTo(size - 4, c - 7); ctx.lineTo(size - 4, c + 7); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
    pointerKick *= 0.82;
  } else {
    ctx.fillStyle = W.cyan;
    ctx.beginPath(); ctx.arc(c, c, 2.5, 0, TAU); ctx.fill();
  }
}

const cv = $('wheel'), ctx = cv.getContext('2d');
let WSIZE = 360;
function sizeWheel() {
  const w = Math.max(220, Math.round(cv.getBoundingClientRect().width) || 360);
  WSIZE = w;
  $("wheelHub").style.width = (2 * ((w / 2 - 18) * 0.42 - 18)) + "px";   // el botón es el círculo central entero
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  cv.width = w * dpr; cv.height = w * dpr;
  drawWheel();
}
// botón del centro: GIRAR mientras espera y SEGUIR (aceptar la generación) cuando ha parado
const genHub = () => spinning || drag ? null : landed && centerLabel ? 'SEGUIR' : 'GIRAR';
const drawWheel = () => {
  const hub = genHub(), el = $('wheelHub'); if (el) { el.hidden = !hub; el.setAttribute('aria-label', hub === 'SEGUIR' ? 'Aceptar la generación' : 'Girar la ruleta'); }
  paintWheel(ctx, WSIZE, rot, { ...(centerLabel ? { center: centerLabel.roman, centerColor: centerLabel.color } : {}), hub });
};
$('wheelHub').onclick = e => { e.stopPropagation(); const h = genHub(); if (h === 'GIRAR') spin(); else if (h === 'SEGUIR') $('acceptBtn').click(); };
window.addEventListener('resize', () => { if (state.scene === 'roulette') sizeWheel(); });

// Ruleta mini de «Que decida la ruleta»: solo gira mientras se ve y con las animaciones activadas
const icoCv = $('wheelIco'), ico = icoCv.getContext('2d');
let icoRot = 0, icoRunning = false;
function icoLoop() {
  paintWheel(ico, 56, icoRot, { mini: true });
  if (!reduceMotion && icoCv.offsetParent) { icoRunning = true; icoRot += 0.012; requestAnimationFrame(icoLoop); } else icoRunning = false;
}
icoLoop();

const segUnderPointer = () => Math.floor(mod(Math.PI / 2 - rot, TAU) / ARC);   // flecha a la derecha
function resetRoulette() {
  glow = -1; centerLabel = null;
  $('rouletteBtns').hidden = false; $('resultBtns').hidden = true;
  $('spinBtn').disabled = false; $('backBtn').disabled = false;
  $('readout').innerHTML = 'Listo';
  drawWheel();
  typeText($('rouletteText'), 'Pulsa girar, o agarra la ruleta por el borde y lánzala tú.');
  setTimeout(() => $('spinBtn').focus({ preventScroll: true }), 50);
}
// para la ruleta (al salir de la escena en mitad de un giro)
function stopGenRoulette() { spinToken++; spinning = false; drag = null; cv.classList.remove('grabbing'); }
function spin() {
  if (spinning) return;
  glow = -1; centerLabel = null;
  // mismo motor que el lanzamiento manual: un impulso de crupier con fuerza aleatoria
  freeSpin(1, 'Girando…');
}

// ---- Lanzamiento manual: agarra y suelta ----
function angleAt(e) {
  const r = cv.getBoundingClientRect();
  return Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2);
}
cv.addEventListener('pointerdown', e => {
  if (state.scene !== 'roulette') return;
  e.preventDefault();
  if (spinning) { // agarrarla en marcha la frena en seco, como con la mano
    spinToken++; spinning = false;
    $('spinBtn').disabled = false; $('backBtn').disabled = false;
    beep(220, 0.12, 0.04);
  }
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  drag = { last: angleAt(e), seg: segUnderPointer(), samples: [{ t: performance.now(), rot }] };
  glow = -1; centerLabel = null;
  cv.classList.add('grabbing');
  $('resultBtns').hidden = true; $('rouletteBtns').hidden = false;
  $('readout').innerHTML = 'Agarrada';
  typeText($('rouletteText'), 'Arrastra y suelta con fuerza para lanzarla.');
  beep(330, 0.06, 0.03);
  drawWheel();
});
cv.addEventListener('pointermove', e => {
  if (!drag) return;
  const a = angleAt(e);
  rot += mod(a - drag.last + Math.PI, TAU) - Math.PI;
  drag.last = a;
  const now = performance.now();
  drag.samples.push({ t: now, rot });
  while (drag.samples.length > 2 && now - drag.samples[0].t > 70) drag.samples.shift();
  const s = segUnderPointer();
  if (s !== drag.seg) { drag.seg = s; tick(); }
  drawWheel();
});
function release() {
  if (!drag) return;
  const now = performance.now();
  const s0 = drag.samples.find(s => now - s.t <= 70) || drag.samples[0];
  const dt = Math.max(0.016, (now - s0.t) / 1000);
  const v = (rot - s0.rot) / dt;
  drag = null;
  cv.classList.remove('grabbing');
  if (Math.abs(v) < 0.25) {
    $('readout').innerHTML = 'Sin fuerza';
    typeText($('rouletteText'), 'Le ha faltado impulso. Arrastra más rápido y suelta.');
    return;
  }
  freeSpin(v, null, true);
}
cv.addEventListener('pointerup', release);
cv.addEventListener('pointercancel', release);

function freeSpin(v, msg, fromHand = false) {
  spinning = true;
  const token = ++spinToken;
  $('spinBtn').disabled = true;
  $('resultBtns').hidden = true; $('rouletteBtns').hidden = false;
  const dir = Math.sign(v) || 1;
  typeText($('rouletteText'), msg || '¡Lanzada!');
  let D;
  if (fromHand) {
    // Lanzada a mano: la ruleta sale exactamente a la velocidad de tu gesto (sin límite).
    // La curva arranca con pendiente y1/x1 = 1/0.3, así que la distancia que recorre es
    // velocidad × duración × 0.3 → cuanto más rápido la sueltes, más vueltas da.
    D = Math.abs(v) * (SPIN_MS / 1000) * 0.3;
  } else {
    // Botón: al azar entre 4 y 10 vueltas, pero inclinado hacia muchas (raíz del azar → más valores altos)
    const turns = 4 + 6 * Math.sqrt(Math.random());
    D = turns * TAU;
  }
  const startRot = rot;
  let start = null, last = null, seg = segUnderPointer(), prev = 0;
  function frame(ts) {
    if (token !== spinToken) return;
    if (start === null) start = ts;
    const p = Math.min((ts - start) / SPIN_MS, 1);
    const pos = D * spinEase(p);
    v = dir * (pos - prev) / Math.max(0.001, (ts - (last || ts)) / 1000);
    last = ts; prev = pos;
    rot = startRot + dir * pos;
    $('readout').innerHTML = `${Math.round(Math.abs(v) * 60 / TAU)} <b>RPM</b>`;
    const s = segUnderPointer();
    if (s !== seg) { seg = s; tick(); pointerKick = Math.max(-0.6, Math.min(0.6, pointerKick - dir * 0.35)); }
    drawWheel();
    if (p < 1) requestAnimationFrame(frame); else land();
  }
  requestAnimationFrame(frame);
}

function land() {
  spinning = false; $('backBtn').disabled = false; $('spinBtn').disabled = false;
  const s = segUnderPointer();
  landed = segGen(s); glow = s; centerLabel = landed;
  drawWheel();
  chord([784, 988, 1318, 1568]);
  $('rouletteBtns').hidden = true;
  $('readout').innerHTML = `Gen <b style="color:${landed.color}">${landed.roman}</b> · ${landed.region}`;
  typeText($('rouletteText'), `Ha salido la Generación ${landed.roman}. ¿Aceptas el destino?`);
  $('resultBtns').hidden = false; $('acceptBtn').focus({ preventScroll: true });   // los botones salen ya, sin esperar al texto
}
$('spinBtn').onclick = spin;
$('menuBtn').onclick = goPlay;
$('respinBtn').onclick = () => { beep(523); $('resultBtns').hidden = true; $('rouletteBtns').hidden = false; spin(); };
$('acceptBtn').onclick = () => { chord([659, 880, 1175]); pick(landed); };
$('backBtn').onclick = goPlay;
