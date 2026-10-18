// Aventura: reordenar el equipo arrastrando
// ---- Equipo: mantén pulsado (o arrastra con el ratón) para levantar un Pokémon y cambiarlo de hueco ----
(() => {
  const T = $('advTeam'); let d = null, eatClick = false;
  const cancel = () => { if (!d) return; clearTimeout(d.timer); d.w.classList.remove('holding'); d = null; };
  T.addEventListener('click', e => { if (eatClick) { e.stopPropagation(); e.preventDefault(); eatClick = false; } }, true);
  T.addEventListener('pointerdown', e => {
    if (e.button > 0 || e.target.closest('.tm-mv, .tm-tool')) return;
    const w = e.target.closest('.tmw'); if (!w || !run || run.team.length < 2 || advWheel.spinning) return;
    d = { w, id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, on: false, held: false, touch: e.pointerType !== 'mouse' };
    d.timer = setTimeout(() => { if (d && !d.on) { d.held = true; w.classList.add('holding'); beep(440, .04, .02); try { navigator.vibrate && navigator.vibrate(12); } catch (_) {} } }, 260);
  });
  function begin() {
    d.on = true; clearTimeout(d.timer); eatClick = true;
    const w = d.w, r = w.getBoundingClientRect(); d.dx = d.x0 - r.left; d.dy = d.y0 - r.top;
    const g = document.createElement('div'); g.className = 'adv-team tm-ghost'; g.style.width = r.width + 'px'; g.style.height = r.height + 'px';
    g.innerHTML = w.innerHTML; document.body.appendChild(g); d.g = g;
    const h = document.createElement('span'); h.className = 'tm-ghost-hand'; h.textContent = '✊'; document.body.appendChild(h); d.h = h;
    w.classList.remove('holding'); w.classList.add('drag-src'); document.body.classList.add('tm-dragging'); beep(520, .05, .03);
  }
  function follow() {
    d.g.style.left = (d.x - d.dx) + 'px'; d.g.style.top = (d.y - d.dy) + 'px';
    d.h.style.left = d.x + 'px'; d.h.style.top = d.y + 'px';
    // ¿sobre qué hueco está el dedo? (posiciones de maquetación, sin contar las animaciones)
    const tr = T.getBoundingClientRect(), px = d.x - tr.left, py = d.y - tr.top;
    const ws = [...T.querySelectorAll('.tmw')];
    const t = ws.find(el => px >= el.offsetLeft && px < el.offsetLeft + el.offsetWidth && py >= el.offsetTop && py < el.offsetTop + el.offsetHeight);
    if (!t || t === d.w) return;
    const before = flipCapture(T, '.tmw'), a = ws.indexOf(d.w), b = ws.indexOf(t);
    T.insertBefore(d.w, a < b ? t.nextSibling : t);
    flipPlay(T, '.tmw', before, false); tick();
  }
  addEventListener('pointermove', e => {
    if (!d || e.pointerId !== d.id) return; d.x = e.clientX; d.y = e.clientY;
    if (!d.on) {
      if (Math.hypot(d.x - d.x0, d.y - d.y0) < 7) return;
      if (d.touch && !d.held) return cancel();      // en el móvil, sin mantener pulsado la página se desplaza como siempre
      begin();
    }
    e.preventDefault(); follow();
  }, { passive: false });
  addEventListener('touchmove', e => { if (d && (d.on || d.held)) e.preventDefault(); }, { passive: false });
  const up = e => {
    if (!d || (e && e.pointerId !== d.id)) return;
    const g = d; d = null; clearTimeout(g.timer); g.w.classList.remove('holding');
    if (!g.on) return;
    document.body.classList.remove('tm-dragging'); g.h.remove();
    const order = [...T.querySelectorAll('.tmw')].map(el => el._m).filter(Boolean);
    const changed = order.length === run.team.length && order.some((m, i) => m !== run.team[i]);
    if (changed) run.team = order;
    // el Pokémon «aterriza» en su nuevo hueco
    const r = g.w.getBoundingClientRect(), gr = g.g.getBoundingClientRect();
    const fin = () => {
      g.g.remove(); g.w.classList.remove('drag-src'); renderAdv();
      const el = [...T.querySelectorAll('.tmw')].find(x => x._m === g.w._m); if (el) { el.classList.add('landed'); setTimeout(() => el.classList.remove('landed'), 450); }
      if (changed) { beep(660, .05, .03); saveRun(); if (curBattle && advWheel.enabled) curBattle(); }
      setTimeout(() => { eatClick = false; }, 60);
    };
    if (reduceMotion || !g.g.animate) return fin();
    g.g.animate([{ transform: 'none' }, { transform: `translate(${r.left - gr.left}px, ${r.top - gr.top}px)` }], { duration: 170, easing: 'ease-in', fill: 'forwards' }).onfinish = fin;
  };
  addEventListener('pointerup', up); addEventListener('pointercancel', e => up(e));
})();
