// Ficha de cada Pokémon: datos, evoluciones, formas, navegación y mote
const STAT_NAMES = ['PS', 'Ataque', 'Defensa', 'At. Esp.', 'Def. Esp.', 'Velocidad'];
const tchip = t => `<span class="tchip" style="${typeVars(t)}">${typeIcon(t)}${t}</span>`;
let infoOpen = false, infoN = 0;
function statColor(v) { return v < 50 ? '#ff6b5e' : v < 70 ? '#ffa24c' : v < 90 ? '#f2cf4e' : v < 110 ? '#7fd36b' : v < 135 ? '#3fd0a8' : '#5ab8ff'; }
function spriteRec(n) { return (shinyMode && SPR.shiny.get(n)) || SPR.normal.get(n); }
function thumb(n, tyOverride) {
  const r = spriteRec(n), ty = tyOverride || BY_NUM.get(n)[3];
  return r ? `<img src="${r.u}" alt=""${r.px ? ' class="px"' : ''}>` : typePh(ty);
}
// Línea evolutiva completa: cada especie de la línea con TODAS sus variantes debajo (megas, Gigamax, formas regionales y otras formas),
// estés en la ficha que estés. Se ve con el mismo aspecto que la ficha abierta (si la ficha es shiny, toda la línea es shiny).
const VAR_TAG = { mega: 'MEGA', gmax: 'GMAX', reg: '', form: '' };
function evoHTML(n, formId) {
  const ids = CHAINS.get(INFO[n - 1][12]);
  const kids = id => ids.filter(k => INFO[k - 1][13] === id);
  const roots = ids.filter(k => !INFO[k - 1][13] || !ids.includes(INFO[k - 1][13]));
  const variants = id => {
    const l = FORMS[id] || []; if (!l.length) return '';
    const own = dexHas(id), many = l.length > 8;
    return `<div class="evo-vars${many ? ' many' : ''}">${l.map(f => { const lb = formLabel(id, f), tag = VAR_TAG[f[8]] || '';
      return own ? `<button class="evo-var${id === n && f[0] === formId ? ' cur' : ''}" type="button" data-go="${id}" data-form="${f[0]}" title="${lb}"><span class="th">${thumb(f[0], f[2])}</span>${many ? '' : `<span class="vl">${tag ? `<b>${tag}</b>` : ''}${lb.replace(/^Mega-|^Gigantamax |\s*Gigamax$/g, '')}</span>`}</button>`
        : `<button class="evo-var locked" type="button" disabled title="???"><span class="th">${thumb(f[0], f[2])}</span></button>`; }).join('')}</div>`;
  };
  const card = id => `<div class="evo-node">${dexHas(id) ? `<button class="evo-card${id === n && !formId ? ' cur' : ''}" type="button" data-go="${id}" data-form="0"><span class="th">${thumb(id)}</span><span class="tx">${baseFormName(id)}<small>Nº ${padN(id)}</small></span></button>`
    : `<button class="evo-card locked" type="button" disabled><span class="th">${thumb(id)}</span><span class="tx">???<small>Nº ${padN(id)}</small></span></button>`}${variants(id)}</div>`;
  if (ids.length < 2) return (FORMS[n] || []).length ? `<p class="empty-note">No evoluciona, pero tiene ${FORMS[n].length > 1 ? 'estas variantes' : 'esta variante'}:</p><div class="evo">${card(n)}</div>` : '<p class="empty-note">No evoluciona.</p>';
  // por etapas (columnas); cada evolución lleva al lado cómo se consigue
  let stage = roots, html = '', first = true;
  while (stage.length) {
    html += `<div class="evo-col">${stage.map(id => first ? card(id) : `<div class="evo-step"><span class="evo-m">${INFO[id - 1][14] || '—'}</span>${card(id)}</div>`).join('')}</div>`;
    first = false;
    stage = stage.flatMap(kids);
  }
  return `<div class="evo">${html}</div>`;
}
function effHTML(types) {
  const mult = {};
  Object.keys(CHART).forEach(att => { mult[att] = types.reduce((m, d) => m * (CHART[att][d] ?? 1), 1); });
  const groups = [['x4', 'x4', 4], ['x2', 'x2', 2], ['h', '×½', .5], ['q', '×¼', .25], ['z', '×0', 0]];
  const rows = groups.map(([cls, label, v]) => { const l = Object.keys(mult).filter(t => mult[t] === v); return l.length ? `<div class="eff-row ${cls}"><b>${label}</b><div class="chips2">${l.map(tchip).join('')}</div></div>` : ''; }).join('');
  return `<div class="eff">${rows}</div>`;
}
function formLabel(n, f) {
  const base = BY_NUM.get(n)[1];
  if (f[8] === 'gmax') return f[1].startsWith(base) && !f[1].startsWith('Gigantamax') ? f[1] : base + ' Gigamax';
  const reg = f[1].match(/^Forma de (Alola|Galar|Hisui|Paldea)$/); if (reg) return `${base} de ${reg[1]}`;
  return /^(Forma|Tronco|Modo|Talla|Estilo|Plumaje|Patrón)/.test(f[1]) || !f[1].includes(base) ? `${base} · ${f[1]}` : f[1];
}
// mote: en la ficha de uno de tus Pokémon de la partida puedes ponerle (o quitarle) un nombre
// (sin < > & ", porque el mote se pinta dentro del HTML del equipo, la caja y el historial)
function nickUI(m) {
  const h = $('infoName'); if (!h || !m) return;
  h.textContent = dname(m);
  const box = document.createElement('div'); box.className = 'nick-box';
  const draw = () => {
    box.innerHTML = `${m.nick ? `<span class="nick-sp">${sname(m)}</span>` : ''}<button class="mini-btn" type="button">✎ ${m.nick ? 'Cambiar mote' : 'Ponerle mote'}</button>`;
    box.querySelector('button').onclick = e => { e.stopPropagation(); edit(); };
  };
  const edit = () => {
    box.innerHTML = `<input class="nick-in" maxlength="14" placeholder="${sname(m)}" value="${(m.nick || '').replace(/"/g, '&quot;')}"><button class="mini-btn on" type="button">OK</button>`;
    const inp = box.querySelector('input'), ok = () => { const v = inp.value.replace(/[<>&"]/g, '').trim().slice(0, 14); m.nick = v && v !== sname(m) ? v : undefined; if (!m.nick) delete m.nick;
      h.textContent = dname(m); draw(); saveRun(); renderAdv(); beep(880, .06, .03); };
    inp.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter') ok(); if (e.key === 'Escape') draw(); };
    inp.onpointerdown = e => e.stopPropagation();
    box.querySelector('button').onclick = e => { e.stopPropagation(); ok(); };
    inp.focus(); inp.select();
  };
  draw(); h.after(box);
}
// el foco de la ficha cruza todo el fondo en diagonal: nace arriba a la derecha y se abre hasta abajo a la izquierda
function centerBeam(hero, sweep) {
  hero = hero || document.querySelector('#info .info-grid:not(.peek) > .info-hero') || document.querySelector('.info-hero'); if (!hero) return;
  const w = hero.offsetWidth, h = hero.offsetHeight; if (!w || !h) return;
  const d = Math.hypot(w, h);
  hero.style.setProperty('--bl', (d * 1.08).toFixed(0) + 'px');
  hero.style.setProperty('--bh', (Math.min(w, h) * .95).toFixed(0) + 'px');
  hero.style.setProperty('--ba', (-Math.atan2(h, w) * 180 / Math.PI).toFixed(2) + 'deg');
  if (sweep) { hero.classList.remove('beam-in'); void hero.offsetWidth; hero.classList.add('beam-in'); }
}
addEventListener('resize', () => centerBeam());
// infoSh: aspecto (shiny o no) de la ficha abierta. Al pulsar una evolución o una variante dentro de la ficha se mantiene,
// para que la línea que estás viendo y la ficha a la que llegas sean coherentes (keep = viene de un enlace de la propia ficha).
let infoSh = false;
const withShiny = (s, f) => { const s0 = shinyMode; shinyMode = s; try { return f(); } finally { shinyMode = s0; } };
function openInfo(n, from, formId, peek, keep) {
  // en la Pokédex (modo usuario), su versión shiny solo se ve si alguna vez lo conseguiste shiny
  // (salvo que llegues desde la línea evolutiva de una ficha shiny: entonces sigue siendo shiny)
  if (!infoNav && !keep && shinyMode && !dexShiny(n)) { shinyMode = false; try { return openInfo(n, from, formId, peek); } finally { shinyMode = true; } }
  const row = BY_NUM.get(n); if (!row) return;
  const I = INFO[n - 1], F = formId && (FORMS[n] || []).find(f => f[0] === formId);
  const [, baseName, g, baseTy, leg, myth] = row;
  const [genus, baseH, baseW, baseSt, , , gr, cap, hap, egg, growth, eggs] = I;
  // si se ha elegido una forma, sus datos sustituyen a los de la forma normal
  const name = F ? formLabel(n, F) : baseName, ty = F ? F[2] : baseTy, st = F ? F[3] : baseSt;
  const abilIds = F ? F[4] : SPAB[n - 1][0], hidId = F ? F[5] : SPAB[n - 1][1], h = F ? F[6] : baseH, w = F ? F[7] : baseW;
  const sid = F ? F[0] : n;
  // "peek" = vista previa del vecino mientras arrastras la ficha (no toca el estado)
  const HERO = peek ? peek.hero : $('infoHero'), BODY = peek ? peek.body : $('infoBody');
  if (!peek) {
    infoN = n; infoOpen = true;
    // desde la ficha de uno de tus Pokémon puedes ir a su línea evolutiva y volver a él (con su mote y su aspecto)
    const isHome = h => h && h.list[h.i].n === n && (h.list[h.i].form || 0) === (formId || 0);
    if (infoNav && !isHome(infoNav)) { infoHome = infoNav; infoNav = null; }
    else if (!infoNav && isHome(infoHome)) { infoNav = infoHome; infoHome = null; }
  }
  const sp = shinyMode && SPR.shiny.get(sid), pc = sp && sp.pc;
  const c = pc ? pc[0] : TYPE_COLORS[ty[0]], c2 = pc ? pc[1] : TYPE_COLORS[ty[1]] || c;
  const box = peek ? peek.root : $('info'); box.style.setProperty('--c', c); box.style.setProperty('--c2', c2); box.style.setProperty('--cn', c);
  const rec = spriteRec(sid);
  const stage = rec ? `<div class="stage" style="--sw:${(rec.fw || .5).toFixed(3)};--sx:${(rec.fx || .5).toFixed(3)}"><div class="bob2"><img src="${rec.u}" alt="${name}"${rec.px ? ' class="px"' : ''} style="--fb:${(rec.fb || 0).toFixed(4)}"></div></div>`
    : `<div class="stage"><div class="bob2">${thumb(sid, ty)}</div></div>`;
  const hasShiny = SPR.shiny.has(sid);
  HERO.className = 'info-hero' + (FLYING.has(n) ? ' fly' : '');
  HERO.innerHTML = `<span class="big-no" aria-hidden="true">${padN(n)}</span>
    <span class="hero-glow" aria-hidden="true"></span>
    <div class="eyebrow2"><span>Nº ${padN(n)}</span><span>GEN ${ROMAN[g]}</span></div>
    ${stage}
    <h2 id="infoName">${name}</h2>
    <div class="genus">${genus || 'Pokémon'}</div>
    <div class="types2">${ty.map(tchip).join('')}</div>
    <div class="badges">${leg ? '<span class="badge">LEGENDARIO</span>' : ''}${myth ? '<span class="badge">SINGULAR</span>' : ''}${F ? `<span class="badge form">${{ mega: 'MEGAEVOLUCIÓN', gmax: 'GIGAMAX', reg: 'FORMA REGIONAL', form: 'OTRA FORMA' }[F[8]]}</span>` : ''}</div>
    ${hasShiny && !infoNav && (dexShiny(n) || keep) ? `<button class="mini-btn${shinyMode ? ' on' : ''}" id="infoShiny" type="button">✦ SHINY · ${shinyMode ? 'ON' : 'OFF'}</button>` : ''}`;
  const total = st.reduce((a, b) => a + b, 0);
  const fem = gr < 0 ? null : gr / 8 * 100;
  BODY.innerHTML = `
    <div><h3>Descripción</h3><p class="desc">${F && F[9] ? F[9] : DESC[n - 1][0]}</p>${!F && DESC[n - 1][1] ? `<p class="habitat"><b>Hábitat</b> ${DESC[n - 1][1]}</p>` : ''}</div>
    <div><h3>Estadísticas base</h3><div class="stats2">${st.map((v, i) => `<span class="k">${STAT_NAMES[i]}</span><span class="v">${v}</span><span class="bar"><i style="--sc:${statColor(v)}" data-w="${Math.min(100, v / 200 * 100)}"></i></span>`).join('')}
      <span class="k tot">Total</span><span class="v tot">${total}</span><span></span></div></div>
    <div><h3>Datos</h3><div class="facts">
      <div class="fact"><b>Altura</b><span>${(h / 10).toLocaleString('es-ES')} m</span></div>
      <div class="fact"><b>Peso</b><span>${(w / 10).toLocaleString('es-ES')} kg</span></div>
      <div class="fact wide"><b>Habilidad${abilIds.length > 1 ? 'es' : ''} <small>· pulsa para ver qué hace</small></b><span class="abils">${abilIds.map(a => `<button class="ab" type="button" data-ab="${a}">${ABIL[a][0]}</button>`).join('') || '—'}${hidId ? `<button class="ab hid" type="button" data-ab="${hidId}" data-hidden="1">${ABIL[hidId][0]} <small>oculta</small></button>` : ''}</span><p class="abil-box" id="abilBox" hidden></p></div>
      <div class="fact"><b>Género</b>${fem === null ? '<span>Sin género</span>' : `<span>♂ ${(100 - fem).toLocaleString('es-ES')}% · ♀ ${fem.toLocaleString('es-ES')}%</span><div class="gbar"><i style="width:${100 - fem}%"></i><u style="width:${fem}%"></u></div>`}</div>
      <div class="fact"><b>Ratio de captura</b><span>${cap}</span> <small>/ 255</small></div>
      <div class="fact"><b>Amistad base</b><span>${hap < 0 ? '—' : hap}</span></div>
      <div class="fact"><b>Ciclos de huevo</b><span>${egg < 0 ? '—' : egg}</span> <small>${egg < 0 ? '' : '≈ ' + ((egg + 1) * 255).toLocaleString('es-ES') + ' pasos'}</small></div>
      <div class="fact"><b>Crecimiento</b><span>${growth || '—'}</span></div>
      <div class="fact"><b>Grupo huevo</b><span>${eggs.join(' / ') || '—'}</span></div>
    </div></div>
    <div><h3>Línea evolutiva y variantes</h3>${evoHTML(n, formId || 0)}</div>
    <div><h3>Daño que recibe</h3>${effHTML(ty)}</div>`;
  if (peek) {
    peek.root.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
    peek.root.querySelectorAll('.bar i').forEach(i => i.style.width = i.dataset.w + '%');
    requestAnimationFrame(() => centerBeam(peek.hero));
    return { c, c2 };
  }
  infoSh = shinyMode;
  const idx = navIdx(), len = navNs().length;
  $('infoPos').textContent = idx >= 0 ? `${infoNav ? 'Tus Pokémon · ' : ''}${idx + 1} / ${len}` : '';
  $('infoPrev').disabled = idx <= 0; $('infoNext').disabled = idx < 0 || idx >= len - 1;
  $('infoShade').hidden = false;
  requestAnimationFrame(() => $('infoBody').querySelectorAll('.bar i').forEach(i => i.style.width = i.dataset.w + '%'));
  // evoluciones y variantes de la línea: la ficha nueva conserva el aspecto de esta (shiny o normal)
  const sh = infoSh;
  $('infoBody').querySelectorAll('[data-go]').forEach(b => b.onclick = () => {
    const to = +b.dataset.go, tf = +b.dataset.form || 0; if (to === n && tf === (formId || 0)) return;
    const order = [0, ...(FORMS[n] || []).map(f => f[0])], dir = to !== n ? (to > n ? 1 : -1) : order.indexOf(tf) > order.indexOf(formId || 0) ? 1 : -1;
    beep(to === n ? 820 : 740, 0.04, 0.02); slideInfo(dir, () => withShiny(sh, () => openInfo(to, null, tf, null, true)));
  });
  // ✦ en la ficha: solo cambia esta ficha y solo mientras está abierta (la Pokédex no se toca)
  const sb = $('infoShiny'); if (sb) sb.onclick = () => { beep(980, .05, .03); withShiny(!sb.classList.contains('on'), () => openInfo(n, null, formId, null, true)); };
  $('infoBody').querySelectorAll('[data-ab]').forEach(b => b.onclick = () => {
    const on = b.classList.contains('on'); $('infoBody').querySelectorAll('[data-ab]').forEach(x => x.classList.remove('on'));
    const box = $('abilBox');
    if (on) { box.hidden = true; return; }
    b.classList.add('on'); const [nm, d] = ABIL[b.dataset.ab]; box.innerHTML = `<b>${nm}${b.dataset.hidden ? ' <small>(oculta)</small>' : ''}</b><span>${d}</span>`; box.hidden = false; beep(740, 0.04, 0.02);
  });
  $('info').scrollTop = 0;
  nickUI(infoNav && infoNav.list[infoNav.i] && infoNav.list[infoNav.i].n === n ? infoNav.list[infoNav.i].m : null);
  centerBeam(null, true); requestAnimationFrame(() => centerBeam()); setTimeout(() => centerBeam(), 450);
  chord([659, 880]);
  if (from) growFrom(from);
}
// animación de agrandar: la ficha nace desde el cuadro pulsado
function growFrom(r, reverse) {
  const el = $('info');
  if (reduceMotion || !el.animate) return Promise.resolve();
  const b = el.getBoundingClientRect();
  const sx = r.width / b.width, sy = r.height / b.height, dx = r.left - b.left, dy = r.top - b.top;
  const start = { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, borderRadius: '10px' };
  const end = { transform: 'none', borderRadius: '4px' };
  el.style.transformOrigin = '0 0';
  const a = el.animate(reverse ? [end, start] : [start, end], { duration: reverse ? 260 : 420, easing: reverse ? 'cubic-bezier(.5,0,.75,0)' : 'cubic-bezier(.2,.85,.25,1)' });
  return a.finished.catch(() => {});
}
let infoOrigin = null;
async function closeInfo() {
  if (!infoOpen) return; infoOpen = false; beep(440, 0.05, 0.03);
  // si su cuadro está a la vista, vuelve encogiéndose hacia él
  const li = document.querySelector(`#dexList .mon[data-n="${infoN}"]`), vr = $('dexView').getBoundingClientRect();
  // abierta desde el equipo de la aventura: vuelve encogiéndose hacia esa tarjeta
  const nav = infoNav || infoHome, o = nav ? document.querySelector(`#advTeam [data-i="${nav.i}"]`) : (infoOrigin && infoOrigin.isConnected && infoOrigin.dataset.n == infoN ? infoOrigin : null);
  if (o) { $('infoShade').classList.add('closing'); await growFrom(o.getBoundingClientRect(), true); $('infoShade').classList.remove('closing'); }
  else if (li) { const r = li.getBoundingClientRect(); if (r.bottom > vr.top && r.top < vr.bottom) { $('infoShade').classList.add('closing'); await growFrom(r, true); $('infoShade').classList.remove('closing'); } }
  infoOrigin = null; infoNav = null; infoHome = null;
  $('infoShade').hidden = true; $('dexView').focus({ preventScroll: true });
}
// Navegar entre fichas: por la Pokédex filtrada o, si se abrió desde la aventura, por tus Pokémon (equipo + caja)
let infoNav = null, infoHome = null;   // { list: [{ n, shiny, form, m }], i } · infoHome: tu Pokémon del que vienes al mirar su línea evolutiva
const navNs = () => infoNav ? infoNav.list.map(e => e.n) : shownRows.map(r => r[1][0]).filter(dexHas);
const navIdx = () => infoNav ? infoNav.i : navNs().indexOf(infoN);
// abre la ficha de uno de tus Pokémon con su aspecto (shiny o no)
function openNav(i, from, peek) {
  const e = infoNav.list[i], s = shinyMode; shinyMode = !!e.shiny;
  try { return openInfo(e.n, from, e.form || 0, peek); } finally { shinyMode = s; }
}
function openTeamInfo(i, el) {
  infoHome = null; infoNav = { list: [...run.team, ...boxList()].map(m => ({ n: m.n, shiny: m.shiny, form: m.form || 0, m })), i };
  infoOrigin = el; openNav(i, el.getBoundingClientRect());
}
function goNav(j) { if (infoNav) { infoNav.i = j; openNav(j); } else openInfo(navNs()[j]); }
function stepInfo(d) { const j = navIdx() + d; if (j >= 0 && j < navNs().length) { beep(740, 0.04, 0.02); slideInfo(d, () => goNav(j)); } }
// Arrastrar la ficha a los lados (ratón o dedo), como un carrusel: el vecino ya se ve mientras arrastras
(() => {
  const info = $('info'); let d = null, suppress = false;
  info.addEventListener('dragstart', e => e.preventDefault());
  const neighbor = dir => { const j = navIdx() + dir, ns = navNs(); return navIdx() >= 0 && j >= 0 && j < ns.length ? { n: ns[j], j } : null; };
  function makePeek(nb, dir, grid) {
    const n = nb.n;
    const root = document.createElement('div');
    root.className = 'info-grid peek';
    root.innerHTML = '<section class="info-hero"></section><section class="info-body"></section>';
    root.style.top = (info.scrollTop + grid.offsetTop) + 'px';
    info.appendChild(root);
    const pk = { root, hero: root.children[0], body: root.children[1] };
    const col = infoNav ? openNav(nb.j, null, pk) : openInfo(n, null, 0, pk);
    // la cabecera del vecino mide lo mismo que la actual: así la luz y el número de fondo quedan en el mismo sitio
    const mh = grid.querySelector('.info-hero'); if (mh) pk.hero.style.height = mh.offsetHeight + 'px';
    return { root, n, j: nb.j, dir, col };
  }
  const mix = (a, b, t) => `color-mix(in srgb, ${b} ${Math.round(t * 100)}%, ${a})`;
  function place(dx) {
    const w = info.clientWidth;
    d.grid.style.transform = `translate3d(${dx}px,0,0)`;
    d.peeks.forEach(p => p.root.style.transform = `translate3d(${p.dir * w * 1.04 + dx}px,0,0)`);
    // el color de la ficha va pasando al del vecino según lo arrastras
    const p = d.peeks.find(p => p.dir === (dx < 0 ? 1 : -1));
    const t = p ? Math.min(1, Math.abs(dx) / (w * .8)) : 0;
    info.style.setProperty('--c', p ? mix(d.c0, p.col.c, t) : d.c0);
    info.style.setProperty('--c2', p ? mix(d.c20, p.col.c2, t) : d.c20);
  }
  info.addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.target.closest('.info-bar, button, a, input, select') || info.querySelector('.ghost-grid')) return;
    const grid = info.querySelector('.info-grid:not(.peek)'); if (!grid) return;
    d = { x0: e.clientX, y0: e.clientY, dx: 0, on: false, id: e.pointerId, grid, peeks: [], s: [[performance.now(), e.clientX]] };
  });
  info.addEventListener('pointermove', e => {
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
    if (!d.on) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { d = null; return; }   // es scroll vertical
      if (Math.abs(dx) < 8) return;
      d.on = true; info.setPointerCapture(e.pointerId); info.classList.add('dragging');
      const cs = getComputedStyle(info); d.c0 = cs.getPropertyValue('--c').trim(); d.c20 = cs.getPropertyValue('--c2').trim();
      [-1, 1].forEach(dir => { const nb = neighbor(dir); if (nb) d.peeks.push(makePeek(nb, dir, d.grid)); });
    }
    const has = d.peeks.some(p => p.dir === (dx < 0 ? 1 : -1));
    d.dx = has ? dx : dx * .3;                                  // en los extremos se resiste
    place(d.dx);
    const now = performance.now(); d.s.push([now, e.clientX]); while (d.s.length > 2 && now - d.s[0][0] > 100) d.s.shift();
  });
  const end = () => {
    if (!d) return; const g = d; d = null;
    if (!g.on) return;
    suppress = true; setTimeout(() => suppress = false, 60);
    const a = g.s[0], b = g.s[g.s.length - 1], dt = (b[0] - a[0]) / 1000, v = dt > 0 ? (b[1] - a[1]) / dt : 0;
    const w = info.clientWidth, dir = g.dx < 0 ? 1 : -1, target = g.peeks.find(p => p.dir === dir);
    const go = target && (Math.abs(g.dx) > w * .22 || (Math.abs(v) > 500 && Math.sign(v) === -dir));
    const to = go ? -dir * w * 1.04 : 0;
    const dur = Math.max(180, Math.min(420, Math.abs(to - g.dx) / Math.max(1.2, Math.abs(v) / 1000)));
    const ease = go ? 'cubic-bezier(.2,.75,.25,1)' : 'cubic-bezier(.3,1.35,.5,1)';
    const anims = [g.grid.animate([{ transform: `translate3d(${g.dx}px,0,0)` }, { transform: `translate3d(${to}px,0,0)` }], { duration: dur, easing: ease, fill: 'forwards' })];
    g.peeks.forEach(p => anims.push(p.root.animate([{ transform: `translate3d(${p.dir * w * 1.04 + g.dx}px,0,0)` }, { transform: `translate3d(${p.dir * w * 1.04 + to}px,0,0)` }], { duration: dur, easing: ease, fill: 'forwards' })));
    // color: termina de pasar al nuevo, o vuelve al de antes
    info.classList.remove('dragging');
    info.style.setProperty('--c', go ? target.col.c : g.c0); info.style.setProperty('--c2', go ? target.col.c2 : g.c20);
    if (go) beep(740, 0.04, 0.02);
    Promise.all(anims.map(x => x.finished.catch(() => {}))).then(() => {
      if (go) {
        info.classList.add('no-color-anim');
        goNav(target.j);                        // el nuevo ya estaba a la vista: se cambia sin salto
        void info.offsetWidth; info.classList.remove('no-color-anim');
        info.classList.remove('flash'); void info.offsetWidth; info.classList.add('flash');
      }
      anims.forEach(x => x.cancel()); g.grid.style.transform = '';
      g.peeks.forEach(p => p.root.remove());
    });
  };
  info.addEventListener('pointerup', end); info.addEventListener('pointercancel', end);
  info.addEventListener('click', e => { if (suppress) { e.stopPropagation(); e.preventDefault(); } }, true);
})();
// cambiar de Pokémon (o de forma) dentro de la ficha deslizando: el actual sale por un lado y el nuevo entra por el otro
function slideInfo(dir, render, offset = 0) {
  const info = $('info'), grid = info.querySelector('.info-grid');
  info.querySelectorAll('.ghost-grid').forEach(g => g.remove());
  if (reduceMotion || !grid.animate) { render(); return; }
  const y = info.scrollTop;
  const ghost = grid.cloneNode(true);
  ghost.classList.add('ghost-grid'); ghost.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
  // la ficha que sale conserva sus colores; la que entra los cambia poco a poco
  const cs = getComputedStyle(info); ghost.style.setProperty('--c', cs.getPropertyValue('--c')); ghost.style.setProperty('--c2', cs.getPropertyValue('--c2'));
  ghost.style.top = (grid.offsetTop - y) + 'px';
  render();                                   // pinta el nuevo (y vuelve arriba)
  info.scrollTop = 0;
  info.appendChild(ghost);
  ghost.style.top = grid.offsetTop - y + 'px';
  const opts = { duration: offset ? 340 : 420, easing: 'cubic-bezier(.22,.8,.25,1)' };
  ghost.animate([{ transform: `translateX(${offset}px)` }, { transform: `translateX(${-dir * 104}%)` }], opts).finished.then(() => ghost.remove(), () => ghost.remove());
  grid.animate([{ transform: `translateX(calc(${dir * 104}% + ${offset}px))` }, { transform: 'translateX(0)' }], opts);
  info.classList.remove('flash'); void info.offsetWidth; info.classList.add('flash');
}
$('infoClose').onclick = closeInfo;
$('infoPrev').onclick = () => stepInfo(-1);
$('infoNext').onclick = () => stepInfo(1);
$('infoShade').addEventListener('pointerdown', e => { if (e.target === $('infoShade')) closeInfo(); });
addEventListener('keydown', e => {
  if (!infoOpen) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeInfo(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); stepInfo(-1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); stepInfo(1); }
}, true);
