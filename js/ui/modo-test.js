// Modo Test: antes de empezar eliges tu equipo (hasta 6 Pokémon, shiny o no, con su megapiedra o su Banda Dinamax)
// y los objetos de tu mochila. Después, la partida sigue el camino del Modo Caos. Lo último que elegiste se recuerda.
const TEST_KEY = 'ruleta-test-setup';
let testSet = null;
function testLoad() {
  const s = store.getJSON(TEST_KEY, null) || {};
  testSet = { team: (s.team || []).filter(t => BY_NUM.get(t.n)).slice(0, 6), bag: { ...(s.bag || { potion: 1 }) }, ball: s.ball ? 1 : 0 };
}
const testSave = () => store.setJSON(TEST_KEY, testSet);
const tsSpr = (n, sh) => { const r = (sh && SPR.shiny.get(n)) || SPR.normal.get(n); return r ? `<img src="${r.u}" alt=""${r.px ? ' class="px"' : ''}>` : ''; };

function openTestSetup() {
  if (!testSet) testLoad();
  let sh = $('tstShade');
  if (!sh) {
    sh = document.createElement('div'); sh.className = 'tst-shade'; sh.id = 'tstShade';
    sh.innerHTML = `<div class="tst" role="dialog" aria-modal="true" aria-label="Modo Test">
      <div class="tst-bar"><span class="tst-ico">T</span><span class="tst-title"><b>Modo Test</b><small>Elige tu equipo y tu mochila</small></span>
        <button class="info-close" type="button" id="tstClose" aria-label="Cerrar">✕</button></div>
      <div class="tst-body">
        <section class="tst-col"><h4 class="tst-tag">Equipo <em id="tstCount"></em></h4><div class="tst-slots" id="tstSlots"></div>
          <h4 class="tst-tag">Mochila</h4><div class="tst-bag" id="tstBag"></div></section>
        <section class="tst-col"><h4 class="tst-tag">Pokémon <em>toca uno para añadirlo</em></h4>
          <input class="tst-q" id="tstQ" type="search" placeholder="Busca por nombre o número…" autocomplete="off">
          <div class="tst-list" id="tstList"></div></section>
      </div>
      <div class="tst-foot"><button class="btn ghostbtn" type="button" id="tstClear">Vaciar equipo</button><button class="btn" type="button" id="tstGo">Empezar →</button></div>
    </div>`;
    document.body.appendChild(sh);
    sh.addEventListener('pointerdown', e => { if (e.target === sh) closeTestSetup(); });
    $('tstClose').onclick = closeTestSetup;
    $('tstQ').oninput = () => { clearTimeout(sh._t); sh._t = setTimeout(testList, 120); };
    $('tstClear').onclick = () => { testSet.team = []; testSave(); beep(440, .05, .03); testRender(); };
    $('tstGo').onclick = testStart;
    addEventListener('keydown', e => { if (e.key === 'Escape' && $('tstShade') && !$('tstShade').hidden) { e.stopImmediatePropagation(); closeTestSetup(); } }, true);
  }
  sh.hidden = false; $('tstQ').value = ''; testRender(); testList();
}
function closeTestSetup() { const sh = $('tstShade'); if (sh) sh.hidden = true; }

// equipo: cada hueco con su Pokémon, el botón shiny, la megapiedra (si puede megaevolucionar) y la Banda Dinamax (si tiene Gigamax)
function testRender() {
  const T = testSet.team;
  $('tstCount').textContent = `${T.length} / 6`;
  $('tstSlots').innerHTML = Array.from({ length: 6 }, (_, i) => {
    const t = T[i]; if (!t) return '<div class="tst-slot empty"><span>Vacío</span></div>';
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
  S.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { T.splice(+b.dataset.rm, 1); testDone(); });
  S.querySelectorAll('[data-sh]').forEach(b => b.onclick = () => { const t = T[+b.dataset.sh]; t.shiny = !t.shiny; testDone(t.shiny ? 988 : 660); });
  // megapiedra: sin piedra → la primera → la siguiente (X / Y) → sin piedra
  S.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { const t = T[+b.dataset.st], ms = megaForms({ n: t.n }), i = ms.indexOf(t.stone);
    if (i < 0) t.stone = ms[0]; else if (i < ms.length - 1) t.stone = ms[i + 1]; else delete t.stone; testDone(); });
  S.querySelectorAll('[data-dm]').forEach(b => b.onclick = () => { const t = T[+b.dataset.dm]; t.dmax = t.dmax ? 0 : 1; testDone(); });
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

// lista para elegir: busca por nombre (sin tildes) o por número; sin búsqueda, los primeros
function testList() {
  const q = norm($('tstQ').value.trim()), qn = q.replace(/^0+/, '');
  const rows = DEX.filter(r => !q || NAME_KEY.get(r[0]).includes(q) || (qn && String(r[0]).startsWith(qn))).slice(0, 90);
  $('tstList').innerHTML = rows.map(([n, name, , ty]) => `<button class="tst-mon" type="button" data-n="${n}" style="--c:${TYPE_COLORS[ty[0]]}"><span class="tst-spr">${tsSpr(n)}</span><small>${padN(n)}</small><span>${name}</span></button>`).join('')
    || '<p class="tst-none">Ningún Pokémon coincide con la búsqueda.</p>';
  $('tstList').querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
    if (testSet.team.length >= 6) { beep(220, .08, .03); advToastMenu('Tu equipo ya tiene 6 Pokémon: quita uno primero'); return; }
    testSet.team.push({ n: +b.dataset.n, shiny: false }); testDone(880);
    b.animate && b.animate([{ transform: 'scale(.9)' }, { transform: 'none' }], { duration: 200 });
  });
}
// aviso corto dentro de la ventana (la de la aventura aún no está abierta)
function advToastMenu(t) { const el = document.createElement('div'); el.className = 'tst-toast'; el.textContent = t; $('tstShade').appendChild(el); setTimeout(() => el.remove(), 2200); }

function testStart() {
  if (!testSet.team.length) return;
  closeTestSetup();
  advStart(true, 'test', r => {
    r.team = testSet.team.map(t => {
      const m = { n: t.n, shiny: !!t.shiny };
      if (t.stone && megaForms(m).includes(t.stone)) m.stone = t.stone;
      if (t.dmax && gmaxForms(m).length) m.dmax = 1;
      return m;
    });
    r.bag = Object.fromEntries(Object.entries(testSet.bag).filter(([k, v]) => v > 0 && ITEMS[k]));
    r.ball = testSet.ball ? 1 : 0; r.starter = r.team[0].n;
    log(`🧪 Modo Test: empiezas con ${r.team.map(dname).join(', ')}.`);
  });
}
