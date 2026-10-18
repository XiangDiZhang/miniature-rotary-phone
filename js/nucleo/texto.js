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
    if (i >= text.length) { clearInterval(typers[el.id]); done && done(); }
  }, ms);
}
// locutor (Opciones): lee en voz alta el texto de la aventura con la voz del sistema

// Voces: las del navegador y el sistema (gratis, sin cuentas ni claves). Se elige sola la más natural en español:
// las neuronales de Edge («Natural» / «Online»), la de Google en Chrome, las mejoradas de Apple… y en Opciones se puede cambiar.
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
  const vs = ttsVoices(), saved = store.get('ruleta-voice');
  ttsVoice = (saved && vs.find(v => v.name === saved)) || vs[0] || null;
  if (typeof syncVoices === 'function') syncVoices();
}
try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}
function speak(t, force) {
  if ((!ttsOn && !force) || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    // frase a frase: algunos navegadores cortan las locuciones largas a mitad
    const parts = String(t).replace(/[★✦▲▼→←·]/g, ' ').match(/[^.!?…]+[.!?…]*\s*/g) || [String(t)];
    parts.forEach(p => {
      if (!p.trim()) return;
      const u = new SpeechSynthesisUtterance(p.trim());
      u.lang = (ttsVoice && ttsVoice.lang) || 'es-ES'; if (ttsVoice) u.voice = ttsVoice;
      u.rate = [0.9, 1.05, 1.25, 1.35][textSpeed]; u.pitch = 1.02;
      speechSynthesis.speak(u);
    });
  } catch (e) {}
}
