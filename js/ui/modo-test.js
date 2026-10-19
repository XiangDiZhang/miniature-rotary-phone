// Modo Test (solo en modo desarrollador): antes de empezar eliges tu equipo (hasta 6 Pokémon, shiny o no, con su megapiedra
// o su Banda Dinamax) y los objetos de tu mochila. Los Pokémon se buscan en la Pokédex de verdad (con sus filtros): se abre en
// «modo elegir» y cada toque añade uno a tu equipo. Tienes todos los objetos: la mochila empieza llena y cada Pokémon que
// puede, lleva puesta su megapiedra y su Banda Dinamax (se pueden quitar). La partida sigue el camino del Modo Caos y no cuenta
// para nada de tu perfil (Pokédex, récords, historial ni Hall de la Fama). Lo último que elegiste se recuerda.
const TEST_KEY = 'ruleta-test-setup';
const TEST_FULL_BAG = () => Object.fromEntries(Object.keys(ITEMS).map(k => [k, ITEMS[k].retries ? 3 : 1]));   // todos los objetos
let testSet = null;
function testLoad() {
  const s = store.getJSON(TEST_KEY, null);
  testSet = s ? { team: (s.team || []).filter(t => BY_NUM.get(t.n)).slice(0, 6), bag: { ...(s.bag || {}) }, ball: s.ball ? 1 : 0 }
    : { team: [], bag: TEST_FULL_BAG(), ball: 1 };
}
const testSave = () => store.setJSON(TEST_KEY, testSet);
const tsSpr = (n, sh) => { const r = (sh && SPR.shiny.get(n)) || SPR.normal.get(n); return r ? `<img src="${r.u}" alt=""${r.px ? ' class="px"' : ''}>` : ''; };
// un Pokémon nuevo para el equipo: con su megapiedra y su Banda Dinamax puestas, si las puede llevar
function testMon(n) {
  const t = { n, shiny: false }, ms = megaForms({ n });
  if (ms.length) t.stone = ms[0];
  else if (gmaxForms({ n }).length) t.dmax = 1;   // (solo una de las dos: si puede megaevolucionar, lleva la megapiedra)
  return t;
}

function openTestSetup() {
  if (!devMode) return;   // el Modo Test es solo para el modo desarrollador
  if (!testSet) testLoad();
  let sh = $('tstShade');
  if (!sh) {
    sh = document.createElement('div'); sh.className = 'tst-shade'; sh.id = 'tstShade';
    sh.innerHTML = `<div class="tst" role="dialog" aria-modal="true" aria-label="Modo Test">
      <div class="tst-bar"><span class="tst-ico">T</span><span class="tst-title"><b>Modo Test</b><small>Elige tu equipo y tu mochila</small></span>
        <button class="info-close" type="button" id="tstClose" aria-label="Cerrar">✕</button></div>
      <div class="tst-body">
        <section class="tst-col"><h4 class="tst-tag">Equipo <em id="tstCount"></em></h4><div class="tst-slots" id="tstSlots"></div>
          <button class="btn tst-dex" type="button" id="tstDex">＋ Añadir desde la Pokédex</button></section>
        <section class="tst-col"><h4 class="tst-tag">Mochila <button class="tst-fill" type="button" id="tstFill">Todos los objetos</button></h4><div class="tst-bag" id="tstBag"></div></section>
      </div>
      <div class="tst-foot"><button class="btn ghostbtn" type="button" id="tstClear">Vaciar equipo</button><button class="btn" type="button" id="tstGo">Empezar →</button></div>
    </div>`;
    document.body.appendChild(sh);
    sh.addEventListener('pointerdown', e => { if (e.target === sh) closeTestSetup(); });
    $('tstClose').onclick = closeTestSetup;
    $('tstDex').onclick = testPick;
    $('tstFill').onclick = () => { testSet.bag = TEST_FULL_BAG(); testSet.ball = 1; testDone(988); };
    $('tstClear').onclick = () => { testSet.team = []; testSave(); beep(440, .05, .03); testRender(); };
    $('tstGo').onclick = testStart;
    addEventListener('keydown', e => { if (e.key === 'Escape' && $('tstShade') && !$('tstShade').hidden) { e.stopImmediatePropagation(); closeTestSetup(); } }, true);
  }
  sh.hidden = false; testRender();
}
function closeTestSetup() { const sh = $('tstShade'); if (sh) sh.hidden = true; }

