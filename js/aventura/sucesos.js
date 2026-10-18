// Aventura: sucesos de las ruletas (ciudades, camino y sitios especiales)
// ---- Ciudades: ruleta de evento ----
function phaseCity() {
  const L = loc();
  spinUI(`${L.name} · Ruleta de evento`, `La ruleta de evento decide qué te pasa en ${L.name}.${L.events.some(k => EVENTS[k].w < 1 && !(k === 'rocket' && L.rocketW)) ? ' Los quesitos pequeños son eventos raros.' : ''}`,
    L.events.map(k => ({ label: EVENTS[k].label, short: EVENTS[k].short, color: EVENTS[k].color, w: k === 'rocket' && L.rocketW ? L.rocketW : EVENTS[k].w, k })), 'EVENTO',
    r => ({ shop: doShop, tea: doTea, trainer: doTrainer, egg: doEgg, rocket: doRocket, kurt: doKurt, casino: doCasino, burned: doBurned, lighthouse: doLighthouse, pharmacy: doPharmacy, lake: doLake, dragon: doDragon })[r.k]());
}
// la tienda regala una poción gratis, mejor cada 3 medallas (0-2: Poción · 3-5: Superpoción · 6+: Hiperpoción).
// No se compra nada: los puntos solo son tu puntuación.
function doShop() {
  const gift = potionTier();
  run.bag[gift] = (run.bag[gift] || 0) + 1; log(`🎁 La tienda te regala ${ITEMS[gift].name}.`); renderAdv(); saveRun();
  advSay(`Tienda Pokémon: ¡te regalan ${ITEMS[gift].name}! ${ITEMS[gift].desc}`, goOn);
}
// el anciano del té SOLO sale en Ciudad Verde (Kanto), como en el juego original. Ya no da quesitos para un combate: entrena a tu equipo y alguien evoluciona (o te da una Poción)
function doTea() { log('🍵 El anciano te invita a té y entrena a tu equipo.'); evolveSure('Un anciano te invita a té y entrena a tu equipo.'); }
function doEgg() {
  const n = 175; // Togepi, el huevo que el Sr. Pokémon da al Profesor Elm
  advSay('El ayudante del Profesor Elm te da un Huevo misterioso que le dejó el Sr. Pokémon… ¡Se está moviendo!', () => advButtons([{ label: '¡Eclosiona!', fn: () => {
    log(`🥚 ¡Del Huevo sale un ${pname(n)}!`); chord([784, 988, 1318]);
    shinyCheck(n);
  } }]));
}
// Entrenadores del camino: si ganas, ruleta de evolución (o Poción si nadie puede evolucionar); si pierdes, la partida sigue
function doTrainer(force) {
  const L = loc(), [ra, rb] = REG().range, list = L.trainers && L.trainers.length ? L.trainers : [{ name: 'Entrenador Guay', team: [rnd(ra, rb - 3)] }], t = force || list[rnd(0, list.length - 1)];
  battle(`${L.name} · ${t.name}`, t.name, t.team, 1, () => {
    addPoints(PTS.win, `victoria contra ${t.name}`);
    advSay(`¡Has ganado a ${t.name}! ¿Habrá evolución?`, () => advButtons([{ label: 'Ruleta de evolución', fn: phaseEvolve }]));
  }, ' Perder contra un entrenador del camino no acaba la partida.', () => {
    log(`💢 ${t.name} te gana, pero sigues tu camino.`);
    advSay(`${t.name} te ha ganado… Por suerte, solo era un combate del camino: tu aventura sigue.`, goOn);
  });
}
function doRocket() { doRocketWheel(loc().rocketTxt); }
function doKurt() {
  run.ball = 1; log('⚪ Kurt te fabrica una Ball con un Bonguri: +1 quesito verde en la próxima captura.');
  advSay('Kurt, el artesano de Pueblo Azalea, te fabrica una Ball con un Bonguri. En tu próxima captura tendrás un quesito verde más.', goOn);
}
function doCasino() {
  advSay(`Entras en el Casino de ${REG().name === 'Kanto' ? 'Ciudad Azulona' : 'Ciudad Trigal'}. ¡A probar suerte en la ruleta!`, () => advButtons([{ label: 'Jugar', fn: () =>
    spinUI('Casino · Ruleta', 'Un Pokémon de premio, dos objetos y tres vacíos.', [
      { label: 'Premio Pokémon', short: 'PREMIO', color: '#ffd84a', ok: 'mon' }, { label: 'Nada', short: 'NADA', color: '#8592ab' },
      { label: 'Objeto', short: 'OBJETO', color: '#b46cff', ok: 'item' }, { label: 'Nada', short: 'NADA', color: '#6c7790' },
      { label: 'Objeto', short: 'OBJETO', color: '#8f5bd6', ok: 'item' }, { label: 'Nada', short: 'NADA', color: '#8592ab' }], 'CASINO', r => {
        if (r.ok === 'item') { log('🎰 Cambias las fichas por un objeto.'); return advSay('¡Premio! Cambias las fichas por un objeto del mostrador.', () => advButtons([{ label: 'Elegir objeto', fn: doItem }])); }
        if (r.ok === 'mon') { const n = randomPick(regionPool(), 1)[0]; log(`🎰 Premio del Casino: ¡${pname(n)}!`); return advSay(`¡Premio gordo! Cambias las fichas por un ${pname(n)}.`, () => advButtons([{ label: 'Recoger premio', fn: () => shinyCheck(n) }])); }
        log('🎰 El Casino se queda con tus fichas.'); advSay('Nada… la casa siempre gana.', goOn);
      }) }]));
}
function doBurned() {
  log('🔥 En el sótano de la Torre Quemada despiertan los perros legendarios…'); chord([523, 659, 784, 1046]);
  // pueden salir los tres: la ruleta decide con cuál te cruzas (igual con cualquier evento de «uno u otro legendario»)
  advSay('En el sótano de la Torre Quemada despiertan tres Pokémon legendarios y salen corriendo en todas direcciones… ¿Con cuál te cruzas?', () => advButtons([{ label: 'Girar la ruleta', fn: () => meetLegend([243, 244, 245]) }]));
}
function doLighthouse() {
  run.bag.potion = (run.bag.potion || 0) + 1; log('💡 Ayudas a Amphy, el Ampharos del faro: +1 Poción.');
  advSay('Subes al faro de Ciudad Olivo. Amphy, el Ampharos que lo ilumina, está enfermo; le haces compañía y Yasmina te da las gracias con una Poción.', goOn);
}
function doPharmacy() {
  run.bag.potion = (run.bag.potion || 0) + 2; log('💊 La farmacia de Ciudad Orquídea te da la Medicina secreta: +2 Pociones.');
  advSay('El farmacéutico de Ciudad Orquídea te da su Medicina secreta. ¡Cuenta como dos Pociones!', goOn);
}
function doLake() {
  log('🔴 ¡Un Gyarados rojo en el Lago de la Furia!'); chord([523, 659, 784, 1046]);
  advSay('En el Lago de la Furia, un Gyarados rojo salta furioso del agua…', () => advButtons([{ label: '¡A por él!', fn: () => throwBall(130, false, true) }]));
}
function doDragon() {
  const n = 147; log('🐉 El anciano del Clan Dragón te regala un Dratini.'); chord([784, 988, 1318]);
  advSay('En la Guarida del Dragón, el anciano del Clan Dragón te pone a prueba… ¡y te regala un Dratini!', () => advButtons([{ label: 'Recibir a Dratini', fn: () => shinyCheck(n) }]));
}

