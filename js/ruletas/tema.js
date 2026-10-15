// Colores de las ruletas (se leen de las variables CSS del tema)
const W = {};
function readTheme() {
  const cs = getComputedStyle(document.documentElement), g = k => cs.getPropertyValue(k).trim();
  Object.assign(W, { tick: g('--w-tick'), tickStrong: g('--w-tick-strong'), div: g('--w-div'), ring: g('--w-ring'),
    label: g('--w-label'), labelLit: g('--w-label-lit'), center: g('--w-center'), hub: g('--bg'), cyan: g('--cyan'), glow: `rgba(${g('--glow-rgb')},.5)` });
}
readTheme();
