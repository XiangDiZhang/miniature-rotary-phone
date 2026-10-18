// Aventura: Caja PC (mover Pokémon entre el equipo y la caja)
// mover Pokémon entre equipo y caja (no mientras gira la ruleta); si hay un combate a punto, se recalculan los quesitos

function moveMon(toBox, i) {
  if (advWheel.spinning) return;
  if (toBox) { if (run.team.length <= 1) return; boxAdd(run.team.splice(i, 1)[0]); }
  else { if (run.team.length >= 6 || !run.box[i]) return; run.team.push(run.box[i]); run.box[i] = null; }
  beep(520); renderAdv(); saveRun();
  if (curBattle && advWheel.enabled) curBattle();
}

// icono de la Caja PC: una caja de almacenamiento con el emblema de la Poké Ball (no hay sprite oficial en la carpeta de sprites)
const PC_BOX_SVG = '<svg class="pcbox" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9h17v10.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" class="bx"/><path d="M2.5 5.2h19a.8.8 0 0 1 .8.8v2.6a.4.4 0 0 1-.4.4H2.1a.4.4 0 0 1-.4-.4V6a.8.8 0 0 1 .8-.8z" class="lid"/><path d="M9.5 7.1h5" class="hd"/>'
  + '<path d="M8.2 15a3.8 3.8 0 0 1 7.6 0z" fill="#ff5a46"/><path d="M8.2 15a3.8 3.8 0 0 0 7.6 0z" fill="#f4f6fb"/><path d="M8.2 15h7.6" stroke="#10131c" stroke-width="1.1"/><circle cx="12" cy="15" r="1.3" fill="#f4f6fb" stroke="#10131c" stroke-width="1"/></svg>';
// botón de la caja (en la tarjeta del equipo): icono, cuántos hay y los tres primeros que guardas, en miniatura
function pcButtonHTML() {
  const list = boxList(), peek = list.slice(0, 3).map(m => { const r = monSprite(m); return r ? `<img src="${r.u}" alt=""${r.px ? ' class="px"' : ''}>` : ''; }).join('');
  return `${PC_BOX_SVG}<span class="pc-lbl">Caja PC</span><b class="pc-n">${list.length}</b>${peek ? `<span class="pc-peek">${peek}</span>` : ''}`;
}

