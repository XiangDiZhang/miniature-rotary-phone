// Aventura: flujo de la partida (fases, evolución, gimnasios, final)
// prep (opcional): prepara la partida nueva antes de empezar (el Modo Test pone ahí tu equipo y tus objetos)
function advStart(fresh, region, prep) {
  region = region || (run && run.region) || 'kanto';
  if (fresh || !run || run.region !== region) { run = newRun(region); if (prep) prep(run); }
  normBox(); [...run.team, ...boxList()].forEach(m => dexRegister(m.n, m.shiny));
  show('adv'); $('eyebrow').textContent = 'Aventura · ' + REG().name;
  renderAdv(); fitAdv(); requestAnimationFrame(fitAdv); advNext();
}
function advNext() {
  advNow = null; $('advExtra').hidden = true; saveRun(); renderAdv();
  if (run.over) return phaseGameOver();
  const L = loc();
  if (L.kind === 'start' && !run.team.length) return phaseStarter();
  if (!run.stepDone && L.kind !== 'start') return ({ route: phaseCapture, rival: phaseRival, city: phaseCity, gym: phaseGym, leg: phaseAdventure, prep: phaseAdventure })[L.kind]();
  if (run.step >= REG().path.length - 1) return phaseEnd();
  // siguiente parada
  run.step++; run.stepDone = false; const N = loc();
  log(`📍 ${N.kind === 'rival' ? `Tu rival ${N.rival} te corta el paso.` : `Llegas a ${N.name}.`}`); saveRun(); renderAdv();
  $('advStep').textContent = N.name; $('advRpm').textContent = '';
  const intro = N.kind === 'route' ? `${N.name}: por aquí viven ${N.wild.map(w => pname(w[0])).join(', ')}… y dicen que a veces pasa corriendo algo legendario. Tendrás una sola oportunidad de captura.`
    : N.kind === 'city' ? `Llegas a ${N.name}. La ruleta de evento decidirá qué te pasa aquí.`
    : N.kind === 'leg' ? `${N.name}: camino de ${N.to}. Una tirada de la ruleta de aventura y… ¡al gimnasio!`
    : N.intro ? N.intro
    : N.kind === 'prep' ? `Llegas a ${REG().league || N.name}. Una tirada para prepararte y después, cinco combates seguidos.`
    : N.kind === 'rival' ? `En ${N.where} aparece ${N.rival}, tu rival. Ha elegido el inicial que tiene ventaja sobre el tuyo… ¡y quiere combatir!`
    : N.role === 'elite' ? `Entras en la sala de ${N.leader}, del Alto Mando. Usa Pokémon de tipo ${N.typeName}. Aquí no hay tiendas entre combate y combate.`
    : N.role === 'champ' ? `Al fondo te espera ${N.leader}, ${/^Campeona/.test(N.name) ? 'la Campeona' : 'el Campeón'} de ${REG().name}. ¡Es el último combate!`
    : `Delante tienes el gimnasio. ${N.leader}, la persona que lo dirige, usa Pokémon de tipo ${N.typeName}.`;
  // la ruleta de la nueva fase sale a la vez que cambia la línea de fases (el texto de llegada va delante)
  introText = intro; advNext();
}
let introText = '';
const goOn = () => advButtons([{ label: 'Continuar →', fn: finish }]);

function phaseStarter() {
  const R = REG(), L = loc();
  spinUI(`${L.name} · Tu primer Pokémon`, `${R.prof[0].toUpperCase() + R.prof.slice(1)} te ofrece ${['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis'][R.starters.length] || R.starters.length} Pokémon. La ruleta elegirá tu compañero.`,
    R.starters.map(n => wseg(n)), 'INICIAL', r => {   // shiny como cualquier otro: 1 %
      run.starter = r.n;
      const sh = !!r.shiny;
      const sm = addMon(r.n, sh); logm(`🎉 Tu inicial es ${sh ? "✦ " : ""}${pname(r.n)}. Recibes ${run.bag.potion} Poción${run.bag.potion > 1 ? "es" : ""}.`, sm);
      if (sh) { addPoints(PTS.shiny, `¡${pname(r.n)} shiny!`); advToast(`✦ ¡${pname(r.n)} SHINY! ✦`); shinySfx(); renderAdv(); const t = $('advTeam').querySelector('.tmw'); const rr = t && t.getBoundingClientRect(); shinyBurst(); if (rr) setTimeout(() => shinyBurst(rr.left + rr.width / 2, rr.top + rr.height / 2), 350); }
      advSay(sh ? `¡INCREÍBLE! ¡Tu ${pname(r.n)} es SHINY! Será tu compañero de viaje.` : `¡${pname(r.n)} será tu compañero de viaje!`, () => advButtons([{ label: `Salir de ${L.name} →`, fn: advNext }]));
    });
}

