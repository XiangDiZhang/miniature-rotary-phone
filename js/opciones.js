// Opciones: sonido, tema, modo, animaciones, texto, locutor y cinemáticas (los valores iniciales están en nucleo/ajustes.js)

// ---- Sonido (también en la cabecera) ----
function syncSound() {
  $('soundBtn').textContent = 'SONIDO · ' + (soundOn ? 'ON' : 'OFF');
  $('soundBtn').setAttribute('aria-pressed', soundOn);
  $('optSound').textContent = soundOn ? 'ON' : 'OFF';
  $('optSound').setAttribute('aria-pressed', soundOn);
}
$('optSound').onclick = () => { soundOn = !soundOn; syncSound(); beep(880); };

// ---- Tema oscuro / claro (también en la cabecera) ----
function applyTheme(t, save) {
  theme = t;
  if (t === 'light') document.documentElement.setAttribute('data-app', 'light'); else document.documentElement.removeAttribute('data-app');
  applyColors();                                 // los colores elegidos se oscurecen un poco en el tema claro
  const label = t === 'light' ? 'CLARO' : 'OSCURO';
  $('themeBtn').textContent = 'TEMA · ' + label;
  $('optTheme').textContent = label;
  $('optTheme').setAttribute('aria-pressed', t === 'dark');
  readTheme();                                   // las ruletas leen sus colores del tema
  if (state.scene === 'roulette') drawWheel();
  if (typeof advWheel !== 'undefined' && advWheel) { advWheel.dirty = true; advWheel.draw(); }   // la ruleta de la aventura, con los colores nuevos (si no, sus textos se quedaban del tema anterior)
  if (typeof renderAdv === 'function' && state.scene === 'adv') renderAdv();
  if (save) store.set('ruleta-theme', t);
}
// ---- Colores del tema: un color neón principal (botones, bordes, brillo de la ruleta) y, si se quiere, un segundo color ----
// Se guardan en 'ruleta-colors' como { c1, c2 } (c2 = null: solo uno). Sin elegir nada, los de siempre.
const COLOR_PRESETS = [
  ['Cian', '#7fd6ff', null], ['Neón rosa', '#ff4fd8', '#7a5cff'], ['Lima', '#a6ff4d', '#21e6c1'], ['Fuego', '#ff8a3d', '#ff3d6e'],
  ['Océano', '#3da9ff', '#3dffd2'], ['Violeta', '#b46cff', '#ff6bd6'], ['Oro', '#ffd84a', '#ff9f43'], ['Menta', '#4dffb8', null],
  ['Kanto', '#ff5a46', '#f2c14e'], ['Hielo', '#a8f0ff', '#7a9cff'], ['Ácido', '#e6ff3d', '#ff3dd8'], ['Rubí', '#ff3d5a', null],
];
let themeColors = store.getJSON('ruleta-colors', null);
const hexRgb = h => { const v = parseInt(h.slice(1), 16); return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
const darken = (h, k) => '#' + hexRgb(h).map(x => Math.round(x * k).toString(16).padStart(2, '0')).join('');   // k < 1: más oscuro
function applyColors() {
  const st = document.documentElement.style, C = themeColors;
  if (!C || !C.c1) { ['--cyan', '--glow-rgb', '--johto'].forEach(k => st.removeProperty(k)); return; }
  const light = theme === 'light', c1 = light ? darken(C.c1, .62) : C.c1, c2 = C.c2 ? (light ? darken(C.c2, .62) : C.c2) : null;
  st.setProperty('--cyan', c1); st.setProperty('--glow-rgb', hexRgb(c1).join(','));
  if (c2) st.setProperty('--johto', c2); else st.removeProperty('--johto');
}
function setColors(c, save = true) {
  themeColors = c; if (save) c ? store.setJSON('ruleta-colors', c) : store.remove('ruleta-colors');
  applyColors(); readTheme(); if (state.scene === 'roulette') drawWheel(); syncColorPanel();
}
function syncColorPanel() {
  const C = themeColors || { c1: '#7fd6ff', c2: null }, two = !!C.c2;
  $('cpC1').value = C.c1; $('cpC2').value = C.c2 || '#f2c14e';
  $('cpTwo').setAttribute('aria-pressed', two); $('cpTwo').textContent = `2 COLORES · ${two ? 'SÍ' : 'NO'}`; $('cpC2Wrap').classList.toggle('off', !two);
  $('cpPreview').style.setProperty('--p1', C.c1); $('cpPreview').style.setProperty('--p2', C.c2 || C.c1);
  $('cpPresets').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.c1 === C.c1 && (b.dataset.c2 || '') === (C.c2 || '')));
}
$('cpPresets').innerHTML = COLOR_PRESETS.map(([nm, a, b]) => `<button class="cp-sw" type="button" data-c1="${a}" data-c2="${b || ''}" style="--p1:${a};--p2:${b || a}" title="${nm}"><i></i><span>${nm}</span></button>`).join('');
$('cpPresets').querySelectorAll('button').forEach(b => b.onclick = () => { beep(760, .05, .03); setColors({ c1: b.dataset.c1, c2: b.dataset.c2 || null }); });
$('cpC1').oninput = e => setColors({ c1: e.target.value, c2: themeColors && themeColors.c2 || null });
$('cpC2').oninput = e => setColors({ c1: (themeColors && themeColors.c1) || '#7fd6ff', c2: e.target.value });
$('cpTwo').onclick = () => { beep(700, .05, .03); const C = themeColors || { c1: '#7fd6ff' }; setColors({ c1: C.c1, c2: C.c2 ? null : $('cpC2').value }); };
$('cpReset').onclick = () => { beep(520, .06, .03); setColors(null); };
$('optColors').onclick = () => { const open = $('colorPanel').hidden; $('colorPanel').hidden = !open; $('optColors').setAttribute('aria-expanded', open); $('optColors').textContent = open ? 'CERRAR' : 'PERSONALIZAR'; beep(open ? 820 : 600, .05, .03); };
syncColorPanel();