function doCapture() { const L = loc(); const pool = allOf(regionPool(() => true, true)); wildWheel(`${L.name} · Pokémon salvaje`, `Puede salir cualquiera de los ${pool.length} Pokémon de ${REG().name}; los legendarios también, pero es más difícil.`, pool, 'SALVAJE'); }
function doCatchTwo() { (run.pending = run.pending || []).push('capture'); advToast('¡Dos capturas seguidas!'); doCapture(); }
function doCatchThree() { (run.pending = run.pending || []).push('capture', 'capture'); advToast('¡Tres capturas seguidas!'); doCapture(); }
function doStraight() { log('🚶 Un paseo tranquilo: no pasa nada.'); advSay('Das un paseo tranquilo por la ruta… y no pasa nada. Pierdes este turno.', goOn); }
function doMultitask() { run.extra = (run.extra || 0) + 2; advToast('🔁 ¡+2 tiradas!'); renderExtra(true); log('🔁 Multitarea: dos tiradas más en este tramo.'); advSay('¡Multitarea! Te da tiempo a hacer más cosas: dos tiradas extra de la ruleta de aventura en este tramo.', goOn); }
function doLegendAct() { advSay('Se oye un rugido a lo lejos… ¡aparece un Pokémon legendario!', () => advButtons([{ label: '¿Cuál es?', fn: () => meetLegend() }])); }
function doFish() { const L = loc(); advSay('Lanzas la caña al agua… ¡algo ha picado!', () => advButtons([{ label: 'Tirar de la caña', fn: () => wildWheel(`${L.name} · Pesca`, '¿Qué ha picado?', allOf(regionPool(waterMon)), 'PESCA') }])); }
function doCave() {
  const L = loc();
  spinUI(`${L.name} · Cueva`, 'Entras en una cueva oscura. ¿Qué te encuentras?', [
    { label: 'Pokémon de cueva', short: 'POKÉMON', color: '#9a7b55', w: 2, k: 'mon' }, { label: 'Entrenador', short: 'ENTRENADOR', color: '#ff5a46', w: 1, k: 'trainer' },
    { label: 'Objeto', short: 'OBJETO', color: '#b46cff', w: 1, k: 'item' }, { label: 'Te pierdes', short: 'PERDIDO', color: '#5b6478', w: 1, k: 'lost' },
    REG().name !== 'Johto' ? { label: 'Fósil', short: 'FÓSIL', color: '#c9b37e', w: 1, k: 'fossil' } : { label: 'Ruinas Alfa', short: 'RUINAS', color: '#c9b37e', w: 1, k: 'unown' }], 'CUEVA', r => {
      if (r.k === 'fossil') return doFossil('Entre las rocas de la cueva encuentras un fósil.');
      if (r.k === 'mon') return wildWheel(`${L.name} · Cueva`, '¿Quién vive en la cueva?', allOf(regionPool(caveMon)), 'CUEVA');
      if (r.k === 'trainer') return doTrainer();
      if (r.k === 'item') return doItem();
      if (r.k === 'zubat') { log('🦇 ¡Un Zubat te corta el paso!'); return throwBall(41); }
      if (r.k === 'unown') { log('🔤 En las Ruinas Alfa aparece un Unown.'); return throwBall(201); }
      if (run.bag.rope > 0) { run.bag.rope--; log('🪢 Usas la Cuerda huida para salir de la cueva.'); return advSay('Te has perdido… pero usas la Cuerda huida y, al salir, encuentras algo en el suelo.', () => advButtons([{ label: 'Recogerlo', fn: doItem }])); }
      const pk = ['potion', 'super', 'hyper'].find(k => (run.bag[k] || 0) > 0);
      if (pk) { run.bag[pk]--; log(`🌑 Te pierdes en la cueva y gastas ${ITEMS[pk].name}.`); renderAdv(); return advSay(`Te pierdes en la cueva y tu equipo acaba agotado: gastas ${ITEMS[pk].name} en curarlo. Una Cuerda huida te lo habría ahorrado.`, goOn); }
      log('🌑 Te pierdes en la cueva.'); advSay('Te pierdes en la cueva y tardas un buen rato en salir. Por suerte no tenías pociones que gastar.', goOn);
    });
}
function doTree() {
  if (REG().name === 'Kanto') return doSnorlax();
  const b = badges();
  advSay('Un árbol raro bloquea el camino… ¡se mueve! Es un Sudowoodo.', () => advButtons([{ label: 'Echarle agua', fn: () =>
    spinUI('Árbol raro · Sudowoodo', 'Cuantas más medallas tienes, más fácil es atraparlo o vencerlo.', [
      { label: 'Capturarlo', short: 'CAPTURA', color: '#7ac74c', w: 1 + b * .25, k: 'catch' }, { label: 'Lo derrotas', short: 'VICTORIA', color: '#6390f0', w: 1 + b * .25, k: 'win' },
      { label: 'Se escapa', short: 'HUYE', color: '#8592ab', w: Math.max(.4, 2 - b * .2), k: 'run' }], 'SUDOWOODO', r => {
        if (r.k === 'catch') return throwBall(185, false, undefined, 0, true);
        if (r.k === 'win') { return advSay('¡Has vencido a Sudowoodo y el camino queda libre! ¿Habrá evolución?', () => advButtons([{ label: 'Ruleta de evolución', fn: phaseEvolve }])); }
        advSay('Sudowoodo se escabulle entre los árboles.', goOn);
      }) }]));
}

