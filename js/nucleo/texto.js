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
// locutor (Opciones): lee en voz alta el texto de la aventura con la voz del navegador o del sistema
// Se elige sola la más natural en español (las neuronales de Edge «Natural» / «Online», la de Google en Chrome, las mejoradas de Apple…);
// en Opciones se puede elegir otra (se guarda como «sys:nombre»). Las voces en línea que hubo (Google Traductor, Polly por StreamElements)
// dejaron de funcionar sin clave: una elección guardada de esas vuelve a la voz del navegador.
const ttsChoice = () => { const s = store.get('ruleta-voice') || ''; return s.startsWith('sys:') ? s : /^(g|se):/.test(s) ? '' : s ? 'sys:' + s : ''; };
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
// frases cortas: algunos navegadores cortan las locuciones largas
function ttsParts(t, max = 190) {
  const out = [];
  (String(t).replace(/[★✦▲▼→←·✧]/g, ' ').match(/[^.!?…]+[.!?…]*\s*/g) || [String(t)]).forEach(p => {
    p = p.trim(); if (!p) return;
    while (p.length > max) { const cut = p.lastIndexOf(' ', max); out.push(p.slice(0, cut > 40 ? cut : max)); p = p.slice(cut > 40 ? cut + 1 : max); }
    out.push(p);
  });
  return out;
}
function ttsStop() { try { speechSynthesis.cancel(); } catch (e) {} }
function speak(t, force) {
  if (!ttsOn && !force) return;
  try {
    ttsStop();
    if (!('speechSynthesis' in window)) return;
    ttsParts(t).forEach(p => {
      const u = new SpeechSynthesisUtterance(p);
      u.lang = (ttsVoice && ttsVoice.lang) || 'es-ES'; if (ttsVoice) u.voice = ttsVoice;
      u.rate = [0.9, 1.05, 1.25, 1.35][textSpeed]; u.pitch = 1.02;
      speechSynthesis.speak(u);
    });
  } catch (e) {}
}
