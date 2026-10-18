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
function log(t) { run.log.unshift(t); run.log = run.log.slice(0, 40); }
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
function renderHistory(region) {
  const el = $('advHist'); if (!el) return;
  const h = store.getJSON('ruleta-hist', []).filter(x => !region || x.region === region);
  if (!h.length) { el.innerHTML = '<p class="label">Historial de partidas</p><p class="hist-empty">Aún no has terminado ninguna partida en esta región.</p>'; return; }
  const mini = m => `<span class="hist-mon${m.shiny ? ' shiny' : ''}" title="${dname(m)}${m.nick ? ' (' + sname(m) + ')' : ''}">${monThumb(m)}<em>${dname(m)}</em></span>`;
  el.innerHTML = `<p class="label">Historial de partidas</p><div class="hist-list">${h.map(x => {
    const d = new Date(x.t), when = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) + ' · ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return `<div class="hist-row ${x.won ? 'won' : 'lost'}"><div class="hist-head"><b>${x.won ? 'Victoria · Campeón' : 'Derrota' + (x.lostTo ? ' · contra ' + x.lostTo : '')}</b><span>${when}</span><span class="hist-pts">${x.points} pts · ${x.rank} · ${x.badges} medallas</span></div><div class="hist-team">${x.team.map(mini).join('')}</div></div>`; }).join('')}</div>`;
}
// guarda el equipo campeón para poder volver a ver el Hall de la Fama desde Opciones
function saveHof() {
  const d = { region: run.region, name: REG().name, team: run.team.slice(0, 6).map(m => ({ n: m.n, form: m.form || 0, shiny: !!m.shiny })), points: run.points, rank: rank(run.points), badges: run.badges.length };
  store.setJSON('ruleta-hof', d);
  return d;
}
function lastHof() { const d = store.getJSON('ruleta-hof'); return d && d.team && d.team.length ? d : null; }
