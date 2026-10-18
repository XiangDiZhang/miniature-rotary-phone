// Jugar: partidas en curso. Se guarda una por región (la última que jugaste ahí); aquí se ven las que no has terminado
// para seguirlas o borrarlas.
const genOf = k => k === 'caos' ? CHAOS_GEN : GENS.find(g => g.region.toLowerCase() === k);
// partidas sin terminar: con equipo, sin perder y sin haber llegado al Hall de la Fama
function activeSaves() {
  return Object.keys(REGIONS).map(k => [k, loadRun(k)]).filter(([k, r]) => r && genOf(k) && r.team && r.team.length && !r.over && !r.histSaved);
}
const saveSpr = m => { const r = monSprite(m); return r ? `<img src="${r.u}" alt=""${r.px ? ' class="px"' : ''}>` : ''; };
// dónde se quedó: el nombre de la parada (en el Modo Caos, el camino de esa partida)
function savePlace(k, r) {
  try { const path = k === 'caos' ? chaosPath(r.chaos) : REGIONS[k].path, p = path[Math.min(r.step, path.length - 1)]; return p.leader && p.kind === 'gym' ? `${p.name} · ${p.leader}` : p.name; } catch (e) { return ''; }
}
function whenTxt(t) {
  if (!t) return '';
  const d = new Date(t), mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return 'ahora mismo'; if (mins < 60) return `hace ${mins} min`; if (mins < 24 * 60) return `hace ${Math.round(mins / 60)} h`;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}
// el botón grande de «Partidas en curso» (Selección de región): cuántas hay y el primer Pokémon de cada una
function renderSavesCard() {
  const s = activeSaves();
  $('savesIco').innerHTML = typeof PC_BOX_SVG !== 'undefined' ? PC_BOX_SVG : '';
  $('savesSub').textContent = s.length ? `${s.length} ${s.length > 1 ? 'partidas sin terminar' : 'partida sin terminar'} · ${s.map(([k]) => genOf(k).region).join(', ')}` : 'No tienes ninguna partida a medias';
  $('savesPeek').innerHTML = s.map(([k, r]) => `<span style="--c:${genOf(k).color}">${saveSpr(r.team[0])}</span>`).join('');
  $('savesCard').hidden = !s.length;   // sin partidas a medias, el botón no sale
}
function renderSaves() {
  const s = activeSaves(), L = $('savesList');
  typeText($('savesText'), s.length ? 'Estas son tus aventuras a medias. Solo puedes tener una por región: si empiezas otra nueva en esa región, se sustituye.' : 'No tienes ninguna partida a medias. ¡Elige una región y empieza una aventura!');
  if (!s.length) { L.innerHTML = '<p class="wip">NO HAY PARTIDAS EN CURSO</p>'; return; }
  L.innerHTML = s.map(([k, r]) => { const g = genOf(k), team = r.team.slice(0, 6);
    return `<div class="save-row" style="--c:${g.color}" data-k="${k}">
      <div class="save-head"><span class="save-gen">${k === 'caos' ? 'MODO CAOS' : 'GEN ' + g.roman}</span><b>${g.region}</b><span class="save-when">${whenTxt(r.t)}</span></div>
      <div class="save-team">${team.map(m => `<span class="save-mon${m.shiny ? ' shiny' : ''}" title="${dname(m)}">${saveSpr(m)}</span>`).join('')}${r.box && r.box.filter(Boolean).length ? `<span class="save-box">+${r.box.filter(Boolean).length} en la caja</span>` : ''}</div>
      <div class="save-meta"><span>📍 ${savePlace(k, r)}</span><span>◆ ${r.badges.length} medalla${r.badges.length === 1 ? '' : 's'}</span><span>⭐ ${r.points} pts · ${rank(r.points, k)}</span></div>
      <div class="save-btns"><button class="btn" type="button" data-go="${k}">Continuar →</button><button class="btn ghostbtn save-del" type="button" data-del="${k}">Borrar</button></div>
    </div>`; }).join('');
  L.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { const k = b.dataset.go, r = loadRun(k); if (!r) return renderSaves(); chord([659, 880, 1175]); run = r; advStart(false, k); });
  // borrar pide confirmación: el primer toque pregunta y el segundo borra
  L.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    if (!b.classList.contains('sure')) { b.classList.add('sure'); b.textContent = '¿Seguro? Toca otra vez'; beep(330, .08, .03); setTimeout(() => { if (b.isConnected) { b.classList.remove('sure'); b.textContent = 'Borrar'; } }, 3000); return; }
    const k = b.dataset.del, row = b.closest('.save-row'); store.remove('ruleta-run-' + k); if (run && run.region === k) run = null; beep(220, .12, .04);
    const done = () => { renderSaves(); renderSavesCard(); };
    if (reduceMotion || !row.animate) return done();
    row.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(40px)' }], { duration: 280, easing: 'ease-in' }).onfinish = done;
  });
}
$('savesBack').onclick = goPlay;