function doBabyEgg() { eggWheel(`Una señora te da un Huevo misterioso para que lo cuides… ¡Se está moviendo! Puede salir cualquiera de los ${DEX.length} Pokémon de la Pokédex.`); }

function doDaycare() {
  const all = [...run.team, ...boxList()].filter(m => !isLegend(m.n));
  spinUI('Guardería', 'Dejas a tus Pokémon un rato en la Guardería…', [
    { label: 'Un Huevo', short: 'HUEVO', color: '#f2e27a', w: 1, k: 'egg' }, { label: 'Entrenado', short: 'EVOLUCIÓN', color: '#7ac74c', w: 1, k: 'evo' },
    { label: 'Nada', short: 'NADA', color: '#8592ab', w: 1, k: 'none' }], 'GUARDERÍA', r => {
      if (r.k === 'egg') { log('🥚 En la Guardería te han regalado un huevo.'); return eggWheel('¡Te han regalado un huevo! Puede salir cualquier Pokémon de la Pokédex.'); }
      if (r.k === 'evo') return evolveSure('Tus Pokémon han entrenado mucho en la Guardería.');
      advSay('Tus Pokémon han descansado, pero no ha pasado nada especial.', goOn);
    });
}
// evolución segura (Caramelo raro, Guardería, Entrenamiento): la ruleta elige quién
function evolveSure(msg) {
  const cands = run.team.filter(canEvolve);
  if (!cands.length) return potionInstead(`${msg} Pero nadie de tu equipo puede evolucionar, así que recibes`);
  advSay(`${msg} ¡Alguien va a evolucionar!`, () => advButtons([{ label: '¿Quién evoluciona?', fn: () => cands.length === 1 ? evolve(cands[0]) :
    spinUI('Evolución · ¿Quién?', 'La ruleta elige quién evoluciona.', evoSegs(cands), '¿QUIÉN?', r => evolve(r.m)) }]));
}
// Intercambio obligatorio: la ruleta elige a quién das y lo que recibes puede ser cualquier Pokémon de la Pokédex (como los huevos)
function doTrade() {
  const all = [...run.team, ...boxList()];
  const give = m => {
    const pool = randomPick(DEX.map(r => r[0]).filter(n => n !== m.n), DEX.length);
    spinUI('Intercambio · ¿Qué recibes?', `Das a tu ${mname(m)}. A cambio puede llegarte cualquiera de los ${pool.length} Pokémon de la Pokédex (los legendarios, más difíciles).`, pool.map(n => wseg(n, isLegend(n) ? LEG_SLICE : 1)), 'RECIBES', r => {
      if (run.team.includes(m)) run.team.splice(run.team.indexOf(m), 1); else run.box[run.box.indexOf(m)] = null;
      log(`🔄 Cambias a ${mname(m)} por ${pname(r.n)}.`);
      advSay(`¡Intercambio hecho! ${mname(m)} se va y llega ${pname(r.n)}.`, () => advButtons([{ label: 'Recibir', fn: () => caught(r.n, r.shiny, false) }]));
    });
  };
  if (all.length === 1) return advSay(`¡Intercambio a ciegas! No se puede rechazar. Solo tienes a ${pname(all[0].n)}, así que va él.`, () => advButtons([{ label: 'Intercambiar', fn: () => give(all[0]) }]));
  advSay('¡Intercambio a ciegas! Un entrenador te obliga a cambiar un Pokémon: la ruleta elige a quién das.', () => advButtons([{ label: '¿A quién das?', fn: () =>
    spinUI('Intercambio · ¿A quién das?', 'Tu equipo y tu caja entran en la ruleta.', all.map(m => ({ label: dname(m), n: mid(m), color: TYPE_COLORS[mtypes(m)[0]], short: dname(m), m })), 'DAS', r => give(r.m)) }]));
}
function doItem() {
  const b = badges();
  spinUI('Objeto', 'Hay algo brillando en el suelo…', [
    { label: 'Poción', short: 'POCIÓN', color: '#b46cff', w: 2, k: 'potion' }, { label: 'Superpoción', short: 'SUPERPOCIÓN', color: '#8f5bd6', w: b >= 2 ? 1 : .3, k: 'super' },
    { label: 'Caramelo raro', short: 'CARAMELO', color: '#5ad1c8', w: 1, k: 'candy' }, { label: 'Cuerda huida', short: 'CUERDA', color: '#c9a36a', w: 1, k: 'rope' },
    ...(run.bag.shoes ? [] : [{ label: 'Deportivas', short: 'DEPORTIVAS', color: '#4aa3df', w: .5, k: 'shoes' }]),
    ...(run.bag.share ? [] : [{ label: 'Repartir Exp.', short: 'REPARTIR EXP', color: '#ffd84a', w: .5, k: 'share' }]), { label: 'Ball especial', short: 'BALL', color: '#e0a040', w: 1, k: 'ball' }], 'OBJETO', r => {
      if (r.k === 'candy') { log('🍬 Encuentras un Caramelo raro.'); return evolveSure('¡Un Caramelo raro!'); }
      if (r.k === 'ball') { run.ball = 1; log('⚪ Encuentras una Ball especial: +1 quesito en la próxima captura.'); return advSay('¡Una Ball especial! En tu próxima captura tendrás un quesito verde más.', goOn); }
      run.bag[r.k] = (run.bag[r.k] || 0) + 1; log(`🎒 Encuentras: ${ITEMS[r.k].name}.`); renderAdv();
      advSay(`¡Has encontrado ${ITEMS[r.k].name}! ${ITEMS[r.k].desc}`, goOn);
    });
}
function rocketTeam() { const L = loc(), T = VIL().teams || ROCKET_TEAMS; return L.rocket || T[Math.min(T.length - 1, badges())]; }

