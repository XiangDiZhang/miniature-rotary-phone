// Pokédex: filtros, numeración y lista de Pokémon
const dexFilter = { q: '', gen: 0, types: [], cls: '', own: '' };   // own: 'own' = solo los que ya has desbloqueado en tus partidas
let shownRows = [];          // filas que se ven ahora (la ficha navega por ellas)
let lastDexKey = '';         // si cambian los filtros, la lista vuelve arriba
const NAME_KEY = new Map(DEX.map(r => [r[0], norm(r[1])]));   // nombres sin tildes, para buscar
const GEN_START = {}; DEX.forEach(([n, , g]) => { if (!GEN_START[g] || n < GEN_START[g]) GEN_START[g] = n; });

function segRow(el, list, key) {
  el.innerHTML = list.map(([v, label, title]) => `<button type="button" data-v="${v}"${title ? ` title="${title}"` : ''} aria-pressed="${dexFilter[key] == v}">${label}</button>`).join('');
  el.querySelectorAll('button').forEach(b => b.onclick = () => {
    dexFilter[key] = key === 'gen' ? Number(b.dataset.v) : b.dataset.v;
    el.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    beep(740, 0.04, 0.02); renderDex();
  });
}
segRow($('dexGens'), [[0, 'TODAS'], ...ROMAN.slice(1).map((r, i) => [i + 1, r, 'Generación ' + r])], 'gen');
segRow($('dexClass'), [['', 'TODOS'], ['leg', 'LEGEND.', 'Legendarios'], ['myth', 'SINGUL.', 'Singulares']], 'cls');
segRow($('dexOwn'), [['', 'TODOS'], ['own', 'DESBLOQUEADOS', 'Solo los Pokémon que ya has conseguido en tus partidas']], 'own');
$('dexTypes').innerHTML = Object.keys(TYPE_COLORS).map(t => `<button class="tbtn" type="button" data-t="${t}" style="${typeVars(t)}" title="${t}" aria-label="${t}" aria-pressed="false">${typeSvg(t)}</button>`).join('');
$('dexTypes').querySelectorAll('.tbtn').forEach(b => b.onclick = () => {
  const t = b.dataset.t, sel = dexFilter.types, i = sel.indexOf(t);
  if (i >= 0) sel.splice(i, 1); else { sel.push(t); if (sel.length > 2) sel.shift(); }
  syncTypes(); beep(i >= 0 ? 520 : 820, 0.04, 0.02); renderDex();
});
function syncTypes() {
  $('dexTypes').querySelectorAll('.tbtn').forEach(b => b.setAttribute('aria-pressed', dexFilter.types.includes(b.dataset.t)));
  $('dexTypes').classList.toggle('picked', dexFilter.types.length > 0);
}
$('dexClear').onclick = () => {
  Object.assign(dexFilter, { q: '', gen: 0, types: [], cls: '', own: '' }); $('dexSearch').value = '';
  ['dexGens', 'dexClass', 'dexOwn'].forEach(id => $(id).querySelectorAll('button').forEach((x, i) => x.setAttribute('aria-pressed', i === 0)));
  syncTypes(); beep(440); renderDex();
};

// buscador: espera a que dejes de teclear un momento antes de volver a dibujar la lista
let searchTimer = 0;
$('dexSearch').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { dexFilter.q = norm(e.target.value.trim()); renderDex(); }, 120);
});

$('dexScope').innerHTML = '<option value="national">TODAS · Nº nacional</option>' +
  ROMAN.slice(1).map((r, i) => { const list = REGIONAL.filter(d => DEX_GEN[d.id] === i + 1); return list.length ? `<optgroup label="Generación ${r}">${list.map(d => `<option value="${d.id}">${d.name} — ${d.games}</option>`).join('')}</optgroup>` : ''; }).join('');
function syncNum() {
  const nat = numMode === 'national';
  $('dexScope').value = numMode;
  $('dexScope').classList.toggle('on', !nat);
  $('dexGens').hidden = !nat;
  if (!nat && dexFilter.gen) { dexFilter.gen = 0; $('dexGens').querySelectorAll('button').forEach((x, i) => x.setAttribute('aria-pressed', i === 0)); }
}
function setNum(m) { numMode = m || 'national'; store.set('ruleta-num', numMode); syncNum(); beep(740, 0.04, 0.02); renderDex(); }
$('dexScope').onchange = e => setNum(e.target.value);
syncNum();

