// Perfil: ficha del entrenador (sus números), logros (conseguidos y por conseguir) y Hall de la Fama histórico (todos los campeones)
const fmtTime = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h} h ${m} min` : `${m} min`; };
function renderProfile() {
  const s = statsGet(), got = achGet(), hof = store.getJSON(HOF_LIST_KEY, []), best = getBest();
  const favN = Object.entries(s.fav).sort((a, b) => b[1] - a[1])[0], fav = favN && BY_NUM.get(+favN[0]);
  const favSpr = fav && SPR.normal.get(+favN[0]);
  const bestR = Object.entries(best).sort((a, b) => b[1] - a[1])[0];
  const forms = PDX.f.size;
  const ts = playerTrainerSpr();
  const num = (v, l) => `<div class="pf-num"><b>${v}</b><span>${l}</span></div>`;
  const ach = ACHIEVEMENTS.map(([id, name, how, ico]) => `<div class="pf-ach${got[id] ? ' on' : ''}" title="${name}: ${how}${got[id] ? ` (conseguido el ${new Date(got[id]).toLocaleDateString('es-ES')})` : ''}"><span class="pf-ai">${got[id] ? ico : '🔒'}</span><span class="pf-at"><b>${name}</b><small>${how}</small></span></div>`).join('');
  const nGot = ACHIEVEMENTS.filter(a => got[a[0]]).length;
  const hofHTML = hof.length ? hof.map(h => `<div class="pf-hof"><div class="pf-hh"><b>${h.name}</b><span>${h.points} pts · rango ${h.rank} · ${new Date(h.t).toLocaleDateString('es-ES')}</span></div>
      <div class="pf-ht">${h.team.map(m => { const r = monSprite(m); return `<span title="${m.nick || mname(m)}${m.shiny ? ' ★' : ''}">${r ? `<img src="${r.u}" alt=""${r.px ? ' class="px"' : ''}>` : ''}</span>`; }).join('')}</div></div>`).join('')
    : '<p class="pf-empty">Aún no has ganado ninguna Liga. ¡Tu primer equipo campeón aparecerá aquí!</p>';
  $('profileBody').innerHTML = `
    <div class="pf-card frame">
      <div class="pf-me">${ts ? `<img src="${ts}" alt="">` : ''}<b>${trainerName()}</b><small>Entrenador</small></div>
      <div class="pf-nums">
        ${num(s.games, 'partidas')}${num(s.wins, 'Ligas ganadas')}${num(s.losses, 'derrotas')}${num(fmtTime(s.time), 'jugado')}
        ${num(s.cap, 'capturas')}${num(s.shiny, 'shiny')}${num(s.legend, 'legendarios')}${num(s.evo, 'evoluciones')}
        ${num(s.badges, 'medallas')}${num(PDX.c.size, 'especies en la Pokédex')}${num(forms, 'formas registradas')}${num(s.champs.length, 'regiones campeón')}
      </div>
      <div class="pf-extra">
        ${fav ? `<div class="pf-fav">${favSpr ? `<img src="${favSpr.u}" alt=""${favSpr.px ? ' class="px"' : ''}>` : ''}<span><small>Pokémon favorito</small><b>${fav[1]}</b><em>en ${favN[1]} partidas</em></span></div>` : ''}
        ${bestR && REGIONS[bestR[0]] ? `<div class="pf-fav"><span><small>Mejor récord</small><b>${REGIONS[bestR[0]].name}</b><em>${bestR[1]} puntos</em></span></div>` : ''}
      </div>
    </div>
    <p class="label">Logros · ${nGot} de ${ACHIEVEMENTS.length}</p>
    <div class="pf-achs">${ach}</div>
    <p class="label">Hall de la Fama</p>
    <div class="pf-hofs">${hofHTML}</div>`;
}
