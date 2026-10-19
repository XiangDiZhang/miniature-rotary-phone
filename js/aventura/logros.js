// Estadísticas del entrenador y logros. Se guardan en este navegador («ruleta-stats» y «ruleta-logros») y se ven en Perfil.
// El Modo Test no cuenta para nada.
const STATS_KEY = 'ruleta-stats', ACH_KEY = 'ruleta-logros', HOF_LIST_KEY = 'ruleta-hof-list';
const statsGet = () => Object.assign({ cap: 0, shiny: 0, legend: 0, evo: 0, mega: 0, gmax: 0, badges: 0, games: 0, wins: 0, losses: 0, time: 0, fav: {}, champs: [], nuzWins: 0, dailyWins: 0 }, store.getJSON(STATS_KEY, {}));
const counts = () => run && run.region === 'test' ? false : true;
// suma a una estadística (y comprueba los logros)
function stat(k, v = 1) {
  if (!counts()) return;
  const s = statsGet(); s[k] = (s[k] || 0) + v; store.setJSON(STATS_KEY, s); achCheck(s);
}

// ---- Logros: [id, nombre, cómo se consigue, icono, se cumple si…] ----
const ACHIEVEMENTS = [
  ['cap1', 'Primera captura', 'Captura tu primer Pokémon.', '🎯', s => s.cap >= 1],
  ['cap50', 'Coleccionista', 'Captura 50 Pokémon.', '🎒', s => s.cap >= 50],
  ['cap200', 'Maestro de las Poké Balls', 'Captura 200 Pokémon.', '🏅', s => s.cap >= 200],
  ['shiny1', '¡Brilla!', 'Consigue tu primer Pokémon shiny.', '✦', s => s.shiny >= 1],
  ['shiny5', 'Cazador de shinys', 'Consigue 5 Pokémon shiny.', '🌟', s => s.shiny >= 5],
  ['leg1', 'Leyenda viva', 'Captura un Pokémon legendario o singular.', '★', s => s.legend >= 1],
  ['leg5', 'Domador de leyendas', 'Captura 5 legendarios o singulares.', '👑', s => s.legend >= 5],
  ['evo1', 'Primera evolución', 'Haz evolucionar a un Pokémon.', '✨', s => s.evo >= 1],
  ['evo50', 'Profesor de evolución', 'Haz evolucionar 50 Pokémon.', '🧬', s => s.evo >= 50],
  ['mega', 'Vínculo mega', 'Megaevoluciona a un Pokémon en combate.', '💎', s => s.mega >= 1],
  ['gmax', 'Tamaño colosal', 'Gigamaxiza a un Pokémon en combate.', '🔴', s => s.gmax >= 1],
  ['badge1', 'Primera medalla', 'Gana tu primera medalla de gimnasio.', '◆', s => s.badges >= 1],
  ['badge50', 'Vitrina llena', 'Gana 50 medallas en total.', '🏆', s => s.badges >= 50],
  ['win1', '¡Campeón!', 'Gana la Liga de una región.', '🏆', s => s.wins >= 1],
  ['win3', 'Trotamundos', 'Sé campeón de 3 regiones distintas.', '🗺️', s => s.champs.filter(r => REGIONS[r] && !REGIONS[r].chaos).length >= 3],
  ['win9', 'Maestro Pokémon', 'Sé campeón de las 9 regiones.', '🌍', s => s.champs.filter(r => REGIONS[r] && !REGIONS[r].chaos).length >= 9],
  ['caos', 'Sobreviviente del Caos', 'Gana el Modo Caos.', '∞', s => s.champs.includes('caos')],
  ['random', 'Suerte de campeón', 'Gana el Randomlocke.', '🎲', s => s.champs.includes('randomlocke')],
  ['nuz', 'Sin red de seguridad', 'Gana un Nuzlocke.', '💀', s => s.nuzWins >= 1],
  ['daily', 'Reto cumplido', 'Supera un reto diario.', '📅', s => s.dailyWins >= 1],
  ['nopot', 'Sin pociones', 'Gana la Liga sin gastar ninguna poción.', '🧪', s => !!s.noPot],
  ['mono', 'Especialista', 'Gana la Liga con todo tu equipo compartiendo un tipo.', '🎨', s => !!s.mono],
  ['dex100', 'Investigador', 'Registra 100 especies en la Pokédex.', '📘', () => PDX.c.size >= 100],
  ['dex500', 'Enciclopedia andante', 'Registra 500 especies en la Pokédex.', '📚', () => PDX.c.size >= 500],
  ['hours', 'Entrenador dedicado', 'Juega 5 horas en total.', '⏱️', s => s.time >= 5 * 3600],
];
const achGet = () => store.getJSON(ACH_KEY, {});
// comprueba los logros y avisa de los nuevos
function achCheck(s = statsGet()) {
  if (!counts()) return;
  const got = achGet(); let any = false;
  ACHIEVEMENTS.forEach(([id, name, , ico, ok]) => { if (got[id]) return; let pass = false; try { pass = ok(s); } catch (e) {} if (pass) { got[id] = Date.now(); any = true; achPop(name, ico); } });
  if (any) store.setJSON(ACH_KEY, got);
}
// aviso de logro: una banda dorada arriba en el centro, que se va sola
let achFree = 0;
function achPop(name, ico) {
  const at = Math.max(performance.now(), achFree); achFree = at + 3200;
  setTimeout(() => {
    const el = document.createElement('div'); el.className = 'ach-pop';
    el.innerHTML = `<span class="ach-ico">${ico}</span><span class="ach-tx"><small>Logro desbloqueado</small><b>${name}</b></span>`;
    document.body.appendChild(el); if (typeof chord === 'function') chord([659, 880, 1175, 1568]); setTimeout(() => el.remove(), 3000);
  }, at - performance.now());
}

