// Aventura: estado de la partida, guardado, nombres y formas de tus Pokémon, historial
// ---- Estado de la partida (se guarda en este navegador, una por región) ----
let run = null, advWheel = null;
const REG = () => REGIONS[run.region];
const loc = () => REG().path[run.step];
const VIL = () => VILLAINS[(run && REG().villain) || 'rocket'];
function newRun(region = 'kanto') { return { chaos: region === 'caos' || region === 'test' ? chaosPlan() : region === 'randomlocke' ? { ...chaosPlan(), rl: randomStarters() } : undefined, v: 5, kv: 2, ball: 0, sub: 0, extra: 0, pending: [], stolen: null, xatk: 0, region, step: 0, stepDone: false, team: [], box: [], bag: { potion: (REGIONS[region] && REGIONS[region].potions) || 1 }, points: 0, badges: [], tea: 0, evoFails: 0, starter: 0, over: false, log: [] }; }
function saveRun() { run.t = Date.now(); store.setJSON('ruleta-run-' + run.region, run); }   // t: cuándo se jugó por última vez (Partidas en curso)
function loadRun(region) {
  const r = store.getJSON('ruleta-run-' + region);
  if (!(r && REGIONS[r.region] && r.v === 5 && (r.region !== 'kanto' || r.kv === 2))) return null;   // partidas de versiones antiguas: no valen
  // si se guardó en mitad de un combate, cada Pokémon vuelve a su forma normal (también si estaba megaevolucionado o Gigamax)
  [...(r.team || []), ...(r.box || []).filter(Boolean), ...(Array.isArray(r.stolen) ? r.stolen : r.stolen ? [r.stolen] : [])].forEach(m => {
    restoreForm(m);
  });
  if ((r.region === 'caos' || r.region === 'test' || r.region === 'randomlocke') && !(r.chaos && r.chaos.gyms)) return null;
  return r;
}
// récord de puntos de cada región
const getBest = () => store.getJSON('ruleta-best', {});
function saveBest() {
  if (run.region === 'test') return false;   // el Modo Test no cuenta para los récords
  const b = getBest(), prev = b[run.region] || 0; if (run.points <= prev) return false;
  b[run.region] = run.points; store.setJSON('ruleta-best', b); return true;
}
function log(t) { run.log.unshift(t); run.log = run.log.slice(0, 40); if (typeof logNow === 'function') logNow(t); }
// entrada del diario que lleva dentro (invisible) la forma exacta del Pokémon y si es shiny: así el diario enseña
// el Vivillon con su motivo, el Raichu de Alola, la mega… y no la forma normal. m = { n, form, shiny }
const LOG_MARK = '⁣';
function logm(t, m) { log(m && m.n ? `${t}${LOG_MARK}${m.form || m.n}.${m.n}${m.shiny ? 's' : ''}` : t); }
function addPoints(k, why) { run.points = Math.max(0, run.points + k); if (k) log(`${k > 0 ? '⭐ +' : '▼ '}${k} puntos · ${why}`); }
const badges = () => run.badges.length;

// ---- Especies ----
const pname = n => BY_NUM.get(n)[1];
const ptypes = n => BY_NUM.get(n)[3];
const isLegend = n => !!(BY_NUM.get(n)[4] || BY_NUM.get(n)[5]);
const nextEvos = n => (EVO_KIDS.get(n) || []).filter(k => !REGIONAL_EVO.has(k));
const canEvolve = m => evoOptions(m).length > 0;

// ---- Caja PC: 30 huecos (6 × 5), cada Pokémon en el hueco que elijas ----
function normBox() { if (!Array.isArray(run.box)) run.box = []; run.box = run.box.map(m => m || null); while (run.box.length < BOX_N) run.box.push(null); }
const boxList = () => run.box.filter(Boolean);
function boxAdd(m) { normBox(); const i = run.box.findIndex(x => !x); if (i >= 0) run.box[i] = m; else run.box.push(m); }
const allMine = () => [...run.team, ...boxList()];
// Pokémon que tiene el villano (pueden ser varios); se recuperan todos al ganarle
const stolenList = () => !run.stolen ? [] : Array.isArray(run.stolen) ? run.stolen : [run.stolen];
function addMon(n, shiny, form) { const m = { n, shiny: !!shiny }; if (form) m.form = form; dexRegister(n, !!shiny, form); if (run.team.length < 6) run.team.push(m); else boxAdd(m); return m; }