// ---- Rival: lleva el inicial con ventaja sobre el tuyo (Planta → Fuego → Agua → Planta), que evoluciona con la historia ----
function evoAt(n, stage) { for (let i = 0; i < stage; i++) { const e = nextEvos(n); if (!e.length) break; n = e[0]; } return n; }
// inicial del rival: el que tiene ventaja sobre el tuyo
function rivalStarter(R) { R = R || REG(); if (R.rivalOf && R.rivalOf[run.starter]) return R.rivalOf[run.starter]; const i = Math.max(0, R.starters.indexOf(run.starter)); return R.starters[(i + 1) % 3]; }
function phaseRival() {
  const R = REG(), L = loc();
  const foe = [...(L.team || []), evoAt(rivalStarter(R), L.stage || 0)];
  battle(`Rival · ${L.rival}`, `Tu rival ${L.rival}`, foe, 1, () => {
    addPoints(PTS.rival, `victoria contra ${L.rival}`);
    advSay(`¡Has ganado a ${L.rival}! «Hmpf… la próxima vez no tendrás tanta suerte». ¿Habrá evolución?`, () => advButtons([{ label: 'Ruleta de evolución', fn: phaseEvolve }]));
  }, L.forgive ? ' Este primer combate no hace perder la partida.' : '', L.forgive ? () => {
    log(`😤 ${L.rival} te gana, pero el viaje sigue.`);
    advSay(`${L.rival} te ha ganado… pero este primer combate no cuenta. «¡Vuelve cuando seas más fuerte!». Tu aventura sigue.`, goOn);
  } : null);
}

// ---- Captura: una por tramo de ruta (y un hueco pequeñito para un legendario) ----
function phaseCapture() { doCapture(); }

function phaseAdventure() {
  const L = loc(), n = (run.sub || 0) + 1, tot = spinsOf(L);
  if (run.pending && run.pending.length) return ACT[run.pending.shift()]();
  renderExtra(false);
  // sitios especiales del camino: cada uno es un quesito opcional más de la ruleta
  const acts = [...(L.kind === 'prep' ? PREP_ACTS : L.start ? START_ACTS : ADV_ACTS), ...(L.local || []).map((k, i) => ({ k, label: EVENTS[k].label, color: i % 2 ? '#e8892f' : '#ff9f43', w: EVENTS[k].pw || .8, place: 1 }))]
    .map(a => a.k === 'tree' && REG().name === 'Kanto' ? { ...a, label: 'Snorlax dormido' } : a.k === 'rocket' ? { ...a, label: VIL().name } : a)
    .map(a => ({ ...a, short: a.place ? EVENTS[a.k].short : shortOf(a.label) }))
    .filter(a => !(a.k === 'trade' && run.team.length + boxList().length < 1))
    // el Árbol raro (Sudowoodo) y el Snorlax dormido solo existen en Johto y Kanto
    .filter(a => !(a.k === 'tree' && run.region !== 'kanto' && run.region !== 'johto'));
  spinUI(`${L.name} · Ruleta de aventura ${n}/${tot}`, L.kind === 'prep' ? 'Última parada antes del Alto Mando: cualquier cosa puede pasar.' : `Camino de ${L.to}. La ruleta decide qué pasa por el camino${L.local && L.local.length ? ' (los quesitos naranjas son sitios especiales de esta zona)' : ''}.`,
    acts, 'AVENTURA', r => ACT[r.k]());
}
// tiradas extra que te quedan en este tramo (Multitarea): +2, luego +1…
function extraLeft() {
  if (!run) return 0; const L = loc(); if (!L || (L.kind !== 'leg' && L.kind !== 'prep') || !run.extra) return 0;
  const tot = spinsOf(L), base = tot - run.extra, sub = run.sub || 0;
  return Math.max(0, sub < base ? run.extra : tot - sub);
}
function renderExtra(pop) {
  const el = $('advExtra'); if (!el) return; const x = extraLeft();
  el.hidden = !x; if (!x) return;
  el.innerHTML = `<b>+${x}</b> tirada${x > 1 ? 's' : ''} extra · Multitarea`;
  if (pop && el.animate) el.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: .6 }, { transform: 'none' }], { duration: 450, easing: 'ease-out' });
}
const spinsOf = L => L.spins + (run.extra || 0) + (L.kind === 'leg' && run.bag.shoes ? 1 : 0);
// termina un suceso: en los tramos pasa a la siguiente tirada; en el resto, a la siguiente parada
function finish() {
  // Caramelo raro guardado: en cuanto alguien del equipo puede evolucionar (un Pokémon nuevo, uno que vuelve de la caja…),
  // se usa solo antes de seguir; al acabar la evolución se vuelve aquí y se sigue como siempre
  if (run.bag.candy > 0 && run.team.some(canEvolve) && !run.over) {
    run.bag.candy--; if (!run.bag.candy) delete run.bag.candy;
    log('🍬 Usas el Caramelo raro que guardabas.'); renderAdv(); saveRun();
    return evolveSure('¡El Caramelo raro que guardabas en la mochila brilla!');
  }
  const L = loc();
  if (L.kind === 'leg' || L.kind === 'prep') {
    if (run.pending && run.pending.length) { saveRun(); return advNext(); }
    run.sub = (run.sub || 0) + 1;
    if (run.sub < spinsOf(L)) { saveRun(); return advNext(); }
    run.sub = 0; run.extra = 0;
  }
  run.stepDone = true; advNext();
}

