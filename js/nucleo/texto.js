// Texto progresivo de los diálogos y locutor (voz del sistema)
const typers = {};
// velocidad del texto (Opciones): lenta, normal, rápida o al instante

function typeText(el, text, done) {
  clearInterval(typers[el.id]);
  const ms = TSPEEDS[textSpeed].ms;
  if (!ms) { el.textContent = text; if (done) done(); return; }
  el.textContent = ''; let i = 0;
  typers[el.id] = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) { clearInterval(typers[el.id]); done && done(); }
  }, ms);
}
// locutor (Opciones): lee en voz alta el texto de la aventura con la voz del sistema

let ttsVoice = null;
function pickVoice() {
  try { const vs = speechSynthesis.getVoices(); ttsVoice = vs.find(v => /^es(-|_)ES/i.test(v.lang)) || vs.find(v => /^es/i.test(v.lang)) || null; } catch (e) {}
}
try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}
function speak(t) {
  if (!ttsOn || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(t).replace(/[★✦▲▼→←·]/g, ' '));
    u.lang = (ttsVoice && ttsVoice.lang) || 'es-ES'; if (ttsVoice) u.voice = ttsVoice;
    u.rate = [0.9, 1.05, 1.25, 1.35][textSpeed]; u.pitch = 1.02;
    speechSynthesis.speak(u);
  } catch (e) {}
}