function doRocketWheel(txt) {
  const canSteal = allMine().length >= 1, st = stolenList();
  const V = VIL();
  spinUI(V.name, `${txt ? txt + ' ' : ''}¡El ${V.name} aparece!${st.length ? ` Tienen a tu ${st.map(mname).join(', ')}: ¡es tu oportunidad de recuperarlo!` : ''}`, [
    { label: 'Combate', short: 'COMBATE', color: '#a33ea1', w: st.length ? 4 : 2, k: 'fight' },
    ...(canSteal ? [{ label: 'Te roban', short: 'ROBO', color: '#ff5a46', w: 1, k: 'steal' }] : []),
    { label: 'Huyen', short: 'HUYEN', color: '#8592ab', w: 1, k: 'flee' }], V.short, r => {
      if (r.k === 'fight') return rocketBattle();
      if (r.k === 'flee') return advSay(`${V.flee} Se van corriendo sin hacer nada.`, goOn);
      rocketSteal(`¡El ${V.name} intenta robarte un Pokémon!`, true);
    });
}
function rocketBattle() {
  const L = loc(), V = VIL();
  battle(`${L.name} · ${V.name}`, V.grunt, rocketTeam(), 1, () => {
    addPoints(PTS.rocket, `${V.name} derrotado`);
    let extra = '';
    const st = stolenList();
    if (st.length) { run.stolen = null; st.forEach(m => run.team.length < 6 ? run.team.push(m) : boxAdd(m)); const nm = st.map(mname).join(', '); extra = ` ¡Y recuperas a tu ${nm}!`; log(`🎉 Recuperas a ${nm}.`); }
    renderAdv();
    advSay(`${V.flee}${extra} ¿Habrá evolución?`, () => advButtons([{ label: 'Ruleta de evolución', fn: phaseEvolve }]));
  }, ' Si pierdes no se acaba la partida… pero te robarán un Pokémon al azar de tu equipo o de tu caja.', () => {
    rocketSteal(`${V.grunt} te ha ganado y se lleva un Pokémon cualquiera de los tuyos. No puedes hacer nada.`, false);
  });
}
// robo de 1 Pokémon al azar de todo lo que tienes (equipo + caja). Tras perder el combate no hay escapatoria;
// en el quesito «Te roban» la Cuerda huida aún te libra.
function rocketSteal(msg, ropeOk) {
  const V = VIL();
  if (ropeOk && run.bag.rope > 0) { run.bag.rope--; log(`🪢 Escapas del ${V.name} con la Cuerda huida.`); return advSay(`${msg} …pero usas la Cuerda huida y escapas a tiempo.`, goOn); }
  if (allMine().length === 1) msg += ` ¡Cuidado: ${mname(allMine()[0])} es tu único Pokémon!`;
  advSay(msg, () => advButtons([{ label: '¿A quién se llevan?', fn: () =>
    spinUI(`${V.name} · Robo`, 'La ruleta elige al azar a cuál de tus Pokémon (equipo o caja) se llevan.', allMine().map(m => ({ label: dname(m), n: mid(m), color: TYPE_COLORS[mtypes(m)[0]], short: dname(m), m })), 'ROBO', q => {
      const ti = run.team.indexOf(q.m);
      if (ti >= 0) run.team.splice(ti, 1); else { const bi = run.box.indexOf(q.m); if (bi >= 0) run.box[bi] = null; }
      if (!run.team.length) { const bi = run.box.findIndex(Boolean); if (bi >= 0) { run.team.push(run.box[bi]); run.box[bi] = null; } }
      run.stolen = [...stolenList(), q.m]; log(`🚨 ¡El ${V.name} te roba a ${mname(q.m)}!`); renderAdv(); saveRun();
      // era tu único Pokémon: sin Pokémon no puedes seguir
      if (!allMine().length) { run.overMsg = `¡El ${V.name} se ha llevado a ${mname(q.m)}, tu único Pokémon! Sin Pokémon no puedes seguir.`; return gameOver(`el ${V.name}`); }
      advSay(`¡El ${V.name} se lleva a tu ${mname(q.m)}! Si vuelves a cruzarte con ellos y les ganas, lo recuperarás.`, goOn);
    }) }]));
}
function doRivalSlice() {
  const R = REG(), b = badges(), st = rivalStarter(R);
  const team = R.rivalTeam ? R.rivalTeam(b) : b < 2 ? [] : b < 4 ? [92, 41] : b < 6 ? [93, 41, 81] : b < 8 ? [42, 81, 93, 215] : [42, 82, 94, 65, 215];
  const foe = [...team, evoAt(st, b < 2 ? 0 : b < 6 ? 1 : 2)];
  battle(`Rival · ${R.rivalName}`, `Tu rival ${R.rivalName}`, foe, 1, () => {
    addPoints(PTS.rival, `victoria contra ${R.rivalName}`);
    advSay(`¡Has ganado a ${R.rivalName}! «Hmpf… la próxima vez no tendrás tanta suerte». ¿Habrá evolución?`, () => advButtons([{ label: 'Ruleta de evolución', fn: phaseEvolve }]));
  }, ' Perder contra el rival no acaba la partida.', () => { log(`😤 ${R.rivalName} te gana, pero el viaje sigue.`); advSay(`${R.rivalName} te ha ganado… «¡Débil!». Por suerte, no pasa nada más: tu aventura sigue.`, goOn); });
}
function doWell() { doRocketWheel('En el Pozo Slowpoke, el Team Rocket está cortando colas de Slowpoke.'); }
function doHideout() { doRocketWheel('Bajo la tienda de Pueblo Caoba está el escondite del Team Rocket.'); }
function doWhirl() { log('🌊 En lo más hondo de las Islas Remolino…'); advSay('En lo más hondo de las Islas Remolino algo enorme se mueve bajo el agua…', () => advButtons([{ label: 'Acercarse', fn: () => meetLegend([249]) }])); }

