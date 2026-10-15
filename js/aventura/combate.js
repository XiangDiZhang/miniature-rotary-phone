// Aventura: combates (quesitos verdes y rojos), formas de combate y derrota
// ---- Combate (sistema de la Ruleta Pokémon original) ----
// Quesitos verdes = 3 de base + el PODER de cada Pokémon del equipo (+2 ventaja de tipo, +3 si es arrolladora).
// Quesitos rojos  = base del combate (gimnasio 1 · Alto Mando 2 · Campeón 3) + 1 por cada 2 rondas superadas (medallas y Alto Mando) + poder medio del rival × 2
//                   + 1 si alguien de tu equipo es débil al rival (+2 si son más de tres).
// Los de la caja no combaten: no suman poder, pero tampoco cuentan sus debilidades.
const eff = (t, defTypes) => defTypes.reduce((x, d) => x * (CHART[t][d] ?? 1), 1);
// poder 1-5: 1 básico, 2 primera evolución, 3 evolución final; los de una sola etapa según sus estadísticas;
// pseudolegendarios (600) 4 y legendarios/singulares 5
const stageOf = n => { let s = 1; while (INFO[n - 1][13]) { n = INFO[n - 1][13]; s++; } return s; };
const bstOf = n => INFO[n - 1][3].reduce((a, b) => a + b, 0);
function power(n) {
  if (isLegend(n)) return 5;
  const b = bstOf(n), st = stageOf(n), evo = nextEvos(n).length > 0;
  if (!evo && b >= 600) return 4;
  if (st === 1 && !evo) return b >= 500 ? 3 : b >= 400 ? 2 : 1;
  return Math.min(3, st);
}
// dificultad: en la web cada ronda suma un rojo; aquí suman 3 rojos cada 4 rondas (medallas + Alto Mando)
// dificultad por avance: 1 rojo cada 2 rondas (medallas + Alto Mando); la fuerza del rival se suma aparte
const round = () => Math.floor((run.badges.length + (run.eliteWins || 0)) / 2);
const foeTypesOf = (foe, types) => types ? [].concat(types) : [...new Set(foe.map(n => ptypes(n)[0]))];
function battleSegs(foe, base, types) {
  const ft = foeTypesOf(foe, types), notes = [], G = [], Rd = [];
  G.push({ label: 'Victoria' }, { label: 'Victoria' }, { label: 'Victoria' });
  run.team.forEach(m => { const pw = power(m.n); for (let i = 0; i < pw; i++) G.push({ label: 'Victoria' }); });
  const adv = run.team.filter(m => mtypes(m).some(t => ft.some(d => eff(t, [d]) > 1))).length;
  const weak = run.team.filter(m => ft.some(t => eff(t, mtypes(m)) > 1)).length;
  const advN = adv >= 3 ? 3 : adv ? 2 : 0;
  for (let i = 0; i < advN; i++) G.push({ label: 'Victoria' });
  if (advN) notes.push(`▲ ${adv >= 3 ? 'Ventaja arrolladora' : 'Ventaja de tipo'} (+${advN})`);
  const rd = round(), weakN = weak > 3 ? 2 : weak ? 1 : 0;
  for (let i = 0; i < base; i++) Rd.push({ label: 'Derrota' });
  for (let i = 0; i < rd; i++) Rd.push({ label: 'Derrota' });
  // la fuerza del rival: su poder medio × 2 en quesitos rojos (no es lo mismo un Gastly que un Gengar)
  const foePw = foe.length ? foe.reduce((a, n) => a + power(n), 0) / foe.length : 1, fpN = Math.round(foePw * 2);
  for (let i = 0; i < fpN; i++) Rd.push({ label: 'Derrota' });
  notes.push(`Fuerza del rival +${fpN}`);
  for (let i = 0; i < weakN; i++) Rd.push({ label: 'Derrota' });
  if (weakN) notes.push(`▼ ${weak} débil${weak > 1 ? 'es' : ''} a ${listJoin(ft)} (+${weakN} rojo${weakN > 1 ? 's' : ''})`);
  if (rd) notes.push(`Dificultad +${rd}`);
  // reparte verdes y rojos intercalados
  const N = G.length + Rd.length, segs = []; let acc = 0, g = 0, r = 0;
  for (let i = 0; i < N; i++) {
    acc += G.length / N;
    if ((acc >= 1 - 1e-9 && g < G.length) || r >= Rd.length) { acc -= 1; segs.push({ ...G[g], short: 'VICTORIA', color: g % 2 ? '#62b33a' : '#7ac74c', ok: 1 }); g++; }
    else { segs.push({ ...Rd[r], short: 'DERROTA', color: r % 2 ? '#e8473a' : '#ff5a46' }); r++; }
  }
  return { segs, p: G.length / N, n: N, g: G.length, notes };
}

// el rango depende de la región (la de Johto es mucho más larga)
function rank(p, region = run && run.region) { const k = (REGIONS[region] || {}).rankScale || 1, x = p / k; return x >= 1200 ? 'S' : x >= 850 ? 'A' : x >= 550 ? 'B' : x >= 300 ? 'C' : 'D'; }

let curBattle = null;

// Solo hay un intento: si pierdes un combate, se acaba la partida… salvo que te quede una Poción.
// onLose (opcional) = combate que no hace perder la partida (el primero contra el rival).