// ---- Tus Pokémon: { n: especie, form: id de la forma (0 = normal), shiny, nick } ----
const wildForms = n => (FORMS[n] || []).filter(f => (f[8] === 'reg' && f[0] !== 10178) || CAPTURE_FORMS.has(f[0]));
const formRec = id => id ? FORM_OF.get(id) : null;
const baseFormName = n => BASE_FORM_NAME[n] ? `${pname(n)} · ${BASE_FORM_NAME[n]}` : pname(n);
const mname = m => { if (m.nick) return m.nick; const r = formRec(m.form); return r ? formLabel(m.n, r[1]) : pname(m.n); };
const sname = m => mname({ n: m.n, form: m.form });          // nombre de la especie (sin mote)
const dname = m => mname(m) + (m.shiny ? ' ★' : '');           // para mostrar: con estrella si es shiny
const mtypes = m => { const r = formRec(m.form); return r ? r[1][2] : ptypes(m.n); };
const mid = m => m.form || m.n;                                 // id de su sprite
const regionTag = id => { const r = formRec(id); if (!r || r[1][8] !== 'reg') return null; const t = r[1][1].match(/Alola|Galar|Hisui|Paldea/); return t && t[0]; };
// su sprite (con su forma y, si es shiny, el shiny); null si no hay sprites cargados
function monSprite(m) { const id = mid(m); return (m.shiny && (SPR.shiny.get(id) || SPR.shiny.get(m.n))) || SPR.normal.get(id) || SPR.normal.get(m.n); }
function monThumb(m) { const r = monSprite(m); return r ? `<img src="${r.u}" alt="" style="${sizeStyle(m.form)}">` : typePh(mtypes(m)); }   // (Pumpkaboo y Gourgeist, a la escala de su tamaño)
// a qué puede evolucionar ESTE Pokémon (según su forma) y con qué forma queda
function evoOptions(m) {
  const all = EVO_KIDS.get(m.n) || [];
  const special = all.filter(t => REG_REQ[t] && REG_REQ[t] === m.form);
  const list = special.length ? special : all.filter(t => !REG_REQ[t]);
  const tag = regionTag(m.form), r = formRec(m.form), lbl = r && r[1][1];
  const out = list.map(t => {
    const fl = FORMS[t] || [];
    const f = tag ? fl.find(x => x[8] === 'reg' && x[0] !== 10178 && x[1].includes(tag)) : lbl ? fl.find(x => x[1] === lbl) : null;
    return { n: t, form: f ? f[0] : 0 };
  });
  // desde la forma normal, también su forma regional cuando existe (Typhlosion de Hisui, Raichu de Alola…)
  if (!m.form) list.forEach(t => { if (REGIONAL_BRANCH[t] && formRec(REGIONAL_BRANCH[t])) out.push({ n: t, form: REGIONAL_BRANCH[t] }); });
  return out;
}