// ---- Evolución tras ganar: 1/4, luego 1/3, luego 1/2… y a la cuarta es segura ----
// Tras ganar un combate SIEMPRE sale la ruleta de evolución (1/4, 1/3, 1/2… y a la cuarta, segura); contra los entrenadores del camino, la evolución es segura.
// Si cae en "¡Evolución!" pero nadie de tu equipo puede evolucionar, en su lugar recibes una poción (mejor cuantas más medallas tengas).
// quesitos de «¿quién evoluciona?»: tus Pokémon (el elegido no se sube al centro: entra directo en la cinemática desde su quesito)
const evoSegs = list => list.map(m => ({ label: dname(m), n: mid(m), color: TYPE_COLORS[mtypes(m)[0]], short: dname(m), m, noCenter: 1 }));
function potionInstead(msg) {
  const k = potionTier(); run.bag[k] = (run.bag[k] || 0) + 1; log(`🧪 Nadie puede evolucionar: recibes ${ITEMS[k].name}.`); renderAdv(); saveRun();
  advSay(`${msg} ${ITEMS[k].name}.`, goOn);
}
function phaseEvolve() {
  const cands = run.team.filter(canEvolve);
  const fails = run.evoFails || 0, ch = EVO_CHANCES[Math.min(EVO_CHANCES.length - 1, fails)];
  const who = () => {
    if (!cands.length) return potionInstead('¡Tocaba evolución, pero ningún Pokémon de tu equipo puede evolucionar! En su lugar recibes');
    if (cands.length === 1) return evolve(cands[0]);
    spinUI('Evolución · ¿Quién?', '¡Alguien va a evolucionar! La ruleta elige quién.', evoSegs(cands), '¿QUIÉN?', r => evolve(r.m), evoNow('¿Quién evoluciona?', cands));
  };
  if (ch >= 1) { run.evoFails = 0; advNow = evoNow('¡Evolución segura!', cands); renderCard(); return advSay('¡Tu equipo ha combatido tanto que esta vez la evolución es segura!', () => advButtons([{ label: cands.length ? '¿Quién evoluciona?' : 'Continuar', fn: who }])); }
  spinUI('Evolución · ¿Habrá suerte?', 'Si cae en dorado, alguien de tu equipo evolucionará (o, si nadie puede, recibes una poción).',
    [{ label: '¡Evolución!', short: '¡EVOLUCIÓN!', color: '#ffd84a', w: ch, ok: 1 }, { label: 'Nada', short: 'NADA', color: '#8592ab', w: 1 - ch }], 'EVOLUCIÓN', r => {
      if (r.ok) { run.evoFails = 0; advNow = evoNow('¡Habrá evolución!', cands); renderCard(); return advSay(cands.length ? '¡Algo está pasando! Uno de tus Pokémon empieza a brillar…' : '¡Ha caído en Evolución!', () => advButtons([{ label: cands.length ? '¿Quién evoluciona?' : 'Ver premio', fn: who }])); }
      run.evoFails = fails + 1; log('🔸 Esta vez nadie evoluciona.');
      advSay('Esta vez no ha pasado nada… La próxima victoria tendrá más posibilidades.', goOn);
    }, evoNow(cands.length ? '¿Habrá evolución?' : '¿Habrá evolución? (nadie puede)', cands));
}
// la tarjeta de información en las ruletas de evolución: qué está pasando y, a la derecha, los Pokémon que pueden evolucionar
const evoNow = (txt, mons) => ({ txt, icon: 'evo', mons: mons.slice(0, 6) });
// el Pokémon se sube al centro de la ruleta (desde su quesito o su ficha) para las ruletas de «¿en qué evoluciona?»
function toCenter(m) {
  if (advWheel.centerM === m) { advWheel.keepM = m; return null; }
  const r = monRect(m); advWheel.keepM = m;
  return r && r.wheel !== 'center' ? r : null;
}
// ¿en qué evoluciona? (si hay varias especies posibles, ruleta) y después ¿qué variante? (Alcremie, Vivillon, Lycanroc…)
function resolveEvo(m, cb) {
  const opts = evoOptions(m);
  if (opts.length === 1) return evoVariant(m, opts[0], cb);
  const from = toCenter(m);
  spinUI(`Evolución · ${mname(m)}`, 'Puede evolucionar de varias formas. ¿Cuál será?',
    opts.map(o => { const nm = mname(o); return { label: nm, n: o.form || o.n, shiny: m.shiny, color: TYPE_COLORS[mtypes(o)[0]], short: nm, o }; }), 'EVOLUCIÓN', r => evoVariant(m, r.o, cb),
    { txt: `Evoluciona ${mname(m)}`, n: mid(m), shiny: m.shiny });
  flyToCenter(m, from);
}
const alcId = (cream, sweet) => cream === 'vanilla-cream' && sweet === 'strawberry' ? 0 : (VARIANTS.find(v => v[3] === `869-${cream}-${sweet}-sweet`) || [0])[0];
function evoVariant(m, o, cb) {
  const V = !o.form && EVO_VARIANTS[o.n];
  if (!V) return cb(o);
  const seg = (f, label) => ({ label, short: label, n: f || o.n, shiny: m.shiny, color: TYPE_COLORS[(f ? formRec(f)[1][2] : ptypes(o.n))[0]], f });
  const wheel = (title, sub, segs, then) => { const from = toCenter(m); spinUI(title, sub, segs, 'VARIANTE', then, { txt: `${mname(m)} evoluciona en ${pname(o.n)}`, n: mid(m), shiny: m.shiny }); flyToCenter(m, from); };
  if (V === 'alcremie')   // Alcremie: primero la crema y después el confite
    return wheel('Evolución · Alcremie: la crema', `${mname(m)} va a evolucionar en Alcremie. ¿Con qué crema se cubrirá? (luego, el confite)`,
      ALC_CREAM.map(([c, nm]) => seg(alcId(c, 'strawberry'), nm)), r => {
        const cream = ALC_CREAM.find(x => x[1] === r.label)[0];
        wheel('Evolución · Alcremie: el confite', `¡${r.label}! Y ahora, ¿qué confite lleva?`, ALC_SWEET.map(([s, nm]) => seg(alcId(cream, s), nm)), q => cb({ n: o.n, form: q.f }));
      });
  wheel(`Evolución · ${pname(o.n)}`, `${mname(m)} va a evolucionar en ${pname(o.n)}… ¿En cuál de sus ${V.length} variantes?`,
    V.map(f => seg(f, f ? formLabel(o.n, formRec(f)[1]) : baseFormName(o.n))), r => cb({ n: o.n, form: r.f }));
}
// cambia los datos de un Pokémon que evoluciona (la megapiedra y la Banda Dinamax solo se quedan si le siguen sirviendo)
function applyEvo(m, o) {
  const from = mname(m); m.n = o.n; if (o.form) m.form = o.form; else delete m.form; dexRegister(o.n, m.shiny);
  if (m.stone && !megaForms(m).includes(m.stone)) { const ok = megaForms(m); if (ok.length) m.stone = ok[0]; else delete m.stone; }
  if (m.dmax && !gmaxForms(m).length) delete m.dmax;
  const toName = sname(m);
  addPoints(PTS.evolve, `${from} evoluciona`); advToast(`¡${from} evoluciona a ${toName}!`);
  logm(`✨ ¡${from} ha evolucionado a ${toName}!`, m);   // con su forma nueva (Vivillon Polar, Alcremie…)
  return [from, toName];
}
// evolución completa: uno solo, o dos a la vez si llevas el Repartir Exp. (la ruleta elige al segundo)
function evolve(m, msg) {
  advNow = { txt: `¡${mname(m)} va a evolucionar!`, icon: 'evo', n: mid(m), shiny: m.shiny, mons: [m] }; renderCard();   // la tarjeta dice quién ha salido
  resolveEvo(m, o => {
    const others = run.bag.share ? run.team.filter(x => x !== m && canEvolve(x)) : [];
    if (!others.length) return evoPlay([{ m, o }], msg);
    const two = p => resolveEvo(p, o2 => evoPlay([{ m, o }, { m: p, o: o2 }], msg));
    advSay(`¡El Repartir Exp. brilla! Otro Pokémon de tu equipo va a evolucionar a la vez que ${mname(m)}.`, () => advButtons([{ label: 'Repartir Exp. →', fn: () => others.length === 1 ? two(others[0]) :
      spinUI('Repartir Exp. · ¿Quién más?', `Otro Pokémon de tu equipo aprovecha la experiencia y evoluciona a la vez que ${mname(m)}.`, evoSegs(others), 'REPARTIR', r => two(r.m), evoNow('Repartir Exp.: ¿quién más evoluciona?', others)) }]));
  });
}
function evoPlay(list, msg) {
  advButtons([]); advWheel.enabled = false;
  const items = list.map(({ m, o }) => { const toM = { n: o.n, form: o.form || 0, shiny: m.shiny };
    return { m, o, A: { id: mid(m), ty: mtypes(m), name: mname(m) }, B: { id: mid(toM), n: o.n, ty: mtypes(toM), name: mname(toM) } }; });
  let done = [];
  evoAnim(items, () => { done = items.map(x => applyEvo(x.m, x.o)); chord([784, 988, 1318, 1568]); saveRun(); }, () => {
    if (advWheel.centerM && items.some(x => x.m === advWheel.centerM)) { advWheel.centerM = null; advWheel.centerImg = null; advWheel.centerName = null; }
    wheelRelease();           // los demás Pokémon de la ruleta vuelven a su hueco del equipo
    renderAdv(); saveRun();
    advSay(`${msg ? msg + ' ' : ''}¡Enhorabuena! ${done.map(([a, b]) => `¡${a} ha evolucionado a ${b}!`).join(' ')}`, goOn);
  });
}

