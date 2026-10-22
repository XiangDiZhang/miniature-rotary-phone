// Jugar: tarjetas de generación y generación elegida
const items = [];
function cardHTML(g, locked) {
  const count = g.to - g.from + 1;
  return `<span class="ghost">${g.roman}</span>
    <div class="row-top"><span class="gen">GEN ${g.roman}</span><span>${locked ? 'BLOQUEADA' : g.year}</span></div>
    <div><div class="region">${g.region}</div><div class="games">${locked ? 'Próximamente' : g.games}</div></div>
    <div class="dex">
      <div class="dex-line"><i style="left:${(g.from - 1) / TOTAL * 100}%;width:${count / TOTAL * 100}%"></i></div>
      <div class="dex-meta"><span>Nº ${pad(g.from)}–${pad(g.to)}</span><span><b>${count}</b> especies</span></div>
    </div>`;
}
// tarjeta de un modo de juego (Caos, Randomlocke, Test): horizontal y compacta, con su símbolo grande, su nombre y qué es
function modeHTML(g, tag, desc) {
  return `<span class="m-sym">${g.roman}</span><span class="m-tx"><small>${tag}</small><b>${g.region}</b><span>${desc}</span></span><span class="m-go">→</span>`;
}
function buildMenu() {
  const grid = $('grid'), modes = $('modes');
  // arriba del todo: las partidas sin terminar (una por región), para seguirlas o borrarlas
  items.push({ el: $('savesCard'), act: () => { chord([523, 659, 880]); show('saves'); } });
  // Modo Caos (el primero): gimnasios, Alto Mando y Campeón al azar de todas las regiones
  {
    const g = CHAOS_GEN, b = document.createElement('button');
    b.type = 'button'; b.className = 'mode chaos'; b.style.setProperty('--c', g.color);
    b.innerHTML = modeHTML(g, 'Modo Caos', '8 gimnasios, Alto Mando y Campeón al azar de todas las regiones');
    b.setAttribute('aria-label', 'Modo Caos: gimnasios, Alto Mando y Campeón al azar de todas las regiones');
    modes.appendChild(b);
    items.push({ el: b, act: () => { chord([523, 740, 1046]); pick(g); } });
  }
  // Randomlocke: el camino del Modo Caos con iniciales y Pokémon salvajes totalmente al azar
  {
    const g = RANDOM_GEN, b = document.createElement('button');
    b.type = 'button'; b.className = 'mode randomlocke'; b.style.setProperty('--c', g.color);
    b.innerHTML = modeHTML(g, 'Randomlocke', 'Iniciales y Pokémon salvajes totalmente al azar');
    b.setAttribute('aria-label', 'Randomlocke: iniciales y Pokémon salvajes totalmente aleatorios');
    modes.appendChild(b);
    items.push({ el: b, act: () => { chord([523, 784, 988]); pick(g); } });
  }
  // Nuzlocke: un encuentro por zona y los Pokémon que caen no vuelven
  {
    const g = NUZ_GEN, b = document.createElement('button');
    b.type = 'button'; b.className = 'mode nuzlocke'; b.style.setProperty('--c', g.color);
    b.innerHTML = modeHTML(g, 'Nuzlocke', 'Un encuentro por zona; si pierdes, uno de tus Pokémon cae para siempre');
    b.setAttribute('aria-label', 'Nuzlocke: un encuentro por zona y los Pokémon que caen no vuelven');
    modes.appendChild(b);
    items.push({ el: b, act: () => { chord([392, 523, 659]); pick(g); } });
  }
  // Reto diario: el mismo camino e iniciales para todos cada día
  {
    const g = DAILY_GEN, b = document.createElement('button');
    b.type = 'button'; b.className = 'mode daily'; b.style.setProperty('--c', g.color);
    b.innerHTML = modeHTML(g, 'Reto diario · ' + new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }), 'El mismo camino e iniciales para todos hoy. ¿Cuántos puntos sacas?');
    b.setAttribute('aria-label', 'Reto diario: el mismo camino e iniciales para todos cada día');
    modes.appendChild(b);
    items.push({ el: b, act: () => { chord([523, 659, 988]); pick(g); } });
  }
  // Modo Test (solo en modo desarrollador): el camino del Modo Caos, pero eliges tú el equipo y los objetos
  {
    const g = TEST_GEN, b = document.createElement('button');
    b.type = 'button'; b.className = 'mode test dev-only'; b.hidden = !devMode; b.style.setProperty('--c', g.color);   // solo en modo desarrollador
    b.innerHTML = modeHTML(g, 'Modo Test', 'Eliges tu equipo y tu mochila (desarrollador)');
    b.setAttribute('aria-label', 'Modo Test: elige tu equipo y tus objetos');
    modes.appendChild(b);
    items.push({ el: b, act: () => { chord([523, 740, 988]); pick(g); } });
  }
  GENS.forEach(g => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'card'; b.style.setProperty('--c', g.color);
    b.innerHTML = cardHTML(g, false);
    b.setAttribute('aria-label', `Generación ${g.roman}, región de ${g.region}`);
    grid.appendChild(b);
    items.push({ el: b, act: () => { chord([659, 880, 1175]); pick(g); } });
  });
  COMING.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'card'; b.disabled = true; b.innerHTML = cardHTML(c, true);
    grid.appendChild(b);
  });
  items.push({ el: $('rouletteCard'), act: () => { chord([523, 784, 1046]); show('roulette'); } });
  items.forEach((it, idx) => {
    it.el.addEventListener('mouseenter', () => markActive(idx, true));
    it.el.addEventListener('focus', () => markActive(idx, true));
    it.el.addEventListener('click', it.act);
  });
  $('legend').innerHTML = GENS.map(g => `<span><i style="background:${g.color};box-shadow:0 0 8px ${g.color}"></i>GEN ${g.roman} · ${g.region}</span>`).join('');
}
let cursor = 0;
function markActive(idx, quiet) {
  if (idx !== cursor) beep(740, 0.05, quiet ? 0.015 : 0.03);
  cursor = idx;
  items.forEach((it, i) => it.el.classList.toggle('active', i === idx));
}
function pick(g) {
  state.chosen = g.id;
  $('chosenCard').style.setProperty('--c', g.color);
  $('chosenGhost').textContent = g.roman;
  $('chosenGen').textContent = g === CHAOS_GEN ? 'MODO CAOS' : g === TEST_GEN ? 'MODO TEST' : g === RANDOM_GEN ? 'RANDOMLOCKE' : g === NUZ_GEN ? 'NUZLOCKE' : g === DAILY_GEN ? 'RETO DIARIO' : 'GENERACIÓN ' + g.roman;
  $('chosenRegion').textContent = g.region;
  $('chosenRange').textContent = `Nº ${pad(g.from)}–${pad(g.to)}`;
  $('chosenCount').textContent = g.to - g.from + 1;
  $('chosenYear').textContent = g.year;
  $('chosenGames').textContent = g.games;
  show('chosen');
  typeText($('chosenText'), g === CHAOS_GEN ? 'Modo Caos: 8 gimnasios de cualquier región, un Alto Mando y un Campeón al azar. Cada partida es distinta. ¿Te atreves?'
    : g === DAILY_GEN ? `Reto del ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}: hoy todo el mundo juega el mismo camino con los mismos iniciales. Mañana, otro. ¡Saca la mejor puntuación!`
    : g === NUZ_GEN ? 'Nuzlocke: el camino del Modo Caos con reglas duras. Solo puedes capturar el primer Pokémon de cada zona y no hay pociones: cada vez que pierdas un giro de combate, uno de tus Pokémon cae para siempre y sigues girando hasta ganar o quedarte sin Pokémon. ¿Llegarás a la Liga?'
    : g === RANDOM_GEN ? 'Randomlocke: el camino del Modo Caos, pero todo al azar. Tus tres iniciales y cada Pokémon salvaje pueden ser cualquiera de los 1025. ¡Suerte!'
    : g === TEST_GEN ? 'Modo Test: el camino del Modo Caos, pero tú eliges los Pokémon de tu equipo y los objetos de tu mochila. No cuenta para la Pokédex ni para los récords.'
    : `Perfecto. Destino fijado: región de ${g.region}. Prepara tu mochila.`);
  const key = g.key || g.region.toLowerCase();
  if (REGIONS[key]) {
    // una partida perdida (o ya terminada en el Hall de la Fama) no se puede seguir: se borra y la región empieza de cero
    let saved = loadRun(key); if (saved && (saved.over || saved.histSaved)) { store.remove('ruleta-run-' + key); saved = null; }
    const cont = saved && saved.team && saved.team.length, best = getBest()[key === 'diario' ? 'diario:' + todayKey() : key];
    $('advEntry').innerHTML = (cont ? `<button class="btn" type="button" id="advCont">Continuar partida</button>` : '') + `<button class="btn${cont ? ' ghostbtn' : ''}" type="button" id="advGo">${cont ? 'Nueva aventura' : 'Empezar aventura →'}</button>` + (best ? `<p class="wip" style="flex-basis:100%;padding:8px">RÉCORD EN ${g.region.toUpperCase()} · ${best} PUNTOS · RANGO ${rank(best, key)}</p>` : '');
    if (cont) $('advCont').onclick = () => { chord([659, 880, 1175]); run = saved; advStart(false, key); };
    histFilter = 'all'; renderHistory(key); requestAnimationFrame(fitHistory);
    $('advGo').onclick = () => { chord([659, 880, 1175]); if (key === 'test') openTestSetup(); else advStart(true, key); };
  } else { $('advEntry').innerHTML = `<p class="wip">LA AVENTURA DE ${g.region.toUpperCase()} LLEGARÁ PRONTO</p>`; $('advHist').innerHTML = ''; }
}
