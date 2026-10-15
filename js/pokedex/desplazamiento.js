// Pokédex: desplazamiento con inercia, rueda, teclado y barra lateral
// ---- Pokédex con inercia (como la ruleta) + barra lateral ----
const rail = (() => {
  const view = $('dexView'), list = $('dexList'), R = $('dexRail'), track = $('railTrack'), thumb = $('railThumb'), bubble = $('railBubble'), ticksEl = $('railTicks');
  const FRICTION = 2.6;            // cuánto frena por segundo (más bajo = desliza más)
  const ICE = 4.2;                 // frenado al soltar la barra: patina un poco y se queda cerca de donde sueltas
  let ice = false, railTarget = 0, railS = [], wheelGoal = 0;
  const MAXV = 14000;
  let pos = 0, vel = 0, max = 0, H = 0, tops = [], hs = [], running = false, last = 0, drag = null, railDrag = false, hideT = 0, wantTicks = false;
  const clamp = v => Math.max(0, Math.min(max, v));
  function measure() {
    H = view.clientHeight;
    const items = list.children;
    tops = []; hs = [];
    for (const li of items) { tops.push(li.offsetTop); hs.push(li.offsetHeight); }
    max = Math.max(0, list.offsetHeight - H);
    fadePx = parseFloat(getComputedStyle($('dexBox')).getPropertyValue('--fade')) || 110; lastPos = NaN;
    pos = clamp(pos);
  }
  // solo se mueve la lista; el borde del cuadro difumina la parte que entra o sale
  // arriba del todo no hay fundido superior; al final, no hay fundido inferior (aparece según te mueves)
  let fadePx = 110;
  const fTop = $('fadeTop'), fBot = $('fadeBot'); let oT = -1, oB = -1, lastPos = NaN;
  function apply() {
    if (pos !== lastPos) { list.style.transform = `translate3d(0,${-pos}px,0)`; lastPos = pos; }
    const t = Math.min(1, pos / fadePx), b = Math.min(1, (max - pos) / fadePx);
    if (Math.abs(t - oT) > .01) { fTop.style.opacity = t.toFixed(3); oT = t; }
    if (Math.abs(b - oB) > .01) { fBot.style.opacity = b.toFixed(3); oB = b; }
  }
  let lastH = 0, lastIdx = -1;
  function syncRail() {
    const h = track.clientHeight;
    // a más velocidad, el indicador se estira como si patinara
    const sp = Math.min(1, Math.abs(vel) / 7000), extra = 44 * 0.8 * sp;
    const ty = (max ? pos / max : 0) * (h - 44) - (vel > 0 ? extra : 0);
    thumb.style.transform = `translate3d(-50%,${ty.toFixed(1)}px,0)`;
    const hh = Math.round(44 + extra); if (hh !== lastH) { thumb.style.height = hh + 'px'; lastH = hh; }
    if (!tops.length || !list.children[0].classList.contains('mon')) { bubble.textContent = ''; lastIdx = -1; return; }
    const mid = pos + H * 0.4; let lo = 0, hi = tops.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (tops[m] + hs[m] < mid) lo = m + 1; else hi = m; }
    if (max && pos >= max - 2) lo = tops.length - 1;   // al final del todo, la burbuja dice el último
    if (lo !== lastIdx) { lastIdx = lo; const it = list.children[lo]; bubble.textContent = it.querySelector('.no').textContent + ' · ' + it.querySelector('.nm').textContent; }
  }
  function showBubble() { R.classList.add('show'); clearTimeout(hideT); }
  function hideLater() { clearTimeout(hideT); hideT = setTimeout(() => { if (!railDrag) R.classList.remove('show'); }, 900); }
  function loop(ts) {
    const dt = last ? Math.max(0, Math.min(0.05, (ts - last) / 1000)) : 0.016; last = ts;
    if (railDrag) {
      // en la barra el contenido patina detrás del dedo, como sobre hielo
      const prev = pos;
      pos += (railTarget - pos) * (1 - Math.exp(-11 * dt));
      if (dt) vel = vel * 0.7 + ((pos - prev) / dt) * 0.3;
    } else if (!drag) {
      pos += vel * dt;
      vel *= Math.exp(-(ice ? ICE : FRICTION) * dt);
      if (pos < 0 || pos > max) {
        pos = pos < 0 ? 0 : max;
        vel = ice && Math.abs(vel) > 400 ? -vel * 0.22 : 0;   // pequeño rebote contra el borde
      }
    }
    apply(); syncRail();
    if (drag || railDrag || Math.abs(vel) > 6) requestAnimationFrame(loop);
    else { vel = 0; ice = false; running = false; thumb.style.height = ''; lastH = 0; hideLater(); }
  }
  function kick() { showBubble(); if (!running) { running = true; last = 0; requestAnimationFrame(loop); } }
  const push = dv => { vel = Math.max(-MAXV, Math.min(MAXV, vel + dv)); kick(); };
  // rueda: cada golpe suma velocidad y luego se va frenando sola
  $('dexBox').addEventListener('wheel', e => {
    if (e.ctrlKey) return;
    e.preventDefault();
    const dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * H : e.deltaY;
    if (reduceMotion) { pos = clamp(pos + dy); apply(); syncRail(); return; }
    // como la barra: se desliza hasta el punto marcado y frena enseguida
    // rueda (saltos grandes) avanza algo más; touchpad (muchos pasos pequeños) va 1:1
    const step = Math.abs(dy) >= 50 ? dy * 2.2 : dy * 1.1;
    const base = ice && running ? wheelGoal : pos;
    // nunca se adelanta más de una pantalla: así siempre se queda donde estás mirando
    wheelGoal = clamp(Math.max(pos - H * 0.9, Math.min(pos + H * 0.9, base + step)));
    vel = (wheelGoal - pos) * ICE; ice = true; kick();
  }, { passive: false });
  // arrastrar con ratón o dedo y soltar con fuerza
  view.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    drag = { y0: e.clientY, x0: e.clientX, t0: performance.now(), moved: 0, p0: pos, s: [[performance.now(), e.clientY]] }; vel = 0;
    view.setPointerCapture(e.pointerId); view.classList.add('grab'); view.focus({ preventScroll: true }); kick();
  });
  view.addEventListener('pointermove', e => {
    if (!drag) return;
    const now = performance.now();
    drag.s.push([now, e.clientY]); while (drag.s.length > 2 && now - drag.s[0][0] > 100) drag.s.shift();
    pos = clamp(drag.p0 - (e.clientY - drag.y0));
    drag.moved = Math.max(drag.moved, Math.abs(e.clientY - drag.y0) + Math.abs(e.clientX - drag.x0));
  });
  const release = (e) => {
    if (!drag) return;
    // un toque corto sin arrastrar = abrir la ficha de ese Pokémon
    if (e && e.type === 'pointerup' && drag.moved < (e.pointerType === 'touch' ? 12 : 6) && performance.now() - drag.t0 < 1200) {
      const li = document.elementFromPoint(e.clientX, e.clientY)?.closest('.mon');
      drag = null; view.classList.remove('grab');
      if (li && li.classList.contains('locked')) { beep(220, .06, .03); return; }
      if (li) { infoOrigin = null; infoNav = null; openInfo(+li.dataset.n, li.getBoundingClientRect()); }
      return;
    }
    const s = drag.s, a = s[0], b = s[s.length - 1], dt = (b[0] - a[0]) / 1000;
    drag = null; view.classList.remove('grab'); ice = true;   // también frena rápido al soltar
    if (dt > 0.01 && performance.now() - b[0] < 80) vel = Math.max(-MAXV, Math.min(MAXV, -(b[1] - a[1]) / dt * 0.5));
    kick();
  };
  view.addEventListener('pointerup', release); view.addEventListener('pointercancel', release);
  // teclado
  addEventListener('keydown', e => {
    if (state.scene !== 'dex' || infoOpen || e.target.closest && e.target.closest('input, select')) return;
    const k = { ArrowDown: 900, ArrowUp: -900, PageDown: H * FRICTION, PageUp: -H * FRICTION, ' ': H * FRICTION }[e.key];
    if (k) { e.preventDefault(); push(k); }
    if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); vel = 0; pos = e.key === 'Home' ? 0 : max; apply(); syncRail(); showBubble(); hideLater(); }
  });
  // barra lateral: arrastrar o pulsar
  function fromPointer(e) {
    const r = track.getBoundingClientRect(), th = 44;
    return Math.max(0, Math.min(1, (e.clientY - r.top - th / 2) / (r.height - th))) * max;
  }
  R.addEventListener('pointerdown', e => {
    if (e.target.closest('.rail-tick')) return;
    railDrag = true; ice = false; R.classList.add('active'); R.setPointerCapture(e.pointerId);
    railTarget = fromPointer(e); railS = [[performance.now(), railTarget]]; kick(); e.preventDefault();
  });
  R.addEventListener('pointermove', e => {
    if (!railDrag) return;
    railTarget = fromPointer(e);
    const now = performance.now(); railS.push([now, railTarget]); while (railS.length > 2 && now - railS[0][0] > 120) railS.shift();
  });
  const endRail = () => {
    if (!railDrag) return;
    railDrag = false; R.classList.remove('active');
    // al soltar, sigue patinando con la velocidad que llevaba la mano
    const a = railS[0], b = railS[railS.length - 1], dt = (b[0] - a[0]) / 1000;
    const hand = dt > 0.015 && performance.now() - b[0] < 90 ? (b[1] - a[1]) / dt : 0;
    vel = Math.max(-MAXV, Math.min(MAXV, hand * 0.1 + (railTarget - pos) * ICE));
    ice = true; kick();
  };
  R.addEventListener('pointerup', endRail); R.addEventListener('pointercancel', endRail);
  // ir a un punto deslizando (como un lanzamiento calculado)
  function glideTo(y) { y = clamp(y); vel = (y - pos) * FRICTION; kick(); }
  function ticks(show) {
    wantTicks = show; ticksEl.innerHTML = '';
    if (!show) return;
    const h = track.clientHeight, th = 44; let lastG = 0;
    [...list.children].forEach((li, i) => {
      const g = +li.dataset.g; if (!g || g === lastG) return; lastG = g;
      const y = Math.min(max, Math.max(0, tops[i] - 16));
      const t = document.createElement('div'); t.className = 'rail-tick';
      t.style.top = ((max ? y / max : 0) * (h - th) + th / 2) + 'px';
      t.innerHTML = `<span>GEN ${ROMAN[g]}</span>`;
      t.onpointerdown = e => { e.stopPropagation(); glideTo(y); beep(740, 0.04, 0.02); };
      ticksEl.appendChild(t);
    });
  }
  // tamaño del cuadro: ocupa lo que queda de pantalla
  function size() {
    if (state.scene !== 'dex') return;
    const sc = $('scene-dex');
    const top = sc.getBoundingClientRect().top + scrollY;
    sc.style.setProperty('--dexH', Math.max(360, innerHeight - top - 24) + 'px');
  }
  // solo se animan los Pokémon que se ven
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('on', e.isIntersecting)), { root: view, rootMargin: '120px 0px' }) : null;
  function observe() { if (!io) { for (const li of list.children) li.classList.add('on'); return; } io.disconnect(); for (const li of list.children) if (li.classList.contains('mon')) io.observe(li); }
  function refresh(showTicks, reset) {
    lastIdx = -1;
    if (reset) { pos = 0; vel = 0; }
    size(); measure(); apply(); syncRail(); ticks(showTicks); observe();
  }
  addEventListener('resize', () => { if (state.scene === 'dex') refresh(wantTicks); });
  // los cuadros se miden de verdad al dibujarse (content-visibility): cuando la lista cambia de alto,
  // se vuelve a medir para que el final no quede vacío y la burbuja diga el Pokémon correcto
  if (window.ResizeObserver) {
    let rq = 0;
    new ResizeObserver(() => { if (rq) return; rq = requestAnimationFrame(() => { rq = 0; if (state.scene !== 'dex') return; const was = max; measure(); if (was !== max) { lastIdx = -1; apply(); syncRail(); } }); }).observe(list);
  }
  return { ticks: (show) => refresh(show), refresh, size };
})();
