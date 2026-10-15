// Motor de giro común: curva de frenado y "tic" de cada casilla
let lastTick = 0;
function tick() {
  const now = performance.now();
  if (now - lastTick > 35) { lastTick = now; beep(1400, 0.03, 0.02, 'triangle'); }
}

// ===== Motor de giro (velocidades de la ruleta de referencia de CodePen) =====
// transition: transform 10s cubic-bezier(0.3, 1, 0.7, 1)  ·  3–4 vueltas completas + casilla al azar.
// Sin configuraciones de fuerza: todos los giros usan la misma animación (el gesto solo marca el sentido).
const SPIN_MS = 6500;                         // duración del giro (6,5 s): frena antes
// Curva cubic-bezier(x1, y1, x2, y2) como la de CSS
function cubicBezier(x1, y1, x2, y2) {
  const bx = t => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3;
  const by = t => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 40; i++) { t = (lo + hi) / 2; if (bx(t) < x) lo = t; else hi = t; }
    return by(t);
  };
}
const spinEase = cubicBezier(0.3, 1, 0.7, 1);
