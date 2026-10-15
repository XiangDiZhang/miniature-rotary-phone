// Aventura: cinemáticas de derrota, Hall de la Fama y evolución
function loseScreen(who, done, team) {
  team = (team || run.team.concat(stolenList())).slice(0, 6);
  if (!team.length && run) team = [...boxList()].slice(0, 6);
  const sh = document.createElement('div'); sh.className = 'lose';
  let rain = ''; for (let i = 0; i < 70; i++) rain += `<i style="--x:${Math.random() * 100}%;--d:${.5 + Math.random() * .5}s;--dl:${Math.random() * 2}s;--h:${30 + Math.random() * 50}px"></i>`;
  sh.innerHTML = `<div class="lose-bg"></div><div class="lose-rain">${rain}</div>
    <div class="lose-row">${team.map((m, i) => `<div class="lose-mon" style="--i:${i}"><div class="lose-sp">${monThumb(m)}</div><span>${dname(m)}</span></div>`).join('')}</div>
    <div class="lose-txt"><small>${who ? 'Contra ' + who : 'Fin del viaje'}</small><b>Derrota</b><span>Tus Pokémon se han debilitado…</span></div>
    <div class="lose-end"><button class="btn" type="button">Continuar</button></div><span class="hof-skip">Toca para saltar</span>`;
  document.body.appendChild(sh);
  loseMusic();
  const mons = [...sh.querySelectorAll('.lose-mon')];
  mons.forEach((el, i) => setTimeout(() => { el.classList.add('down'); beep(150 - i * 8, .25, .05, 'sine'); }, 1400 + i * 650));
  const finale = () => { mons.forEach(el => el.classList.add('down')); sh.classList.add('done'); };
  const tm = setTimeout(finale, 1400 + mons.length * 650 + 600);
  const close = () => { clearTimeout(tm); sh.classList.add('out'); setTimeout(() => { sh.remove(); done && done(); }, 500); };
  sh.querySelector('.lose-end button').onclick = e => { e.stopPropagation(); close(); };
  sh.addEventListener('click', () => { if (!sh.classList.contains('done')) finale(); });
}

function hallOfFame(done, data) {
  if (!data && run) saveHistory(true);
  if (window.__noCine) return done && done();   // (pruebas automáticas)
  data = data || saveHof();
  const team = data.team.slice(0, 6);
  const sh = document.createElement('div'); sh.className = 'hof';
  const n = team.length, gap = Math.min(15, 80 / Math.max(1, n));
  const slots = team.map((m, i) => 50 + (i - (n - 1) / 2) * gap);
  let conf = ''; for (let i = 0; i < 46; i++) conf += `<i style="--x:${Math.random() * 100}%;--d:${3 + Math.random() * 3}s;--dl:${Math.random() * 3}s;--r:${Math.random() * 360}deg;--c:${['#ffd84a', '#ff5a46', '#5ad1c8', '#fff3c4', '#b46cff'][i % 5]}"></i>`;
  sh.innerHTML = `<div class="hof-bg"></div><div class="hof-shafts"></div>
    <div class="hof-title"><small>${data.name} · Liga Pokémon</small><b>Hall de la Fama</b></div>
    <div class="hof-crown" aria-hidden="true">♛</div>
    <div class="hof-row">${team.map((m, i) => `<div class="hof-mon${m.shiny ? ' shiny' : ''}" style="--to:${slots[i]}%;--i:${i};--c:${TYPE_COLORS[mtypes(m)[0]]}"><div class="hof-walk">${monThumb(m)}</div><span class="hof-plate">${dname(m)}</span></div>`).join('')}</div>
    <div class="hof-confetti">${conf}</div>
    <div class="hof-end"><b>¡Nuevo Campeón de ${data.name}!</b><span>${data.points} puntos · rango ${data.rank} · ${data.badges} medallas</span><button class="btn" type="button">Continuar</button></div>
    <span class="hof-skip">Toca para saltar</span>`;
  document.body.appendChild(sh);
  const crownIn = hofMusic() || 8.4;
  // desfile: cada Pokémon entra caminando por la alfombra y se coloca en su sitio
  const mons = [...sh.querySelectorAll('.hof-mon')];
  mons.forEach((el, i) => setTimeout(() => el.classList.add('go'), 1200 + i * 900));
  const finale = () => { if (sh.classList.contains('crowned')) return; mons.forEach(el => el.classList.add('go', 'arrived')); sh.classList.add('crowned');
    const r = sh.querySelector('.hof-crown').getBoundingClientRect(); setTimeout(() => shinyBurst(r.left + r.width / 2, r.top + r.height / 2), 500); };
  const tm = setTimeout(finale, Math.max(1200 + n * 900 + 1400, crownIn * 1000));
  const close = () => { clearTimeout(tm); sh.classList.add('out'); setTimeout(() => { sh.remove(); done && done(); }, 500); };
  sh.querySelector('.hof-end button').onclick = e => { e.stopPropagation(); close(); };
  sh.addEventListener('click', () => { if (!sh.classList.contains('crowned')) finale(); });
}