const toggleTheme = () => { applyTheme(theme === 'dark' ? 'light' : 'dark', true); beep(660); };
$('themeBtn').onclick = toggleTheme;
$('optTheme').onclick = toggleTheme;
applyTheme(theme, false);

// ---- Modo usuario (la Pokédex se completa capturando) o desarrollador (todo desbloqueado) ----
// las animaciones de prueba (Hall de la Fama, derrota, intercambio, evolución, mega y Gigamax) solo se ven en modo desarrollador
function syncMode() { $('optMode').textContent = devMode ? 'DESARROLLADOR' : 'USUARIO'; $('optMode').setAttribute('aria-pressed', devMode); document.querySelectorAll('.dev-only').forEach(el => el.hidden = !devMode); }
// pasar a desarrollador pide la contraseña; volver a usuario, no
const DEV_PASS = 'SuscribeteALukeDiver514';
function setMode(dev) { devMode = dev; store.set('ruleta-mode', dev ? 'dev' : 'user'); beep(dev ? 988 : 660, .06, .03); syncMode(); renderDex(); }
const closePass = () => { $('devPass').hidden = true; $('devPassIn').value = ''; $('devMsg').textContent = ''; $('devPass').classList.remove('bad'); };
$('optMode').onclick = () => {
  if (devMode) return setMode(false);
  if (!$('devPass').hidden) return closePass();
  $('devPass').hidden = false; $('devPassIn').focus(); beep(700, .05, .03);
};
$('devPass').onsubmit = e => {
  e.preventDefault();
  if ($('devPassIn').value === DEV_PASS) { closePass(); setMode(true); chord([659, 880, 1175]); return; }
  $('devMsg').textContent = 'Contraseña incorrecta'; $('devPass').classList.remove('bad'); void $('devPass').offsetWidth; $('devPass').classList.add('bad');
  $('devPassIn').select(); beep(180, .18, .05, 'square');
};
$('devPassNo').onclick = () => { closePass(); beep(440, .05, .03); };
syncMode();

// ---- Nombre de entrenador (más adelante habrá más cosas del perfil) ----
const trainerName = () => (store.get('ruleta-trainer') || '').trim() || 'Entrenador';
$('optTrainer').value = store.get('ruleta-trainer') || '';
$('optTrainer').oninput = e => store.set('ruleta-trainer', e.target.value.replace(/[<>]/g, '').slice(0, 16));
$('optTrainer').onchange = () => beep(760, .05, .03);

