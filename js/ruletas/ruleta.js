// Ruleta genérica de la aventura (casillas de distinto tamaño = distinta probabilidad)
const imgCache = new Map();
function spriteImg(n, shiny) {
  const r = (shiny && SPR.shiny.get(n)) || SPR.normal.get(n); if (!r) return null;
  let im = imgCache.get(r.u); if (!im) { im = new Image(); im.src = r.u; im.onload = () => advWheel && advWheel.draw(); imgCache.set(r.u, im); }
  return im.complete && im.naturalWidth ? im : null;
}
// encoge la letra (hasta 9 px) para que el texto quepa antes de recortarlo con «…»
function fitFont(ctx, text, maxW, fs) {
  const w = ctx.measureText(text).width; if (w <= maxW) return;
  ctx.font = `600 ${Math.max(9, Math.floor(fs * maxW / w))}px "Chakra Petch", system-ui, sans-serif`;
}
class Wheel {
  constructor(canvas) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.size = 360;
    this.segs = []; this.rot = 0; this.glow = -1; this.kick = 0; this.spinning = false; this.token = 0; this.center = '?'; this.centerColor = null;
    this.onLand = null; this.onStart = null; this.enabled = false; this.drag = null;
    canvas.addEventListener('pointerdown', e => this.down(e));
    canvas.addEventListener('pointermove', e => this.move(e));
    canvas.addEventListener('pointerup', () => this.up()); canvas.addEventListener('pointercancel', () => this.up());
    // tocar la ruleta cuando ya ha parado = pulsar el botón principal (Continuar, Intentar…)
    canvas.addEventListener('click', () => { if (!this.enabled && !this.spinning && !this.justSpun && this.onTap) this.onTap(); this.justSpun = false; });
  }
  set(segs, center = '?') {
    if (this === advWheel) { wheelRelease(this.keepM); }
    const tot = segs.reduce((a, s) => a + (s.w || 1), 0); let acc = 0;
    this.segs = segs.map(s => { const a = (s.w || 1) / tot * TAU, o = { ...s, a0: acc, arc: a }; acc += a; return o; });
    this.glow = -1; this.center = center; this.centerColor = null; this.centerImg = null; this.rot = Math.random() * TAU;
    this.keepM = null; this.centerM = null;
    if (this.segs.some(x => x.m)) this.segs.forEach(x => { if (x.m) x.hideImg = true; });
    this.draw(); this.idle();
    if (this.segs.some(x => x.hideImg)) requestAnimationFrame(() => flyIntoSlices(this));
  }
  resize() {
    const w = Math.max(220, Math.round(this.cv.getBoundingClientRect().width) || 360), dpr = Math.min(3, devicePixelRatio || 1);
    this.size = w; this.cv.width = w * dpr; this.cv.height = w * dpr; this.draw();
  }
  // casilla bajo la flecha (a la derecha)
  segIndex() { const a = mod(Math.PI / 2 - this.rot, TAU); return Math.max(0, this.segs.findIndex(s => a >= s.a0 && a < s.a0 + s.arc)); }
  draw() {
    const ctx = this.ctx, size = this.size, dpr = this.cv.width / size; if (!size) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size);
    const c = size / 2, R = size / 2 - 18, inner = R * 0.36; ctx.lineCap = 'round';
    for (let i = 0; i < 96; i++) {
      const a = i / 96 * TAU, long = i % 12 === 0, r1 = R + 6, r2 = R + (long ? 14 : 9);
      ctx.strokeStyle = long ? W.tickStrong : W.tick; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1); ctx.lineTo(c + Math.sin(a) * r2, c - Math.cos(a) * r2); ctx.stroke();
    }
    const many = this.segs.length > 150;   // ruletas enormes (p. ej. toda la Pokédex): dibujo ligero, sin textos
    this.segs.forEach((s, i) => {
      const a0 = this.rot + s.a0 - Math.PI / 2, a1 = a0 + s.arc, lit = i === this.glow;
      if (many) {
        ctx.fillStyle = hexA(s.color, lit ? .55 : .16); ctx.beginPath(); ctx.arc(c, c, R, a0, a1); ctx.arc(c, c, inner, a1, a0, true); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = s.color; ctx.lineWidth = lit ? 6 : 3; ctx.beginPath(); ctx.arc(c, c, R - 3, a0, a1 + .002); ctx.stroke();
        return;
      }
      const grad = ctx.createRadialGradient(c, c, inner, c, c, R);
      grad.addColorStop(0, hexA(s.color, 0)); grad.addColorStop(1, hexA(s.color, lit ? .38 : .12));
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(c, c, R, a0, a1); ctx.arc(c, c, inner, a1, a0, true); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = s.color; ctx.lineWidth = lit ? 5 : 3; ctx.shadowColor = s.color; ctx.shadowBlur = lit ? 18 : 8;
      const gap = Math.min(.035, s.arc * .15);
      ctx.beginPath(); ctx.arc(c, c, R - 3, a0 + gap, a1 - gap); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.strokeStyle = W.div; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(c + Math.cos(a0) * inner, c + Math.sin(a0) * inner); ctx.lineTo(c + Math.cos(a0) * (R - 8), c + Math.sin(a0) * (R - 8)); ctx.stroke();
      // contenido de la casilla
      const am = a0 + s.arc / 2, rm = (R + inner) / 2, chord = s.arc * rm;
      const im = s.n ? spriteImg(s.n, s.m ? s.m.shiny : s.shiny) : null;
      ctx.fillStyle = lit ? W.labelLit : W.label;
      if (s.arc >= .7) {
        // casilla ancha: sprite grande y el nombre debajo, siempre de pie
        const rot = am + Math.PI / 2;   // la base del texto siempre mira al centro
        const sz = im ? Math.min(R * .4, chord * .55) : 0, fs = Math.max(11, Math.min(R * .1, chord * .16));
        const rS = rm + sz * .12, rN = im ? rS - sz / 2 - fs * .55 : rm;
        if (im) s._sp = { x: c + Math.cos(am) * rS, y: c + Math.sin(am) * rS, sz };
        if (im && !s.hideImg) { ctx.save(); ctx.translate(c + Math.cos(am) * rS, c + Math.sin(am) * rS); ctx.rotate(rot); this.hop(ctx, i, sz, lit); ctx.imageSmoothingEnabled = false; ctx.drawImage(im, -sz / 2, -sz / 2, sz, sz); ctx.restore(); }
        ctx.save(); ctx.translate(c + Math.cos(am) * rN, c + Math.sin(am) * rN); ctx.rotate(rot);
        ctx.font = `600 ${Math.round(fs)}px "Chakra Petch", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        fitFont(ctx, s.label, chord * .85, fs);
        let t = s.label; while (ctx.measureText(t).width > chord * .85 && t.length > 3) t = t.slice(0, -2) + '…';
        ctx.fillText(t, 0, 0); ctx.restore();
      } else {
        // casilla estrecha: sprite pequeño al borde y texto a lo largo del radio
        ctx.save(); ctx.translate(c, c); ctx.rotate(am);
        const sz = im ? Math.min(chord * .8, R * .22) : 0, x0 = inner + 10;
        if (im && chord > 22) { const rr = R - sz / 2 - 8; s._sp = { x: c + Math.cos(am) * rr, y: c + Math.sin(am) * rr, sz }; }
        if (im && chord > 22 && !s.hideImg) { ctx.save(); ctx.translate(R - sz / 2 - 8, 0); ctx.rotate(Math.PI / 2); this.hop(ctx, i, sz, lit); ctx.imageSmoothingEnabled = false; ctx.drawImage(im, -sz / 2, -sz / 2, sz, sz); ctx.restore(); }
        const fs = Math.max(9, Math.min(R * .085, chord * .42));
        ctx.font = `600 ${Math.round(fs)}px "Chakra Petch", system-ui, sans-serif`; ctx.textBaseline = 'middle';
        const maxW = (im && chord > 22 ? R - sz - 14 : R - 12) - x0;
        fitFont(ctx, s.label, maxW, fs);
        let t = s.label; while (ctx.measureText(t).width > maxW && t.length > 3) t = t.slice(0, -2) + '…';
        if (s.arc > .12) {
          // en la mitad izquierda se da la vuelta al texto para que no quede del revés
          ctx.textAlign = 'left'; ctx.fillText(t, x0, 0);   // siempre del centro hacia fuera (con la flecha a la derecha, el ganador se lee recto)
        } else if (s.arc > .025) {
          // muchísimos quesitos (p. ej. todos los Pokémon de una región): nombre pequeñito hacia el borde
          const x1 = R * .5, f2 = Math.max(6, Math.min(fs, s.arc * R * .62)), mw = R - 10 - x1;
          ctx.font = `600 ${Math.round(f2)}px "Chakra Petch", system-ui, sans-serif`;
          let t2 = s.label; while (ctx.measureText(t2).width > mw && t2.length > 3) t2 = t2.slice(0, -2) + '…';
          ctx.textAlign = 'left'; ctx.fillText(t2, x1, 0);
        }
        ctx.restore();
      }
    });
    ctx.strokeStyle = W.ring; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(c, c, inner, 0, TAU); ctx.stroke();
    ctx.fillStyle = W.hub; ctx.beginPath(); ctx.arc(c, c, inner - 10, 0, TAU); ctx.fill();
    ctx.strokeStyle = W.glow; ctx.beginPath(); ctx.arc(c, c, inner - 10, 0, TAU); ctx.stroke();
    if (this.centerImg) {   // el Pokémon elegido, subido al centro de la ruleta
      const hs = (inner - 14) * 1.5, t = performance.now() / 1000, up = reduceMotion ? 0 : Math.abs(Math.sin(t * 3.2)) * hs * .06;
      ctx.save(); ctx.beginPath(); ctx.arc(c, c, inner - 11, 0, TAU); ctx.clip(); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.centerImg, c - hs / 2, c - hs / 2 - up - hs * .14, hs, hs); ctx.restore();
      if (this.centerName) { ctx.fillStyle = W.center; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `600 ${Math.round(Math.max(9, R * .055))}px "Chakra Petch", system-ui, sans-serif`;
        let t = this.centerName; while (ctx.measureText(t).width > inner * 1.5 && t.length > 3) t = t.slice(0, -2) + '…'; ctx.fillText(t, c, c + inner * .55); }
    } else {
    ctx.fillStyle = this.centerColor || W.center; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ct = String(this.center); ctx.font = `500 ${Math.round(R * (ct.length > 6 ? .07 : ct.length > 3 ? .1 : .16))}px "Chakra Petch", system-ui, sans-serif`;
    ctx.fillText(ct, c, c + 1);
    }
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
      if (!this.segs.some(s => s.n) || this.segs.length > 150 || !(SPR.normal.size || SPR.shiny.size) || !this.cv.isConnected || state.scene !== 'adv') { this.idling = false; return; }
      if (!this.spinning && !this.drag && this.cv.offsetParent && now - last > 33) { last = now; this.draw(); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  angleAt(e) { const r = this.cv.getBoundingClientRect(); return Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2); }
  down(e) {
    if (!this.enabled || this.spinning) return; e.preventDefault();
    try { this.cv.setPointerCapture(e.pointerId); } catch (_) {}
    this.drag = { last: this.angleAt(e), seg: this.segIndex(), moved: 0, t0: performance.now(), samples: [{ t: performance.now(), rot: this.rot }] };
    this.glow = -1; this.cv.classList.add('grabbing'); beep(330, .06, .03); this.draw();
  }
  move(e) {
    const d = this.drag; if (!d) return;
    const a = this.angleAt(e), da = mod(a - d.last + Math.PI, TAU) - Math.PI; this.rot += da; d.moved += Math.abs(da); d.last = a;
    const now = performance.now(); d.samples.push({ t: now, rot: this.rot }); while (d.samples.length > 2 && now - d.samples[0].t > 70) d.samples.shift();
    const s = this.segIndex(); if (s !== d.seg) { d.seg = s; tick(); }
    this.draw();
  }
  up() {
    const d = this.drag; if (!d) return; this.drag = null; this.cv.classList.remove('grabbing');
    const now = performance.now(), s0 = d.samples.find(s => now - s.t <= 70) || d.samples[0];
    const v = (this.rot - s0.rot) / Math.max(.016, (now - s0.t) / 1000);
    // un toque (sin arrastrar) también la hace girar
    if (d.moved < .08 && now - d.t0 < 600) { this.justSpun = true; this.spin(1); return; }
    if (Math.abs(v) < .25) { advSay('Le ha faltado impulso. Arrastra más rápido y suelta, o simplemente tócala.'); return; }
    this.justSpun = true; this.spin(v, true);
  }
  spin(v = 1, fromHand = false) {
    if (this.spinning || !this.segs.length) return;
    this.spinning = true; this.enabled = false; this.glow = -1; this.onStart && this.onStart();
    const token = ++this.token, dir = Math.sign(v) || 1;
    const D = fromHand ? Math.max(TAU * 1.5, Math.abs(v) * (SPIN_MS / 1000) * .3) : (4 + 6 * Math.sqrt(Math.random())) * TAU;
    const start0 = this.rot; let start = null, seg = this.segIndex(), last = 0, prev = 0;
    const frame = ts => {
      if (token !== this.token) return;
      if (start === null) { start = ts; last = ts; }
      const p = Math.min((ts - start) / SPIN_MS, 1), pos = D * spinEase(p);
      const vel = (pos - prev) / Math.max(.001, (ts - last) / 1000); prev = pos; last = ts;
      this.rot = start0 + dir * pos;
      $('advRpm').innerHTML = `${this.segs.length > 16 ? `<span class="rp-at"><b>▼ ${this.segs[this.segIndex()].label}</b></span>` : ''}<span class="rp-v">${Math.round(vel * 60 / TAU)} <b>RPM</b></span>`;
      const s = this.segIndex(); if (s !== seg) { seg = s; tick(); this.kick = Math.max(-.6, Math.min(.6, this.kick - dir * .35)); }
      this.draw();
      if (p < 1) requestAnimationFrame(frame); else land();
    };
    const land = () => { this.spinning = false; this.glow = this.segIndex(); const r = this.segs[this.glow]; if (this === advWheel && r && r.m) pickToCenter(r.m, this); this.center = r.short || r.label; this.centerColor = r.color; this.draw(); chord([784, 988, 1318]); this.onLand && this.onLand(r); };
    if (reduceMotion) { this.rot = start0 + dir * D; this.draw(); land(); return; }
    requestAnimationFrame(frame);
  }
  stop() { this.token++; this.spinning = false; this.drag = null; }
}