// ---- Animación de evolución: sale de la ficha, la energía se concentra, las siluetas se funden (sin destellos) y estalla en estrellas ----
function evoAnim(m, A, B, cb) {
  if (reduceMotion || document.hidden) return cb();
  const pic = (x, cls) => { const r = (m.shiny && SPR.shiny.get(x.id)) || SPR.normal.get(x.id) || SPR.normal.get(x.n || x.id);
    const c1 = TYPE_COLORS[x.ty[0]] || '#8592ab', c2 = TYPE_COLORS[x.ty[1] || x.ty[0]] || c1;
    return r ? `<img class="${cls}" src="${r.u}" alt="">` : `<span class="${cls}" style="display:grid;place-items:center"><i class="ph" style="--c1:${c1};--c2:${c2}"></i></span>`; };
  const tile = [...$('advTeam').querySelectorAll('.tmw')].find(x => x._m === m);
  const fromWheel = advWheel && advWheel.centerM === m;
  const shade = document.createElement('div'); shade.className = 'evo-shade';
  const pop = document.createElement('div'); pop.className = 'evo-pop'; pop.style.setProperty('--c', TYPE_COLORS[B.ty[0]] || '#5ad1c8'); pop.style.setProperty('--p', 0);
  let sparks = ''; for (let i = 0; i < 14; i++) sparks += `<span class="spark" style="--x0:${(Math.random() - .5) * 220}px;--x1:${(Math.random() - .5) * 260}px;--d:${1.2 + Math.random()}s;--dl:${Math.random() * 1.5}s"></span>`;
  let orbit = ''; for (let i = 0; i < 10; i++) orbit += `<i style="--a:${i * 36}deg;--r:${92 + (i % 3) * 18}px;--fs:${10 + (i % 3) * 5}px;--dl:${i * .16}s">✦</i>`;
  pop.innerHTML = `<div class="rays"></div><div class="rays r2"></div><div class="glow"></div>${sparks}<div class="orbit">${orbit}</div><div class="energy"></div>
    <div class="pillar"></div><div class="stage2">${pic(A, 'a')}${pic(B, 'b hide')}</div><div class="waves"></div><div class="stars-out"></div>
    <p class="cap"><small>Evolución</small>¿Eh? ¡${A.name} está evolucionando!</p><span class="skip">Toca para acelerar</span>`;
  shade.appendChild(pop); document.body.appendChild(shade);
  const a = pop.querySelector('.stage2 .a'), b = pop.querySelector('.stage2 .b'), cap = pop.querySelector('.cap'), energy = pop.querySelector('.energy');
  const pr = pop.getBoundingClientRect(), wr = fromWheel && advWheel.cv.getBoundingClientRect();
  const tr = fromWheel ? { left: wr.left + wr.width * .36, top: wr.top + wr.height * .36, width: wr.width * .28, height: wr.height * .28 } : tile && tile.getBoundingClientRect();
  if (fromWheel) { advWheel.centerImg = null; advWheel.centerName = null; advWheel.draw(); }
  if (tr) pop.animate([{ transform: `translate(${tr.left + tr.width / 2 - (pr.left + pr.width / 2)}px, ${tr.top + tr.height / 2 - (pr.top + pr.height / 2)}px) scale(${tr.width / pr.width})`, opacity: .4, borderRadius: '8px' }, { transform: 'none', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.2,.9,.25,1.1)' });
  const snd = evoAudio();
  // partículas de energía que van hacia el Pokémon
  const gather = n => { let h = ''; for (let i = 0; i < n; i++) { const an = Math.random() * Math.PI * 2, d = 140 + Math.random() * 60;
      h += `<i style="--x:${Math.cos(an) * d}px;--y:${Math.sin(an) * d}px;--dl:${Math.random() * .3}s;--s:${.5 + Math.random()}"></i>`; }
    const w = document.createElement('div'); w.className = 'burst-in'; w.innerHTML = h; energy.appendChild(w); setTimeout(() => w.remove(), 1300); };
  let stage = 0, timer = null, gap = 950, flips = 0, showB = false;
  const flick = () => {
    if (stage !== 1) return;
    showB = !showB; flips++;
    a.classList.toggle('hide', showB); b.classList.toggle('hide', !showB);
    pop.style.setProperty('--p', Math.min(1, flips / 9).toFixed(2));
    snd.pulse(); gather(6 + flips);
    if (flips === 4) pop.classList.add('fast');
    if (flips === 7) cap.innerHTML = `<small>Evolución</small>¡Algo increíble está pasando!`;
    gap = Math.max(480, gap * .86);
    if (flips >= 9) return timer = setTimeout(reveal, 520);
    timer = setTimeout(flick, gap);
  };
  const start = () => { stage = 1; a.classList.add('w'); b.classList.add('w'); pop.classList.add('glowing'); gather(10); timer = setTimeout(flick, 700); };
  const reveal = () => {
    if (stage >= 2) return; stage = 2; clearTimeout(timer);
    snd.climax();
    pop.classList.add('climax');
    pop.animate([{ transform: 'none' }, { transform: 'translate(-4px, 2px)' }, { transform: 'translate(4px, -3px)' }, { transform: 'translate(-3px, -2px)' }, { transform: 'translate(2px, 3px)' }, { transform: 'none' }], { duration: 380, easing: 'ease-out' });
    pop.querySelector('.waves').innerHTML = '<i></i><i></i><i></i>';
    let st = ''; for (let i = 0; i < 26; i++) { const an = i / 26 * Math.PI * 2, d = 120 + Math.random() * 90; st += `<i style="--x:${Math.cos(an) * d}px;--y:${Math.sin(an) * d}px;--fs:${12 + Math.random() * 16}px;--dl:${Math.random() * .2}s">✦</i>`; }
    pop.querySelector('.stars-out').innerHTML = st;
    a.classList.add('hide'); b.classList.remove('hide', 'w'); b.classList.add('new-in'); pop.classList.remove('fast', 'glowing'); pop.querySelector('.orbit').style.opacity = '0';
    cap.innerHTML = `<small>¡Enhorabuena!</small>¡${A.name} ha evolucionado a <b>${B.name}</b>!`; cap.classList.add('win');
    const r = pop.getBoundingClientRect(); setTimeout(() => shinyBurst(r.left + r.width / 2, r.top + r.height * .42), 250);
    timer = setTimeout(close, 2700);
  };
  const close = () => {
    if (stage >= 3) return; stage = 3; clearTimeout(timer);
    const p2 = pop.getBoundingClientRect(), t2 = tile && tile.isConnected && tile.getBoundingClientRect();
    shade.classList.add('out');
    const anim = pop.animate(t2 ? [{ transform: 'none', opacity: 1 }, { transform: `translate(${t2.left + t2.width / 2 - (p2.left + p2.width / 2)}px, ${t2.top + t2.height / 2 - (p2.top + p2.height / 2)}px) scale(${t2.width / p2.width})`, opacity: 0 }]
      : [{ transform: 'none', opacity: 1 }, { transform: 'scale(.8)', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    anim.onfinish = () => { shade.remove(); cb();
      const el = [...$('advTeam').querySelectorAll('.tmw')].find(x => x._m === m); if (el) { el.classList.add('landed'); setTimeout(() => el.classList.remove('landed'), 450); } };
  };
  shade.addEventListener('click', () => { if (stage === 0) { clearTimeout(timer); start(); } else if (stage === 1) { clearTimeout(timer); reveal(); } else if (stage === 2) close(); });
  timer = setTimeout(start, 700);
}
