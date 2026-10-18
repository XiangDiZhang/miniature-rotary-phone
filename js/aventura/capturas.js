// Aventura: encuentros, formas y capturas
function rarityOf(n) { if (isLegend(n)) return LEGEND_RARITY; const cap = INFO[n - 1][7] || 45; return RARITY.find(r => cap >= r[1]); }
function captureGreen(n) {
  const r = rarityOf(n), b = run.badges.length + (run.eliteWins || 0);
  const p = Math.min(r[4], r[2] + r[3] * b);
  return Math.max(1, Math.min(CAP_N - 2, Math.round(p * CAP_N)));
}

// Ruleta de captura: 6 quesitos (3 atrapan y 3 fallan; con un legendario solo 1 atrapa). Cada fallo con su frase.
const CAPTURE_FAILS = [
  { label: 'Se escapa', short: 'SE ESCAPA', say: n => `¡Oh, no! ${n} se ha escapado de la Poké Ball.` },
  { label: 'Rompe la ball', short: 'ROTA', say: n => `¡${n} ha roto la Poké Ball y se ha ido!` },
  { label: 'Huye', short: 'HUYE', say: n => `${n} ha huido a toda prisa entre la hierba.` },
  { label: '¡Casi!', short: '¡CASI!', say: n => `¡Casi! La Poké Ball se ha movido tres veces… pero ${n} ha salido.` },
  { label: 'Se suelta', short: 'SE SUELTA', say: n => `${n} se ha soltado en el último segundo y se ha marchado.` },
];
function captureSegs(green) {
  const N = CAP_N, mix = [...CAPTURE_FAILS].sort(() => Math.random() - .5), fails = Array.from({ length: N - green }, (_, i) => mix[i % mix.length]), segs = [];
  let acc = 0, g = 0, f = 0;
  for (let i = 0; i < N; i++) {
    acc += green / N;
    if (acc >= 1 - 1e-9 && g < green) { acc -= 1; segs.push({ label: '¡Atrapado!', short: '¡ATRAPADO!', color: g % 2 ? '#62b33a' : '#7ac74c', ok: 1 }); g++; }
    else { segs.push({ ...fails[f], color: f % 2 ? '#e8473a' : '#ff5a46' }); f++; }
  }
  return segs;
}
// Pokémon salvaje en la ruleta: si va a ser shiny se decide ANTES y ya se ve en su quesito (con ★)
const wseg = (n, w = 1, forceShiny) => { const sh = forceShiny !== undefined ? !!forceShiny : Math.random() < SHINY_RATE, nm = pname(n) + (sh ? ' ★' : '');
  return { label: nm, n, w, shiny: sh, color: TYPE_COLORS[ptypes(n)[0]], short: nm }; };