function battleFormsOn() {
  const changed = [];
  run.team.forEach(m => {
    if ('bf' in m) return;
    const e = BATTLE_FORMS[`${m.n}:${m.form || 0}`]; if (!e || !formRec(Array.isArray(e[0]) ? e[0][0] : e[0])) return;
    const before = dname(m), to = Array.isArray(e[0]) ? e[0][rnd(0, e[0].length - 1)] : e[0];
    m.bf = m.form || 0; m.form = to; changed.push(`${before} → ${dname(m)} (${e[1]})`);
  });
  if (!changed.length) return;
  log(`✨ En combate: ${changed.join(' · ')}.`); advToast(`✨ ${changed.length > 1 ? '¡Cambian de forma!' : '¡' + changed[0].split(' (')[0] + '!'}`); chord([523, 784, 1046]);
  renderAdv(); flashForms();
}
// al terminar el combate (o al recargar la partida) todos vuelven a su forma normal
function battleFormsOff() {
  if (!run) return; let any = false;
  [...run.team, ...run.box.filter(Boolean), ...stolenList()].forEach(m => { if (!('bf' in m)) return; if (m.bf) m.form = m.bf; else delete m.form; delete m.bf; any = true; });
  if (any) { renderAdv(); saveRun(); }
}
// destello en las fichas del equipo que han cambiado de forma
function flashForms() { if (reduceMotion) return; requestAnimationFrame(() => document.querySelectorAll('#advTeam .tmw').forEach((el, i) => { const m = run.team[i]; if (m && 'bf' in m && el.animate) el.animate([{ filter: 'brightness(2.6) saturate(0)', transform: 'scale(1.06)' }, { filter: 'none', transform: 'none' }], { duration: 700, easing: 'ease-out' }); })); }
function battle(title, who, foe, base, onWin, extra = '', onLose = null, types = null) {
  let again = false, retries = 0, disguise = false;
  const end = () => battleFormsOff();
  const show = () => {
    battleFormsOn();
    const B = battleSegs(foe, base, types);
    const sub = again ? `¡Revancha! Misma ruleta, vuelve a girar.${retries ? ` (Te quedan ${retries} reintento${retries > 1 ? 's' : ''} de la poción.)` : ''}`
      : `${who} te reta con ${listJoin(foe.map(pname))}. ${B.g} de ${B.n} quesitos verdes (${pct(B.p)}).${B.notes.length ? ' ' + B.notes.join(' · ') + '.' : ''}${extra}${run.team.length > 1 || boxList().length ? ' Puedes cambiar tu equipo en la Caja PC antes de girar.' : ''}`;
    spinUI(title, sub, B.segs, 'COMBATE', r => {
      if (r.ok) { end(); return onWin(); }
      if (onLose) { end(); return onLose(); }
      if (retries > 0) { retries--; again = true; return advSay(`${who} te ha ganado… pero tu poción aún aguanta.`, () => advButtons([{ label: 'Volver a girar', fn: show }])); }
      const have = ['potion', 'super', 'hyper'].filter(k => (run.bag[k] || 0) > 0);
      if (have.length) {
        log(`💥 Pierdes contra ${who}… ¡pero te quedan pociones!`);
        return advSay(`${who} te ha ganado… ¡Espera! Te quedan pociones. Úsalas para volver a girar la misma ruleta.`, () => advButtons(have.map(k => ({
          label: `Usar ${ITEMS[k].name} (${ITEMS[k].retries > 1 ? ITEMS[k].retries + ' giros' : '1 giro'}) · quedan ${run.bag[k]}`, ghost: k !== have[0],
          fn: () => { run.bag[k]--; retries = ITEMS[k].retries - 1; again = true; log(`🧪 Usas ${ITEMS[k].name}: ¡revancha!`); renderAdv(); saveRun(); show(); } }))));
      }
      if (!disguise && run.team.some(m => m.n === 778)) { disguise = true; again = true; log('👻 ¡El Disfraz de Mimikyu aguanta el golpe!'); return advSay('¡El Disfraz de Mimikyu se rompe, pero aguanta el golpe! Una oportunidad más.', () => advButtons([{ label: 'Volver a girar', fn: show }])); }
      end(); gameOver(who);
    });
    curBattle = show;
  };
  show();
}
function gameOver(who) {
  run.over = true; run.lostTo = who; run.record = saveBest(); saveHistory(false);
  log(`☠️ Derrota contra ${who}. Fin de la partida.`); renderAdv(); saveRun();
  advButtons([]); $('advStep').textContent = 'Fin de la partida'; advWheel.enabled = false;
  if (reduceMotion) return phaseGameOver();
  loseScreen(who, phaseGameOver);
}
function phaseGameOver() {
  $('advStep').textContent = 'Fin de la partida'; advWheel.enabled = false;
  advSay(`${run.overMsg || `${run.lostTo || 'Tu rival'} te ha derrotado y no te quedaban Pociones.`} Fin de la partida: ${run.points} puntos (rango ${rank(run.points)}).${run.record ? ' ¡Nuevo récord!' : ''}`, () => advButtons([
    { label: 'Nueva partida', fn: () => advStart(true) }, { label: '← Menú', ghost: true, fn: goMenu }]));
}