// ---- Final de una partida: victorias, derrotas, favoritos, campeonatos y el Hall de la Fama histórico ----
function statsEndRun(won) {
  if (!counts() || !run) return;
  const s = statsGet(); s.games++; if (won) s.wins++; else s.losses++;
  allMine().forEach(m => { s.fav[m.n] = (s.fav[m.n] || 0) + 1; });
  if (won) {
    if (!s.champs.includes(run.region)) s.champs.push(run.region);
    if (!run.potUsed) s.noPot = 1;
    const t = run.team.map(mtypes); if (run.team.length >= 3 && t[0].some(ty => t.every(x => x.includes(ty)))) s.mono = 1;
    if (run.nuzlocke) s.nuzWins++;
    if (run.daily) s.dailyWins++;
    const list = store.getJSON(HOF_LIST_KEY, []);
    list.unshift({ t: Date.now(), region: run.region, name: REG().name, points: run.points, rank: rank(run.points), team: run.team.slice(0, 6).map(m => ({ n: m.n, form: m.form || 0, shiny: !!m.shiny, nick: m.nick || '' })) });
    store.setJSON(HOF_LIST_KEY, list.slice(0, 60));
  }
  store.setJSON(STATS_KEY, s); achCheck(s);
}
// tiempo jugado: cada 10 s en la aventura (con la pestaña a la vista)
setInterval(() => { if (typeof state !== 'undefined' && state.scene === 'adv' && !document.hidden && run && counts()) { const s = statsGet(); s.time += 10; store.setJSON(STATS_KEY, s); } }, 10000);
// la primera vez, se rellena con lo que ya había: el historial de partidas y el último equipo campeón
(() => {
  if (store.get(STATS_KEY)) return;
  const h = store.getJSON('ruleta-hist', []), s = statsGet();
  h.filter(x => x.region !== 'test').forEach(x => { s.games++; if (x.won) { s.wins++; if (!s.champs.includes(x.region)) s.champs.push(x.region); } else s.losses++;
    s.badges += x.badges || 0; (x.team || []).forEach(m => { s.fav[m.n] = (s.fav[m.n] || 0) + 1; }); });
  store.setJSON(STATS_KEY, s);
  const last = store.getJSON('ruleta-hof', null);
  if (last && last.team && !store.get(HOF_LIST_KEY)) store.setJSON(HOF_LIST_KEY, [{ t: last.t || Date.now(), region: last.region, name: last.name, points: last.points, rank: last.rank, team: last.team }]);
})();
