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
function buildMenu() {
  const grid = $('grid');
  // arriba del todo: las partidas sin terminar (una por región), para seguirlas o borrarlas
  items.push({ el: $('savesCard'), act: () => { chord([523, 659, 880]); show('saves'); } });
  // Modo Caos (el primero): gimnasios, Alto Mando y Campeón al azar de todas las regiones
  {
    const g = CHAOS_GEN, b = document.createElement('button');
    b.type = 'button'; b.className = 'card chaos'; b.style.setProperty('--c', g.color);
    b.innerHTML = cardHTML(g, false).replace(`GEN ${g.roman}`, 'MODO CAOS');
    b.setAttribute('aria-label', 'Modo Caos: gimnasios, Alto Mando y Campeón al azar de todas las regiones');
    grid.appendChild(b);
    items.push({ el: b, act: () => { chord([523, 740, 1046]); pick(g); } });
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
  $('chosenGen').textContent = g === CHAOS_GEN ? 'MODO CAOS' : 'GENERACIÓN ' + g.roman;
  $('chosenRegion').textContent = g.region;
  $('chosenRange').textContent = `Nº ${pad(g.from)}–${pad(g.to)}`;
  $('chosenCount').textContent = g.to - g.from + 1;
  $('chosenYear').textContent = g.year;
  $('chosenGames').textContent = g.games;
  show('chosen');
  typeText($('chosenText'), g === CHAOS_GEN ? 'Modo Caos: 8 gimnasios de cualquier región, un Alto Mando y un Campeón al azar. Cada partida es distinta. ¿Te atreves?'
    : `Perfecto. Destino fijado: región de ${g.region}. Prepara tu mochila.`);
  const key = g.region.toLowerCase();
  if (REGIONS[key]) {
    const saved = loadRun(key), cont = saved && saved.team && saved.team.length, best = getBest()[key];
    $('advEntry').innerHTML = (cont ? `<button class="btn" type="button" id="advCont">Continuar partida</button>` : '') + `<button class="btn${cont ? ' ghostbtn' : ''}" type="button" id="advGo">${cont ? 'Nueva aventura' : 'Empezar aventura →'}</button>` + (best ? `<p class="wip" style="flex-basis:100%;padding:8px">RÉCORD EN ${g.region.toUpperCase()} · ${best} PUNTOS · RANGO ${rank(best, key)}</p>` : '');
    if (cont) $('advCont').onclick = () => { chord([659, 880, 1175]); run = saved; advStart(false, key); };
    histFilter = 'all'; renderHistory(key); requestAnimationFrame(fitHistory);
    $('advGo').onclick = () => { chord([659, 880, 1175]); advStart(true, key); };
  } else { $('advEntry').innerHTML = `<p class="wip">LA AVENTURA DE ${g.region.toUpperCase()} LLEGARÁ PRONTO</p>`; $('advHist').innerHTML = ''; }
}