// Para que abrir la Pokédex no se atasque: si nada ha cambiado, la lista no se vuelve a dibujar; y si hay que dibujarla,
// primero van los cuadros que caben en pantalla y el resto se añade por bloques, dejando pintar entre bloque y bloque.
let listKey = '', fillTimer = 0;
const FIRST = 60, CHUNK = 160;
function dexItem([num, [n, name, g, ty, leg, myth]], label, plainNum) {
  // en modo shiny, el cuadro toma los colores del sprite shiny; si no, los de sus tipos
  const own = dexHas(n), sm = shinyMode && own && dexShiny(n);
  // si de esta especie solo tienes otra forma (Articuno de Galar…), el cuadro enseña esa forma: su dibujo, su nombre y sus tipos
  const fid = own && !devMode && !PDX.f.has(n) ? dexFirstForm(n) || 0 : 0, fr = fid && FORM_OF.get(fid);
  if (fr) { ty = fr[1][2]; name = formLabel(n, fr[1]); }
  const sp = sm && SPR.shiny.get(fid || n), pc = sp && sp.pc;
  const c = !own ? '#4a5263' : pc ? pc[0] : TYPE_COLORS[ty[0]] || '#8592ab', c2c = !own ? c : pc ? pc[1] : TYPE_COLORS[ty[1]] || c, shown = padN(num);
  const keep = shinyMode; shinyMode = sm; const cell = spriteCell(fid || n, ty); shinyMode = keep;
  if (!own) return `<li class="mon locked" data-n="${n}" data-g="${g}" style="--c:${c};--c2:${c2c}">` +
    `<span class="bg${shown.length > 3 ? ' d4' : ''}" aria-hidden="true">${shown}</span>` +
    `<span class="top"><span class="no">${label} ${shown}</span></span>` + cell + `<span class="nm">???</span><span class="ty"></span></li>`;
  return `<li class="mon${FLYING.has(n) ? ' fly' : ''}" data-n="${n}"${fid ? ` data-form="${fid}"` : ''} data-g="${g}" style="--c:${c};--c2:${c2c};--dur:${(2.6 + (n * 37 % 13) / 10).toFixed(1)}s;--del:-${(n * 53 % 30) / 10}s">` +
    `<span class="bg${shown.length > 3 ? ' d4' : ''}" aria-hidden="true">${shown}</span>` +
    `<span class="top"><span class="no">${label} ${shown}</span>${leg ? '<small>LEG</small>' : myth ? '<small>SING</small>' : plainNum ? `<span>GEN ${ROMAN[g]}</span>` : ''}</span>` +
    cell +
    `<span class="nm">${name}</span>` +
    `<span class="ty">${ty.map(typeIcon).join('')}</span></li>`;
}
function renderDex() {
  const q = dexFilter.q, qn = q.replace(/^0+/, '');
  const reg = REGIONAL.find(r => r.id === numMode);
  // [número que se muestra, fila de DEX]
  // Nacional con una generación elegida: se numera desde 001 dentro de esa generación
  const genStart = !reg && dexFilter.gen ? GEN_START[dexFilter.gen] : 0;
  const base = reg ? reg.ids.map((id, i) => [reg.start + i, BY_NUM.get(id)]).filter(x => x[1])
    : DEX.map(r => [genStart ? r[0] - genStart + 1 : r[0], r]);
  const rows = shownRows = base.filter(([num, [n, name, g, ty, leg, myth]]) => (!q || dexHas(n) || !isNaN(+q)) &&
    (!dexFilter.gen || g === dexFilter.gen) &&
    dexFilter.types.every(t => ty.includes(t)) &&
    (!dexFilter.cls || (dexFilter.cls === 'leg' ? leg : myth)) &&
    (!dexFilter.own || PDX.c.has(n)) &&
    (!shinyMode || dexShiny(n)) &&            // con el botón shiny, solo los que has conseguido shiny (en modo desarrollador, todos)
    (!q || NAME_KEY.get(n).includes(q) || (qn && (String(num).startsWith(qn) || String(n).startsWith(qn))) || q === '0' && num === 0));
  const active = !!(dexFilter.q || dexFilter.gen || dexFilter.types.length || dexFilter.cls || dexFilter.own);
  $('dexClear').hidden = !active;
  $('dexCount').textContent = `${devMode ? '' : shinyMode ? `✦ ${base.filter(r => PDX.s.has(r[1][0])).length} SHINY · ` : `${base.filter(r => PDX.c.has(r[1][0])).length} CONSEGUIDOS · `}${rows.length} DE ${base.length} · ${reg ? 'POKÉDEX DE ' + reg.name.toUpperCase() + ' (' + reg.games.toUpperCase() + ')' : 'POKÉDEX NACIONAL'}${dexFilter.types.length ? ' · ' + dexFilter.types.join(' + ').toUpperCase() : ''}`;
  $('dexSub').hidden = true;
  const showTicks = !reg && !genStart, key = JSON.stringify([numMode, dexFilter]), reset = key !== lastDexKey;
  lastDexKey = key;
  // misma lista que ya está dibujada (p. ej. al volver a abrir la Pokédex): solo se vuelve a medir
  const look = JSON.stringify([key, devMode, shinyMode, PDX.c.size, PDX.s.size, PDX.f.size]);
  if (look === listKey) return rail.refresh(showTicks, reset);
  listKey = look; clearTimeout(fillTimer);
  const list = $('dexList');
  if (!rows.length) { list.innerHTML = `<li class="dex-empty">${shinyMode && !devMode && !PDX.s.size ? 'Aún no has conseguido ningún Pokémon shiny: cuando lo consigas en tus partidas, aparecerá aquí.' : dexFilter.own && !PDX.c.size ? 'Aún no has desbloqueado ningún Pokémon: captúralos en tus partidas.' : 'Ningún Pokémon coincide con la búsqueda.'}</li>`; return rail.refresh(showTicks, reset); }
  const label = reg ? reg.name.slice(0, 3).toUpperCase() : genStart ? 'GEN ' + ROMAN[dexFilter.gen] + ' ·' : 'Nº';
  const html = from => rows.slice(from, from + (from ? CHUNK : FIRST)).map(r => dexItem(r, label, !genStart && !reg)).join('');
  list.innerHTML = html(0);
  rail.refresh(showTicks, reset);
  let i = FIRST;
  const more = () => {
    list.insertAdjacentHTML('beforeend', html(i)); i += CHUNK;
    if (i < rows.length) fillTimer = setTimeout(more, 16);
    else rail.refresh(showTicks, false);           // lista completa: barra lateral y marcas de generación
  };
  if (i < rows.length) fillTimer = setTimeout(more, 16);
}

// Filtros en móvil: cajón lateral
$('sideTab').onclick = () => { document.body.classList.add('side-open'); beep(740, 0.04, 0.02); };
$('sideClose').onclick = $('sideShade').onclick = () => document.body.classList.remove('side-open');