// ---- Historial de partidas: equipo (con motes), puntos y si ganaste o perdiste ----
function saveHistory(won) {
  if (!run || run.histSaved) return; run.histSaved = true; statsEndRun(won);   // (estadísticas, logros y Hall de la Fama histórico)
  if (run.region === 'test') return saveRun();   // el Modo Test no se apunta en el historial
  const mons = allMine().map(m => ({ n: m.n, form: m.form || 0, shiny: !!m.shiny, nick: m.nick || '' }));
  const e = { t: Date.now(), region: run.region, name: REG().name, won: !!won, points: run.points, rank: rank(run.points), badges: run.badges.length, lostTo: won ? '' : (run.lostTo || ''), team: mons };
  store.setJSON('ruleta-hist', [e, ...store.getJSON('ruleta-hist', [])].slice(0, 40));
  saveRun();
}
// Historial de la región: un hueco con su propio desplazamiento (la página no crece), con filtro Todas · Victorias · Derrotas
// y, en cada partida, «Exportar imagen» (tu entrenador a la izquierda con su nombre y tus 6 Pokémon a la derecha)
let histRegion = null, histFilter = 'all';
const histWhen = t => { const d = new Date(t); return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) + ' · ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); };
function renderHistory(region) {
  const el = $('advHist'); if (!el) return;
  if (region !== undefined) histRegion = region;
  const all = store.getJSON('ruleta-hist', []).filter(x => !histRegion || x.region === histRegion);
  if (!all.length) { el.innerHTML = '<p class="label">Historial de partidas</p><p class="hist-empty">Aún no has terminado ninguna partida en esta región.</p>'; return; }
  const won = all.filter(x => x.won).length, h = all.filter(x => histFilter === 'all' || (histFilter === 'won') === x.won);
  const mini = m => `<span class="hist-mon${m.shiny ? ' shiny' : ''}" title="${dname(m)}${m.nick ? ' (' + sname(m) + ')' : ''}">${monThumb(m)}<em>${dname(m)}</em></span>`;
  el.innerHTML = `<div class="hist-top"><p class="label">Historial de partidas</p><div class="seg hist-seg" role="group" aria-label="Filtrar el historial">${[['all', 'Todas', all.length], ['won', 'Victorias', won], ['lost', 'Derrotas', all.length - won]].map(([k, t, n]) => `<button type="button" data-f="${k}" aria-pressed="${histFilter === k}">${t} <b>${n}</b></button>`).join('')}</div></div>
    <div class="hist-view"><div class="hist-list">${h.length ? h.map(x => `<div class="hist-row ${x.won ? 'won' : 'lost'}"><div class="hist-head"><b>${x.won ? 'Victoria · Campeón' : 'Derrota' + (x.lostTo ? ' · contra ' + x.lostTo : '')}</b><span>${histWhen(x.t)}</span><span class="hist-pts">${x.points} pts · ${x.rank} · ${x.badges} medallas</span><button class="mini-btn hist-exp" type="button" data-t="${x.t}" title="Exportar imagen: tu entrenador y tus 6 Pokémon de esta partida">⇩ Imagen</button></div><div class="hist-team">${x.team.map(mini).join('')}</div></div>`).join('')
      : `<p class="hist-empty">No hay ${histFilter === 'won' ? 'victorias' : 'derrotas'} en esta región.</p>`}</div></div>`;
  el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { histFilter = b.dataset.f; beep(700, .04, .02); renderHistory(); });
  el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const x = all.find(e => String(e.t) === b.dataset.t); if (x) { beep(880, .05, .03); exportRun(x); } });
  fitHistory();
}
// el hueco llega justo hasta abajo de la pantalla: así se desplaza dentro y la página no
function fitHistory() {
  const v = document.querySelector('#advHist .hist-view'); if (!v || state.scene !== 'chosen') return;
  const top = v.getBoundingClientRect().top + scrollY;
  // (las medidas de la pantalla van con el zoom de los menús; la altura se pone en px de la página: se divide por él)
  const z = uiZ(); let h = Math.max(140, Math.floor((innerHeight - top - 22) / z)); v.style.height = h + 'px';
  // lo que quede por debajo (márgenes de la página) también cuenta: se descuenta para que la página no se desplace
  const over = document.documentElement.scrollHeight - innerHeight; if (over > 0) v.style.height = Math.max(140, h - Math.ceil(over / z)) + 'px';
}
addEventListener('resize', fitHistory);
// el historial y la mochila se arrastran con el ratón como la Pokédex (con el dedo ya se desplazan solos), con inercia al soltar
(() => {
  let d = null;
  document.addEventListener('pointerdown', e => {
    const v = e.target.closest && e.target.closest('.hist-view, .drag-scroll'); if (!v || e.pointerType !== 'mouse' || e.button > 0 || e.target.closest('button')) return;
    cancelAnimationFrame(v._glide); d = { v, y: e.clientY, top: v.scrollTop, last: e.clientY, t: performance.now(), vel: 0, moved: false };
  });
  addEventListener('pointermove', e => {
    if (!d) return; const dy = e.clientY - d.y; if (!d.moved && Math.abs(dy) < 4) return;
    d.moved = true; d.v.classList.add('dragging'); d.v.scrollTop = d.top - dy;
    const now = performance.now(); d.vel = (e.clientY - d.last) / Math.max(1, now - d.t); d.last = e.clientY; d.t = now; e.preventDefault();
  });
  addEventListener('pointerup', () => {
    if (!d) return; const { v, moved } = d; let vel = d.vel * 16; d = null; v.classList.remove('dragging');
    if (!moved || reduceMotion) return;
    const glide = () => { if (Math.abs(vel) < .4) return; v.scrollTop -= vel; vel *= .94; v._glide = requestAnimationFrame(glide); }; glide();
  });
})();
// lo de arriba cambia de alto después (el texto del profesor se va escribiendo, los botones…): se vuelve a medir
try { const ro = new ResizeObserver(() => fitHistory()); ['chosenText', 'chosenCard', 'advEntry'].forEach(id => $(id) && ro.observe($(id))); } catch (e) {}