// ---- Ventana de la Caja PC: arrastrar (ratón o dedo) o tocar origen y destino ----
let pcSel = null;
const pcGet = (w, i) => w === 'team' ? run.team[i] : run.box[i];
function pcSlot(w, i) {
  const m = pcGet(w, i);
  const ty = m ? mtypes(m) : [];
  const no = m ? padN(m.n) : '';
  return `<div class="pc-slot${m ? '' : ' empty'}${m && m.shiny ? ' shiny' : ''}${pcSel && pcSel.w === w && pcSel.i === i ? ' sel' : ''}" data-w="${w}" data-i="${i}"${m ? ` title="${dname(m)}" style="--c:${TYPE_COLORS[ty[0]]};--c2:${TYPE_COLORS[ty[1] || ty[0]]}"` : ''}>${m ? `<span class="pc-bg${no.length > 3 ? ' d4' : ''}" aria-hidden="true">${no}</span><span class="pc-no">Nº ${no}</span><span class="pc-ty">${ty.map(typeIcon).join('')}</span>` + monThumb(m) + `<small>${dname(m)}</small>` : ''}</div>`;
}
function renderPC() {
  normBox();
  const P = $('pcShade'), before = P.hidden ? new Map() : flipCapture(P, '.pc-slot');
  $('pcTeam').innerHTML = Array.from({ length: 6 }, (_, i) => pcSlot('team', i)).join('');
  $('pcBox').innerHTML = Array.from({ length: run.box.length }, (_, i) => pcSlot('box', i)).join('');
  P.querySelectorAll('.pc-slot').forEach(el => el._m = pcGet(el.dataset.w, +el.dataset.i) || null);
  flipPlay(P, '.pc-slot', before, false);
  $('pcCount').textContent = `EQUIPO ${run.team.length}/6 · CAJA ${boxList().length}/${run.box.length}`;
}
function pcMove(a, b) {
  if (!a || !b || (a.w === b.w && a.i === b.i) || advWheel.spinning) return false;
  const A = pcGet(a.w, a.i), B = pcGet(b.w, b.i); if (!A) return false;
  if (a.w === 'team' && b.w === 'team') { if (B) [run.team[a.i], run.team[b.i]] = [B, A]; else { run.team.splice(a.i, 1); run.team.push(A); } }
  else if (a.w === 'box' && b.w === 'box') { run.box[a.i] = B || null; run.box[b.i] = A; }
  else if (a.w === 'team') {          // del equipo a la caja
    if (B) { run.team[a.i] = B; run.box[b.i] = A; }
    else { if (run.team.length <= 1) { advToast('Tu equipo necesita al menos un Pokémon'); return false; } run.team.splice(a.i, 1); run.box[b.i] = A; }
  } else {                            // de la caja al equipo
    if (B) { run.team[b.i] = A; run.box[a.i] = B; }
    else { if (run.team.length >= 6) return false; run.team.push(A); run.box[a.i] = null; }
  }
  beep(520); saveRun(); renderAdv(); renderPC();
  if (curBattle && advWheel.enabled) curBattle();      // los quesitos del combate se recalculan
  return true;
}
function openPC() { pcSel = null; renderPC(); $('pcShade').hidden = false; beep(660, .05, .03); }
function closePC() { $('pcShade').hidden = true; pcSel = null; }
(() => {
  // misma sensación que en el equipo: lo levantas (se inclina y lo sostiene una mano), el otro Pokémon se aparta hacia tu hueco y al soltar aterriza con un rebote
  let d = null;
  const slotAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.closest('.pc-slot'); };
  const key = el => el && { w: el.dataset.w, i: +el.dataset.i };
  const clearPrev = () => { if (!d || !d.over) return; d.over.classList.remove('over', 'swap-prev'); d.over.style.removeProperty('--dx'); d.over.style.removeProperty('--dy'); };
  $('pcShade').addEventListener('pointerdown', e => {
    if (e.target === $('pcShade')) return closePC();
    const el = e.target.closest('.pc-slot'); if (!el || e.button > 0) return;
    d = { el, from: key(el), x0: e.clientX, y0: e.clientY, on: false, id: e.pointerId, over: null };
    if (pcGet(d.from.w, d.from.i)) d.timer = setTimeout(() => { if (d && !d.on) { d.el.classList.add('holding'); beep(440, .04, .02); try { navigator.vibrate && navigator.vibrate(12); } catch (_) {} } }, 240);
  });
  addEventListener('pointermove', e => {
    if (!d || e.pointerId !== d.id) return;
    if (!d.on) {
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 6 || !pcGet(d.from.w, d.from.i)) return;
      d.on = true; clearTimeout(d.timer); d.el.classList.remove('holding'); d.el.classList.add('src'); document.body.classList.add('pc-dragging');
      const r = d.el.getBoundingClientRect(); d.dx = d.x0 - r.left; d.dy = d.y0 - r.top;
      d.ghost = document.createElement('div'); d.ghost.className = d.el.className.replace(/\b(src|sel|holding|over)\b/g, '') + ' pc-lift';
      d.ghost.setAttribute('style', (d.el.getAttribute('style') || '') + `;width:${r.width}px;height:${r.height}px`); d.ghost.innerHTML = d.el.innerHTML; document.body.appendChild(d.ghost);
      d.hand = document.createElement('span'); d.hand.className = 'tm-ghost-hand'; d.hand.textContent = '✊'; document.body.appendChild(d.hand); beep(520, .05, .03);
    }
    d.ghost.style.left = (e.clientX - d.dx) + 'px'; d.ghost.style.top = (e.clientY - d.dy) + 'px';
    d.hand.style.left = e.clientX + 'px'; d.hand.style.top = e.clientY + 'px';
    const o = slotAt(e.clientX, e.clientY);
    if (o !== d.over) {
      clearPrev(); d.over = o;
      if (o && o !== d.el) {
        o.classList.add('over'); tick();
        // el que estaba ahí se aparta hacia tu hueco (vista previa del intercambio)
        if (pcGet(o.dataset.w, +o.dataset.i)) { const a = o.getBoundingClientRect(), b = d.el.getBoundingClientRect(); o.style.setProperty('--dx', (b.left - a.left) + 'px'); o.style.setProperty('--dy', (b.top - a.top) + 'px'); o.classList.add('swap-prev'); }
      }
    }
    e.preventDefault();
  }, { passive: false });
  const up = e => {
    if (!d || (e && e.pointerId !== d.id)) return; const g = d; clearTimeout(g.timer); g.el.classList.remove('holding');
    if (g.on) {
      const target = g.over && g.over !== g.el ? g.over : g.el, tr = target.getBoundingClientRect(), gr = g.ghost.getBoundingClientRect();
      clearPrev(); d = null; g.hand.remove(); document.body.classList.remove('pc-dragging');
      const A = pcGet(g.from.w, g.from.i);
      const toK = g.over && g.over !== g.el ? key(g.over) : null;
      if (toK && g.from.w === 'team' && toK.w === 'box' && !pcGet(toK.w, toK.i) && run.team.length <= 1) {
        // tu único Pokémon no puede irse a la caja: tiembla en rojo y vuelve a su hueco del equipo
        const sr = g.el.getBoundingClientRect(); g.ghost.classList.add('pc-err'); beep(180, .2, .05, 'square'); advToast('Tu equipo necesita al menos un Pokémon');
        const back = () => { g.ghost.remove(); g.el.classList.remove('src'); renderPC(); const el = [...$('pcShade').querySelectorAll('.pc-slot')].find(x => x._m === A); if (el) { el.classList.add('landed'); setTimeout(() => el.classList.remove('landed'), 450); } };
        if (reduceMotion || !g.ghost.animate) return back();
        const base = `translate(${tr.left - gr.left}px, ${tr.top - gr.top}px)`;
        g.ghost.animate([{ transform: 'scale(1.08) rotate(-3deg)' }, { transform: base + ' scale(1)' }, { transform: base + ' translateX(-10px) rotate(-4deg)' }, { transform: base + ' translateX(10px) rotate(4deg)' }, { transform: base + ' translateX(-7px)' }, { transform: base + ' translateX(5px)' }, { transform: base }],
          { duration: 520, easing: 'ease-in-out', fill: 'forwards' }).onfinish = () =>
          g.ghost.animate([{ transform: base }, { transform: `translate(${sr.left - gr.left}px, ${sr.top - gr.top - 40}px) scale(1.05)`, offset: .55 }, { transform: `translate(${sr.left - gr.left}px, ${sr.top - gr.top}px)` }], { duration: 480, easing: 'cubic-bezier(.3,.6,.35,1)', fill: 'forwards' }).onfinish = back;
        return;
      }
      const fin = () => {
        g.ghost.remove(); g.el.classList.remove('src');
        const to = g.over && g.over !== g.el ? key(g.over) : null, moved = to && pcMove(g.from, to);
        pcSel = null; renderPC();
        const el = [...$('pcShade').querySelectorAll('.pc-slot')].find(x => x._m && x._m === A);
        if (el) { el.classList.add('landed'); setTimeout(() => el.classList.remove('landed'), 450); }
      };
      if (reduceMotion || !g.ghost.animate) return fin();
      g.ghost.animate([{ transform: 'scale(1.08) rotate(-3deg)' }, { transform: `translate(${tr.left - gr.left}px, ${tr.top - gr.top}px) scale(1) rotate(0)` }], { duration: 180, easing: 'ease-in', fill: 'forwards' }).onfinish = fin;
      return;
    }
    d = null;
    // toque: elegir origen y luego destino
    const m = pcGet(g.from.w, g.from.i);
    if (pcSel) { const moved = pcMove(pcSel, g.from); pcSel = moved || !m ? null : g.from; renderPC(); }
    else if (m) { pcSel = g.from; renderPC(); }
  };
  addEventListener('pointerup', up); addEventListener('pointercancel', () => up());
  $('pcOpen').onclick = openPC; $('pcClose').onclick = closePC;
  $('pcShade').querySelector('.pc-ico').innerHTML = PC_BOX_SVG;
  const tag = $('pcShade').querySelector('.pc-tag.box'); if (tag) tag.insertAdjacentHTML('afterbegin', `<i class="pc-tag-ico">${PC_BOX_SVG}</i>`);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !$('pcShade').hidden) { e.stopImmediatePropagation(); closePC(); } }, true);
})();
