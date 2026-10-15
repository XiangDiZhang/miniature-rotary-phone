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
  const label = t === 'light' ? 'CLARO' : 'OSCURO';
  $('themeBtn').textContent = 'TEMA · ' + label;
  $('optTheme').textContent = label;
  $('optTheme').setAttribute('aria-pressed', t === 'dark');
  readTheme();                                   // las ruletas leen sus colores del tema
  if (state.scene === 'roulette') drawWheel();
  if (save) store.set('ruleta-theme', t);
}
const toggleTheme = () => { applyTheme(theme === 'dark' ? 'light' : 'dark', true); beep(660); };
$('themeBtn').onclick = toggleTheme;
$('optTheme').onclick = toggleTheme;
applyTheme(theme, false);

// ---- Modo usuario (la Pokédex se completa capturando) o desarrollador (todo desbloqueado) ----
function syncMode() { $('optMode').textContent = devMode ? 'DESARROLLADOR' : 'USUARIO'; $('optMode').setAttribute('aria-pressed', devMode); }
$('optMode').onclick = () => {
  devMode = !devMode; store.set('ruleta-mode', devMode ? 'dev' : 'user');
  beep(devMode ? 988 : 660, .06, .03); syncMode(); renderDex();
};
syncMode();

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
  if (ttsOn) speak('Locutor activado. ¡Que empiece la aventura!'); else try { speechSynthesis.cancel(); } catch (e) {}
};
syncText();

// ---- Ver las cinemáticas: con tu último equipo campeón, o el de tu partida de Johto, o uno de ejemplo ----
function demoTeam() {
  const h = lastHof(); if (h) return h;
  const r = store.getJSON('ruleta-run-johto');
  const team = r && r.team && r.team.length ? r.team.map(m => ({ n: m.n, form: m.form || 0, shiny: !!m.shiny })) : [{ n: 154 }, { n: 157 }, { n: 160 }, { n: 181 }, { n: 248 }, { n: 249, shiny: true }];
  return { name: 'Johto', team, points: (r && r.points) || 0, rank: rank((r && r.points) || 0), badges: r && r.badges ? r.badges.length : 8 };
}
$('optHof').onclick = () => { beep(880); hallOfFame(null, demoTeam()); };
$('optLose').onclick = () => { beep(660); const d = demoTeam(); loseScreen('Lance', null, d.team); };
