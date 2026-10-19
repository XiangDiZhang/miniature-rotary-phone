// Música de fondo de la aventura, sintetizada (Web Audio): un tema por tipo de fase (ruta, ciudad, gimnasio y Liga) que se repite
// en bucle. Suave (seno y triángulo, nada de 8 bits) y bajita para que no tape los efectos. Se enciende y apaga en Opciones.
let musicOn = store.get('ruleta-music') !== '0';
// acordes de 4 compases (raíz MIDI + tipo) y tempo; el bajo toca la raíz y un arpegio sube y baja por el acorde
const MUSIC = {
  ruta: { bpm: 116, chords: [[60, 'M'], [67, 'M'], [69, 'm'], [65, 'M']], lead: [72, 76, 79, 76, 74, 71, 74, 79, 76, 72, 76, 81, 77, 76, 74, 72] },
  ciudad: { bpm: 90, chords: [[65, 'M'], [60, 'M'], [62, 'm'], [70, 'M']], lead: [77, 0, 76, 74, 72, 0, 74, 76, 74, 0, 72, 69, 70, 0, 72, 74] },
  gimnasio: { bpm: 138, chords: [[57, 'm'], [53, 'M'], [55, 'M'], [52, 'M']], lead: [69, 72, 76, 72, 69, 72, 77, 76, 74, 71, 67, 71, 68, 71, 76, 74] },
  liga: { bpm: 126, chords: [[62, 'm'], [58, 'M'], [60, 'M'], [57, 'M']], lead: [74, 77, 81, 77, 74, 70, 74, 77, 76, 72, 67, 72, 73, 76, 81, 79] },
};
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const triad = (r, k) => [r, r + (k === 'm' ? 3 : 4), r + 7];
let mus = { kind: null, timer: 0, next: 0, step: 0, gain: null };
function musicNote(t, m, dur, type, vol, dest) {
  const A = audio, o = A.createOscillator(), g = A.createGain(); o.type = type; o.frequency.value = hz(m);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(dest); o.start(t); o.stop(t + dur + .05);
}
// programa las notas que tocan en el próximo cuarto de segundo (así el ritmo no depende de los temporizadores)
function musicTick() {
  const T = MUSIC[mus.kind]; if (!T || !audio) return;
  const s8 = 60 / T.bpm / 2;   // una corchea
  while (mus.next < audio.currentTime + .25) {
    const i = mus.step % 32, bar = Math.floor(i / 8), [r, k] = T.chords[bar], ch = triad(r, k);
    if (i % 4 === 0) musicNote(mus.next, r - 24, s8 * 3.6, 'sine', .09, mus.gain);                  // bajo, cada negra… de dos en dos
    musicNote(mus.next, ch[[0, 1, 2, 1][i % 4]] , s8 * .9, 'triangle', .035, mus.gain);              // arpegio
    if (i % 2 === 0) { const l = T.lead[(i / 2) % 16]; if (l) musicNote(mus.next, l, s8 * 1.8, 'sine', .04, mus.gain); }   // melodía
    mus.next += s8; mus.step++;
  }
}
function musicStop() { clearInterval(mus.timer); mus.timer = 0; if (mus.gain) { const g = mus.gain; try { g.gain.setTargetAtTime(.0001, audio.currentTime, .25); } catch (e) {} setTimeout(() => g.disconnect(), 1200); } mus.gain = null; mus.kind = null; }
// cambia de tema (o lo para con null); si ya suena ese, no hace nada
function setMusic(kind) {
  if (!musicOn || !soundOn) kind = null;
  if (kind === mus.kind) return;
  musicStop(); if (!kind) return;
  try {
    actx(); mus.kind = kind; mus.gain = audio.createGain(); mus.gain.gain.setValueAtTime(.0001, audio.currentTime); mus.gain.gain.setTargetAtTime(.55, audio.currentTime, .6);
    mus.gain.connect(audio.destination); mus.next = audio.currentTime + .1; mus.step = 0; mus.timer = setInterval(musicTick, 90); musicTick();
  } catch (e) {}
}
// qué tema toca ahora en la aventura
function musicKind() {
  if (typeof state === 'undefined' || state.scene !== 'adv' || !run || run.over) return null;
  const L = loc(); if (!L) return null;
  if (L.kind === 'gym') return L.role === 'elite' || L.role === 'champ' ? 'liga' : 'gimnasio';
  if (L.kind === 'prep') return 'liga';
  return L.kind === 'city' || L.kind === 'start' ? 'ciudad' : 'ruta';
}
// se comprueba cada poco (cambio de fase, de pantalla, pestaña oculta…)
setInterval(() => setMusic(document.hidden ? null : musicKind()), 700);