// ---- Recompensas del gimnasio: megapiedra (para un Pokémon del equipo que pueda megaevolucionar) y Banda Dinamax ----
function gymRewards(next) {
  const steps = [];
  // Banda Dinamax: todos tus Pokémon con forma Gigamax que aún no la tengan (equipo y caja)
  const dm = allMine().filter(m => !m.dmax && gmaxForms(m).length);
  if (dm.length) steps.push(go => {
    dm.forEach(m => m.dmax = 1); logm(`🔴 Banda Dinamax para ${dm.map(mname).join(", ")}.`, dm[0]); advToast('🔴 ¡Banda Dinamax!'); renderAdv(); saveRun();
    advSay(`¡El estadio vibra con energía Dinamax! ${listJoin(dm.map(mname))} ${dm.length > 1 ? 'reciben' : 'recibe'} la Banda Dinamax: en combate, púlsala para que se gigamaxice durante ese giro.`, () => advButtons([{ label: 'Continuar →', fn: go }]));
  });
  // megapiedra: una por gimnasio, para uno de los Pokémon del equipo que puedan megaevolucionar (si hay varios, la ruleta decide)
  const opts = run.team.filter(m => !m.stone).flatMap(m => megaForms(m).map(f => ({ m, f })));
  if (opts.length) steps.push(go => {
    const give = ({ m, f }) => {
      m.stone = f; const nm = mname({ n: m.n, form: f }), st = stoneName(f); logm(`💎 ${mname(m)} recibe la ${st}.`, m); advToast(`💎 ¡${st} para ${mname(m)}!`); renderAdv(); saveRun();
      advSay(`¡El líder te da la ${st}! ${mname(m)} la lleva equipada: en combate, pulsa la piedra de su ficha para que megaevolucione en ${nm} durante ese giro.`, () => advButtons([{ label: 'Continuar →', fn: go }]));
    };
    if (opts.length === 1) return give(opts[0]);
    advSay('¡El líder te ofrece una megapiedra! ¿Para quién será?', () => advButtons([{ label: 'Girar la ruleta', fn: () =>
      spinUI('Megapiedra · ¿Para quién?', 'Uno de tus Pokémon que pueden megaevolucionar se lleva su megapiedra.',
        opts.map(x => { const nm = mname({ n: x.m.n, form: x.f }); return { label: nm, short: nm, n: x.f, shiny: x.m.shiny, color: TYPE_COLORS[formRec(x.f)[1][2][0]], x }; }), 'MEGA', r => give(r.x)) }]));
  });
  const runSteps = i => i < steps.length ? steps[i](() => runSteps(i + 1)) : next();
  runSteps(0);
}