// equipo: cada hueco con su Pokémon, el botón shiny, la megapiedra (si puede megaevolucionar) y la Banda Dinamax (si tiene Gigamax).
// Un hueco vacío abre la Pokédex para elegir
function testRender() {
  const T = testSet.team;
  $('tstCount').textContent = `${T.length} / 6`;
  $('tstSlots').innerHTML = Array.from({ length: 6 }, (_, i) => {
    const t = T[i]; if (!t) return '<button class="tst-slot empty" type="button" data-add="1"><span>＋ Pokédex</span></button>';
    const ty = ptypes(t.n), megas = megaForms({ n: t.n }), gmax = gmaxForms({ n: t.n }).length;
    return `<div class="tst-slot" style="--c:${TYPE_COLORS[ty[0]]};--c2:${TYPE_COLORS[ty[1]] || TYPE_COLORS[ty[0]]}">
      <button class="tst-x" type="button" data-rm="${i}" aria-label="Quitar a ${pname(t.n)}">✕</button>
      <span class="tst-spr">${tsSpr(t.n, t.shiny)}</span><b>${pname(t.n)}</b>
      <span class="tst-opts">
        <button class="tst-opt${t.shiny ? ' on' : ''}" type="button" data-sh="${i}" title="Shiny">✦</button>
        ${megas.length ? `<button class="tst-opt gem${t.stone ? ' on' : ''}" type="button" data-st="${i}" title="${t.stone ? stoneName(t.stone) + ' (toca para cambiarla o quitarla)' : 'Ponerle su megapiedra'}">${stoneHTML(t.stone || megas[0])}</button>` : ''}
        ${gmax ? `<button class="tst-opt dmax${t.dmax ? ' on' : ''}" type="button" data-dm="${i}" title="Banda Dinamax">${dmaxIcon()}</button>` : ''}
      </span></div>`;
  }).join('');
  const S = $('tstSlots');
  S.querySelectorAll('[data-add]').forEach(b => b.onclick = testPick);
  S.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { T.splice(+b.dataset.rm, 1); testDone(); });
  S.querySelectorAll('[data-sh]').forEach(b => b.onclick = () => { const t = T[+b.dataset.sh]; t.shiny = !t.shiny; testDone(t.shiny ? 988 : 660); });
  // megapiedra: la primera → la siguiente (X / Y) → sin piedra → la primera…
  S.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { const t = T[+b.dataset.st], ms = megaForms({ n: t.n }), i = ms.indexOf(t.stone);
    if (i < 0) { t.stone = ms[0]; t.dmax = 0; } else if (i < ms.length - 1) t.stone = ms[i + 1]; else delete t.stone; testDone(); });
  S.querySelectorAll('[data-dm]').forEach(b => b.onclick = () => { const t = T[+b.dataset.dm]; t.dmax = t.dmax ? 0 : 1; if (t.dmax) delete t.stone; testDone(); });   // (megapiedra o banda: ponerse una quita la otra)
  $('tstDex').disabled = T.length >= 6;
  // mochila: cada objeto con − y +, y la Ball de Kurt (sí o no)
  $('tstBag').innerHTML = Object.entries(ITEMS).map(([k, it]) => { const v = testSet.bag[k] || 0;
    return `<div class="tst-item${v ? ' on' : ''}" style="--c:${it.color}" title="${it.name}: ${it.desc || ''}"><span class="bag-ico">${bagIcon(k)}</span><span class="tst-inm">${it.name}</span>
      <button type="button" data-k="${k}" data-d="-1" aria-label="Uno menos">−</button><b>${v}</b><button type="button" data-k="${k}" data-d="1" aria-label="Uno más">+</button></div>`; }).join('')
    + `<div class="tst-item${testSet.ball ? ' on' : ''}" style="--c:#ff5a46" title="Ball de Kurt: +1 quesito verde en la próxima captura"><span class="bag-ico">${bagIcon('ball')}</span><span class="tst-inm">Ball de Kurt</span>
      <button type="button" class="tst-tog" data-ball="1">${testSet.ball ? 'Sí' : 'No'}</button></div>`;
  $('tstBag').querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k; testSet.bag[k] = Math.max(0, Math.min(9, (testSet.bag[k] || 0) + +b.dataset.d)); testDone(); });
  $('tstBag').querySelector('[data-ball]').onclick = () => { testSet.ball = testSet.ball ? 0 : 1; testDone(); };
  $('tstGo').disabled = !T.length;
  $('tstGo').textContent = T.length ? 'Empezar →' : 'Elige al menos un Pokémon';
}
function testDone(f = 740) { testSave(); beep(f, .04, .02); testRender(); }