// si la especie tiene formas (regional…), primero se decide la forma y después se intenta capturar
function encounter(n, legend, shiny, cont) {
  const fl = wildForms(n); if (!fl.length) return cont(0);
  const segs = [{ label: baseFormName(n) + (shiny ? ' ★' : ''), short: baseFormName(n), n, shiny, color: TYPE_COLORS[ptypes(n)[0]], form: 0 },
    ...fl.map(f => { const nm = formLabel(n, f); return { label: nm + (shiny ? ' ★' : ''), short: nm, n: f[0], shiny, color: TYPE_COLORS[f[2][0]], form: f[0] }; })];
  advSay(`¡Un ${pname(n)}${shiny ? ' shiny' : ''}! Esta especie tiene ${segs.length} formas… ¿cuál es la que tienes delante?`, () => advButtons([{ label: 'Ver qué forma es', fn: () =>
    spinUI(`Forma · ${pname(n)}`, `Todas las formas tienen la misma probabilidad (${pct(1 / segs.length)} cada una).`, segs, 'FORMA', r => cont(r.form), { txt: `¿Qué forma tiene ${pname(n)}?`, n, shiny }) }]));
}
function throwBall(n, legend = false, shiny, form = 0, sure = false) {
  if (shiny === undefined) shiny = Math.random() < SHINY_RATE;
  const nm0 = form ? mname({ n, form }) : pname(n);
  if (sure) {   // Sudowoodo, Snorlax… si toca capturarlo, se captura sin ruleta
    return advSay(`¡${nm0}${shiny ? ' (¡y es shiny!)' : ''} se deja atrapar sin oponer resistencia!`, () => advButtons([{ label: 'Lanzar la Poké Ball', fn: () => caught(n, shiny, legend, form) }]));
  }
  const green = Math.min(CAP_N - 1, captureGreen(n) + (run.ball ? 1 : 0)), kurt = run.ball, rar = rarityOf(n)[0];
  // la captura es obligatoria: si sale un Pokémon, siempre se lanza la Poké Ball (no se puede dejar ir)
  const what = shiny ? `¡Un ${nm0} de color distinto! Es shiny ★.` : legend ? `¡Es ${nm0}, un Pokémon legendario! Es muy difícil de atrapar.` : `¡Un ${nm0} salvaje!`;
  advSay(`${what} ¡Lanza la Poké Ball! Solo tienes una oportunidad.${kurt ? ' Usarás tu Ball especial (+1 quesito verde).' : ''}`, () => advButtons([
    { label: 'Lanzar la Poké Ball', fn: () => {
      run.ball = 0;
      spinUI(`Captura · ${pname(n)}`, `Rareza: ${rar}. ${green} de ${CAP_N} quesitos lo atrapan (${pct(green / CAP_N)}). Solo hay un intento.`,
        captureSegs(green), legend ? '★' : 'CAPTURA', r => {
          if (r.ok) return caught(n, shiny, legend, form);
          logm(`💨 ${nm0}: ${r.label.toLowerCase()}.`, { n, form, shiny }); setNow(`${nm0} se ha escapado`, { n: form || n, shiny });
          advSay(r.say(pname(n)) + (legend ? ' Se ha perdido en el horizonte…' : ''), goOn);
        }, { txt: `Capturando a ${nm0}${shiny ? ' ★' : ''}`, n: form || n, shiny });
    } }]));
}
function caught(n, shiny, legend, form) {
  // si la especie tiene formas regionales u otras variantes, una ruleta decide cuál te toca
  const fl = form === undefined ? wildForms(n) : [];
  if (fl.length) {
    const segs = [{ label: baseFormName(n), short: baseFormName(n), n, color: TYPE_COLORS[ptypes(n)[0]], form: 0 },
      ...fl.map(f => { const nm = formLabel(n, f); return { label: nm, short: nm, n: f[0], color: TYPE_COLORS[f[2][0]], form: f[0] }; })];
    return advSay(`¡${pname(n)} tiene ${segs.length} formas distintas! ¿Cuál te ha tocado?`, () => advButtons([{ label: 'Girar la ruleta de formas', fn: () =>
      spinUI(`Forma · ${pname(n)}`, `Todas las formas tienen la misma probabilidad (${pct(1 / segs.length)} cada una).`, segs, 'FORMA', r => caught(n, shiny, legend, r.form), { txt: `¿Qué forma tiene tu ${pname(n)}?`, n, shiny }) }]));
  }
  const m = addMon(n, shiny); if (form) m.form = form;
  const inTeam = run.team.includes(m), nm = mname(m);
  logm(`🎯 ¡${nm}${shiny ? ' ★' : ''} capturado!${inTeam ? '' : ' Va a la caja.'}`, m);   // en el diario, con su forma (y su sprite shiny si lo es)
  setNow(`¡${nm} capturado!`, { n: mid(m), shiny });
  addPoints(legend ? PTS.legend : PTS.capture, `${nm} capturado`);
  // legendario o singular (mítico): cada uno con su música; si además es shiny, suena después el brillo
  const [, , , , isLeg, isMyth] = BY_NUM.get(n);
  if (isMyth) mythMusic(); else if (isLeg) legendMusic();
  if (shiny) { addPoints(PTS.shiny, `¡${nm} shiny!`); advToast(`✦ ¡${nm} SHINY! ✦`); (isLeg || isMyth) ? setTimeout(shinySfx, 2600) : shinySfx(); shinyBurst(); }
  else advToast(isMyth ? `✧ ¡${nm}, un Pokémon singular! ✧` : isLeg ? `★ ¡${nm}, un Pokémon legendario! ★` : `¡${nm} se une a tu equipo!`);
  advSay(shiny ? `¡INCREÍBLE! ¡Tu ${nm} es SHINY!${inTeam ? '' : ' (va a la caja)'}` : `Es un ${nm}${form ? '' : ' normal'}. ¡Bienvenido al equipo!${inTeam ? '' : ' (va a la caja)'}`, goOn);
}

function shinyCheck(n, legend = false) { caught(n, Math.random() < SHINY_RATE, legend); }

