// Ruleta genérica de la aventura (casillas de distinto tamaño = distinta probabilidad)
const imgCache = new Map();
function spriteImg(n, shiny) {
  const r = (shiny && SPR.shiny.get(n)) || SPR.normal.get(n); if (!r) return null;
  let im = imgCache.get(r.u); if (!im) { im = new Image(); im.src = r.u; im.onload = () => { if (advWheel) { advWheel.dirty = true; advWheel.draw(); advWheel.idle(); } }; imgCache.set(r.u, im); }
  return im.complete && im.naturalWidth ? im : null;
}
// encoge la letra (hasta 9 px) para que el texto quepa antes de recortarlo con «…»
function fitFont(ctx, text, maxW, fs) {
  const w = ctx.measureText(text).width; if (w <= maxW) return;
  ctx.font = `600 ${Math.max(9, Math.floor(fs * maxW / w))}px "Chakra Petch", system-ui, sans-serif`;
}
// iconos que pueden ir en el centro de la ruleta (encima del texto): de momento, el de la evolución (flechas doradas que suben y destellos)
const EVO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="eg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff9f43"/><stop offset="1" stop-color="#ffe27a"/></linearGradient></defs>'
  + '<path d="M14 46 32 28l18 18" fill="none" stroke="url(#eg)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 31 32 19l12 12" fill="none" stroke="url(#eg)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>'
  + '<path d="M50 6l2.2 5.8L58 14l-5.8 2.2L50 22l-2.2-5.8L42 14l5.8-2.2z" fill="#fff6c8"/><path d="M13 9l1.4 3.6L18 14l-3.6 1.4L13 19l-1.4-3.6L8 14l3.6-1.4z" fill="#fff6c8"/><path d="M54 40l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="#ffe27a"/></svg>';