// ---- Gimnasios, Alto Mando y Campeón ----
function phaseGym() {
  const L = loc();
  if (L.badge && run.badges.includes(L.badge)) { run.stepDone = true; return advNext(); }
  const who = L.who || (L.role === 'elite' ? `${L.leader}, del Alto Mando,` : L.role === 'champ' ? `${/^Campeona/.test(L.name) ? 'La Campeona' : /^Campeón/.test(L.name) ? 'El Campeón' : ''} ${L.leader}`.trim() : `${L.leader}, líder del gimnasio,`);
  const title = L.btitle || (L.role === 'elite' ? `Alto Mando · ${L.leader}` : L.role === 'champ' ? L.name : `Gimnasio · ${L.leader}`);
  renderCard();
  const foeTeam = L.rivalStarter ? [...L.team, evoAt(rivalStarter(), 2)] : L.team;
  battle(title, who, foeTeam, L.role === 'champ' ? 3 : L.role === 'elite' ? 2 : 1, () => {
    if (L.badge) { run.badges.push(L.badge); addPoints(PTS.badge, L.badge); advToast(`◆ ¡${L.badge}!`); }
    else { run.eliteWins = (run.eliteWins || 0) + 1; addPoints(L.role === 'champ' ? PTS.champ : PTS.elite, `victoria contra ${L.leader}`); advToast(L.role === 'champ' ? '👑 ¡CAMPEÓN!' : `¡${L.leader} derrotado!`); }
    chord([659, 784, 1046, 1318]); renderAdv(); saveRun();
    if (L.role === 'champ') return advSay(`¡Has derrotado a ${L.leader}! ¡Eres el nuevo Campeón!`, () => { run.stepDone = true; advButtons([{ label: 'Entrar en el Hall de la Fama →', fn: () => hallOfFame(phaseEnd) }]); });
    const evo = () => advButtons([{ label: 'Ruleta de evolución', fn: phaseEvolve }]);
    advSay(L.badge ? `¡Increíble! Has derrotado a ${L.leader}. ¡Consigues la ${L.badge}!` : `¡Has derrotado a ${L.leader}! ¿Habrá evolución antes del siguiente?`,
      () => L.badge ? advButtons([{ label: 'Continuar →', fn: () => gymRewards(() => advSay('¿Habrá evolución?', evo)) }]) : evo());
  }, '', null, L.typeName);
}
// cine = se ha visto el Hall de la Fama: al cerrarlo se va a la selección de región (los puntos y el rango ya salían en él)
function phaseEnd(cine) {
  run.stepDone = true; saveHistory(true); advNow = null;
  if (run.record === undefined) { run.record = saveBest(); saveRun(); }
  if (cine === true) return goPlay();
  $('advStep').textContent = 'Fin de la aventura'; advWheel.enabled = false;
  const team = run.team.map(m => (m.shiny ? '✦ ' : '') + mname(m)).join(', ');
  advSay(`${REG().end()} ${run.points} puntos (rango ${rank(run.points)}).${run.record ? ' ¡Nuevo récord!' : ''} Medallas: ${run.badges.length}. Tu equipo: ${team}.`, () => advButtons([
    { label: 'Nueva partida', fn: () => advStart(true) }, { label: '← Menú', ghost: true, fn: goMenu }]));
}

