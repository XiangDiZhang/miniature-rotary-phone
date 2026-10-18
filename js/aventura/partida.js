// Aventura: estado de la partida, guardado, nombres y formas de tus Pokémon, historial
// ---- Estado de la partida (se guarda en este navegador, una por región) ----
let run = null, advWheel = null;
const REG = () => REGIONS[run.region];
const loc = () => REG().path[run.step];
const VIL = () => VILLAINS[(run && REG().villain) || 'rocket'];
function newRun(region = 'kanto') { return { chaos: region === 'caos' ? chaosPlan() : undefined, v: 5, kv: 2, ball: 0, sub: 0, extra: 0, pending: [], stolen: null, xatk: 0, region, step: 0, stepDone: false, team: [], box: [], bag: { potion: (REGIONS[region] && REGIONS[region].potions) || 1 }, points: 0, badges: [], tea: 0, evoFails: 0, starter: 0, over: false, log: [] }; }
function saveRun() { run.t = Date.now(); store.setJSON('ruleta-run-' + run.region, run); }   // t: cuándo se jugó por última vez (Partidas en curso)
function loadRun(region) {
  const r = store.getJSON('ruleta-run-' + region);
  if (!(r && REGIONS[r.region] && r.v === 5 && (r.region !== 'kanto' || r.kv === 2))) return null;   // partidas de versiones antiguas: no valen
  // si se guardó en mitad de un combate, cada Pokémon vuelve a su forma normal (también si estaba megaevolucionado o Gigamax)
  [...(r.team || []), ...(r.box || []).filter(Boolean), ...(Array.isArray(r.stolen) ? r.stolen : r.stolen ? [r.stolen] : [])].forEach(restoreForm);
  if (r.region === 'caos' && !(r.chaos && r.chaos.gyms)) return null;
  return r;
}
// récord de puntos de cada región
const getBest = () => store.getJSON('ruleta-best', {});
function saveBest() {
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
function addMon(n, shiny) { const m = { n, shiny: !!shiny }; dexRegister(n, !!shiny); if (run.team.length < 6) run.team.push(m); else boxAdd(m); return m; }

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
function monThumb(m) { const r = monSprite(m); return r ? `<img src="${r.u}" alt="">` : typePh(mtypes(m)); }
// a qué puede evolucionar ESTE Pokémon (según su forma) y con qué forma queda
function evoOptions(m) {
  const all = EVO_KIDS.get(m.n) || [];
  const special = all.filter(t => REG_REQ[t] && REG_REQ[t] === m.form);
  const list = special.length ? special : all.filter(t => !REG_REQ[t]);
  const tag = regionTag(m.form), r = formRec(m.form), lbl = r && r[1][1];
  return list.map(t => {
    const fl = FORMS[t] || [];
    const f = tag ? fl.find(x => x[8] === 'reg' && x[0] !== 10178 && x[1].includes(tag)) : lbl ? fl.find(x => x[1] === lbl) : null;
    return { n: t, form: f ? f[0] : 0 };
  });
}

// ---- Historial de partidas: equipo (con motes), puntos y si ganaste o perdiste ----
function saveHistory(won) {
  if (!run || run.histSaved) return; run.histSaved = true;
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
  let h = Math.max(140, Math.floor(innerHeight - top - 22)); v.style.height = h + 'px';
  // lo que quede por debajo (márgenes de la página) también cuenta: se descuenta para que la página no se desplace
  const over = document.documentElement.scrollHeight - innerHeight; if (over > 0) v.style.height = Math.max(140, h - over) + 'px';
}
addEventListener('resize', fitHistory);
// el historial se arrastra con el ratón como la Pokédex (con el dedo ya se desplaza solo), con inercia al soltar
(() => {
  let d = null;
  document.addEventListener('pointerdown', e => {
    const v = e.target.closest && e.target.closest('.hist-view'); if (!v || e.pointerType !== 'mouse' || e.button > 0 || e.target.closest('button')) return;
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

// ---- Imagen de una partida: tu entrenador (de momento, una silueta neón; más adelante, su sprite) con su nombre debajo,
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
  g.strokeStyle = C; g.lineWidth = 2; g.shadowColor = C; g.shadowBlur = 18; g.strokeRect(14, 14, Wd - 28, Hg - 28); g.shadowBlur = 0;
  // entrenador: silueta neón (gorra, cabeza, cuerpo) sobre una peana, y su nombre debajo
  const tx = 230, ty = 300;
  g.save(); g.fillStyle = C + '22'; g.beginPath(); g.ellipse(tx, ty + 205, 130, 26, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = C; g.lineWidth = 3; g.shadowColor = C; g.shadowBlur = 22; g.stroke();
  g.lineWidth = 5; g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = '#e7edf8'; g.shadowColor = acc; g.fillStyle = 'rgba(231,237,248,.06)';
  g.beginPath(); g.arc(tx, ty - 95, 46, 0, Math.PI * 2); g.fill(); g.stroke();                                   // cabeza
  g.beginPath(); g.moveTo(tx - 52, ty - 112); g.quadraticCurveTo(tx, ty - 175, tx + 52, ty - 112); g.lineTo(tx + 92, ty - 104); g.lineTo(tx + 50, ty - 96); g.closePath(); g.fillStyle = C; g.fill(); g.stroke();   // gorra
  g.fillStyle = 'rgba(231,237,248,.06)'; g.beginPath(); g.moveTo(tx - 80, ty + 190); g.lineTo(tx - 72, ty + 10); g.quadraticCurveTo(tx, ty - 40, tx + 72, ty + 10); g.lineTo(tx + 80, ty + 190); g.closePath(); g.fill(); g.stroke();   // cuerpo
  g.beginPath(); g.arc(tx, ty + 70, 22, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(tx - 22, ty + 70); g.lineTo(tx + 22, ty + 70); g.stroke();   // Poké Ball del pecho
  g.restore();
  const name = (typeof trainerName === 'function' ? trainerName() : 'Entrenador');
  g.textAlign = 'center'; g.fillStyle = '#e7edf8'; g.font = F(600, 40); g.shadowColor = C; g.shadowBlur = 14; g.fillText(name, tx, ty + 270); g.shadowBlur = 0;
  g.font = F(500, 15, 'IBM Plex Mono'); g.fillStyle = C; g.fillText('ENTRENADOR', tx, ty + 296);
  // cabecera de la derecha
  const rx = 480; g.textAlign = 'left';
  g.font = F(500, 16, 'IBM Plex Mono'); g.fillStyle = acc; g.fillText(`RULETA POKÉMON · ${(x.name || '').toUpperCase()}`, rx, 72);
  g.font = F(600, 44); g.fillStyle = x.won ? '#7ee0a1' : '#ff8a7a'; g.fillText(x.won ? '¡Campeón!' : 'Derrota' + (x.lostTo ? ' · ' + x.lostTo : ''), rx, 120);
  g.font = F(500, 18, 'IBM Plex Mono'); g.fillStyle = '#a9b4c8'; g.fillText(`${x.points} PTS · RANGO ${x.rank} · ${x.badges} MEDALLAS · ${histWhen(x.t).toUpperCase()}`, rx, 154);
  // los 6 Pokémon: 3 × 2 casillas con el color de su tipo, su sprite y su nombre
  const team = x.team.slice(0, 6), load = m => new Promise(res => { const r = monSprite(m); if (!r) return res(null); const im = new Image(); im.onload = () => res({ im, px: !!r.px }); im.onerror = () => res(null); im.src = r.u; });
  const imgs = await Promise.all(team.map(load)), cw = 220, ch = 200, gx = 14, gy = 16, y0 = 182;
  for (let i = 0; i < 6; i++) {
    const cx = rx + (i % 3) * (cw + gx), cy = y0 + Math.floor(i / 3) * (ch + gy), m = team[i];
    g.save(); g.beginPath(); g.roundRect ? g.roundRect(cx, cy, cw, ch, 10) : g.rect(cx, cy, cw, ch); g.clip();
    g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(cx, cy, cw, ch);
    if (m) { const ty2 = mtypes(m), c1 = TYPE_COLORS[ty2[0]] || '#8592ab', c2 = TYPE_COLORS[ty2[1]] || c1, lg = g.createLinearGradient(cx + cw, cy, cx, cy + ch);
      lg.addColorStop(0, 'rgba(255,255,255,.5)'); lg.addColorStop(.3, c1); lg.addColorStop(.75, c2); lg.addColorStop(1, 'transparent');
      g.globalAlpha = .2; g.fillStyle = lg; g.beginPath(); g.moveTo(cx + cw * .68, cy); g.lineTo(cx + cw, cy); g.lineTo(cx + cw, cy + ch * .24); g.lineTo(cx + cw * .4, cy + ch); g.lineTo(cx, cy + ch); g.lineTo(cx, cy + ch * .5); g.closePath(); g.fill(); g.globalAlpha = 1;
      g.fillStyle = c1; g.shadowColor = c1; g.shadowBlur = 10; g.fillRect(cx, cy, 40, 3); g.shadowBlur = 0;
      const im = imgs[i]; if (im) { g.imageSmoothingEnabled = !im.px; const s = 150; g.drawImage(im.im, cx + (cw - s) / 2, cy + 8, s, s); }
      g.textAlign = 'center'; g.font = F(600, 19); g.fillStyle = m.shiny ? '#ffd84a' : '#e7edf8'; g.fillText(dname(m), cx + cw / 2, cy + ch - 16); }
    else { g.strokeStyle = 'rgba(255,255,255,.12)'; g.setLineDash([6, 6]); g.strokeRect(cx + 1, cy + 1, cw - 2, ch - 2); g.setLineDash([]); }
    g.restore();
    g.strokeStyle = m ? (TYPE_COLORS[mtypes(m)[0]] || '#8592ab') + '88' : 'transparent'; g.lineWidth = 1.5; g.beginPath(); g.roundRect ? g.roundRect(cx, cy, cw, ch, 10) : g.rect(cx, cy, cw, ch); g.stroke();
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
  store.setJSON('ruleta-hof', d);
  return d;
}
function lastHof() { const d = store.getJSON('ruleta-hof'); return d && d.team && d.team.length ? d : null; }