// ---- Elegir en la Pokédex: se abre la Pokédex con una barra abajo (tu equipo y «Listo»); tocar un Pokémon lo añade ----
let dexPick = null;
function testPick() {
  if (testSet.team.length >= 6) { beep(220, .08, .03); return; }
  closeTestSetup(); beep(740, .05, .03);
  dexPick = n => {
    if (testSet.team.length >= 6) { beep(220, .08, .03); pickBar('¡Equipo completo! Pulsa «Listo».'); return; }
    testSet.team.push(testMon(n)); testSave(); beep(880, .05, .03); pickBar();
    if (testSet.team.length >= 6) setTimeout(endDexPick, 450);   // con 6, vuelve solo
  };
  document.body.classList.add('dex-picking');
  show('dex'); pickBar();
}
// barra de abajo de la Pokédex mientras eliges: los que llevas (tocar uno lo quita) y «Listo»
function pickBar(msg) {
  let b = $('pickBar');
  if (!b) { b = document.createElement('div'); b.className = 'pick-bar'; b.id = 'pickBar'; document.body.appendChild(b); }
  const T = testSet.team;
  b.innerHTML = `<span class="pk-t"><b>Modo Test</b><small>${msg || 'Toca un Pokémon para añadirlo a tu equipo'}</small></span>
    <span class="pk-team">${Array.from({ length: 6 }, (_, i) => T[i] ? `<button type="button" data-i="${i}" title="Quitar a ${pname(T[i].n)}">${tsSpr(T[i].n, T[i].shiny)}</button>` : '<i></i>').join('')}</span>
    <button class="btn" type="button" id="pickDone">Listo · ${T.length}/6</button>`;
  b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => { T.splice(+x.dataset.i, 1); testSave(); beep(440, .05, .03); pickBar(); });
  $('pickDone').onclick = endDexPick;
}
// vuelve de la Pokédex a la ventana del Modo Test (quiet: solo limpia, si te has ido a otra pantalla)
function endDexPick(quiet) {
  if (!dexPick) return;
  dexPick = null; document.body.classList.remove('dex-picking'); const b = $('pickBar'); if (b) b.remove();
  if (quiet === true) return;
  show('chosen'); openTestSetup();
}

function testStart() {
  if (!testSet.team.length) return;
  closeTestSetup();
  advStart(true, 'test', r => {
    r.team = testSet.team.map(t => {
      const m = { n: t.n, shiny: !!t.shiny };
      if (t.stone && megaForms(m).includes(t.stone)) m.stone = t.stone;
      if (t.dmax && !m.stone && gmaxForms(m).length) m.dmax = 1;   // (nunca las dos)
      return m;
    });
    r.bag = Object.fromEntries(Object.entries(testSet.bag).filter(([k, v]) => v > 0 && ITEMS[k]));
    r.ball = testSet.ball ? 1 : 0; r.starter = r.team[0].n;
    log(`🧪 Modo Test: empiezas con ${r.team.map(dname).join(', ')}.`);
  });
}
