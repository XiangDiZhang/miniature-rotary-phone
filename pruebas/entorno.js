// Entorno determinista para las pruebas: azar con semilla, sin animaciones, texto instantáneo
(function () {
  const P = new URLSearchParams(location.hash.slice(1));
  let s = +(P.get('seed') || 123456789);
  Math.random = function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  let t = 1790000000000; Date.now = () => (t += 1000);
  try {
    localStorage.clear();
    if (!P.get('motion')) localStorage.setItem('ruleta-motion', 'off');   // #motion=1: con animaciones
    if (!P.get('motion')) localStorage.setItem('ruleta-tspeed', '3');
    if (P.get('dev')) localStorage.setItem('ruleta-mode', 'dev');
    if (P.get('theme')) localStorage.setItem('ruleta-theme', P.get('theme'));
  } catch (e) {}
  window.__errors = [];
  addEventListener('error', e => __errors.push('error: ' + e.message + ' @' + String(e.filename || '').split('/').pop() + ':' + e.lineno));
  addEventListener('unhandledrejection', e => __errors.push('rejection: ' + ((e.reason && e.reason.message) || e.reason)));
  const ce = console.error; console.error = (...a) => { __errors.push('console: ' + a.join(' ')); ce.apply(console, a); };
})();
