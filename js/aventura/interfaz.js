// Aventura: interfaz (diálogo, botones, equipo, mochila, línea de fases, tarjeta del líder)
// los botones de después salen a los 180 ms, mientras el texto se sigue escribiendo (no hay que esperar a que acabe)
function advSay(t, done) { speak(t); typeText($('advText'), t, done, 180); }
// «¡NUEVO!» encima de una ficha: en una capa fija sobre toda la página, así no lo recortan los bordes de las tarjetas,
// y colocado para que nunca se salga de la pantalla
function newTag(el) {
  if (!el.getBoundingClientRect().width) return;
  const t = document.createElement('div'); t.className = 'new-tag'; t.textContent = '¡NUEVO!'; document.body.appendChild(t);
  const w = t.offsetWidth, h = t.offsetHeight, end = performance.now() + 2300;
  // sigue a la ficha mientras dura (la ficha puede estar aún colocándose en su hueco, o desplazarse la lista)
  const place = () => {
    if (!t.isConnected) return;
    if (performance.now() > end || !el.isConnected) return t.remove();
    const r = el.getBoundingClientRect();
    t.style.left = Math.max(6, Math.min(innerWidth - w - 6, r.left + r.width / 2 - w / 2)) + 'px';
    // en las fichas, abajo por dentro; en un botón pequeño (Caja PC), justo encima (o debajo si no cabe)
    const y = r.height >= 60 ? r.bottom - h - 8 : r.top - h - 4 >= 6 ? r.top - h - 4 : r.bottom + 4;
    t.style.top = Math.max(6, Math.min(innerHeight - h - 6, y)) + 'px';
    requestAnimationFrame(place);
  };
  place(); setTimeout(() => t.remove(), 2400);
}
// «Nuevo registro» en la Pokédex: aviso pequeño en la esquina con el dibujo de la Pokédex, sin tapar nada ni recibir toques
// salen de uno en uno (son grandes): cada uno espera a que se vaya el anterior
let dexPopFree = 0;
// (form: la forma exacta que has conseguido: su dibujo, su nombre y sus tipos, p. ej. Articuno de Galar)
function dexPop(n, shiny, wait, form) {
  const at = Math.max(performance.now() + (wait || 0), dexPopFree); dexPopFree = at + 3500;
  setTimeout(() => {
    if (!run) return;
    let box = document.querySelector('.dex-pops'); if (!box) { box = document.createElement('div'); box.className = 'dex-pops'; document.body.appendChild(box); }
    // una Pokédex roja: lente azul y luces arriba, el Pokémon en la pantalla con su nombre y tipos, y los botones abajo
    const m = { n, form: form || 0, shiny }, id = form || n, r = (shiny && SPR.shiny.get(id)) || SPR.normal.get(id) || SPR.normal.get(n), el = document.createElement('div'); el.className = 'dex-pop';
    const ty = mtypes(m).map(t => `<em style="--t:${TYPE_COLORS[t]}">${t.slice(0, 5)}</em>`).join('');
    el.innerHTML = `<div class="dx-top"><i class="dx-lens"></i><i class="dx-led r"></i><i class="dx-led y"></i><i class="dx-led g"></i></div>`
      + `<div class="dx-bezel"><div class="dx-dots"><i></i><i></i></div><div class="dx-screen"><div class="dx-plate"><b>${sname(m)}${shiny ? ' ★' : ''}</b>${ty}</div>`
      + `${r ? `<img src="${r.u}" alt="">` : ''}<small>Nº ${String(n).padStart(3, '0')}</small></div><div class="dx-under"><i></i><i class="dx-grill"></i></div></div>`
      + `<div class="dx-ctrl"><div class="dx-row"><i class="dx-round"></i><i class="dx-pill r"></i><i class="dx-pill b"></i></div><span class="dx-green">Nuevo registro</span><i class="dx-pad"></i></div>`;
    // se puede pulsar: abre su ficha de la Pokédex (con esa forma y, si es shiny, en shiny)
    el.title = 'Ver su ficha en la Pokédex'; el.setAttribute('role', 'button');
    el.onclick = () => { const rr = el.getBoundingClientRect(); el.remove(); withShiny(!!shiny, () => openInfo(n, rr, form || 0, null, true)); };
    box.appendChild(el); beep(1319, .07, .03, 'triangle'); setTimeout(() => beep(1760, .12, .03, 'triangle'), 90);
    setTimeout(() => el.remove(), 3700);
  }, at - performance.now());
}
function advToast(t) { const el = document.createElement('div'); el.className = 'adv-toast'; el.textContent = t; $('advToasts').appendChild(el); setTimeout(() => el.remove(), 3200); }
function advButtons(list) {
  $('advBtns').innerHTML = list.map((b, i) => `<button class="btn${b.ghost ? ' ghostbtn' : ''}" type="button" data-i="${i}"${b.off ? ' disabled' : ''}>${b.label}</button>`).join('');
  // un toque = una acción: los botones desaparecen al pulsar (evita dobles toques)
  $('advBtns').querySelectorAll('button').forEach(el => el.onclick = () => { const f = list[+el.dataset.i].fn; $('advBtns').innerHTML = ''; beep(660); f(); if (advWheel) advWheel.draw(); });
  if (advWheel) advWheel.draw();     // el botón del centro de la ruleta cambia (GIRAR / SEGUIR)
}
// now (opcional): qué está pasando, para la tarjeta de información ({ txt, n, shiny }); si no, se deduce del título
function spinUI(title, sub, segs, center, onLand, now) {
  curBattle = null; $('advPotion').hidden = true;   // la etiqueta de la poción solo se ve en su combate
  advNow = now || nowFrom(title); renderCard();
  $('advStep').textContent = title; $('advRpm').textContent = '';
  advWheel.set(segs, center); advWheel.enabled = true;
  if (advNow && advNow.icon && WHEEL_ICONS[advNow.icon]) { advWheel.centerIcon = WHEEL_ICONS[advNow.icon]; advWheel.draw(); advWheel.idle(); }
  advWheel.onLand = r => { advWheel.enabled = false; onLand(r); renderAdv(); saveRun(); };
  advWheel.onStart = () => { advButtons([]); advSay('Girando…'); renderAdv(); };   // (la megapiedra deja de poder pulsarse)
  advSay(introText ? introText + ' ' + sub : sub); introText = ''; advButtons([{ label: 'Girar', fn: () => advWheel.spin(1) }]);
}
// tarjeta del equipo con el mismo diseño que la Pokédex (fondo, número, sprite, nombre y tipos)
function teamTile(m, i) {
  const [n, , , , leg, myth] = BY_NUM.get(m.n), name = dname(m), ty = mtypes(m), sid = SPR.normal.get(mid(m)) ? mid(m) : n, sp = m.shiny && SPR.shiny.get(sid), pc = sp && sp.pc;
  const c = pc ? pc[0] : TYPE_COLORS[ty[0]] || '#8592ab', c2 = pc ? pc[1] : TYPE_COLORS[ty[1]] || c, no = padN(n);
  const sm = shinyMode; shinyMode = !!m.shiny; const cell = spriteCell(sid, ty); shinyMode = sm;
  return `<span class="tmw${offTile(m) ? ' on-wheel' : ''}"><button class="mon tmon on${FLYING.has(n) ? ' fly' : ''}${m.shiny ? ' shiny' : ''}" type="button" data-n="${n}" data-i="${i}" style="--c:${c};--c2:${c2};--dur:${(2.6 + (n * 37 % 13) / 10).toFixed(1)}s;--del:-${(n * 53 % 30) / 10}s">` +
    `<span class="bg${no.length > 3 ? ' d4' : ''}" aria-hidden="true">${no}</span>` +
    `<span class="top"><span class="no">Nº ${no}</span>${m.shiny ? '<small>✦ SHINY</small>' : leg ? '<small>LEG</small>' : myth ? '<small>SING</small>' : ''}</span>` +
    cell + `<span class="nm">${name}</span><span class="ty">${ty.map(typeIcon).join('')}<em class="pw">P${mpower(m)}</em></span></button>` +
    (run.team.length > 1 ? `<button class="tm-mv" type="button" data-out="${i}" title="Meter en la caja" aria-label="Meter ${name} en la caja">${PC_BOX_SVG}</button>` : '') + toolsHTML(m, i) + `</span>`;
}
// megapiedra y Banda Dinamax equipadas: esquina inferior izquierda de la ficha; en combate brillan y se pueden pulsar
const GEM_SVG = '<svg viewBox="0 0 24 24"><path d="M7 3h10l4 6-9 12L3 9z" class="gem"/><path d="M3 9h18M9 3l3 6 3-6M12 9v12" class="ln"/></svg>';
const DMAX_SVG = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" class="gem"/><path d="M12 6l2 4.5 4.5.5-3.5 3 1 4.5L12 16l-4 2.5 1-4.5-3.5-3 4.5-.5z" class="ln"/></svg>';
// icono de la Banda Dinamax: su dibujo de la carpeta de sprites (si faltara, el dibujado)
const dmaxIcon = () => { const r = SPR.item && SPR.item.get(DMAX_SPR.spr); return r ? `<img class="dmax-img" src="${r.u}" alt="">` : DMAX_SVG; };
// icono de la megapiedra de cada mega (Charizardita X, Lucarita Z…); si faltara, una gema dibujada
const stoneHTML = id => { const r = stoneIcon(id); return r ? `<img class="stone${MEGA_STONES[id][0].startsWith('gen9/') ? '' : ' px'}" src="${r.u}" alt="">` : GEM_SVG; };
function toolsHTML(m, i) {
  const out = [];
  if (m.stone && formRec(m.stone)) { const nm = stoneName(m.stone), live = canTransform('mega', m);
    out.push(`<button class="tm-tool mega${m.tf && m.tf.kind === 'mega' ? ' on' : live ? ' live' : ''}" type="button" data-tool="mega" data-i="${i}" title="${nm}${live ? ': pulsa para megaevolucionar en este giro' : ': úsala en combate'}" aria-label="${nm} de ${name4(m)}">${stoneHTML(m.stone)}</button>`); }
  const live = canTransform('gmax', m);
  if (m.dmax && gmaxForms(m).length) out.push(`<button class="tm-tool dmax${m.tf && m.tf.kind === 'gmax' ? ' on' : live ? ' live' : ''}" type="button" data-tool="gmax" data-i="${i}" title="Banda Dinamax${live ? ': pulsa para gigamaxizarlo en este giro' : ': úsala en combate'}" aria-label="Banda Dinamax de ${name4(m)}">${dmaxIcon()}</button>`);
  return out.length ? `<span class="tm-tools">${out.join('')}</span>` : '';
}
const name4 = m => mname(m).replace(/"/g, '');
// ---- Animación FLIP: los huecos que cambian de sitio se deslizan; los nuevos aparecen con un saltito ----
function flipCapture(root, sel) { const m = new Map(); root.querySelectorAll(sel).forEach(el => { if (el._m) m.set(el._m, el.getBoundingClientRect()); }); return m; }
function flipPlay(root, sel, before, pop) {
  if (reduceMotion || !before.size) return;
  root.querySelectorAll(sel).forEach(el => {
    if (!el._m || !el.animate) return;
    const r0 = before.get(el._m), r1 = el.getBoundingClientRect();
    if (r0) { const dx = r0.left - r1.left, dy = r0.top - r1.top; if (Math.abs(dx) + Math.abs(dy) > 1) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.9,.25,1.12)' }); }
    else if (pop) el.animate([{ transform: 'scale(.55)', opacity: 0 }, { transform: 'scale(1.07)', opacity: 1, offset: .7 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'ease-out' });
  });
}
// dibujos de los objetos de la mochila
const BAG_ICON = {
  potion: '<svg viewBox="0 0 24 24"><rect x="9" y="2.5" width="6" height="3" rx="1" class="cap"/><path d="M9.5 5.5h5v2.2l2.6 3.3c.4.5.6 1.1.6 1.7V19a2.5 2.5 0 0 1-2.5 2.5h-6.4A2.5 2.5 0 0 1 6.3 19v-6.3c0-.6.2-1.2.6-1.7l2.6-3.3z" class="glass"/><path d="M6.6 13.5h10.8V19a2.2 2.2 0 0 1-2.2 2.2H8.8A2.2 2.2 0 0 1 6.6 19z" class="liq"/><path d="M9 11.2h2" class="shine"/></svg>',
  rope: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" class="ln"/><circle cx="12" cy="12" r="4.5" class="ln"/><path d="M19.5 12c0 3-1 6 2 8" class="ln"/></svg>',
  shoes: '<svg viewBox="0 0 24 24"><path d="M3 15.5V9.5l4 1.5 3-3 3 4c2.5.5 6 1.2 7.5 2.6.6.6.5 1.9-.3 1.9H3z" class="liq"/><path d="M3 18.5h18" class="ln"/></svg>',
  share: '<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="3" class="liq"/><text x="12" y="14.6" text-anchor="middle" font-size="6.4" font-weight="700" font-family="monospace" fill="#10131c">EXP</text></svg>',
  ball: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" class="ln"/><path d="M3.5 12h17" class="ln"/><path d="M3.5 12a8.5 8.5 0 0 1 17 0z" class="liq"/><circle cx="12" cy="12" r="2.6" fill="var(--bg)" class="ln"/></svg>',
};
BAG_ICON.super = BAG_ICON.hyper = BAG_ICON.potion;
// icono de un objeto: su sprite si lo hay (pociones, Repartir Exp., Cuerda huida, Ball de Kurt) o el dibujo
function bagIcon(k) {
  const it = k === 'ball' ? BALL_SPR : ITEMS[k], r = it && it.spr && SPR.item && SPR.item.get(it.spr);
  return r ? `<img class="item" src="${r.u}" alt="">` : BAG_ICON[k] || BAG_ICON.potion;
}
// cómo se ve cada fase en la línea: un icono, un nombre corto y qué es
const PH_ICON = {
  home: '<svg viewBox="0 0 24 24"><path d="M4 11l8-6 8 6v8h-5v-5H9v5H4z"/></svg>',
  trail: '<svg viewBox="0 0 24 24"><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6.5a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7H16"/></svg>',
  medal: '<svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="5"/><path d="M8.5 3.5L12 9l3.5-5.5"/></svg>',
  peak: '<svg viewBox="0 0 24 24"><path d="M3 19l6.5-11 4 6.5 2.5-3.5L21 19z"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/></svg>',
  crown: '<svg viewBox="0 0 24 24"><path d="M4 18h16l-1.5-9-4.5 4-2-6-2 6-4.5-4z"/></svg>',
  dot: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/></svg>',
};
const shortPlace = t => (t || '').replace(/^(la|el)\s+/, '').replace(/^(Pueblo|Ciudad|Isla|Villa|Meseta)\s+/, '');
function phaseLook(p) {
  if (p.kind === 'start') return { icon: PH_ICON.home, label: shortPlace(p.name), kind: 'Inicio' };
  if (p.kind === 'leg') return { icon: PH_ICON.trail, label: '→ ' + shortPlace(p.to), kind: 'Camino' };
  if (p.kind === 'prep') return { icon: PH_ICON.peak, label: shortPlace(REG().league || 'Liga').replace(/^(la|el)\s+/, ''), kind: 'Preparación' };
  if (p.kind === 'gym' && p.role === 'champ') return { icon: PH_ICON.crown, label: p.leader, kind: 'Campeón' };
  if (p.kind === 'gym' && p.role === 'elite') return { icon: PH_ICON.star, label: p.leader, kind: 'Alto Mando' };
  if (p.kind === 'gym') { const sp = badgeSpr(p);
    return { icon: sp ? `<img src="${sp.u}" alt="">` : PH_ICON.medal, label: p.leader, kind: REG().trials ? 'Prueba' : 'Gimnasio', tc: TYPE_COLORS[p.typeName] || 'var(--kanto)' }; }
  return { icon: PH_ICON.dot, label: shortPlace(p.name), kind: p.kind === 'route' ? 'Ruta' : p.kind === 'rival' ? 'Rival' : 'Ciudad' };
}
// la ventana de la línea del tiempo se centra en la parada actual (sin pasarse de los extremos)
function placePath() {
  const W = $('advPathWin'), P = $('advPath'), now = P.querySelector('.now') || P.lastElementChild; if (!W || !now) return;
  const w = W.clientWidth, tot = P.scrollWidth, max = Math.max(0, tot - w);
  const off = Math.max(0, Math.min(max, now.offsetLeft + now.offsetWidth / 2 - w / 2));
  P.style.transform = `translateX(${-off}px)`;
  W.style.setProperty('--fl', off > 1 ? '64px' : '0px'); W.style.setProperty('--fr', off < max - 1 ? '64px' : '0px');
}
// ---- La ruleta crece todo lo posible sin que el equipo, las medallas o el diario se salgan de la pantalla ----
// móvil en vertical: pantalla fija (sin desplazarse); móvil en horizontal: el diseño del ordenador, en pequeño
const PHONE_V = '(max-width: 760px) and (orientation: portrait)', PHONE_H = '(orientation: landscape) and (max-height: 520px)';
// alto de verdad de lo que se ve en el móvil (sin la barra del navegador): 100vh la incluye en muchos móviles y
// lo de abajo (el botón de girar) quedaba escondido; la pantalla fija de la aventura usa este alto (--app-h)
{
  const setAppH = () => document.documentElement.style.setProperty('--app-h', Math.round(window.visualViewport ? visualViewport.height : innerHeight) + 'px');
  setAppH(); addEventListener('resize', setAppH); addEventListener('orientationchange', () => setTimeout(setAppH, 250));
  if (window.visualViewport) visualViewport.addEventListener('resize', setAppH);
}
function fitAdv() {
  if (state.scene !== 'adv' || !advWheel) return;
  const st = document.querySelector('.adv-stage'), box = document.querySelector('.adv-wbox'), track = document.querySelector('.adv-track');
  let sz;
  if (matchMedia(PHONE_V).matches) {
    // la ruleta ocupa el hueco que deja todo lo demás: el alto del escenario menos lo de debajo (equipo, texto y botones) y la línea
    // de fases; su caja se ajusta a ella, así lo que sobre queda abajo del todo y el botón de girar siempre se ve
    const cs = getComputedStyle(st), side = st.querySelector('.side'), gap = parseFloat(cs.rowGap) || 0;
    const free = st.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - (side ? side.offsetHeight : 0) - gap;
    sz = Math.min(box.clientWidth * .94, free - track.offsetHeight - 14);
    sz = Math.max(120, Math.floor(sz));
    document.documentElement.style.setProperty('--wsz', sz + 'px'); advWheel.resize(); placePath(); return;
  }
  if (matchMedia(PHONE_H).matches) {
    const cs = getComputedStyle(st), innerH = st.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    sz = Math.min(innerH - track.offsetHeight - 6, st.clientWidth * .5);
    sz = Math.max(140, Math.floor(sz));
    document.documentElement.style.setProperty('--wsz', sz + 'px'); advWheel.resize(); placePath(); return;
  }
  if (matchMedia('(min-width: 900px) and (min-height: 560px)').matches) {
    const cs = getComputedStyle(st);
    const innerH = st.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    sz = Math.min(Math.min(innerH, box.clientWidth, 820) * .75, innerH - 2 * (track.offsetHeight + 6));   // ¾ del hueco, dejando sitio debajo para la línea de fases
  } else if (innerWidth > 760) {
    sz = Math.min(box.clientWidth, 460);
  } else {
    const wheelH = $('advWheel').offsetHeight, lead = $('advLeader').hidden ? 0 : $('advLeader').offsetHeight + 8;
    const bs = getComputedStyle(document.body);
    const rest = document.querySelector('.wrap').getBoundingClientRect().height + parseFloat(bs.paddingTop) + parseFloat(bs.paddingBottom) - wheelH;
    sz = Math.min(box.clientWidth, innerHeight - rest) * .75;   // en el móvil, ¾ del hueco
  }
  sz = Math.max(innerWidth <= 760 ? 200 : 260, Math.floor(sz));
  document.documentElement.style.setProperty('--wsz', sz + 'px');
  advWheel.resize(); placePath();
}
function renderAdv() {
  if (!run) return;
  // línea del tiempo corta: un punto por parada (rombos = gimnasios) y el nombre de la actual debajo
  // (solo se vuelve a dibujar si cambia la parada o la región: renderAdv se llama muchas veces por giro)
  const path = REG().path, cur = path[Math.min(run.step, path.length - 1)];
  const lit = renderAdv.lastStep !== undefined && renderAdv.lastStep !== run.step && run.step > renderAdv.lastStep; renderAdv.lastStep = run.step;
  if (lit && onWheel.size) wheelRelease();   // la próxima ruleta que salga (la de la nueva fase) se cambia con animación
  const pathKey = run.region + ':' + run.step + ':' + path.length + ':' + (run.chaos ? run.chaos.gyms.join() : '');
  if ($('advPath')._k !== pathKey) {
    $('advPath')._k = pathKey;
    $('advPath').innerHTML = path.map((p, i) => { const v = phaseLook(p);
      return `<li class="${i < run.step ? 'ok' : i === run.step ? 'now' + (lit ? ' lit' : '') : ''}${v.tc ? ' gym' : ''}" title="${p.name}"${v.tc ? ` style="--tc:${v.tc}"` : ''}><span class="node">${v.icon}</span><span class="pl">${v.label}</span><span class="pk">${v.kind}</span></li>`; }).join('');
    placePath();
  }
  const slots = [...run.team, ...Array(Math.max(0, 6 - run.team.length)).fill(null)];
  const TM = $('advTeam'), live = canTransform();
  // si el equipo no ha cambiado, no se vuelve a dibujar (así las animaciones de los Pokémon no se reinician)
  const sig = run.team.map(m => [m.n, m.form || 0, m.shiny ? 1 : 0, offTile(m) ? 1 : 0, m.nick || '', m.stone || 0, m.dmax ? 1 : 0, m.tf ? m.tf.kind : ''].join('.')).join('|') + '#' + SPR.normal.size + '.' + SPR.shiny.size + '.' + (run.bag.share ? 1 : 0) + (live ? 'L' : '');
  const same = TM._sig === sig && [...TM.querySelectorAll('.tmw')].every((el, i) => el._m === run.team[i]);
  // mientras arrastras un Pokémon del equipo no se vuelve a dibujar (si no, se vería a la vez en tu mano y en su hueco)
  if (!same && !document.body.classList.contains('tm-dragging')) {
    const before = flipCapture(TM, '.tmw');
    TM.innerHTML = slots.map((m, i) => m ? teamTile(m, i) : '<span class="tm empty"></span>').join('');
    TM.querySelectorAll('.tmw').forEach((el, i) => el._m = run.team[i]);
    flipPlay(TM, '.tmw', before, true); TM._sig = sig;
    TM.querySelectorAll('[data-n]').forEach(b => b.onclick = () => openTeamInfo(+b.dataset.i, b));
    TM.querySelectorAll('[data-out]').forEach(b => b.onclick = () => moveMon(true, +b.dataset.out));
    TM.querySelectorAll('[data-tool]').forEach(b => b.onclick = e => { e.stopPropagation(); transformMon(run.team[+b.dataset.i], b.dataset.tool); });
  }
  const pcb = pcButtonHTML(); if ($('pcOpen')._h !== pcb) { $('pcOpen')._h = pcb; $('pcOpen').innerHTML = pcb; $('pcOpen').setAttribute('aria-label', `Caja PC: ${boxList().length} Pokémon`); }
  if (!$('pcShade').hidden && !document.body.classList.contains('pc-dragging')) renderPC();
  // Pokémon nuevo (capturado, regalado, del huevo, de un intercambio…): como con los objetos, suena un tintineo y su ficha
  // salta con «¡NUEVO!»; si ha ido a la caja, salta el botón de la Caja PC. (El shiny y los legendarios ya tienen su propio sonido.)
  const mine = allMine(), prevM = renderAdv.monRun === run ? renderAdv.mons : null;
  renderAdv.monRun = run; renderAdv.mons = new Set(mine);
  const fresh = prevM ? mine.filter(m => !prevM.has(m)) : [];
  if (fresh.length) {
    if (!fresh.some(m => m.shiny || isLegend(m.n))) monSfx();
    const pop = (el, tag) => { if (!el) return; el.classList.remove('got'); void el.offsetWidth; el.classList.add('got'); setTimeout(() => el.classList.remove('got'), 2300); if (tag) newTag(el); };
    fresh.forEach(m => run.team.includes(m) ? pop([...TM.querySelectorAll('.tmw')].find(x => x._m === m), true) : pop($('pcOpen'), true));
    const tab = $('advTabs') && $('advTabs').querySelector('[data-tab="0"]'); if (tab && tab.offsetParent) pop(tab);
  }
  // especie que no estaba en tu Pokédex: después del «¡NUEVO!», un aviso pequeño con su dibujo y «Nuevo registro»
  // (también al evolucionar a una especie nueva, que no tiene «¡NUEVO!», y entonces sale antes)
  if (dexFresh.size) { const wait = fresh.length ? 1300 : 400; [...dexFresh.values()].forEach((d, i) => dexPop(d.n, d.shiny, wait + i * 900, d.form)); dexFresh.clear(); }
  // mochila: cada objeto en su hueco, con su dibujo y cuántos tienes; las megapiedras, con quién las lleva
  const items = Object.entries(run.bag).filter(([k, v]) => v > 0 && ITEMS[k]);
  const stones = allMine().filter(m => m.stone && formRec(m.stone)), bands = allMine().filter(m => m.dmax && gmaxForms(m).length);
  const bag = (items.map(([k, v]) => `<span class="bag-slot" data-k="${k}" style="--c:${ITEMS[k].color}" title="${ITEMS[k].name}: ${ITEMS[k].desc || ''}"><span class="bag-ico">${bagIcon(k)}</span><span class="bag-nm">${ITEMS[k].name}</span>${v > 1 ? `<b class="bag-n">×${v}</b>` : ''}</span>`).join('')
    + stones.map(m => { const nm = mname({ n: m.n, form: m.stone }), st = stoneName(m.stone); return `<span class="bag-slot gem" data-k="st${m.stone}" style="--c:${TYPE_COLORS[formRec(m.stone)[1][2][0]]}" title="${st} (${nm}), equipada en ${mname(m)}. En combate, púlsala en su ficha para megaevolucionar durante ese giro."><span class="bag-ico">${stoneHTML(m.stone)}</span><span class="bag-nm">${st}</span></span>`; }).join('')
    + (bands.length ? `<span class="bag-slot gem" data-k="dmax" style="--c:#ff2d55" title="Banda Dinamax: ${bands.map(mname).join(', ')}. En combate, púlsala en su ficha para gigamaxizarlo durante ese giro."><span class="bag-ico">${dmaxIcon()}</span><span class="bag-nm">Banda Dinamax</span>${bands.length > 1 ? `<b class="bag-n">×${bands.length}</b>` : ''}</span>` : '')
    + (run.ball ? `<span class="bag-slot buff" data-k="ball" style="--c:#ff5a46" title="Ball de Kurt: +1 quesito verde en la próxima captura"><span class="bag-ico">${bagIcon('ball')}</span><span class="bag-nm">Ball de Kurt</span></span>` : '')
    || '<span class="bag-empty">Mochila vacía</span>')
    + (stolenList().length ? `<span class="bag-note">Robado por el ${VIL().name}: ${stolenList().map(mname).join(', ')}</span>` : '');
  if ($('advBag')._h !== bag) { $('advBag')._h = bag; $('advBag').innerHTML = bag; }
  // objeto nuevo (o uno más de los que ya tenías): suena la fanfarria y su hueco de la mochila salta
  const counts = { ...Object.fromEntries(items), ...Object.fromEntries(stones.map(m => ['st' + m.stone, 1])), dmax: bands.length, ball: run.ball ? 1 : 0 };
  const prev = renderAdv.bagRun === run ? renderAdv.bagCounts : null;
  renderAdv.bagRun = run; renderAdv.bagCounts = counts;
  const got = prev ? Object.keys(counts).filter(k => counts[k] > (prev[k] || 0)) : [];
  if (got.length) {
    itemSfx();
    got.forEach(k => { const el = $('advBag').querySelector(`[data-k="${k}"]`); if (el) { el.classList.remove('got'); void el.offsetWidth; el.classList.add('got'); setTimeout(() => el.classList.remove('got'), 1200); } });
    // en el móvil la mochila va en su pestaña: la pestaña también avisa
    const tab = $('advTabs') && $('advTabs').querySelector('[data-tab="1"]'); if (tab && tab.offsetParent) { tab.classList.remove('got'); void tab.offsetWidth; tab.classList.add('got'); setTimeout(() => tab.classList.remove('got'), 1200); }
  }
  const best = getBest()[run.region];
  $('advPoints').innerHTML = `<b>${run.points}</b><span>pts · ${rank(run.points)}</span>`; $('advPoints').title = `Puntos de la partida · rango ${rank(run.points)}${best ? ` · récord ${best}` : ''}`;
  // estuche de medallas: las 8 de la región; las conseguidas brillan y las que faltan se ven apagadas
  const gyms = REG().path.filter(p => p.badge), bKey = pathKey.split(':')[0] + gyms.map(p => p.badge).join() + '|' + run.badges.join();
  if ($('advBadges')._k !== bKey) {
    $('advBadges')._k = bKey;
    $('advBadges').innerHTML = gyms.map(p => { const got = run.badges.includes(p.badge), sp = badgeSpr(p);
      return `<span class="bdg${got ? ' got' : ''}" title="${p.badge}${got ? '' : ' (por conseguir)'}">${sp ? `<img src="${sp.u}" alt="${p.badge}">` : `<i>◆</i>`}</span>`; }).join('');
  }
  const lg = run.log.join('\n');
  if ($('advLog')._k !== lg) { $('advLog')._k = lg; $('advLog').innerHTML = run.log.map(logHTML).join(''); }
  renderCard();
}

// ---- Diario visual: cada entrada con su icono (el Pokémon del que habla y, en la esquina, el objeto o la acción),
// los puntos como fichas pequeñas y la llegada a cada sitio como separador (cómo se dibuja cada emoji: LOG_ICONS de eventos.js) ----
const LOG_SVG = {
  dmax: DMAX_SVG,
  skull: '<svg viewBox="0 0 24 24"><path d="M12 3a8 8 0 0 0-5 14.2V20h3v-2h4v2h3v-2.8A8 8 0 0 0 12 3z" class="f"/><circle cx="9" cy="11" r="1.8" class="h"/><circle cx="15" cy="11" r="1.8" class="h"/></svg>',
  vs: '<svg viewBox="0 0 24 24"><path d="M4 4l10 10M20 4L10 14M6 16l-2 4M18 16l2 4M8 14l2 2M16 14l-2 2" class="l"/></svg>',
  trade: '<svg viewBox="0 0 24 24"><path d="M4 8h14l-3-3M20 16H6l3 3" class="l"/></svg>',
  alert: '<svg viewBox="0 0 24 24"><path d="M12 3l10 18H2z" class="f"/><path d="M12 10v5M12 18v.5" class="h l"/></svg>',
  multi: '<svg viewBox="0 0 24 24"><path d="M5 12a7 7 0 0 1 12-5l2 2M19 12a7 7 0 0 1-12 5l-2-2M19 4v5h-5M5 20v-5h5" class="l"/></svg>',
  walk: '<svg viewBox="0 0 24 24"><ellipse cx="8" cy="15" rx="2.6" ry="4" class="f"/><ellipse cx="16" cy="9" rx="2.6" ry="4" class="f"/></svg>',
  cave: '<svg viewBox="0 0 24 24"><path d="M2 20l6-12 3 4 3-6 8 14z" class="f"/><path d="M9 20a3 3 0 0 1 6 0" class="h"/></svg>',
};
const itemImg = k => { const r = SPR.item && SPR.item.get(k); return r ? `<img class="px" src="${r.u}" alt="">` : ''; };
let LOG_RX = null, LOG_NAMES = null;
// el Pokémon del que habla una entrada (por su nombre); last: el último que se nombra
function logMon(t, last) {
  if (!LOG_RX) {
    const rows = [...BY_NUM.values()]; LOG_NAMES = new Map(rows.map(r => [r[1], r[0]]));
    const names = rows.map(r => r[1]).sort((a, b) => b.length - a.length).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    LOG_RX = new RegExp(`(?<![\\p{L}])(${names.join('|')})(?![\\p{L}])`, 'gu');
  }
  const ms = [...t.matchAll(LOG_RX)]; return ms.length ? LOG_NAMES.get(ms[last ? ms.length - 1 : 0][1]) : 0;
}
function logHTML(t) {
  // marca invisible del final (logm): la forma exacta, la especie y si es shiny
  const mk = t.match(/⁣(\d+)\.(\d+)(s?)$/); if (mk) t = t.slice(0, mk.index);
  const em0 = (t.match(/^[^\p{L}\p{N}¡¿«(+-]+/u) || [''])[0], em = em0.trim(), tx = t.slice(em0.length);
  const L = LOG_ICONS[em] || { mon: 1 };
  if (L.pts) { const m = tx.match(/^([+-]?\d+) puntos · (.*)$/); if (m) return `<li class="lg pts${+m[1] < 0 ? ' neg' : ''}"><b>${+m[1] > 0 ? '+' : ''}${m[1].replace(/^\+/, '')}</b><span>${m[2]}</span></li>`; }
  if (L.place) return `<li class="lg place" style="--c:${L.c}"><span class="lg-pin">${itemImg(L.spr)}</span><span>${tx}</span></li>`;
  const n = mk ? +mk[2] : L.mon ? logMon(tx, L.mon === 'last') : 0, sh = mk ? !!mk[3] : /★|✦|shiny/i.test(tx), fid = mk ? +mk[1] : n;
  const k = L.item && Object.keys(ITEMS).find(k => tx.includes(ITEMS[k].name)), it = k ? bagIcon(k) : '';
  const deco = it || (L.spr && itemImg(L.spr)) || (L.svg && LOG_SVG[L.svg]) || '';
  const r = n && ((sh && (SPR.shiny.get(fid) || SPR.shiny.get(n))) || SPR.normal.get(fid) || SPR.normal.get(n));
  const main = r ? `<img class="lgm${r.px ? ' px' : ''}" src="${r.u}" alt="">` : deco || `<em>${em || '•'}</em>`;
  // con Pokémon: su icono se puede pulsar para ver su ficha (se abre agrandándose desde ahí)
  const open = r ? ` lg-open" data-n="${n}" data-f="${fid !== n ? fid : 0}" data-sh="${sh ? 1 : 0}" role="button" tabindex="0" title="Ver la ficha de ${pname(n)}` : '';
  return `<li class="lg${L.dim ? ' dim' : ''}${sh ? ' sh' : ''}" style="--c:${L.c || 'var(--cyan)'}"><span class="lg-ic${open}">${main}${r && deco ? `<i class="lg-b">${deco}</i>` : ''}</span><span class="lg-tx">${tx}</span></li>`;
}

// ---- Qué está pasando ahora (la tarjeta de información lo enseña arriba): se pone con cada ruleta y se borra al cambiar de parada ----
let advNow = null;
// rival o villano al que te enfrentas ahora (sus sprites salen como los de los líderes): { sprs: [imágenes] }; se borra al pasar de fase
let advFoe = null;
const setFoe = sprs => { advFoe = sprs && sprs.length ? { sprs } : null; renderCard(); };
// para los momentos sin ruleta (tienda, té, premio, victoria…): la tarjeta dice qué está pasando
function setNow(txt, extra) { advNow = { txt, ...(extra || {}) }; renderCard(); }
// cada suceso escribe en el diario lo que ha pasado: eso mismo sale en la tarjeta (con su Pokémon, si lo hay),
// hasta que la siguiente ruleta diga otra cosa. Los puntos y las llegadas a un sitio no cuentan.
function logNow(t) {
  if (!run || /^(⭐|▼|📍)/.test(t)) return;
  const mk = t.match(/⁣(\d+)\.(\d+)(s?)$/); if (mk) t = t.slice(0, mk.index);
  const em = (t.match(/^[^\p{L}\p{N}¡¿«(+-]+/u) || [''])[0], tx = t.slice(em.length).replace(/\.$/, ''), L = LOG_ICONS[em.trim()] || { mon: 1 };
  const n = mk ? +mk[1] : L.mon ? logMon(tx, L.mon === 'last') : 0, sh = mk ? !!mk[3] : /★|✦|shiny/i.test(tx);
  advNow = { txt: tx, n: n || null, shiny: sh, icon: em.trim() === '✨' && !n ? 'evo' : undefined }; renderCard();
}
// textos de la tarjeta para las ruletas de cada sitio o suceso (lo último del título)
const NOW_PLACES = {
  'Ruleta de evento': () => `¿Qué pasará en ${loc().name}?`, Cueva: 'Explorando la cueva', Pesca: 'Pescando', Robo: '¡Te intentan robar un Pokémon!',
  'Mt. Moon': 'Explorando Mt. Moon', 'S.S. Anne': 'A bordo del S.S. Anne', 'Torre Pokémon': 'En la Torre Pokémon', 'Silph S.A.': 'Asaltando Silph S.A.',
  'Central Energía': 'En la Central Energía', 'Calle Victoria': 'Cruzando la Calle Victoria', 'Bosque Verde': 'Buscando en el Bosque Verde',
  Encinar: 'Buscando en el Encinar', 'Ruta Helada': 'Mirando bajo el hielo', Sudowoodo: '¡Un árbol que se mueve!', Ruleta: 'Jugando en el Casino',
  Snorlax: '¡Un Snorlax bloquea el camino!', 'Casa de Bill': 'En la Casa de Bill', 'Dojo Karate': 'En el Dojo Karate', 'Zona Safari': 'En la Zona Safari',
  'Aparece un legendario': '¡Aparece un legendario!',
};
function nowFrom(title) {
  // a = lo primero («Captura», «Gimnasio»…), b = lo último (el sitio puede llevar « · » dentro: «Rutas 1 · 22 · Pokémon salvaje»)
  const i = title.indexOf(' · '), j = title.lastIndexOf(' · '), a = i < 0 ? title : title.slice(0, i), b = j < 0 ? '' : title.slice(j + 3);
  if (b === 'Pokémon salvaje') return { txt: 'Buscando Pokémon salvajes' };
  if (b === 'Tu primer Pokémon') return { txt: 'Eligiendo tu primer Pokémon' };
  { const m = /^Ruleta de aventura (\d+)\/(\d+)$/.exec(b); if (m) return { txt: `¿Qué pasará por el camino? (${m[1]}/${m[2]})` }; }
  { const k = NOW_PLACES[b] ? b : !b && NOW_PLACES[a] ? a : null; if (k) return { txt: typeof NOW_PLACES[k] === 'function' ? NOW_PLACES[k]() : NOW_PLACES[k] }; }
  if (VILLAINS && Object.values(VILLAINS).some(v => v.name === title)) return { txt: `¡El ${title} aparece!` };
  if (/^(Gimnasio|Alto Mando|Rival|Campe)/.test(a)) return { txt: `Combatiendo contra ${b || a}` };
  switch (a) {
    case 'Captura': return { txt: `Capturando a ${b}` };
    case 'Forma': return { txt: `¿Qué forma tiene ${b}?` };
    case 'Legendario': return { txt: `¡Ha aparecido ${b}!` };
    case 'Evolución': return { txt: b === '¿Quién?' ? '¿Quién evoluciona?' : b === '¿Habrá suerte?' ? '¿Habrá evolución?' : /^Alcremie/.test(b) ? 'Evolucionando a Alcremie' : `Evoluciona ${b}`, icon: 'evo' };
    case 'Repartir Exp.': return { txt: 'Repartir Exp.: ¿quién más evoluciona?', icon: 'evo' };
    case 'Megapiedra': return { txt: 'Repartiendo una megapiedra' };
    case 'Intercambio': return { txt: b === '¿A quién das?' ? 'Intercambio: ¿a quién das?' : 'Intercambio: ¿qué recibes?' };
    case 'Huevo': return { txt: 'Eclosionando un huevo' };
    case 'Objeto': return { txt: 'Buscando un objeto' };
    case 'Guardería': return { txt: 'En la Guardería' };
    case 'Fósil': return { txt: 'Reviviendo un fósil' };
  }
  return { txt: b || a };
}

// ---- Tarjeta del líder: nombre, tipo, debilidades y resistencias (el hueco redondo será su sprite) ----
const TYPES = Object.keys(CHART);
// tipo: su icono en un círculo de su color, como los del filtro de la Pokédex (el nombre, al pasar el ratón y para los lectores de pantalla)
const chip = t => `<span class="lc-ty" style="${typeVars(t)}" title="${t}" role="img" aria-label="${t}">${typeSvg(t)}</span>`;
// sprites de un entrenador en la tarjeta de información: de fondo, el busto grande y tenue; delante (en el móvil), de cuerpo entero.
// ls = sus imágenes (varias si son varios personajes: Vito y Leti, los dos reclutas de un equipo villano…)
function trainerArt(ls) {
  if (!ls.length) return '';
  const imgs = ls.map(u => `<img src="${u}" alt="">`).join('');
  return `<div class="lc-art n${ls.length}${ls.length > 1 ? ' many' : ''}" aria-hidden="true"><span class="lc-big">${imgs}</span><span class="lc-full">${imgs}</span></div>`;
}
function leaderHTML(L) {
  const T = L.typeName, done = (L.badge && run.badges.includes(L.badge)) || run.stepDone;
  const weak = TYPES.filter(t => eff(t, [T]) > 1);       // tipos que le hacen mucho daño
  const danger = TYPES.filter(d => eff(T, [d]) > 1);     // tipos que sufren con sus ataques
  const role = L.role === 'elite' ? 'Alto Mando' : L.role === 'champ' ? (/^Campeona/.test(L.name) ? 'Campeona' : 'Campeón') : REG().trials ? (/^Gran/.test(L.name) ? 'Kahuna' : 'Capitán') : `Líder · ${L.name}`;
  // con los líderes, el círculo enseña siempre su medalla (más adelante, el sprite del personaje), nunca un Pokémon
  const bsp = badgeSpr(L), N = advNow, ni = null;
  // su sprite (Líderes, Alto Mando y Campeones): de fondo, de medio cuerpo para arriba, grande y tenue, abajo a la derecha;
  // y encima, de cuerpo entero
  // (si son varios personajes, como Vito y Leti, salen todos juntos, un poco montados uno sobre otro)
  const art = trainerArt(leaderSprs(L.leader));
  return { c: TYPE_COLORS[T], html: `${art}<div class="lc-spr${ni ? ' lc-mon' : bsp ? ' medal' : ''}">${ni || phaseLook(L).icon}</div>
    <div class="lc-top">${N ? nowLine(N) : `<small>${role}${done ? ' · ✓ derrotado' : ''}</small>`}<b>${L.leader}</b><div>${chip(T)}</div></div>
    <div class="lc-rows">${N && N.mons ? monsRow(N) : `
      <div class="lc-row"><em>Tienen ventaja los</em>${weak.map(chip).join('') || '—'}</div>
      <div class="lc-row"><em>Tienen desventaja los</em>${danger.map(chip).join('') || '—'}</div>
      <div class="lc-row lc-team">${teamMarks(L.rivalStarter ? [...L.team, evoAt(rivalStarter(), 2)] : L.team, T)}</div>`}
    </div>` };
}
// en las ruletas de evolución: los Pokémon que pueden evolucionar (o el que va a evolucionar), con su sprite y su nombre
function monsRow(N) {
  if (!N.mons.length) return '<div class="lc-row lc-mons"><em>Nadie de tu equipo puede evolucionar</em></div>';
  return `<div class="lc-row lc-mons"><em>${N.mons.length > 1 ? 'Pueden evolucionar' : 'Evoluciona'}</em>${N.mons.map(m => { const r = monSprite(m);
    return `<span class="lc-mon-chip${m.shiny ? ' shiny' : ''}" style="--tc:${TYPE_COLORS[mtypes(m)[0]] || '#8592ab'}">${r ? `<img src="${r.u}" alt=""${r.px ? ' class="px"' : ''}>` : ''}${dname(m)}</span>`; }).join('')}</div>`;
}
// tus Pokémon contra el TIPO del líder (el de su gimnasio, con la tabla de tipos completa):
//   ▼ si el tipo del líder le pega fuerte: eff(T, sus tipos) > 1 (▼▼ si es ×4)
//   ▲ si alguno de sus tipos le pega fuerte al tipo del líder: eff(su tipo, [T]) > 1
//   · si no (resistir, como Planta contra Eléctrico, cuenta como neutro)
// Ojo: el combate sí mira los tipos reales de cada Pokémon del rival (los Emolga de Camila son también Volador).
function teamMarks(foe, T) {
  if (!run.team.length) return '';
  return '<em>Tu equipo</em>' + run.team.map(m => { const my = mtypes(m), hit = eff(T, my), mine = bestHit(my, [T]);
    const d = hit >= 4 ? 2 : hit > 1 ? 1 : 0, a = mine > 1 ? 1 : 0;
    const tip = `${mname(m)} (${my.join('/')}): el tipo ${T} le hace ${xTxt(hit)} · sus ataques le hacen ${xTxt(mine)}`;
    return `<span class="lmark ${a && !d ? 'up' : d && !a ? 'down' : a && d ? 'mix' : ''}" title="${tip}">${mname(m)} ${'▲'.repeat(a)}${'▼'.repeat(d)}${!a && !d ? '·' : ''}</span>`; }).join('');
}
// sprite del Pokémon de lo que está pasando (el que intentas capturar, el que evoluciona, el as del rival…)
const nowImg = N => { const r = N && N.n && ((N.shiny && SPR.shiny.get(N.n)) || SPR.normal.get(N.n)); return r ? `<img src="${r.u}" alt=""${r.px ? '' : ' class="hd"'}>` : null; };
// línea de «ahora»: un punto que late y el texto (en la tarjeta del líder, lo que pasa; en el camino, dónde estás)
const nowLine = (N, where) => `<small class="lc-now"><i></i>${where || N.txt}</small>`;
// tarjeta de contexto (siempre del mismo tamaño): líder en los combates, y en el camino adónde vas y qué hay
function renderCard() {
  const el = $('advLeader'); if (!el || !run) return;
  const L = loc(), P = REG().path, nextGym = P.slice(run.step).find(p => p.kind === 'gym');
  let c = 'var(--cyan)', html;
  if (L.kind === 'gym') ({ c, html } = leaderHTML(L));
  else {
    const kind = { leg: 'Camino', prep: 'Preparación', start: 'Inicio', route: 'Ruta', city: 'Ciudad', rival: 'Rival' }[L.kind] || '';
    const places = (L.local || []).map(k => `<span class="lchip" style="--tc:#ff9f43">${EVENTS[k].label}</span>`).join('');
    // lo que está pasando va en grande (Capturando a Pikachu…) y el sitio, encima en pequeño
    const N = advNow, ni = nowImg(N) || (N && N.icon === 'evo' ? EVO_SVG : null);
    // de fondo, abajo a la derecha, grande y tenue: el Pokémon de lo que está pasando (el que capturas, el que evoluciona…)
    // o, si no hay ninguno, el icono de la fase (camino, ciudad, inicio…)
    const deco = nowImg(N) ? `<span class="lc-bigmon">${nowImg(N)}</span>` : `<span class="lc-bigico">${N && N.icon === 'evo' ? EVO_SVG : phaseLook(L).icon}</span>`;
    // (contra un rival o un villano, sus sprites como los de los líderes; si no, la decoración de la fase)
    html = `${advFoe ? trainerArt(advFoe.sprs) : `<div class="lc-art lc-deco" aria-hidden="true">${deco}</div>`}<div class="lc-spr${ni ? ' lc-mon' : ''}${N && N.icon && !nowImg(N) ? ' lc-ico' : ''}">${ni || phaseLook(L).icon}</div>
      <div class="lc-top">${N ? `${nowLine(N, `${kind} · ${L.name}`)}<b class="lc-doing">${N.txt}</b>` : `<small>${kind}${L.to ? ' · hacia ' + L.to : ''}</small><b>${L.name}</b>`}</div>
      <div class="lc-rows">
        ${N && N.mons ? monsRow(N) : ''}
        ${L.local && !(N && N.mons) ? `<div class="lc-row"><em>Sitios</em>${places || '—'}</div>` : ''}
        ${nextGym ? `<div class="lc-row"><em>Próximo</em><span class="lc-txt">${nextGym.role === 'elite' ? 'Alto Mando · ' : nextGym.role === 'champ' ? 'Campeón · ' : ''}${nextGym.leader}</span>${chip(nextGym.typeName)}</div>` : ''}
        <div class="lc-row"><em>Medallas</em><span class="lc-txt">${run.badges.length} / 8</span></div>
      </div>`;
  }
  el.style.setProperty('--c', c); el.hidden = false;
  if (el._h !== html) { el._h = html; el.innerHTML = html; groundSprites(el.querySelector('.lc-full')); }   // (renderAdv la llama mucho: solo se redibuja si cambia)
  // en el ordenador, el líder (Alto Mando, Campeón…) de cuerpo entero abajo a la derecha del escenario, sobre una peana de luz
  const fig = $('advLeadFig');
  if (fig) {
    const ls = L.kind === 'gym' ? leaderSprs(L.leader) : advFoe ? advFoe.sprs : [], fh = ls.length ? `<span class="lf-glow"></span><span class="lf-row n${ls.length}">${ls.map(u => `<img src="${u}" alt="">`).join('')}</span>` : '';
    fig.style.setProperty('--c', c); fig.hidden = !ls.length; fig.dataset.n = ls.length;
    if (fig._h !== fh) { fig._h = fh; fig.innerHTML = fh; groundSprites(fig.querySelector('.lf-row'), fig.querySelector('.lf-glow')); }
  }
  // pestaña del móvil: un botón redondo con icono (medalla en los combates de gimnasio y liga, mapa en el resto); el nombre, para los lectores de pantalla
  const lt = $('leadTab');
  if (lt) {
    const name = L.kind === 'gym' ? (L.role === 'elite' ? 'Alto Mando' : L.role === 'champ' ? 'Campeón' : REG().trials ? 'Prueba' : 'Líder') : L.kind === 'leg' ? 'Ruta' : L.kind === 'prep' ? 'Meseta' : 'Zona';
    const h = `<span class="tab-ico">${L.kind === 'gym' ? LEAD_SVG.gym : LEAD_SVG.map}</span><span class="t">${name}</span>`;
    if (lt._h !== h) { lt._h = h; lt.innerHTML = h; lt.title = name; lt.setAttribute('aria-label', name); }
  }
}
// Sprites de entrenadores con los pies en el suelo: cada imagen trae un hueco transparente distinto debajo de los pies (y su figura
// no siempre está centrada). Se mide una vez por imagen (último píxel visible y centro de la figura) y se baja cada sprite lo justo
// (--fy); con uno solo, la peana se centra bajo sus pies. Sirve igual para los grupos (cada personaje con su medida).
const trainerFeet = new Map();
function feetOf(im) {
  if (trainerFeet.has(im.src)) return trainerFeet.get(im.src);
  const w = im.naturalWidth, h = im.naturalHeight, out = { fb: 0, fx: .5 };
  try {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, w, h).data; let maxY = -1, minX = w, maxX = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { maxY = y; if (x < minX) minX = x; if (x > maxX) maxX = x; }
    if (maxY >= 0) { out.fb = 1 - (maxY + 1) / h; out.fx = (minX + maxX + 1) / 2 / w; }
  } catch (e) {}
  trainerFeet.set(im.src, out); return out;
}
function groundSprites(row, glow) {
  if (!row) return;
  const imgs = [...row.querySelectorAll('img')];
  const go = () => {
    if (!imgs.every(im => im.complete && im.naturalWidth)) return;
    const ft = imgs.map(feetOf);
    imgs.forEach((im, i) => im.style.setProperty('--fy', (ft[i].fb * 100).toFixed(2) + '%'));
    if (glow && imgs.length === 1) glow.style.setProperty('--gx', ((ft[0].fx - .5) / 1.2 * 100).toFixed(2) + '%');
  };
  imgs.forEach(im => { if (!(im.complete && im.naturalWidth)) im.addEventListener('load', go, { once: true }); });
  go();
}
const LEAD_SVG = {
  gym: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2.5h8l-2 6h-4z" fill="#ff5a46" stroke="#10131c" stroke-width=".9"/><circle cx="12" cy="15" r="6.5" fill="#ffd84a" stroke="#10131c" stroke-width="1.1"/><path d="M12 11.2l1.2 2.5 2.7.3-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.3z" fill="#fff6c8" stroke="#b08a10" stroke-width=".6"/></svg>',
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6l6-2.5 6 2.5 6-2.5v14.5l-6 2.5-6-2.5-6 2.5z" fill="#7ee0a1" stroke="#10131c" stroke-width="1.1" stroke-linejoin="round"/><path d="M9 3.5v14.5M15 6v14.5" stroke="#10131c" stroke-width=".9" opacity=".6"/><circle cx="12" cy="10" r="2.6" fill="#ff5a46" stroke="#10131c" stroke-width=".9"/></svg>',
};

// ---- Diario: pulsar el Pokémon de una entrada abre su ficha (agrandándose desde su icono, y vuelve a él al cerrarla) ----
(() => {
  const openLog = el => {
    const n = +el.dataset.n; if (!n || infoOpen) return;
    beep(820, .05, .03); infoNav = null; infoHome = null; infoOrigin = el;
    withShiny(el.dataset.sh === '1', () => openInfo(n, el.getBoundingClientRect(), +el.dataset.f || 0, null, true));   // con su forma (Vivillon Polar, Raichu de Alola…)
  };
  $('advLog').addEventListener('click', e => { const el = e.target.closest('.lg-open'); if (el) openLog(el); });
  $('advLog').addEventListener('keydown', e => { const el = e.target.closest('.lg-open'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openLog(el); } });
})();