// ---- Sitios especiales de Kanto (quesitos opcionales del camino) ----
const typed = (...ts) => n => ptypes(n).some(t => ts.includes(t));
function doViridian() { const L = loc(); advSay('Te adentras en el Bosque Verde: un laberinto de árboles lleno de Pokémon bicho.', () => advButtons([{ label: 'Buscar entre la hierba', fn: () => wildWheel(`${L.name} · Bosque Verde`, '¿Qué sale de entre los árboles?', allOf(regionPool(typed('Bicho', 'Planta')).concat([25])), 'BOSQUE') }])); }
// fósiles: Kabuto, Omanyte o Aerodactyl, la ruleta decide cuál se revive
function doFossil(msg) {
  const fs = REG().fossils || [140, 138, 142];
  advSay(`${msg} En el laboratorio lo pueden revivir… ¿Qué Pokémon es?`, () => advButtons([{ label: 'Revivir el fósil', fn: () =>
    spinUI('Fósil', `Puede salir ${fs.map(pname).join(', ').replace(/, ([^,]*)$/, ' o $1')}.`, fs.map(n => wseg(n, n === 142 ? .5 : 1)), 'FÓSIL', r => { log(`🦴 Del fósil revive un ${pname(r.n)}${r.shiny ? ' ★' : ''}.`); caught(r.n, r.shiny); }) }]));
}
function doMoon() {
  const L = loc();
  advSay('Entras en el Mt. Moon. Dicen que en lo más hondo bailan Clefairy bajo la luz de la luna…', () => advButtons([{ label: 'Explorar', fn: () =>
    spinUI(`${L.name} · Mt. Moon`, 'Fósiles, Clefairy, Zubat… y el Team Rocket buscando fósiles.', [
      { label: 'Clefairy', short: 'CLEFAIRY', color: '#f4a6c8', w: 1, k: 'clef' }, { label: 'Fósil', short: 'FÓSIL', color: '#c9b37e', w: 1, k: 'fossil' },
      { label: 'Zubat', short: 'ZUBAT', color: '#a33ea1', w: 1, k: 'zubat' }, { label: 'Team Rocket', short: 'ROCKET', color: '#7a2e78', w: 1, k: 'rocket' }], 'MT. MOON', r => {
        if (r.k === 'clef') return throwBall(35);
        if (r.k === 'zubat') { log('🦇 ¡Un Zubat te corta el paso!'); return throwBall(41); }
        if (r.k === 'fossil') return doFossil('Un supernecio y tú encontráis dos fósiles; te quedas con uno.');
        doRocketWheel('El Team Rocket está saqueando los fósiles del Mt. Moon.');
      }) }]));
}
function doMagikarp() { log('🐟 Un vendedor te «regala» un Magikarp.'); advSay('Un señor en el Centro Pokémon te vende un Magikarp «increíble» por unas monedas… ¡Trato hecho!', () => advButtons([{ label: 'Recibir a Magikarp', fn: () => shinyCheck(129) }])); }
function doBill() {
  const pool = randomPick([133, 63, 147, 137, 131, 123, 127, 113, 108, 115, 132, 83], 6);
  advSay('Bill, el maniaco de los Pokémon, te deja escoger uno de su colección como agradecimiento.', () => advButtons([{ label: 'Mirar su PC', fn: () =>
    spinUI('Casa de Bill', 'La colección de Bill: el que salga, es tuyo.', pool.map(n => wseg(n)), 'BILL', r => { log(`💾 Bill te regala un ${pname(r.n)}.`); caught(r.n, r.shiny); }) }]));
}
function doSSAnne() { const L = loc(); advSay('Subes al S.S. Anne. Los marineros quieren combatir… ¡y tu rival Azul también está a bordo!', () => advButtons([{ label: 'Recorrer el barco', fn: () =>
  spinUI(`${L.name} · S.S. Anne`, 'Marineros, tu rival o una fiesta con premio.', [
    { label: 'Marinero', short: 'MARINERO', color: '#4aa3df', w: 2, k: 'tr' }, { label: 'Rival Azul', short: 'RIVAL', color: '#d0505a', w: 1, k: 'rival' }, { label: 'Fiesta: objeto', short: 'OBJETO', color: '#b46cff', w: 1, k: 'item' }], 'S.S. ANNE', r => {
      if (r.k === 'rival') return doRivalSlice(); if (r.k === 'item') return doItem(); doTrainer({ name: 'Marinero del S.S. Anne', team: [72, 66, 98] });
    }) }])); }