// ---- Sprite de entrenador: se elige entre todos los de assets/sprites/entrenadores.js (con buscador) ----
function syncTrainerSpr() { const u = playerTrainerSpr(); $('optTrainerImg').src = u || ''; $('optTrainerImg').hidden = !u; }
syncTrainerSpr();
$('optTrainerSpr').onclick = () => {
  beep(740, .05, .03);
  let sh = $('trnShade');
  if (!sh) {
    sh = document.createElement('div'); sh.className = 'trn-shade'; sh.id = 'trnShade';
    sh.innerHTML = `<div class="trn" role="dialog" aria-modal="true" aria-label="Sprite de entrenador">
      <div class="trn-bar"><b>Sprite de entrenador</b><input class="tst-q" id="trnQ" type="search" placeholder="Busca: red, cynthia, ace trainer…" autocomplete="off"><button class="info-close" type="button" id="trnClose" aria-label="Cerrar">✕</button></div>
      <div class="trn-grid" id="trnGrid"></div></div>`;
    document.body.appendChild(sh);
    const close = () => { sh.hidden = true; };
    $('trnClose').onclick = close; sh.addEventListener('pointerdown', e => { if (e.target === sh) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && !sh.hidden) { e.stopImmediatePropagation(); close(); } }, true);
    $('trnQ').oninput = () => { clearTimeout(sh._t); sh._t = setTimeout(fill, 120); };
    // la lista se dibuja por bloques (son muchos) para que se abra al momento
    const fill = () => {
      clearTimeout(sh._f);
      const q = norm($('trnQ').value.trim()).replace(/\s+/g, ''), cur = playerTrainer(), G = $('trnGrid');
      const keys = Object.keys(TRAINER_SPR).filter(k => !q || k.replace(/-/g, '').includes(q)).sort((a, b) => (b === cur) - (a === cur));   // el tuyo, el primero
      const item = k => `<button type="button" class="trn-it${k === cur ? ' on' : ''}" data-k="${k}" title="${k}"><img src="${TRAINER_SPR[k]}" alt="" loading="lazy"><small>${k}</small></button>`;
      G.innerHTML = keys.slice(0, 120).map(item).join('') || '<p class="tst-none">Ningún sprite coincide con la búsqueda.</p>';
      let i = 120; const more = () => { G.insertAdjacentHTML('beforeend', keys.slice(i, i + 200).map(item).join('')); i += 200; if (i < keys.length) sh._f = setTimeout(more, 30); };
      if (i < keys.length) sh._f = setTimeout(more, 30);
    };
    $('trnGrid').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return;
      store.set('ruleta-trainer-spr', b.dataset.k); syncTrainerSpr(); chord([659, 880, 1175]); close(); });
    sh._fill = fill;
  }
  sh.hidden = false; $('trnQ').value = ''; sh._fill();
  const on = $('trnGrid').querySelector('.on'); if (on) on.scrollIntoView({ block: 'center' });
};

// ---- Animaciones ----
function syncMotion() { $('optMotion').textContent = reduceMotion ? 'OFF' : 'ON'; $('optMotion').setAttribute('aria-pressed', !reduceMotion); document.documentElement.classList.toggle('nomotion', reduceMotion); }
$('optMotion').onclick = () => {
  reduceMotion = !reduceMotion; store.set('ruleta-motion', reduceMotion ? 'off' : 'on');
  syncMotion(); beep(880); if (!reduceMotion && !icoRunning) icoLoop();
};
syncMotion();

