// Texto progresivo de los diálogos y locutor (voz del sistema)
const typers = {};
// velocidad del texto (Opciones): lenta, normal, rápida o al instante

// early (ms, opcional): «done» se llama a los pocos milisegundos, sin esperar a que termine de escribirse el texto
// (así los botones aparecen enseguida y el texto sigue escribiéndose)
const typerDone = {};
function typeText(el, text, done, early) {
  clearInterval(typers[el.id]); clearTimeout(typerDone[el.id]);
  const ms = TSPEEDS[textSpeed].ms;
  if (!ms) { el.textContent = text; if (done) done(); return; }
  el.textContent = ''; let i = 0;
  if (done && early != null) { typerDone[el.id] = setTimeout(done, Math.min(early, text.length * ms)); done = null; }
  typers[el.id] = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (el.scrollHeight > el.clientHeight + 2) el.scrollTop = el.scrollHeight;   // texto largo en una caja pequeña (móvil): se ve lo último que se escribe
    if (i >= text.length) { clearInterval(typers[el.id]); done && done(); }
  }, ms);
}
// locutor (Opciones): lee en voz alta el texto de la aventura con la voz del sistema

// Voces (todas gratis, sin cuentas ni claves):
//  · las del navegador y el sistema: se elige sola la más natural en español (las neuronales de Edge «Natural» / «Online»,
//    la de Google en Chrome, las mejoradas de Apple…);
//  · voces en línea: la de Google Traductor (España, México, EE. UU.) y las de Amazon Polly a través de StreamElements
//    (Conchita, Lucía, Enrique, Mia, Lupe, Penélope, Miguel). Necesitan internet y el texto se envía a ese servicio;
//    si no responden, el locutor sigue con la voz del navegador.
// En Opciones se elige una (se guarda como «sys:nombre», «g:idioma» o «se:voz»; las partidas antiguas guardaban solo el nombre).
const ONLINE_VOICES = [
  ['g:es', 'Google Traductor · España'], ['g:es-MX', 'Google Traductor · México'], ['g:es-US', 'Google Traductor · EE. UU.'],
  ['se:Conchita', 'Polly · Conchita (España)'], ['se:Lucia', 'Polly · Lucía (España)'], ['se:Enrique', 'Polly · Enrique (España)'],
  ['se:Mia', 'Polly · Mia (México)'], ['se:Lupe', 'Polly · Lupe (EE. UU.)'], ['se:Penelope', 'Polly · Penélope (EE. UU.)'], ['se:Miguel', 'Polly · Miguel (EE. UU.)'],
];
const ttsChoice = () => { const s = store.get('ruleta-voice') || ''; return /^(sys|g|se):/.test(s) ? s : s ? 'sys:' + s : ''; };
let ttsVoice = null;
// cuánto «suena a persona» una voz (más es mejor); las de España van delante de las de América
function voiceScore(v) {
  return (/natural|neural|online/i.test(v.name) ? 40 : 0) + (/google/i.test(v.name) ? 25 : 0) + (/premium|enhanced|mejorada|siri/i.test(v.name) ? 20 : 0)
    + (/^es[-_]ES/i.test(v.lang) ? 10 : /^es[-_](MX|US|419)/i.test(v.lang) ? 5 : 0) + (v.localService ? 0 : 2);
}
// voces en español, de la mejor a la peor
function ttsVoices() {
  try { return speechSynthesis.getVoices().filter(v => /^es/i.test(v.lang)).sort((a, b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name)); } catch (e) { return []; }
}
function pickVoice() {
  const vs = ttsVoices(), c = ttsChoice(), name = c.startsWith('sys:') ? c.slice(4) : '';
  ttsVoice = (name && vs.find(v => v.name === name)) || vs[0] || null;
  if (typeof syncVoices === 'function') syncVoices();
}
try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}
// frases cortas: algunos navegadores cortan las locuciones largas, y Google Traductor solo admite ~200 letras
function ttsParts(t, max = 190) {
  const out = [];
  (String(t).replace(/[★✦▲▼→←·✧]/g, ' ').match(/[^.!?…]+[.!?…]*\s*/g) || [String(t)]).forEach(p => {
    p = p.trim(); if (!p) return;
    while (p.length > max) { const cut = p.lastIndexOf(' ', max); out.push(p.slice(0, cut > 40 ? cut : max)); p = p.slice(cut > 40 ? cut + 1 : max); }
    out.push(p);
  });
  return out;
}
// voces en línea: un audio por frase, una detrás de otra
let ttsAudio = null, ttsSeq = 0;
function ttsStop() { ttsSeq++; try { speechSynthesis.cancel(); } catch (e) {} if (ttsAudio) { try { ttsAudio.pause(); } catch (e) {} ttsAudio = null; } }
const onlineUrl = (c, p) => c.startsWith('g:') ? `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(c.slice(2))}&q=${encodeURIComponent(p)}`
  : `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(c.slice(3))}&text=${encodeURIComponent(p)}`;
function speakSystem(parts) {
  if (!('speechSynthesis' in window)) return;
  parts.forEach(p => {
    const u = new SpeechSynthesisUtterance(p);
    u.lang = (ttsVoice && ttsVoice.lang) || 'es-ES'; if (ttsVoice) u.voice = ttsVoice;
    u.rate = [0.9, 1.05, 1.25, 1.35][textSpeed]; u.pitch = 1.02;
    speechSynthesis.speak(u);
  });
}
// onFail: si la voz en línea no responde (sin internet, servicio caído…) se sigue con la del navegador y se avisa
function speakOnline(c, parts, onFail) {
  const seq = ttsSeq;
  const next = i => {
    if (seq !== ttsSeq || i >= parts.length) return;
    const a = new Audio(onlineUrl(c, parts[i])); ttsAudio = a;
    a.playbackRate = [0.95, 1.05, 1.2, 1.3][textSpeed];
    a.onended = () => next(i + 1);
    const fail = () => { if (seq !== ttsSeq) return; ttsAudio = null; speakSystem(parts.slice(i)); onFail && onFail(); };
    a.onerror = fail;
    const pr = a.play(); if (pr && pr.catch) pr.catch(e => { if (e && e.name === 'NotAllowedError') return; fail(); });
  };
  next(0);
}
function speak(t, force, onFail) {
  if (!ttsOn && !force) return;
  try {
    ttsStop();
    const c = ttsChoice(), parts = ttsParts(t);
    if (c.startsWith('g:') || c.startsWith('se:')) speakOnline(c, parts, onFail);
    else speakSystem(parts);
  } catch (e) {}
}