function doTunnel() { advSay('El Túnel Roca está completamente a oscuras… Usas Destello para ver algo.', () => advButtons([{ label: 'Explorar', fn: doCave }])); }
function doTower() {
  const L = loc();
  advSay('Subes a la Torre Pokémon de Pueblo Lavanda. Hace frío… y se oyen voces.', () => advButtons([{ label: 'Subir', fn: () =>
    spinUI(`${L.name} · Torre Pokémon`, 'Fantasmas, médiums poseídas… o un Cubone que llora.', [
      { label: 'Fantasma', short: 'FANTASMA', color: '#705898', w: 2, k: 'ghost' }, { label: 'Médium poseída', short: 'MÉDIUM', color: '#a33ea1', w: 1, k: 'medium' }, { label: 'Cubone', short: 'CUBONE', color: '#e2bf65', w: 1, k: 'cubone' }], 'TORRE', r => {
        if (r.k === 'ghost') return wildWheel(`${L.name} · Torre Pokémon`, '¿Qué fantasma aparece?', allOf([92, 92, 93]), 'FANTASMA');
        if (r.k === 'cubone') return throwBall(104);
        doTrainer({ name: 'Médium poseída', team: [92, 92, 93] });
      }) }]));
}
function doHideoutK() { doRocketWheel('Bajo el Casino de Ciudad Azulona está el escondite secreto del Team Rocket.'); }
// Snorlax dormido: si toca capturarlo, se captura de una
function doSnorlax() {
  const b = badges();
  advSay('Un Snorlax enorme duerme en mitad del camino… Tocas la Poké Flauta y se despierta de mal humor.', () => advButtons([{ label: 'Tocar la Poké Flauta', fn: () =>
    spinUI('Snorlax', 'Cuantas más medallas tienes, más fácil es atraparlo o vencerlo.', [
      { label: 'Capturarlo', short: 'CAPTURA', color: '#7ac74c', w: 1 + b * .25, k: 'catch' }, { label: 'Lo derrotas', short: 'VICTORIA', color: '#6390f0', w: 1 + b * .25, k: 'win' },
      { label: 'Se vuelve a dormir', short: 'ZZZ', color: '#8592ab', w: Math.max(.4, 2 - b * .2), k: 'run' }], 'SNORLAX', r => {
        if (r.k === 'catch') return throwBall(143, false, undefined, 0, true);
        if (r.k === 'win') return advSay('¡Has vencido a Snorlax y el camino queda libre! ¿Habrá evolución?', () => advButtons([{ label: 'Ruleta de evolución', fn: phaseEvolve }]));
        advSay('Snorlax bosteza, se da la vuelta… y se aparta rodando para seguir durmiendo.', goOn);
      }) }]));
}
function doSafariK() {
  const pool = randomPick([111, 113, 115, 123, 127, 128, 147, 102, 84, 29, 32, 48], 7);
  advSay('¡Zona Safari de Ciudad Fucsia! Aquí no hay que combatir: lo que salga en la ruleta, te lo llevas.', () => advButtons([{ label: 'Entrar', fn: () =>
    spinUI('Zona Safari', 'Siete Pokémon de la Zona Safari. El que salga, es tuyo.', pool.map(n => wseg(n, n === 147 || n === 113 ? .5 : 1)), 'SAFARI', r => { log(`🦒 Zona Safari: ¡${pname(r.n)}${r.shiny ? ' ★' : ''}!`); caught(r.n, r.shiny); }) }]));
}
function doSilph() {
  const L = loc();
  advSay('El Team Rocket ha tomado Silph S.A. en Ciudad Azafrán. Dentro, un empleado esconde un Lapras…', () => advButtons([{ label: 'Entrar en el edificio', fn: () =>
    spinUI(`${L.name} · Silph S.A.`, 'Reclutas, tu rival… o te regalan un Lapras.', [
      { label: 'Team Rocket', short: 'ROCKET', color: '#a33ea1', w: 2, k: 'rocket' }, { label: 'Rival Azul', short: 'RIVAL', color: '#d0505a', w: 1, k: 'rival' }, { label: 'Lapras', short: 'LAPRAS', color: '#6390f0', w: 1, k: 'lapras' }], 'SILPH', r => {
        if (r.k === 'rival') return doRivalSlice();
        if (r.k === 'lapras') { log('🎁 Te regalan un Lapras en Silph S.A.'); return advSay('Un empleado agradecido te regala su Lapras.', () => advButtons([{ label: 'Recibir a Lapras', fn: () => shinyCheck(131) }])); }
        rocketBattle();
      }) }]));
}
function doDojo() {
  advSay('Derrotas al maestro del Dojo Karate y te deja elegir uno de sus Pokémon… La ruleta decide.', () => advButtons([{ label: 'Elegir', fn: () =>
    spinUI('Dojo Karate', 'Hitmonlee o Hitmonchan.', [wseg(106), wseg(107)], 'DOJO', r => { log(`🥋 El Dojo Karate te da a ${pname(r.n)}.`); caught(r.n, r.shiny); }) }]));
}
function doSeafoam() { log('❄️ En lo más hondo de las Islas Espuma…'); advSay('En lo más hondo de las Islas Espuma, el aire se congela… Algo enorme bate las alas.', () => advButtons([{ label: 'Acercarse', fn: () => meetLegend([144]) }])); }
function doMansion() { const L = loc(); advSay('Exploras la Mansión Pokémon de Isla Canela. Un diario habla de un tal «Mew»…', () => advButtons([{ label: 'Explorar', fn: () =>
  wildWheel(`${L.name} · Mansión Pokémon`, '¿Qué Pokémon ronda por la mansión?', allOf([88, 109, 77, 58, 132, 126, 110, 89]), 'MANSIÓN') }])); }
