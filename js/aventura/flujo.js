// Aventura: flujo de la partida (fases, evolución, gimnasios, final)
function advStart(fresh, region) {
  region = region || (run && run.region) || 'kanto';
  if (fresh || !run || run.region !== region) run = newRun(region);
  normBox(); [...run.team, ...boxList()].forEach(m => dexRegister(m.n, m.shiny));
  show('adv'); $('eyebrow').textContent = 'Aventura · ' + REG().name;
  renderAdv(); fitAdv(); requestAnimationFrame(fitAdv); advNext();
}
function advNext() {
  $('advExtra').hidden = true; saveRun(); renderAdv();
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
    R.starters.map(n => wseg(n, 1, true /* PRUEBA: de momento todos los iniciales son shiny */)), 'INICIAL', r => {
      run.starter = r.n;
      // PRUEBA: de momento el inicial siempre es shiny (luego volverá a ser el 1 %)
      const sh = !!r.shiny;
      addMon(r.n, sh); log(`🎉 Tu inicial es ${sh ? '✦ ' : ''}${pname(r.n)}. Recibes ${run.bag.potion} Poción${run.bag.potion > 1 ? 'es' : ''}.`);
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
    .filter(a => !(a.k === 'trade' && run.team.length + boxList().length < 1));
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
// Tras ganar un combate SIEMPRE sale la ruleta de evolución (1/4, 1/3, 1/2… y a la cuarta, segura).
// Si cae en "¡Evolución!" pero nadie de tu equipo puede evolucionar, en su lugar recibes una Poción.
function phaseEvolve() {
  const cands = run.team.filter(canEvolve);
  const fails = run.evoFails || 0, ch = EVO_CHANCES[Math.min(3, fails)];
  const who = () => {
    if (!cands.length) { run.bag.potion = (run.bag.potion || 0) + 1; log('🧪 Nadie puede evolucionar: recibes una Poción.'); renderAdv(); return advSay('¡Tocaba evolución, pero ningún Pokémon de tu equipo puede evolucionar! En su lugar recibes una Poción.', goOn); }
    if (cands.length === 1) return evolve(cands[0]);
    spinUI('Evolución · ¿Quién?', '¡Alguien va a evolucionar! La ruleta elige quién.',
      cands.map(m => ({ label: dname(m), n: mid(m), color: TYPE_COLORS[mtypes(m)[0]], short: dname(m), m })), '¿QUIÉN?', r => evolve(r.m));
  };
  if (ch >= 1) { run.evoFails = 0; return advSay('¡Tu equipo ha combatido tanto que esta vez la evolución es segura!', () => advButtons([{ label: cands.length ? '¿Quién evoluciona?' : 'Continuar', fn: who }])); }
  spinUI('Evolución · ¿Habrá suerte?', 'Si cae en dorado, alguien de tu equipo evolucionará (o, si nadie puede, recibes una Poción).',
    [{ label: '¡Evolución!', short: '¡EVOLUCIÓN!', color: '#ffd84a', w: ch, ok: 1 }, { label: 'Nada', short: 'NADA', color: '#8592ab', w: 1 - ch }], 'EVOLUCIÓN', r => {
      if (r.ok) { run.evoFails = 0; return advSay(cands.length ? '¡Algo está pasando! Uno de tus Pokémon empieza a brillar…' : '¡Ha caído en Evolución!', () => advButtons([{ label: cands.length ? '¿Quién evoluciona?' : 'Ver premio', fn: who }])); }
      run.evoFails = fails + 1; log('🔸 Esta vez nadie evoluciona.');
      advSay('Esta vez no ha pasado nada… La próxima victoria tendrá más posibilidades.', goOn);
    });
}
function evolve(m, msg, shared = false) {
  const opts = evoOptions(m);
  const done = o => {
    const toM = { n: o.n, form: o.form || 0, shiny: m.shiny };
    advButtons([]);
    evoAnim(m, { id: mid(m), ty: mtypes(m), name: mname(m) }, { id: mid(toM), n: o.n, ty: mtypes(toM), name: mname(toM) }, () => doneNow(o));
  };
  const doneNow = o => {
    onWheel.delete(m); if (advWheel.centerM === m) { advWheel.centerM = null; advWheel.centerImg = null; advWheel.centerName = null; advWheel.draw(); }
    const from = mname(m); m.n = o.n; if (o.form) m.form = o.form; else delete m.form; dexRegister(o.n, m.shiny);
    const toName = sname(m);
    addPoints(PTS.evolve, `${from} evoluciona`); advToast(`¡${from} evoluciona a ${toName}!`); chord([784, 988, 1318, 1568]);
    log(`✨ ¡${from} ha evolucionado a ${toName}!`); renderAdv(); saveRun();
    // Repartir Exp.: otro Pokémon del equipo evoluciona también (una vez por evolución)
    const others = run.bag.share && !shared ? run.team.filter(o => o !== m && canEvolve(o)) : [];
    const next = others.length ? () => advButtons([{ label: 'Repartir Exp. →', fn: () => others.length === 1 ? evolve(others[0], 'El Repartir Exp. también ha hecho efecto.', true) :
      spinUI('Repartir Exp. · ¿Quién más?', 'Otro Pokémon de tu equipo aprovecha la experiencia.', others.map(o => ({ label: dname(o), n: mid(o), color: TYPE_COLORS[mtypes(o)[0]], short: dname(o), m: o })), 'REPARTIR', r => evolve(r.m, 'El Repartir Exp. también ha hecho efecto.', true)) }]) : goOn;
    advSay(`${msg ? msg + ' ' : ''}¡Enhorabuena! ¡${from} ha evolucionado a ${toName}!${others.length ? ' ¡Y el Repartir Exp. brilla!' : ''}`, next);
  };
  if (opts.length === 1) return done(opts[0]);
  // varias evoluciones posibles: el Pokémon se sube al centro de la ruleta (desde su quesito o desde su ficha)
  const inCenter = advWheel.centerM === m;
  const seg = advWheel.segs.find(x => x.m === m && x._sp), cr = advWheel.cv.getBoundingClientRect(), kk = cr.width / advWheel.size;
  const tile = [...$('advTeam').querySelectorAll('.tmw')].find(x => x._m === m);
  const from = inCenter ? null : seg && !seg.hideImg ? { left: cr.left + seg._sp.x * kk - seg._sp.sz * kk / 2, top: cr.top + seg._sp.y * kk - seg._sp.sz * kk / 2, width: seg._sp.sz * kk, height: seg._sp.sz * kk }
    : tile && tile.offsetParent ? (tile.querySelector('.sp') || tile).getBoundingClientRect() : null;
  advWheel.keepM = m;
  spinUI(`Evolución · ${mname(m)}`, 'Puede evolucionar de varias formas. ¿Cuál será?',
    opts.map(o => { const nm = mname(o); return { label: nm, n: o.form || o.n, shiny: m.shiny, color: TYPE_COLORS[mtypes(o)[0]], short: nm, o }; }), 'EVOLUCIÓN', r => done(r.o));
  flyToCenter(m, from);
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
    advSay(L.badge ? `¡Increíble! Has derrotado a ${L.leader}. ¡Consigues la ${L.badge}! ¿Habrá evolución?` : `¡Has derrotado a ${L.leader}! ¿Habrá evolución antes del siguiente?`, () => advButtons([{ label: 'Ruleta de evolución', fn: phaseEvolve }]));
  }, '', null, L.typeName);
}
function phaseEnd() {
  run.stepDone = true; saveHistory(true);
  if (run.record === undefined) { run.record = saveBest(); saveRun(); }
  $('advStep').textContent = 'Fin de la aventura'; advWheel.enabled = false;
  const team = run.team.map(m => (m.shiny ? '✦ ' : '') + mname(m)).join(', ');
  advSay(`${REG().end()} ${run.points} puntos (rango ${rank(run.points)}).${run.record ? ' ¡Nuevo récord!' : ''} Medallas: ${run.badges.length}. Tu equipo: ${team}.`, () => advButtons([
    { label: 'Nueva partida', fn: () => advStart(true) }, { label: '← Menú', ghost: true, fn: goMenu }]));
}

function initAdv() {
  advWheel = new Wheel($('advWheel'));
  advWheel.onTap = () => { const b = [...$('advBtns').querySelectorAll('button:not([disabled])')].find(x => !x.classList.contains('ghostbtn')); if (b) b.click(); };
  addEventListener('resize', () => { if (state.scene === 'adv') fitAdv(); });
  // móvil: los datos del líder/ruta van en un panel lateral (como los filtros de la Pokédex) y el equipo se ve siempre debajo de la ruleta
  const mq = matchMedia('(max-width: 760px)');
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
  $('advNew').onclick = () => { advWheel.stop(); advStart(true); };
}
