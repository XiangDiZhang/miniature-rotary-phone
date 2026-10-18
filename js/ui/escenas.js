// Escenas, cabecera (sonido, pantalla completa) y menú principal
const SCENE_TITLES = { home: 'Menú principal', dex: 'Pokédex', menu: 'Jugar · Selección de región', saves: 'Jugar · Partidas en curso', roulette: 'Jugar · Ruleta', chosen: 'Jugar · Generación elegida', options: 'Opciones', adv: 'Aventura' };

// Pantalla completa (si el navegador o la app lo permiten)
$('fsBtn').onclick = async () => {
  beep(660, .05, .03);
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else { const el = document.documentElement; await (el.requestFullscreen || el.webkitRequestFullscreen).call(el); }
  } catch (e) { $('fsBtn').title = 'Este navegador no deja poner la pantalla completa aquí'; beep(220, .08, .03); }
};
const syncFs = () => { const on = !!(document.fullscreenElement || document.webkitFullscreenElement); $('fsBtn').setAttribute('aria-pressed', on); $('fsBtn').textContent = on ? '⤢' : '⛶'; };
document.addEventListener('fullscreenchange', syncFs); document.addEventListener('webkitfullscreenchange', syncFs);
$('soundBtn').onclick = () => {
  soundOn = !soundOn; syncSound(); beep(880);
};

// ---- Escenas ----
function show(scene) {
  state.scene = scene;
  ['home', 'dex', 'options', 'menu', 'saves', 'roulette', 'chosen', 'adv'].forEach(s => $('scene-' + s).hidden = s !== scene);
  document.body.classList.toggle('wide-adv', scene === 'adv');
  if (scene !== 'adv' && advWheel) advWheel.stop();
  $('homeBtn').hidden = scene === 'home';
  $('eyebrow').textContent = SCENE_TITLES[scene] || '';
  document.body.classList.toggle('wide', scene === 'dex');
  document.documentElement.classList.toggle('dexmode', scene === 'dex');
  document.body.classList.remove('side-open');
  if (scene === 'dex') scrollTo(0, 0);
  if (scene === 'dex') renderDex();
  if (scene === 'menu') { typeText($('menuText'), `Bienvenido, ${trainerName()}. ¿Qué generación quieres jugar? Si no te decides, deja que gire la ruleta.`); markActive(cursor); if (!icoRunning) icoLoop(); renderSavesCard(); }
  if (scene === 'saves') renderSaves();
  if (scene === 'roulette') { sizeWheel(); resetRoulette(); }
}

// Volver al menú principal o a Jugar desde cualquier pantalla y en cualquier momento (si la ruleta está girando, la para)
function goMenu() { stopGenRoulette(); beep(440); show('home'); }
function goPlay() { stopGenRoulette(); beep(440); show('menu'); }
$('changeBtn').onclick = goPlay;
$('homeBtn').onclick = goMenu;

// ---- Menú principal ----
document.querySelectorAll('.home-opt').forEach(b => b.addEventListener('click', () => { chord([523, 659, 784]); show(b.dataset.go); }));