// ---- Imagen de una partida: tu entrenador (tu sprite de entrenador) con su nombre debajo,
// y a la derecha tus 6 Pokémon con su nombre, más la región, el resultado y los puntos. Se ve en grande y se puede descargar. ----
async function exportRun(x) {
  const Wd = 1200, Hg = 630, cv = document.createElement('canvas'); cv.width = Wd; cv.height = Hg;
  const g = cv.getContext('2d'), gen = typeof genOf === 'function' && genOf(x.region), C = (gen && gen.color) || '#7fd6ff';
  const css = getComputedStyle(document.documentElement), acc = css.getPropertyValue('--cyan').trim() || '#7fd6ff';
  try { await document.fonts.ready; } catch (e) {}
  const F = (w, s, f = 'Chakra Petch') => `${w} ${s}px "${f}", system-ui, sans-serif`;
  // fondo: oscuro, con el brillo de la región y la franja diagonal de las fichas
  g.fillStyle = '#0b0f1a'; g.fillRect(0, 0, Wd, Hg);
  let gr = g.createRadialGradient(260, 330, 20, 260, 330, 520); gr.addColorStop(0, C + '55'); gr.addColorStop(1, 'transparent'); g.fillStyle = gr; g.fillRect(0, 0, Wd, Hg);
  gr = g.createRadialGradient(900, 120, 10, 900, 120, 600); gr.addColorStop(0, acc + '33'); gr.addColorStop(1, 'transparent'); g.fillStyle = gr; g.fillRect(0, 0, Wd, Hg);
  g.save(); g.globalAlpha = .12; g.fillStyle = C; g.beginPath(); g.moveTo(Wd * .62, 0); g.lineTo(Wd, 0); g.lineTo(Wd, Hg * .3); g.lineTo(Wd * .4, Hg); g.lineTo(0, Hg); g.lineTo(0, Hg * .55); g.closePath(); g.fill(); g.restore();
  // decoración del fondo (todo muy tenue, para que lo de delante destaque):
  // · rejilla de puntos
  g.save(); g.fillStyle = 'rgba(255,255,255,.055)';
  for (let yy = 30; yy < Hg; yy += 22) for (let xx = 30 + (yy / 22 % 2) * 11; xx < Wd; xx += 22) { g.beginPath(); g.arc(xx, yy, 1.1, 0, Math.PI * 2); g.fill(); }
  g.restore();
  // · rayos de luz que salen de detrás del entrenador
  { const ox = 238, oy = 300, rg = g.createRadialGradient(ox, oy, 40, ox, oy, 430); rg.addColorStop(0, C + '30'); rg.addColorStop(1, 'transparent');
    g.save(); g.fillStyle = rg; for (let k = 0; k < 16; k++) { const a0 = k / 16 * Math.PI * 2, a1 = a0 + Math.PI / 32;
      g.beginPath(); g.moveTo(ox, oy); g.arc(ox, oy, 430, a0, a1); g.closePath(); g.fill(); } g.restore(); }
  // · una Poké Ball enorme, solo el contorno, detrás del entrenador
  { const ox = 238, oy = 292, R = 214; g.save(); g.strokeStyle = C + '2e'; g.lineWidth = 7;
    g.beginPath(); g.arc(ox, oy, R, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(ox - R, oy); g.lineTo(ox - 52, oy); g.moveTo(ox + 52, oy); g.lineTo(ox + R, oy); g.stroke();
    g.beginPath(); g.arc(ox, oy, 52, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(ox, oy, 28, 0, Math.PI * 2); g.stroke(); g.restore(); }
  // · el nombre de la región en grande, solo el contorno, abajo a la derecha
  g.save(); g.font = F(300, 170); g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.lineWidth = 1.5; g.strokeStyle = C + '22';
  g.strokeText((x.name || '').toUpperCase(), Wd - 26, Hg - 22); g.restore();
  // · si ganaste, destellos dorados repartidos (siempre en el mismo sitio para la misma partida)
  if (x.won) { let sd = (x.t || 1) % 2147483647; const rr = () => (sd = sd * 16807 % 2147483647) / 2147483647;
    g.save(); for (let k = 0; k < 22; k++) { const sx = 40 + rr() * (Wd - 80), sy = 40 + rr() * (Hg - 80), r = 3 + rr() * 6;
      g.globalAlpha = .18 + rr() * .3; g.fillStyle = '#ffd84a'; g.shadowColor = '#ffd84a'; g.shadowBlur = 8;
      g.beginPath(); g.moveTo(sx, sy - r); g.quadraticCurveTo(sx, sy, sx + r, sy); g.quadraticCurveTo(sx, sy, sx, sy + r); g.quadraticCurveTo(sx, sy, sx - r, sy); g.quadraticCurveTo(sx, sy, sx, sy - r); g.fill(); }
    g.restore(); }
  g.strokeStyle = C; g.lineWidth = 2; g.shadowColor = C; g.shadowBlur = 18; g.strokeRect(14, 14, Wd - 28, Hg - 28); g.shadowBlur = 0;
  // · esquinas del marco remarcadas, como las del juego
  g.save(); g.strokeStyle = acc; g.lineWidth = 4; g.lineCap = 'square'; g.shadowColor = acc; g.shadowBlur = 10;
  [[24, 24, 1, 1], [Wd - 24, 24, -1, 1], [24, Hg - 24, 1, -1], [Wd - 24, Hg - 24, -1, -1]].forEach(([px, py, dx, dy]) => {
    g.beginPath(); g.moveTo(px + dx * 30, py); g.lineTo(px, py); g.lineTo(px, py + dy * 30); g.stroke(); });
  g.restore();
  // entrenador: tu sprite (Opciones · Sprite de entrenador) bien grande sobre una peana neón, y su nombre debajo
  const tx = 238;
  g.save(); g.fillStyle = C + '22'; g.beginPath(); g.ellipse(tx, 522, 150, 28, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = C; g.lineWidth = 3; g.shadowColor = C; g.shadowBlur = 22; g.stroke(); g.restore();
  const tu = playerTrainerSpr(), tim = tu && await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = tu; });
  if (tim) {
    // 80 × 80 px → 520 × 520, nítido (sin suavizar), con los pies sobre la peana y un halo del color de la región
    const s = 520; g.save(); g.imageSmoothingEnabled = false; g.shadowColor = C; g.shadowBlur = 26;
    g.drawImage(tim, tx - s / 2, 538 - s, s, s); g.restore();
  }
  const name = (typeof trainerName === 'function' ? trainerName() : 'Entrenador');
  g.textAlign = 'center'; g.fillStyle = '#e7edf8'; g.font = F(600, 38); g.shadowColor = C; g.shadowBlur = 14; g.fillText(name, tx, 580); g.shadowBlur = 0;
  g.font = F(500, 14, 'IBM Plex Mono'); g.fillStyle = C; g.fillText('ENTRENADOR', tx, 603);
  // cabecera de la derecha
  const rx = 480; g.textAlign = 'left';
  g.font = F(500, 16, 'IBM Plex Mono'); g.fillStyle = acc; g.fillText(`RULETA POKÉMON · ${(x.name || '').toUpperCase()}`, rx, 72);
  g.font = F(600, 44); g.fillStyle = x.won ? '#7ee0a1' : '#ff8a7a'; g.fillText(x.won ? '¡Campeón!' : 'Derrota' + (x.lostTo ? ' · ' + x.lostTo : ''), rx, 120);
  g.font = F(500, 18, 'IBM Plex Mono'); g.fillStyle = '#a9b4c8'; g.fillText(`${x.points} PTS · RANGO ${x.rank} · ${x.badges} MEDALLAS · ${histWhen(x.t).toUpperCase()}`, rx, 154);
  // las 8 medallas arriba a la derecha (encendidas las que conseguiste) y una línea que separa la cabecera de las fichas
  g.save(); for (let k = 0; k < 8; k++) { const bx = Wd - 52 - (7 - k) * 26, by = 66, on = k < x.badges;
    g.beginPath(); g.moveTo(bx, by - 10); g.lineTo(bx + 9, by); g.lineTo(bx, by + 10); g.lineTo(bx - 9, by); g.closePath();
    if (on) { g.fillStyle = C; g.shadowColor = C; g.shadowBlur = 10; g.fill(); g.shadowBlur = 0; } else { g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1.5; g.stroke(); } }
  const sl = g.createLinearGradient(rx, 0, Wd - 40, 0); sl.addColorStop(0, C); sl.addColorStop(1, 'transparent');
  g.fillStyle = sl; g.fillRect(rx, 166, Wd - 40 - rx, 1.5); g.restore();
  // los 6 Pokémon: 3 × 2 fichas como las miniaturas de la Pokédex (número y generación arriba, número grande de fondo,
  // franja diagonal con sus colores, sprite, nombre e iconos de tipo)
  const team = x.team.slice(0, 6), loadImg = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  const load = m => { const r = monSprite(m); return r ? loadImg(r.u).then(im => im && { im, px: !!r.px, fb: r.fb || 0, fx: r.fx || .5, fw: r.fw || .45 }) : Promise.resolve(null); };
  // icono de tipo: su dibujo (TYPE_ICONS) en blanco o negro según el color, dentro de un círculo del color del tipo
  const tyIcons = {};
  await Promise.all([...new Set(team.flatMap(m => mtypes(m)))].map(async t => {
    const c = TYPE_COLORS[t] || '#8592ab', ink = lum(c) > 0.55 ? '#0b0f1a' : '#ffffff', d = (TYPE_ICONS[t] || '').replace(/currentColor/g, ink);
    tyIcons[t] = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="${ink}">${d}</svg>`));
  }));
  const imgs = await Promise.all(team.map(load)), cw = 220, ch = 200, gx = 14, gy = 16, y0 = 182;
  for (let i = 0; i < 6; i++) {
    const cx = rx + (i % 3) * (cw + gx), cy = y0 + Math.floor(i / 3) * (ch + gy), m = team[i];
    g.save(); g.beginPath(); g.roundRect ? g.roundRect(cx, cy, cw, ch, 6) : g.rect(cx, cy, cw, ch); g.clip();
    g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(cx, cy, cw, ch);
    if (m) { const ty2 = mtypes(m), c1 = TYPE_COLORS[ty2[0]] || '#8592ab', c2 = TYPE_COLORS[ty2[1]] || c1, no = padN(m.n), gen = (BY_NUM.get(m.n) || [])[2];
      // franja diagonal (de arriba a la derecha hacia abajo a la izquierda) con sus colores
      const lg = g.createLinearGradient(cx + cw, cy, cx, cy + ch);
      lg.addColorStop(0, 'rgba(255,255,255,.6)'); lg.addColorStop(.26, c1); lg.addColorStop(.7, c2); lg.addColorStop(.96, 'transparent');
      g.globalAlpha = .18; g.fillStyle = lg; g.beginPath(); g.moveTo(cx + cw * .68, cy); g.lineTo(cx + cw, cy); g.lineTo(cx + cw, cy + ch * .24); g.lineTo(cx + cw * .4, cy + ch); g.lineTo(cx, cy + ch); g.lineTo(cx, cy + ch * .5); g.closePath(); g.fill(); g.globalAlpha = 1;
      // número grande de fondo, solo el contorno, abajo a la derecha (detrás del nombre y los tipos)
      g.font = F(300, no.length > 3 ? 62 : 76); g.textAlign = 'right'; g.lineWidth = 1.2; g.strokeStyle = c1 + '77'; g.textBaseline = 'alphabetic'; g.strokeText(no, cx + cw - 6, cy + ch - 8);
      // rayita de color arriba a la izquierda
      g.fillStyle = c1; g.shadowColor = c1; g.shadowBlur = 10; g.fillRect(cx, cy, 34, 3); g.shadowBlur = 0;
      // arriba: «Nº 006» y «GEN I»
      g.font = F(500, 13, 'IBM Plex Mono'); g.textAlign = 'left'; g.fillStyle = c1; g.fillText(`Nº ${no}`, cx + 12, cy + 24);
      g.textAlign = 'right'; g.fillStyle = '#8b97ad'; g.fillText(gen ? `GEN ${ROMAN[gen]}` : '', cx + cw - 12, cy + 24);
      // sprite con los pies sobre su sombra, como en la Pokédex: cada imagen trae medido el hueco que deja bajo los pies (fb),
      // dónde está su centro (fx) y lo ancho que es (fw). Los que vuelan se quedan un poco por encima de su sombra
      const im = imgs[i], s = 124, sx0 = cx + (cw - s) / 2, floor = cy + 136, fly = FLYING.has(m.n);
      const fx = im ? im.fx : .5, fw = im ? im.fw : .45;
      g.fillStyle = 'rgba(0,0,0,.32)'; g.beginPath(); g.ellipse(sx0 + fx * s, floor, Math.max(18, fw * s * .5), 7, 0, 0, Math.PI * 2); g.fill();
      if (im) { g.imageSmoothingEnabled = !im.px; g.drawImage(im.im, sx0, floor - s + im.fb * s + 2 - (fly ? 22 : 0), s, s); g.imageSmoothingEnabled = true; }
      // abajo: nombre e iconos de tipo
      g.textAlign = 'left'; g.font = F(600, 18); g.fillStyle = m.shiny ? '#ffd84a' : '#e7edf8'; g.fillText(dname(m), cx + 12, cy + ch - 38, cw - 24);
      ty2.forEach((t, k) => { const ix = cx + 23 + k * 28, iy = cy + ch - 19;
        g.fillStyle = TYPE_COLORS[t] || '#8592ab'; g.beginPath(); g.arc(ix, iy, 11, 0, Math.PI * 2); g.fill();
        if (tyIcons[t]) g.drawImage(tyIcons[t], ix - 7, iy - 7, 14, 14); }); }
    else { g.strokeStyle = 'rgba(255,255,255,.12)'; g.setLineDash([6, 6]); g.strokeRect(cx + 1, cy + 1, cw - 2, ch - 2); g.setLineDash([]); }
    g.restore();
    g.strokeStyle = m ? (TYPE_COLORS[mtypes(m)[0]] || '#8592ab') + '66' : 'transparent'; g.lineWidth = 1.2; g.beginPath(); g.roundRect ? g.roundRect(cx, cy, cw, ch, 6) : g.rect(cx, cy, cw, ch); g.stroke();
  }
  const url = cv.toDataURL('image/png'), file = `ruleta-pokemon-${x.region}-${new Date(x.t).toISOString().slice(0, 10)}.png`;
  // vista previa con «Descargar» (en algunos sitios el navegador no deja descargar sin más: así siempre se puede guardar la imagen)
  const sh = document.createElement('div'); sh.className = 'exp-shade';
  sh.innerHTML = `<div class="exp-box frame"><img src="${url}" alt="Imagen de la partida"><div class="btns"><a class="btn" href="${url}" download="${file}">Descargar</a><button class="btn ghostbtn" type="button">Cerrar</button></div></div>`;
  document.body.appendChild(sh);
  const close = () => sh.remove();
  sh.querySelector('button').onclick = close; sh.addEventListener('click', e => { if (e.target === sh) close(); });
}
// guarda el equipo campeón para poder volver a ver el Hall de la Fama desde Opciones
function saveHof() {
  const d = { region: run.region, name: REG().name, team: run.team.slice(0, 6).map(m => ({ n: m.n, form: m.form || 0, shiny: !!m.shiny })), points: run.points, rank: rank(run.points), badges: run.badges.length };
  if (run.region !== 'test') store.setJSON('ruleta-hof', d);   // (el Modo Test no se guarda)
  return d;
}
function lastHof() { const d = store.getJSON('ruleta-hof'); return d && d.team && d.team.length ? d : null; }