// ---- Velocidad del texto y locutor ----
function syncText() { $('optTSpeed').textContent = TSPEEDS[textSpeed].n; $('optTts').textContent = ttsOn ? 'ON' : 'OFF'; $('optTts').setAttribute('aria-pressed', ttsOn); }
$('optTSpeed').onclick = () => { textSpeed = (textSpeed + 1) % TSPEEDS.length; store.set('ruleta-tspeed', textSpeed); syncText(); beep(760); };
$('optTts').onclick = () => {
  ttsOn = !ttsOn; store.set('ruleta-tts', ttsOn ? 'on' : 'off'); syncText(); beep(880);
  if (ttsOn) speak('Locutor activado. ¡Que empiece la aventura!'); else ttsStop();
};
syncText();
// voz del locutor: las del navegador y el sistema en español, de la más natural a la menos (★ = natural)
function syncVoices() {
  const sel = $('optVoice'); if (!sel) return;
  const vs = ttsVoices(), esc = s => s.replace(/"/g, '&quot;');
  sel.innerHTML = vs.length ? vs.map(v => `<option value="sys:${esc(v.name)}">${voiceScore(v) >= 25 ? '★ ' : ''}${v.name} (${v.lang})</option>`).join('') : '<option value="" disabled>No hay voces en español en este navegador</option>';
  sel.value = ttsVoice ? 'sys:' + ttsVoice.name : '';
  voiceInfo();
}
function voiceInfo(msg) {
  const n = ttsVoices().length;
  $('optVoiceInfo').textContent = msg || (n ? `${n} ${n > 1 ? 'voces' : 'voz'} en español en tu navegador (★ las más naturales). En Edge hay voces neuronales «Natural» muy realistas, gratis.`
    : 'Tu navegador no tiene voces en español: prueba en Edge o Chrome.');
}
$('optVoice').onchange = e => { store.set('ruleta-voice', e.target.value); pickVoice(); voiceInfo(); beep(760); speak(`¡Hola, ${trainerName()}! Así sonará el locutor.`, true); };
$('optVoiceTest').onclick = () => { beep(880); speak('¡Un Pikachu salvaje! ¡Lanza la Poké Ball! Solo tienes una oportunidad.', true); };
syncVoices();

// ---- Ver las cinemáticas: con tu último equipo campeón, o el de tu partida de Johto, o uno de ejemplo ----
function demoTeam() {
  const h = lastHof(); if (h) return h;
  const r = store.getJSON('ruleta-run-johto');
  const team = r && r.team && r.team.length ? r.team.map(m => ({ n: m.n, form: m.form || 0, shiny: !!m.shiny })) : [{ n: 154 }, { n: 157 }, { n: 160 }, { n: 181 }, { n: 248 }, { n: 249, shiny: true }];
  return { name: 'Johto', team, points: (r && r.points) || 0, rank: rank((r && r.points) || 0), badges: r && r.badges ? r.badges.length : 8 };
}
$('optHof').onclick = () => { beep(880); hallOfFame(null, demoTeam()); };
$('optLose').onclick = () => { beep(660); const d = demoTeam(); loseScreen('Lance', null, d.team); };
// animaciones de prueba (modo desarrollador): con Pokémon de ejemplo, sin tocar ninguna partida
const demoSide = (id, n) => ({ id, n, ty: formRec(id) ? formRec(id)[1][2] : ptypes(n), name: formRec(id) ? formLabel(n, formRec(id)[1]) : pname(n) });
const needMotion = () => { if (!reduceMotion) return true; beep(220, .1, .03); $('optMotion').animate && $('optMotion').animate([{ transform: 'scale(1.15)' }, { transform: 'none' }], 400); return false; };
$('optTrade').onclick = () => { if (!needMotion()) return; beep(880); tradeAnim({ n: 25 }, { n: 133, shiny: false }, null); };
$('optEvo').onclick = () => { if (!needMotion()) return; beep(880); evoAnim([{ m: { n: 5 }, A: demoSide(5, 5), B: demoSide(6, 6) }], () => {}, () => {}); };
$('optMega').onclick = () => { if (!needMotion()) return; beep(880); transformAnim({ n: 6, stone: 10034 }, 'mega', demoSide(6, 6), demoSide(10034, 6), () => {}, () => {}); };
$('optDmax').onclick = () => { if (!needMotion()) return; beep(880); const g = (FORMS[6] || []).find(f => f[8] === 'gmax'); if (g) transformAnim({ n: 6 }, 'gmax', demoSide(6, 6), demoSide(g[0], 6), () => {}, () => {}); };