function initAdv() {
  advWheel = new Wheel($('advWheel'));
  const mainBtn = () => [...$('advBtns').querySelectorAll('button:not([disabled])')].find(x => !x.classList.contains('ghostbtn'));
  advWheel.onTap = () => { const b = mainBtn(); if (b) b.click(); };
  advWheel.hasNext = () => !!mainBtn();     // botón SEGUIR en el centro de la ruleta
  addEventListener('resize', () => { if (state.scene === 'adv') fitAdv(); });
  // en el móvil, la caja de la ruleta tiene el alto que sobra: si cambia (texto más largo, otra fila de botones…), la ruleta se ajusta
  // (también cuando cambia lo de debajo de la ruleta: más o menos texto, otra fila de botones…)
  // (en el fotograma siguiente: si no, al cambiar el tamaño dentro del aviso, el navegador avisa de un bucle)
  try { let raf = 0; const ro = new ResizeObserver(() => { if (state.scene === 'adv' && (matchMedia(PHONE_V).matches || matchMedia(PHONE_H).matches)) { cancelAnimationFrame(raf); raf = requestAnimationFrame(fitAdv); } });
    ['.adv-wbox', '.adv-stage', '.adv-stage .side'].forEach(s => { const el = document.querySelector(s); if (el) ro.observe(el); }); } catch (e) {}
  // móvil: los datos del líder/ruta van en un panel lateral (como los filtros de la Pokédex) y el equipo se ve siempre debajo de la ruleta
  const mq = matchMedia(PHONE_V);   // (en horizontal, el móvil usa el diseño del ordenador)
  const placeTeam = () => {
    const card = document.querySelector('[data-card="0"]');
    if (mq.matches) { $('mTeamSlot').appendChild(card); if ($('advGrid').dataset.tab === '0') $('advGrid').dataset.tab = '1'; }
    else { $('advGrid').prepend(card); document.body.classList.remove('lead-open'); }
    if (state.scene === 'adv') fitAdv();
  };
  try { mq.addEventListener('change', placeTeam); } catch (e) { mq.addListener(placeTeam); }
  placeTeam();
  $('leadTab').onclick = () => { document.body.classList.toggle('lead-open'); beep(700, .03, .02); };
  $('leadShade').onclick = () => document.body.classList.remove('lead-open');
  // pestañas del móvil: Equipo · Puntos y medallas · Diario
  const sheet = (tab) => {
    const G = $('advGrid'), open = tab != null && !(G.classList.contains('open') && G.dataset.tab === tab);
    if (tab != null) G.dataset.tab = tab;
    G.classList.toggle('open', open);
    $('advTabs').querySelectorAll('button').forEach(x => x.classList.toggle('on', open && x.dataset.tab === G.dataset.tab));
  };
  $('advTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; sheet(b.dataset.tab); beep(700, .03, .02); });
  // tocar fuera del panel lo cierra (salvo si se está usando la Caja PC o una ficha)
  addEventListener('pointerdown', e => { if ($('advGrid').classList.contains('open') && !e.target.closest('#advGrid, #advTabs, .pc-shade, .info-shade, .tm-ghost')) sheet(null); });
  // «Nueva partida» no empieza de golpe: el botón se cambia por «¿Seguro? Sí · No» (y vuelve solo a los 6 s)
  $('advNew').onclick = () => {
    const b = $('advNew'); if (b.hidden) return; b.hidden = true; beep(520, .06, .03);
    const box = document.createElement('span'); box.className = 'new-confirm';
    box.innerHTML = '<em>¿Empezar de nuevo?</em><button class="mini-btn yes" type="button">Sí</button><button class="mini-btn no" type="button">No</button>';
    b.after(box);
    const back = () => { clearTimeout(t); box.remove(); b.hidden = false; }, t = setTimeout(back, 6000);
    box.querySelector('.yes').onclick = () => { back(); beep(880, .06, .03); advWheel.stop(); advStart(true); };
    box.querySelector('.no').onclick = () => { back(); beep(440, .06, .03); };
  };
}
