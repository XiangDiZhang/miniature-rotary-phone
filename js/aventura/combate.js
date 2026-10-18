// Aventura: combates (quesitos verdes y rojos), tabla de tipos, formas de combate, megaevolución/Gigamax y derrota
// ---- Combate (sistema de la Ruleta Pokémon original) ----
// Quesitos verdes = 3 de base + el PODER de cada Pokémon del equipo + lo que aporten los tipos (+ ánimo de principiante al empezar).
// Quesitos rojos  = base del combate (gimnasio 1 · Alto Mando 2 · Campeón 3) + 1 por cada 2 rondas superadas (medallas y Alto Mando)
//                   + poder medio del rival × 2 + lo que resten los tipos.
// Tipos (tabla completa, con los dos tipos de cada rival, resistencias e inmunidades), Pokémon a Pokémon de tu equipo:
//   ataque: sus golpes contra los rivales (el mejor de sus tipos, de media)   ×2 → +1 verde · ×4 → +2 verdes · ×½ o menos → +1 rojo
//   defensa: los golpes de los rivales contra él (el mejor de sus tipos)      ×2 → +1 rojo  · ×4 → +2 rojos  · ×½ o menos → +1 verde
//   (como mucho +5 verdes y +4 rojos por tipos)
// Los de la caja no combaten: no suman poder, pero tampoco cuentan sus debilidades.
const eff = (t, defTypes) => defTypes.reduce((x, d) => x * (CHART[t][d] ?? 1), 1);
const bestHit = (atk, def) => Math.max(...atk.map(t => eff(t, def)));   // el mejor golpe de un Pokémon con uno o dos tipos
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
// poder de uno de tus Pokémon: megaevolucionado o Gigamax vale uno más
const mpower = m => Math.min(5, power(m.n) + (m.tf ? 1 : 0));
// dificultad por avance: 1 rojo cada 2 rondas (medallas + Alto Mando); la fuerza del rival se suma aparte
const round = () => Math.floor((run.badges.length + (run.eliteWins || 0)) / 2);
// tipos de cada rival (los dos, si tiene dos); si no hay equipo, el tipo del combate
const foeSets = (foe, types) => foe.length ? foe.map(n => ptypes(n)) : [[].concat(types || 'Normal')];
// cómo le va a uno de tus Pokémon contra los rivales, según la tabla de tipos (g = verdes que suma, r = rojos)
function matchup(m, sets) {
  const my = mtypes(m), avg = f => sets.reduce((a, d) => a + f(d), 0) / sets.length;
  const off = avg(d => bestHit(my, d)), def = avg(d => bestHit(d, my));
  const g = (off >= 3 ? 2 : off >= 1.5 ? 1 : 0) + (def <= .5 ? 1 : 0), r = (def >= 3 ? 2 : def >= 1.5 ? 1 : 0) + (off <= .5 ? 1 : 0);
  return { off, def, g, r };
}
const xTxt = v => v === 0 ? '×0' : v <= .25 ? '×¼' : v < 1 ? '×½' : ('×' + Math.round(v * 10) / 10).replace('.', ',');
function battleSegs(foe, base, types) {
  const sets = foeSets(foe, types), notes = [], G = [], Rd = [];
  G.push({ label: 'Victoria' }, { label: 'Victoria' }, { label: 'Victoria' });
  run.team.forEach(m => { const pw = mpower(m); for (let i = 0; i < pw; i++) G.push({ label: 'Victoria' }); });
  const rk = ROOKIE_BONUS(run.badges.length);
  for (let i = 0; i < rk; i++) G.push({ label: 'Victoria' });
  if (rk) notes.push(`Ánimo de principiante +${rk}`);
  // tabla de tipos, Pokémon a Pokémon
  const mu = run.team.map(m => ({ m, ...matchup(m, sets) }));
  const tg = Math.min(5, mu.reduce((a, x) => a + x.g, 0)), tr = Math.min(4, mu.reduce((a, x) => a + x.r, 0));
  for (let i = 0; i < tg; i++) G.push({ label: 'Victoria' });
  if (tg) notes.push(`▲ Tipos a favor +${tg} (${mu.filter(x => x.g).map(x => `${mname(x.m)} ${x.off >= 1.5 ? 'pega ' + xTxt(x.off) : 'resiste'}`).join(', ')})`);
  const rd = round();
  for (let i = 0; i < base; i++) Rd.push({ label: 'Derrota' });
  for (let i = 0; i < rd; i++) Rd.push({ label: 'Derrota' });
  // la fuerza del rival: su poder medio × 2 en quesitos rojos (no es lo mismo un Gastly que un Gengar)
  const foePw = foe.length ? foe.reduce((a, n) => a + power(n), 0) / foe.length : 1, fpN = Math.round(foePw * 2);
  for (let i = 0; i < fpN; i++) Rd.push({ label: 'Derrota' });
  notes.push(`Fuerza del rival +${fpN}`);
  for (let i = 0; i < tr; i++) Rd.push({ label: 'Derrota' });
  if (tr) notes.push(`▼ Tipos en contra +${tr} (${mu.filter(x => x.r).map(x => `${mname(x.m)} ${x.def >= 1.5 ? 'recibe ' + xTxt(x.def) : 'apenas hace daño'}`).join(', ')})`);
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

// Solo hay un intento: si pierdes un combate, se acaba la partida… salvo que te quede una Poción (se usa sola).
// onLose (opcional) = combate que no hace perder la partida (el primero contra el rival).

function battleFormsOn() {
  const changed = [];
  run.team.forEach(m => {
    if ('bf' in m || m.tf) return;
    const e = BATTLE_FORMS[`${m.n}:${m.form || 0}`]; if (!e || !formRec(Array.isArray(e[0]) ? e[0][0] : e[0])) return;
    const before = dname(m), to = Array.isArray(e[0]) ? e[0][rnd(0, e[0].length - 1)] : e[0];
    m.bf = m.form || 0; m.form = to; changed.push(`${before} → ${dname(m)} (${e[1]})`);
  });
  if (!changed.length) return;
  log(`✨ En combate: ${changed.join(' · ')}.`); advToast(`✨ ${changed.length > 1 ? '¡Cambian de forma!' : '¡' + changed[0].split(' (')[0] + '!'}`); chord([523, 784, 1046]);
  renderAdv(); flashForms();
}
// vuelve a su forma de siempre: primero deshace la megaevolución o el Gigamax y después la forma de combate
function restoreForm(m) {
  let any = false;
  if (m.tf) { if (m.tf.from) m.form = m.tf.from; else delete m.form; delete m.tf; any = true; }
  if ('bf' in m) { if (m.bf) m.form = m.bf; else delete m.form; delete m.bf; any = true; }
  return any;
}
// al terminar el combate (o al recargar la partida) todos vuelven a su forma normal
function battleFormsOff() {
  if (!run) return; let any = false;
  [...run.team, ...run.box.filter(Boolean), ...stolenList()].forEach(m => { if (restoreForm(m)) any = true; });
  if (any) { renderAdv(); saveRun(); }
}
// la megaevolución y el Gigamax solo duran un giro
function transformOff() {
  if (!run) return false; const was = run.team.filter(m => m.tf);
  was.forEach(m => { if (m.tf.from) m.form = m.tf.from; else delete m.form; delete m.tf; });
  if (was.length) { log(`↩️ ${was.map(mname).join(', ')} vuelve${was.length > 1 ? 'n' : ''} a la normalidad.`); renderAdv(); saveRun(); }
  return was.length > 0;
}
// destello en las fichas del equipo que han cambiado de forma
function flashForms() { if (reduceMotion) return; requestAnimationFrame(() => document.querySelectorAll('#advTeam .tmw').forEach((el, i) => { const m = run.team[i]; if (m && 'bf' in m && el.animate) el.animate([{ filter: 'brightness(2.6) saturate(0)', transform: 'scale(1.06)' }, { filter: 'none', transform: 'none' }], { duration: 700, easing: 'ease-out' }); })); }

// ---- Megaevolución y Gigamax en combate: se pulsa la piedra o la banda de la ficha antes de girar ----
// ¿se puede transformar ahora? (en un combate, con la ruleta lista y sin nadie transformado en este giro)
const canTransform = () => !!(curBattle && advWheel && advWheel.enabled && !advWheel.spinning && run && !run.team.some(m => m.tf));
function transformMon(m, kind) {
  if (!canTransform()) { advToast(curBattle ? 'Solo un Pokémon por giro' : kind === 'mega' ? 'La megapiedra se usa en combate, antes de girar' : 'La Banda Dinamax se usa en combate, antes de girar'); beep(220, .08, .03); return; }
  const to = kind === 'mega' ? m.stone : (gmaxForms(m)[0]); if (!to || !formRec(to)) return;
  const from = { id: mid(m), ty: mtypes(m), name: mname(m) }, form0 = m.form || 0, shown = mname({ n: m.n, form: to });
  advButtons([]); advWheel.enabled = false;
  const battleNow = curBattle;
  transformAnim(m, kind, from, { id: to, n: m.n, ty: formRec(to)[1][2], name: shown }, () => {
    m.tf = { from: form0, kind }; m.form = to;
    log(kind === 'mega' ? `💎 ¡${from.name} megaevoluciona en ${shown}!` : `🔴 ¡${from.name} se gigamaxiza!`);
    advToast(kind === 'mega' ? `💎 ¡${shown}!` : `🔴 ¡${shown}!`); saveRun();
  }, () => battleNow());   // los quesitos del combate se recalculan con su nueva forma
}
// etiqueta de la poción en uso (como la de Multitarea): «+2 giros de revancha · Superpoción»; n = giros que quedan
function renderPotion(k, n, pop) {
  const el = $('advPotion'); if (!el) return;
  el.hidden = !(k && n > 0); if (el.hidden) return;
  el.innerHTML = `<b>+${n}</b> giro${n > 1 ? 's' : ''} de revancha · ${ITEMS[k].name}`;
  if (pop && el.animate && !reduceMotion) el.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: .6 }, { transform: 'none' }], { duration: 450, easing: 'ease-out' });
}
function battle(title, who, foe, base, onWin, extra = '', onLose = null, types = null) {
  let again = false, retries = 0, disguise = false, note = '', pot = null;
  const end = () => { pot = null; renderPotion(null); battleFormsOff(); };
  const show = () => {
    battleFormsOn();
    const B = battleSegs(foe, base, types), tfm = run.team.find(m => m.tf);
    const tools = run.team.some(m => (m.stone && !m.tf) || (m.dmax && gmaxForms(m).length));
    const sub = again ? `${note || '¡Revancha! Misma ruleta, vuelve a girar.'}${retries ? ` (Te quedan ${retries} reintento${retries > 1 ? 's' : ''} de la poción.)` : ''} ${B.g} de ${B.n} quesitos verdes (${pct(B.p)}).`
      : `${who} te reta con ${listJoin(foe.map(pname))}. ${B.g} de ${B.n} quesitos verdes (${pct(B.p)}).${B.notes.length ? ' ' + B.notes.join(' · ') + '.' : ''}${extra}${run.team.length > 1 || boxList().length ? ' Puedes cambiar tu equipo en la Caja PC antes de girar.' : ''}`;
    spinUI(title, (tfm ? `¡${mname(tfm)} está ${tfm.tf.kind === 'mega' ? 'megaevolucionado' : 'gigamaxizado'} durante este giro! ` : '') + sub
      + (tools && !tfm ? ' Pulsa la megapiedra o la Banda Dinamax de un Pokémon para transformarlo en este giro.' : ''), B.segs, 'COMBATE', r => {
      transformOff();      // la transformación solo dura este giro
      if (pot) renderPotion(pot, retries);   // este giro de revancha ya se ha gastado
      if (r.ok) { end(); return onWin(); }
      if (onLose) { end(); return onLose(); }
      if (retries > 0) { retries--; again = true; note = '¡Revancha! La poción aún aguanta.'; return advSay(`${who} te ha ganado… pero tu poción aún aguanta.`, () => advButtons([{ label: 'Volver a girar', fn: show }])); }
      // si te quedan pociones, se usa una sola, sin preguntar (primero la más flojita, para guardar las mejores)
      const k = ['potion', 'super', 'hyper'].find(k => (run.bag[k] || 0) > 0);
      if (k) {
        run.bag[k]--; retries = ITEMS[k].retries - 1; again = true; note = `¡Revancha con ${ITEMS[k].name}!`; pot = k;
        renderPotion(pot, ITEMS[k].retries, true);
        log(`🧪 Pierdes contra ${who}… y usas ${ITEMS[k].name}: ¡revancha!`); advToast(`🧪 ${ITEMS[k].name}`); renderAdv(); saveRun();
        return advSay(`${who} te ha ganado… pero usas ${ITEMS[k].name} automáticamente${ITEMS[k].retries > 1 ? ` (${ITEMS[k].retries} giros)` : ''}. ¡Revancha con la misma ruleta!`, () => advButtons([{ label: 'Volver a girar', fn: show }]));
      }
      pot = null; renderPotion(null);
      if (!disguise && run.team.some(m => m.n === 778)) { disguise = true; again = true; note = '¡El Disfraz de Mimikyu te da otra oportunidad!'; log('👻 ¡El Disfraz de Mimikyu aguanta el golpe!'); return advSay('¡El Disfraz de Mimikyu se rompe, pero aguanta el golpe! Una oportunidad más.', () => advButtons([{ label: 'Volver a girar', fn: show }])); }
      end(); gameOver(who);
    });
    curBattle = show;
    if (pot && again) renderPotion(pot, retries + 1);   // spinUI la oculta: vuelve a salir mientras dure la poción
    renderAdv();          // la megapiedra y la banda se encienden mientras se puede usar
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
// cine = se ha visto la cinemática de la derrota: al cerrarla se vuelve al inicio (el resumen ya salía en ella)
function phaseGameOver(cine) {
  if (cine === true) return goMenu();
  $('advStep').textContent = 'Fin de la partida'; advWheel.enabled = false;
  advSay(`${run.overMsg || `${run.lostTo || 'Tu rival'} te ha derrotado y no te quedaban Pociones.`} Fin de la partida: ${run.points} puntos (rango ${rank(run.points)}).${run.record ? ' ¡Nuevo récord!' : ''}`, () => advButtons([
    { label: 'Nueva partida', fn: () => advStart(true) }, { label: '← Menú', ghost: true, fn: goMenu }]));
}