const WHEEL_ICONS = { evo: Object.assign(new Image(), { src: 'data:image/svg+xml,' + encodeURIComponent(EVO_SVG) }) };
const clip = (ctx, t, maxW) => { while (ctx.measureText(t).width > maxW && t.length > 3) t = t.slice(0, -2) + '…'; return t; };
// El dibujo va en dos partes para que girar y arrastrar no pesen:
//  · una capa con lo que no cambia mientras gira (colores, brillos, separadores y textos), dibujada una vez y luego solo rotada;
//  · encima, en cada fotograma, los sprites (con sus saltitos cuando está parada), el centro y la flecha.
class Wheel {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.size = 360;
    this.segs = []; this.rot = 0; this.glow = -1; this.kick = 0; this.spinning = false; this.token = 0; this.center = '?'; this.centerColor = null;
    this.onLand = null; this.onStart = null; this.enabled = false; this.drag = null; this.dirty = true; this.layer = document.createElement('canvas');
    canvas.addEventListener('pointerdown', e => this.down(e));
    canvas.addEventListener('pointermove', e => this.move(e));
    canvas.addEventListener('pointerup', () => this.up()); canvas.addEventListener('pointercancel', () => this.up());
    // tocar la ruleta cuando ya ha parado = pulsar el botón principal (Continuar, Lanzar…)
    canvas.addEventListener('click', () => { if (!this.enabled && !this.spinning && !this.justSpun && this.onTap) this.onTap(); this.justSpun = false; });
    // botón del centro: gira la ruleta o sigue adelante
    this.hubEl = canvas.parentElement && canvas.parentElement.querySelector('.wheel-hub');
    if (this.hubEl) this.hubEl.addEventListener('click', e => { e.stopPropagation(); const h = this.hub(); if (h === 'GIRAR') { this.justSpun = true; this.spin(1); } else if (h && this.onTap) this.onTap(); });
  }
  // qué hace ahora el botón del centro
  hub() {
    if (this.spinning || this.drag) return null;
    if (this.enabled) return 'GIRAR';
    return this.hasNext && this.hasNext() ? 'SEGUIR' : null;
  }
  set(segs, center = '?') {
    this.gen = (this.gen || 0) + 1;   // cada ruleta nueva tiene su número: las animaciones de la anterior ya no la tocan
    if (this === advWheel) { wheelRelease(this.keepM); }
    const tot = segs.reduce((a, s) => a + (s.w || 1), 0); let acc = 0;
    this.segs = segs.map(s => { const a = (s.w || 1) / tot * TAU, o = { ...s, a0: acc, arc: a }; acc += a; return o; });
    this.glow = -1; this.center = center; this.centerColor = null; this.centerImg = null; this.centerIcon = null; this.rot = Math.random() * TAU;
    this.keepM = null; this.centerM = null; this.dirty = true;
    this.pokemon = this.segs.some(s => s.n);
    if (this.segs.some(x => x.m)) this.segs.forEach(x => { if (x.m) x.hideImg = true; });
    this.draw(); this.idle();
    if (this.segs.some(x => x.hideImg)) requestAnimationFrame(() => flyIntoSlices(this));
  }
  resize() {
    const w = Math.max(220, Math.round(this.cv.getBoundingClientRect().width) || 360), dpr = Math.min(3, devicePixelRatio || 1);
    this.size = w; this.cv.width = w * dpr; this.cv.height = w * dpr; this.dirty = true;
    if (this.hubEl) this.hubEl.style.width = (2 * (this.geo().inner - 10)) + "px";   // el botón es el círculo central entero
    this.draw();
  }
  // casilla bajo la flecha (a la derecha)
  segIndex() { const a = mod(Math.PI / 2 - this.rot, TAU); return Math.max(0, this.segs.findIndex(s => a >= s.a0 && a < s.a0 + s.arc)); }
  geo() { const size = this.size, c = size / 2, R = size / 2 - 18; return { size, c, R, inner: R * 0.36 }; }
  // capa fija (sin girar): casillas, brillos y textos; también decide dónde va el sprite de cada casilla
  buildLayer() {
    const L = this.layer, dpr = this.cv.width / this.size; if (L.width !== this.cv.width) { L.width = this.cv.width; L.height = this.cv.height; }
    const ctx = L.getContext('2d'), { c, R, inner } = this.geo();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, this.size, this.size); ctx.lineCap = 'round';
    const many = this.segs.length > 150;   // ruletas enormes (p. ej. toda la Pokédex): dibujo ligero, sin textos
    this.segs.forEach((s, i) => {
      const a0 = s.a0 - Math.PI / 2, a1 = a0 + s.arc, lit = i === this.glow;
      s._sp0 = null;
      // partes de color del quesito: una, o dos mitades si el Pokémon tiene dos tipos
      const half = a0 + s.arc / 2, parts = s.color2 ? [[a0, half, s.color], [half, a1, s.color2]] : [[a0, a1, s.color]];
      if (many) {
        parts.forEach(([b0, b1, col]) => {
          ctx.fillStyle = hexA(col, lit ? .55 : .16); ctx.beginPath(); ctx.arc(c, c, R, b0, b1); ctx.arc(c, c, inner, b1, b0, true); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = col; ctx.lineWidth = lit ? 6 : 3; ctx.beginPath(); ctx.arc(c, c, R - 3, b0, b1 + .002); ctx.stroke();
        });
        return;
      }
      const gap = Math.min(.035, s.arc * .15);
      parts.forEach(([b0, b1, col], k) => {
        const grad = ctx.createRadialGradient(c, c, inner, c, c, R);
        grad.addColorStop(0, hexA(col, 0)); grad.addColorStop(1, hexA(col, lit ? .38 : .12));
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(c, c, R, b0, b1 + (k < parts.length - 1 ? .002 : 0)); ctx.arc(c, c, inner, b1, b0, true); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = lit ? 5 : 3; ctx.shadowColor = col; ctx.shadowBlur = lit ? 18 : 8;
        ctx.beginPath(); ctx.arc(c, c, R - 3, k ? b0 : b0 + gap, k === parts.length - 1 ? b1 - gap : b1); ctx.stroke(); ctx.shadowBlur = 0;
      });
      ctx.strokeStyle = W.div; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(c + Math.cos(a0) * inner, c + Math.sin(a0) * inner); ctx.lineTo(c + Math.cos(a0) * (R - 8), c + Math.sin(a0) * (R - 8)); ctx.stroke();
      // contenido de la casilla
      const am = a0 + s.arc / 2, rm = (R + inner) / 2, chord = s.arc * rm;
      const im = s.n ? spriteImg(s.n, s.m ? s.m.shiny : s.shiny) : null;
      ctx.fillStyle = lit ? W.labelLit : W.label;
      if (!this.pokemon) {
        // sin Pokémon: todos los textos a lo largo del radio, del centro hacia fuera; con la flecha a la derecha se leen rectos
        if (s.arc <= .025) return;
        ctx.save(); ctx.translate(c, c); ctx.rotate(am);
        const x0 = inner + 12, maxW = R - 14 - x0, fs = Math.max(9, Math.min(R * .1, s.arc * (inner + 20) * .62, s.arc > .12 ? 99 : s.arc * R * .62));
        ctx.font = `600 ${Math.round(fs)}px "Chakra Petch", system-ui, sans-serif`; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        fitFont(ctx, s.label, maxW, fs);
        ctx.fillText(clip(ctx, s.label, maxW), x0 + maxW / 2, 0); ctx.restore();
        return;
      }
      if (s.arc >= .7) {
        // casilla ancha con Pokémon: sprite grande y el nombre debajo, siempre de pie
        const rot = am + Math.PI / 2;   // la base del texto siempre mira al centro
        const sz = im ? Math.min(R * .4, chord * .55) : 0, fs = Math.max(11, Math.min(R * .1, chord * .16));
        const rS = rm + sz * .12, rN = im ? rS - sz / 2 - fs * .55 : rm;
        if (im) s._sp0 = { am: am, r: rS, sz, im };
        ctx.save(); ctx.translate(c + Math.cos(am) * rN, c + Math.sin(am) * rN); ctx.rotate(rot);
        ctx.font = `600 ${Math.round(fs)}px "Chakra Petch", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        fitFont(ctx, s.label, chord * .85, fs);
        ctx.fillText(clip(ctx, s.label, chord * .85), 0, 0); ctx.restore();
      } else {
        // casilla estrecha con Pokémon: sprite pequeño al borde y texto a lo largo del radio
        ctx.save(); ctx.translate(c, c); ctx.rotate(am);
        const sz = im ? Math.min(chord * .8, R * .22) : 0, x0 = inner + 10;
        if (im && chord > 22) s._sp0 = { am: am, r: R - sz / 2 - 8, sz, im };
        const fs = Math.max(9, Math.min(R * .085, chord * .42));
        ctx.font = `600 ${Math.round(fs)}px "Chakra Petch", system-ui, sans-serif`; ctx.textBaseline = 'middle';
        const maxW = (im && chord > 22 ? R - sz - 14 : R - 12) - x0;
        fitFont(ctx, s.label, maxW, fs);
        if (s.arc > .12) { ctx.textAlign = 'left'; ctx.fillText(clip(ctx, s.label, maxW), x0, 0); }   // del centro hacia fuera
        else if (s.arc > .025) {
          // muchísimos quesitos (p. ej. todos los Pokémon de una región): nombre pequeñito hacia el borde
          const x1 = R * .5, f2 = Math.max(6, Math.min(fs, s.arc * R * .62)), mw = R - 10 - x1;
          ctx.font = `600 ${Math.round(f2)}px "Chakra Petch", system-ui, sans-serif`;
          ctx.textAlign = 'left'; ctx.fillText(clip(ctx, s.label, mw), x1, 0);
        }
        ctx.restore();
      }
    });
    this.dirty = false; this.layerGlow = this.glow;
  }
  draw() {
    const ctx = this.ctx, size = this.size, dpr = this.cv.width / size; if (!size || !this.cv.width) return;
    if (this.dirty || this.layerGlow !== this.glow) this.buildLayer();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size);
    const { c, R, inner } = this.geo(); ctx.lineCap = 'round';
    for (let i = 0; i < 96; i++) {
      const a = i / 96 * TAU, long = i % 12 === 0, r1 = R + 6, r2 = R + (long ? 14 : 9);
      ctx.strokeStyle = long ? W.tickStrong : W.tick; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1); ctx.lineTo(c + Math.sin(a) * r2, c - Math.cos(a) * r2); ctx.stroke();
    }
    // la capa fija, girada
    ctx.save(); ctx.translate(c, c); ctx.rotate(this.rot); ctx.translate(-c, -c); ctx.drawImage(this.layer, 0, 0, size, size); ctx.restore();
    // sprites: saltan mientras la ruleta está parada (el que gana salta más)
    const still = !this.spinning && !this.drag;
    this.segs.forEach((s, i) => {
      const p = s._sp0; if (!p) { s._sp = null; return; }
      const am = p.am + this.rot, x = c + Math.cos(am) * p.r, y = c + Math.sin(am) * p.r;
      s._sp = { x, y, sz: p.sz };
      if (s.hideImg) return;
      ctx.save(); ctx.translate(x, y); ctx.rotate(am + Math.PI / 2); if (still) this.hop(ctx, i, p.sz, i === this.glow);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(p.im, -p.sz / 2, -p.sz / 2, p.sz, p.sz); ctx.restore();
    });
    ctx.strokeStyle = W.ring; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(c, c, inner, 0, TAU); ctx.stroke();
    ctx.fillStyle = W.hub; ctx.beginPath(); ctx.arc(c, c, inner - 10, 0, TAU); ctx.fill();
    ctx.strokeStyle = W.glow; ctx.beginPath(); ctx.arc(c, c, inner - 10, 0, TAU); ctx.stroke();
    const hub = this.hub();
    if (this.centerImg) {   // el Pokémon elegido, subido al centro de la ruleta
      const hs = (inner - 14) * 1.5, t = performance.now() / 1000, up = reduceMotion ? 0 : Math.abs(Math.sin(t * 3.2)) * hs * .06;
      ctx.save(); ctx.beginPath(); ctx.arc(c, c, inner - 11, 0, TAU); ctx.clip(); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.centerImg, c - hs / 2, c - hs / 2 - up - hs * .14, hs, hs); ctx.restore();
      if (this.centerName) { ctx.fillStyle = W.center; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `600 ${Math.round(Math.max(9, R * .055))}px "Chakra Petch", system-ui, sans-serif`;
        ctx.fillText(clip(ctx, this.centerName, inner * 1.5), c, c + inner * .55); }
    } else {
      ctx.fillStyle = this.centerColor || W.center; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const ct = String(this.center), ic = this.centerIcon && this.centerIcon.complete && this.centerIcon.naturalWidth ? this.centerIcon : null;
      // con icono: el icono arriba (con un brillo que late) y el texto, más pequeño, debajo
      if (ic) { const s = inner * .78, t = performance.now() / 1000, p = reduceMotion ? 0 : (Math.sin(t * 2.6) + 1) / 2;
        ctx.save(); ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 8 + p * 14; ctx.drawImage(ic, c - s / 2, c - s * .72, s, s); ctx.restore(); }
      ctx.font = `500 ${Math.round(R * (ic ? .055 : ct.length > 6 ? .07 : ct.length > 3 ? .1 : .16))}px "Chakra Petch", system-ui, sans-serif`;
      ctx.fillText(clip(ctx, ct, inner * 1.55), c, ic ? c + inner * .42 : c + 1);
    }
    if (this.hubEl && this.hubEl._h !== hub) { this.hubEl._h = hub; this.hubEl.hidden = !hub; if (hub) this.hubEl.setAttribute('aria-label', hub === 'GIRAR' ? 'Girar la ruleta' : 'Seguir'); }
    // flecha a la derecha, apuntando al centro
    ctx.save(); ctx.translate(size - 4, c); ctx.rotate(this.kick); ctx.translate(-(size - 4), -c);
    ctx.fillStyle = W.cyan; ctx.shadowColor = W.cyan; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(size - 24, c); ctx.lineTo(size - 4, c - 7); ctx.lineTo(size - 4, c + 7); ctx.closePath(); ctx.fill(); ctx.restore();
    this.kick *= .82;
  }
  // los sprites de la ruleta están vivos: saltitos desfasados (el que gana salta más)
  hop(ctx, i, sz, lit) {
    if (reduceMotion) return;
    const t = performance.now() / 1000, ph = t * (lit ? 7 : 3.2) + i * 1.3, up = Math.abs(Math.sin(ph));
    const h = sz * (lit ? .22 : .1) * up, sq = 1 + (1 - up) * (lit ? .1 : .05) * (up < .35 ? 1 : 0);
    ctx.translate(0, sz / 2 - h); ctx.scale(sq, 2 - sq); ctx.rotate(Math.sin(ph * .5) * (lit ? .12 : .06)); ctx.translate(0, -sz / 2);
  }
  // mientras está parada, se redibuja a ~30 fps para que los sprites salten; se detiene si no hay sprites que animar
  // o si la ruleta deja de verse (set() la vuelve a poner en marcha con la siguiente ruleta)
  idle() {
    if (this.idling || reduceMotion) return; this.idling = true;
    let last = 0;
    const loop = now => {
      if (!(this.segs.some(s => s._sp0) || this.centerImg || this.centerIcon) || !this.cv.isConnected || state.scene !== 'adv' || document.hidden) { this.idling = false; return; }
      if (!this.spinning && !this.drag && this.cv.offsetParent && now - last > 33) { last = now; this.draw(); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  angleAt(e) { const r = this.cv.getBoundingClientRect(); return Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2); }
  down(e) {
    if (!this.enabled || this.spinning) return; e.preventDefault();
    try { this.cv.setPointerCapture(e.pointerId); } catch (_) {}
    this.drag = { last: this.angleAt(e), seg: this.segIndex(), moved: 0, net: 0, t0: performance.now(), samples: [{ t: performance.now(), rot: this.rot }] };
    this.glow = -1; this.cv.classList.add('grabbing'); beep(330, .06, .03); this.draw();
  }
  move(e) {
    const d = this.drag; if (!d) return;
    const a = this.angleAt(e), da = mod(a - d.last + Math.PI, TAU) - Math.PI; this.rot += da; d.moved += Math.abs(da); d.net += da; d.last = a;
    const now = performance.now(); d.samples.push({ t: now, rot: this.rot }); while (d.samples.length > 2 && now - d.samples[0].t > 70) d.samples.shift();
    const s = this.segIndex(); if (s !== d.seg) { d.seg = s; tick(); }
    // se dibuja una vez por fotograma aunque lleguen muchos movimientos (ratón o dedo)
    if (!this.dragRaf) this.dragRaf = requestAnimationFrame(() => { this.dragRaf = 0; this.draw(); });
  }
  up() {
    const d = this.drag; if (!d) return; this.drag = null; this.cv.classList.remove('grabbing');
    const now = performance.now(), s0 = d.samples.find(s => now - s.t <= 70) || d.samples[0];
    const v = (this.rot - s0.rot) / Math.max(.016, (now - s0.t) / 1000);
    // un toque (sin arrastrar) también la hace girar
    if (d.moved < .08 && now - d.t0 < 600) { this.justSpun = true; this.spin(1); return; }
    // arrastrada despacio pero con recorrido: sale igualmente, hacia donde la llevabas
    if (Math.abs(v) < .25) { if (Math.abs(d.net) > .5) { this.justSpun = true; this.spin(Math.sign(d.net) * 2, true); return; } advSay('Le ha faltado impulso. Arrastra más rápido y suelta, o simplemente tócala.'); this.draw(); return; }
    this.justSpun = true; this.spin(v, true);
  }
  spin(v = 1, fromHand = false) {
    if (this.spinning || !this.segs.length) return;
    this.spinning = true; this.enabled = false; this.glow = -1; this.onStart && this.onStart();
    const token = ++this.token, dir = Math.sign(v) || 1;
    const D = fromHand ? Math.max(TAU * 1.5, Math.abs(v) * (SPIN_MS / 1000) * .3) : (4 + 6 * Math.sqrt(Math.random())) * TAU;
    const start0 = this.rot; let start = null, seg = this.segIndex(), last = 0, prev = 0, rpmT = 0;
    const rpm = $('advRpm'), showAt = this.segs.length > 16;
    const frame = ts => {
      if (token !== this.token) return;
      if (start === null) { start = ts; last = ts; }
      const p = Math.min((ts - start) / SPIN_MS, 1), pos = D * spinEase(p);
      const vel = (pos - prev) / Math.max(.001, (ts - last) / 1000); prev = pos; last = ts;
      this.rot = start0 + dir * pos;
      // el contador de RPM no hace falta a 60 fps: cada 80 ms
      if (ts - rpmT > 80 || p >= 1) { rpmT = ts; rpm.innerHTML = `${showAt ? `<span class="rp-at"><b>▼ ${this.segs[this.segIndex()].label}</b></span>` : ''}<span class="rp-v">${Math.round(vel * 60 / TAU)} <b>RPM</b></span>`; }
      const s = this.segIndex(); if (s !== seg) { seg = s; tick(); this.kick = Math.max(-.6, Math.min(.6, this.kick - dir * .35)); }
      this.draw();
      if (p < 1) requestAnimationFrame(frame); else land();
    };
    const land = () => {
      this.spinning = false; this.glow = this.segIndex(); const r = this.segs[this.glow];
      if (this === advWheel && r && r.m && !r.noCenter) pickToCenter(r.m, this);
      this.center = r.short || r.label; this.centerColor = r.color; this.draw(); chord([784, 988, 1318]); this.onLand && this.onLand(r); this.idle();
    };
    if (reduceMotion) { this.rot = start0 + dir * D; this.draw(); land(); return; }
    requestAnimationFrame(frame);
  }
  stop() { this.token++; this.spinning = false; this.drag = null; }
}