function doLab() { doFossil('En el Laboratorio Pokémon de Isla Canela pueden revivir fósiles.'); }
function doPowerPlant() { const L = loc(); advSay('La Central Energía abandonada zumba de electricidad…', () => advButtons([{ label: 'Entrar', fn: () =>
  spinUI(`${L.name} · Central Energía`, 'Pokémon eléctricos… o el legendario Zapdos.', [{ label: 'Pokémon eléctrico', short: 'ELÉCTRICO', color: '#f7d02c', w: 3, k: 'mon' }, { label: 'Zapdos', short: 'ZAPDOS', color: '#ffd84a', w: 1, k: 'zapdos' }], 'CENTRAL', r => {
    if (r.k === 'zapdos') return meetLegend([145]);
    wildWheel(`${L.name} · Central Energía`, '¿Qué Pokémon eléctrico aparece?', allOf(regionPool(typed('Eléctrico'))), 'CENTRAL');
  }) }])); }
function doCCave() { log('🌀 Entras en la Cueva Celeste.'); advSay('Entras en la Cueva Celeste. En lo más profundo, un Pokémon creado por el hombre te observa…', () => advButtons([{ label: 'Acercarse', fn: () => meetLegend([150]) }])); }
function doVictory() { const L = loc(); advSay('La Calle Victoria: la última prueba antes de la Liga. Hay rocas, entrenadores… y una llama que arde en lo alto.', () => advButtons([{ label: 'Cruzar', fn: () =>
  spinUI(`${L.name} · Calle Victoria`, 'Pokémon de cueva, entrenadores o el legendario Moltres.', [{ label: 'Pokémon de cueva', short: 'POKÉMON', color: '#9a7b55', w: 2, k: 'mon' }, { label: 'Entrenador', short: 'ENTRENADOR', color: '#ff5a46', w: 1, k: 'tr' }, { label: 'Moltres', short: 'MOLTRES', color: '#ffd84a', w: 1, k: 'moltres' }], 'VICTORIA', r => {
    if (r.k === 'moltres') return meetLegend([146]);
    if (r.k === 'tr') return doTrainer();
    wildWheel(`${L.name} · Calle Victoria`, '¿Quién vive en la Calle Victoria?', allOf(regionPool(caveMon)), 'CUEVA');
  }) }])); }
// ---- Sitios especiales de Johto (quesitos opcionales del camino) ----
function doBellsprout() {
  const L = loc(), t = { name: 'Sabio de la Torre Bellsprout', team: [69, 69] };
  advSay('Subes a la Torre Bellsprout, que se balancea sin parar. Un sabio te reta.', () => advButtons([{ label: '¡A combatir!', fn: () =>
    battle(`${L.name} · Torre Bellsprout`, t.name, t.team, 1, () => { addPoints(PTS.win, 'Torre Bellsprout'); advSay('¡Has superado la prueba de la Torre Bellsprout! ¿Habrá evolución?', () => advButtons([{ label: 'Ruleta de evolución', fn: phaseEvolve }])); },
      ' Perder aquí no acaba la partida.', () => advSay('El sabio te ha ganado… pero solo era un entrenamiento.', goOn)) }]));
}
function doRuins() { log('🔤 Exploras las Ruinas Alfa.'); advSay('En las Ruinas Alfa, unas letras misteriosas cobran vida… ¡un Unown!', () => advButtons([{ label: '¡A por él!', fn: () => throwBall(201) }])); }
function doForest() { const L = loc(); advSay('Te adentras en el Encinar, un bosque espeso y oscuro.', () => advButtons([{ label: 'Buscar entre los árboles', fn: () => wildWheel(`${L.name} · Encinar`, '¿Quién vive en el bosque?', allOf(regionPool(n => ptypes(n).some(t => t === 'Planta' || t === 'Bicho'))), 'ENCINAR') }])); }
function doContest() {
  const L = loc(); run.ball = 1;
  advSay('¡Concurso de bichos en el Parque Nacional! Te dan una Ball de Parque (+1 quesito verde en la captura).', () => advButtons([{ label: 'Buscar bichos', fn: () => wildWheel(`${L.name} · Concurso de bichos`, '¿Qué bicho encuentras?', allOf(regionPool(n => ptypes(n).includes('Bicho'))), 'CONCURSO') }]));
}
function doSafari() {
  const pool = randomPick(regionPool(), 7);
  advSay('¡Zona Safari! Aquí no hay que combatir: lo que salga en la ruleta, te lo llevas.', () => advButtons([{ label: 'Entrar', fn: () =>
    spinUI('Zona Safari', `Siete Pokémon de ${REG().name}. El que salga, es tuyo.`, pool.map(n => wseg(n)), 'SAFARI', r => { log(`🦒 Zona Safari: ¡${pname(r.n)}${r.shiny ? ' ★' : ''}!`); caught(r.n, r.shiny); }) }]));
}
function doTin() { log('🔔 Subes a la Torre Hojalata.'); advSay('Con tus medallas, por fin puedes subir a la Torre Hojalata… Algo brilla en lo alto.', () => advButtons([{ label: 'Subir', fn: () => meetLegend([250]) }])); }
function doIcepath() { const L = loc(); advSay('La Ruta Helada resbala… Algo se mueve bajo el hielo.', () => advButtons([{ label: 'Mirar', fn: () => wildWheel(`${L.name} · Ruta Helada`, '¿Qué Pokémon vive en el hielo?', allOf(regionPool(n => ptypes(n).some(t => t === 'Hielo' || t === 'Agua'))), 'HELADA') }])); }
function doMortar() { advSay('Entras en el Monte Mortero, lleno de túneles.', () => advButtons([{ label: 'Explorar', fn: doCave }])); }
function doRadio() { doRocketWheel('¡El Team Rocket ha tomado la Torre Radio de Ciudad Trigal!'); }