function wildWheel(title, sub, pool, center, legend = false) {
  const tot = pool.reduce((a, w) => a + w[1], 0);
  spinUI(title, sub, [...pool.map(([n, w]) => wseg(n, w)),
    ...(legend ? [{ label: '★ ???', short: '¡¿???!', color: '#ffd84a', w: tot * LEGEND_W, legend: 1 }] : [])], center, r => {
    if (r.legend) return meetLegend();
    if (isLegend(r.n)) return legendEncounter(r.n, r.shiny);
    log(`🌿 Aparece un ${pname(r.n)}${r.shiny ? ' shiny ★' : ''} salvaje.`); encounter(r.n, false, r.shiny, f => throwBall(r.n, false, r.shiny, f));
  });
}
// "Aparece un legendario": ruleta con los legendarios de la región y, después, qué haces: capturar, combatir o huir
function meetLegend(pool) {
  const L = loc(), lg = pool || L.legends || REG().legends;
  if (lg.length === 1) return legendEncounter(lg[0]);
  spinUI('Aparece un legendario', `¿Cuál de ${lg.length === 3 ? 'los tres' : 'los'} legendarios se cruza en tu camino?`,
    lg.map(n => wseg(n)), '★', r => legendEncounter(r.n, r.shiny));
}
function legendEncounter(n, shiny) {
  if (shiny === undefined) shiny = Math.random() < SHINY_RATE;
  log(`🌟 ¡Aparece ${pname(n)}, un Pokémon legendario!`); advToast(`★ ¡${pname(n)}! ★`); chord([523, 659, 784, 1046]);
  advSay(`¡${pname(n)} aparece ante ti! ¿Qué pasará?`, () => advButtons([{ label: 'Girar', fn: () =>
    spinUI(`Legendario · ${pname(n)}`, 'Captura, combate o huida: la ruleta decide.', [
      { label: 'Captura', short: 'CAPTURA', color: '#7ac74c', k: 'catch' },
      { label: 'Combate', short: 'COMBATE', color: '#ff5a46', k: 'fight' },
      { label: 'Huye', short: 'HUYE', color: '#8592ab', k: 'flee' }], '★', r => {
        if (r.k === 'catch') return encounter(n, true, shiny, f => throwBall(n, true, shiny, f));
        if (r.k === 'flee') { log(`💨 ${pname(n)} desaparece.`); return advSay(`${pname(n)} te mira un instante… y desaparece a toda velocidad.`, goOn); }
        battle(`Legendario · ${pname(n)}`, pname(n), [n], 2, () => {
          addPoints(PTS.rival, `${pname(n)} derrotado`);
          advSay(`¡Has vencido a ${pname(n)}! Se retira… pero tu equipo ha aprendido mucho. ¿Habrá evolución?`, () => advButtons([{ label: 'Ruleta de evolución', fn: phaseEvolve }]));
        }, ' Perder contra un legendario no acaba la partida.', () => { log(`💨 ${pname(n)} te supera y se marcha.`); advSay(`${pname(n)} es demasiado fuerte y se marcha. Tu aventura sigue.`, goOn); });
      }, { txt: `¡Ha aparecido ${pname(n)}!`, n, shiny }) }]));
}
// Pokémon salvajes: SIEMPRE aleatorios de la región (Kanto 1-151, Johto 152-251), sin legendarios (esos tienen su hueco dorado)
function regionPool(filter = () => true, legends = false) { const [a, b] = REG().range, out = []; for (let n = a; n <= b; n++) if ((legends || !isLegend(n)) && filter(n)) out.push(n); return out; }
// todos los Pokémon de la lista, en orden aleatorio (para que la ruleta cambie cada vez)

const allOf = pool => randomPick(pool, pool.length).map(n => [n, isLegend(n) ? LEG_SLICE : 1]);
function randomPick(pool, k = 8) { const p = [...pool], out = []; while (out.length < k && p.length) out.push(p.splice(rnd(0, p.length - 1), 1)[0]); return out; }

const caveMon = n => ptypes(n).some(t => CAVE_TYPES.includes(t)), waterMon = n => ptypes(n).includes('Agua');

// Huevo misterioso: totalmente aleatorio, cualquier Pokémon de cualquier región, incluso legendarios. La ruleta enseña 8 candidatos al azar.
// Huevo misterioso: ruleta con TODOS los Pokémon de la Pokédex (de cualquier región, legendarios incluidos)
function eggWheel(msg) {
  const pool = randomPick(Array.from({ length: DEX.length }, (_, i) => i + 1), DEX.length);
  advSay(msg, () => advButtons([{ label: '¡Eclosiona!', fn: () =>
    spinUI('Huevo', `Toda la Pokédex en la ruleta: ${DEX.length} Pokémon (los legendarios, más difíciles). ¿Cuál saldrá?`, pool.map(n => wseg(n, isLegend(n) ? LEG_SLICE : 1)), 'HUEVO', r => {
      log(`🥚 ¡Del huevo sale un ${pname(r.n)}!`); chord([784, 988, 1318]);
      advSay(`¡El huevo se abre y sale un ${pname(r.n)}${r.shiny ? ' shiny ★' : ''}!`, () => advButtons([{ label: 'Recibirlo', fn: () => caught(r.n, r.shiny) }]));
    }) }]));
}