// un sitio especial: texto + botón y después lo que diga su descripción
function doSpot(k) { const E = EVENTS[k], s = E.spot; if (s.txt) return advSay(s.txt, () => advButtons([{ label: s.btn || 'Recibirlo', fn: () => runSpot(s, E.label) }])); runSpot(s, E.label); }
function runSpot(s, label) {
  const L = loc(), T = `${L.name} · ${label}`;
  switch (s.t) {
    case 'wild': { const pool = s.list ? s.list : regionPool(typed(...s.types)); return wildWheel(T, s.q || '¿Qué Pokémon aparece?', allOf(pool), s.center || 'SALVAJE'); }
    case 'legend': return meetLegend(s.ids);
    case 'gift': return spinUI(T, s.q || 'El que salga, es tuyo.', randomPick(s.ids, 8).map(n => wseg(n, isLegend(n) ? LEG_SLICE : 1)), s.center || 'REGALO', r => { log(`🎁 ${label}: ¡${pname(r.n)}${r.shiny ? ' ★' : ''}!`); caught(r.n, r.shiny, isLegend(r.n)); });
    case 'present': return advSay(s.got || `¡Recibes un ${pname(s.n)}!`, () => advButtons([{ label: `Recibir a ${pname(s.n)}`, fn: () => { log(`🎁 ${label}: te dan un ${pname(s.n)}.`); shinyCheck(s.n, isLegend(s.n)); } }]));
    case 'catch': { const sh = Math.random() < SHINY_RATE; log(`🌿 ${label}: ¡aparece ${pname(s.n)}${sh ? ' shiny ★' : ''}!`); return encounter(s.n, false, sh, f => throwBall(s.n, isLegend(s.n), sh, f, !!s.sure)); }
    case 'villain': return doRocketWheel(s.vt);
    case 'trainer': return doTrainer(s.who);
    case 'rival': return doRivalSlice();
    case 'item': return doItem();
    case 'cave': return doCave();
    case 'fossil': return doFossil(s.ft || 'Encuentras un fósil.');
    case 'evo': return evolveSure(s.et || 'Tu equipo entrena duro.');
    case 'blocker': return doBlocker(s.n, s.bt);
    case 'mix': return spinUI(T, s.q || '¿Qué te encuentras?', s.opts.map(o => ({ label: o.label, short: o.short || shortOf(o.label), color: o.color || '#ff9f43', w: o.w || 1, o })), s.center || shortOf(label), r => runSpot(r.o, label));
  }
}
// Pokémon que bloquea el camino (Snorlax, Kecleon…): capturarlo (seguro), vencerlo o que se aparte
function doBlocker(n, txt) {
  const b = badges(), nm = pname(n);
  advSay(txt || `Un ${nm} bloquea el camino…`, () => advButtons([{ label: 'Acercarse', fn: () =>
    spinUI(nm, 'Cuantas más medallas tienes, más fácil es atraparlo o vencerlo.', [
      { label: 'Capturarlo', short: 'CAPTURA', color: '#7ac74c', w: 1 + b * .25, k: 'catch' }, { label: 'Lo derrotas', short: 'VICTORIA', color: '#6390f0', w: 1 + b * .25, k: 'win' },
      { label: 'Se aparta', short: 'SE VA', color: '#8592ab', w: Math.max(.4, 2 - b * .2), k: 'run' }], shortOf(nm), r => {
        if (r.k === 'catch') return throwBall(n, false, undefined, 0, true);
        if (r.k === 'win') return advSay(`¡Has vencido a ${nm} y el camino queda libre! ¿Habrá evolución?`, () => advButtons([{ label: 'Ruleta de evolución', fn: phaseEvolve }]));
        advSay(`${nm} se aparta y desaparece. El camino queda libre.`, goOn);
      }) }]));
}
const ACT = {
  capture: doCapture, catchTwo: doCatchTwo, catchThree: doCatchThree, trainer: () => doTrainer(), shop: () => doShop(), straight: doStraight, daycare: doDaycare, rocket: () => doRocketWheel(),
  egg: doBabyEgg, legend: doLegendAct, trade: doTrade, item: doItem, cave: doCave, tree: doTree, multitask: doMultitask, fish: doFish, rival: doRivalSlice,
  train: () => evolveSure(`Entrenas a tu equipo en ${loc().name}.`), togepi: () => doEgg(), kurt: () => doKurt(), casino: () => doCasino(),
  bellsprout: doBellsprout, ruins: doRuins, forest: doForest, contest: doContest, safari: doSafari, tin: doTin, icepath: doIcepath, mortar: doMortar, radio: doRadio,
  burned: () => doBurned(), lighthouse: () => doLighthouse(), pharmacy: () => doPharmacy(), lake: () => doLake(), dragon: () => doDragon(), well: doWell, hideout: doHideout, whirl: doWhirl,
  // Kanto
  viridian: doViridian, moon: doMoon, magikarp: doMagikarp, bill: doBill, ssanne: doSSAnne, tunnel: doTunnel, tower: doTower, hideoutk: doHideoutK, snorlax: doSnorlax,
  safarik: doSafariK, silph: doSilph, dojo: doDojo, seafoam: doSeafoam, mansion: doMansion, lab: doLab, powerplant: doPowerPlant, ccave: doCCave, victory: doVictory, tea: () => doTea(),
};
// los sitios descritos con datos (Hoenn → Paldea) se resuelven solos
Object.keys(EVENTS).forEach(k => { if (EVENTS[k].spot && !ACT[k]) ACT[k] = () => doSpot(k); });
