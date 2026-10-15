// Medición de sprites: suelo (dónde apoya los pies), ancho y centro para la sombra, y colores principales para el modo shiny.
// La usa herramientas/generar-sprites.ps1 en Chrome para calcular los datos de los sprites incluidos.
// Mide dónde están los "pies" (último píxel visible) para apoyar todos los sprites en el mismo suelo.
// Devuelve el hueco inferior como fracción del cuadro, contando que la imagen se muestra encajada (contain).
// Colores principales del sprite (sin contornos negros ni grises): para teñir el cuadro en modo shiny
function palette(d) {
  const buckets = new Map();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const sat = mx ? (mx - mn) / mx : 0;
    if (mx < 50 || sat < 0.22) continue;                 // contorno, sombras y grises fuera
    const key = (r >> 5) << 6 | (g >> 5) << 3 | (b >> 5);
    const e = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0, w: 0 };
    const w = 0.5 + sat; e.n++; e.w += w; e.r += r * w; e.g += g * w; e.b += b * w; buckets.set(key, e);
  }
  const list = [...buckets.values()].sort((a, b) => b.w - a.w).map(e => [e.r / e.w, e.g / e.w, e.b / e.w]);
  if (!list.length) return null;
  const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const hue = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return 0; const dd = mx - mn; let h = mx === r ? (g - b) / dd : mx === g ? 2 + (b - r) / dd : 4 + (r - g) / dd; return ((h * 60) + 360) % 360; };
  const c1 = list[0], h1 = hue(c1);
  const c2 = list.find(c => { const dh = Math.abs(hue(c) - h1); return Math.min(dh, 360 - dh) > 35; }) || c1;
  return [hex(c1), hex(c2)];
}
// también mide lo ancho que es (para la sombra) y dónde está su centro
function feetGap(src, w, h) {
  const out = { fb: 0, fw: 0.5, fx: 0.5 };
  try {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(src, 0, 0);
    const d = ctx.getImageData(0, 0, w, h).data;
    let maxY = -1, minX = w, maxX = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 24) { if (y > maxY) maxY = y; if (x < minX) minX = x; if (x > maxX) maxX = x; }
    if (maxY < 0) return out;
    out.pc = palette(d);
    // encaje "contain" dentro de un cuadro
    const sc = 1 / Math.max(w, h), dw = w * sc, dh = h * sc, left = (1 - dw) / 2, top = (1 - dh) / 2;
    out.fb = Math.max(0, 1 - (top + (maxY + 1) * sc));
    out.fw = Math.max(0.05, (maxX - minX + 1) * sc);
    out.fx = left + ((minX + maxX + 1) / 2) * sc;
    return out;
  } catch (e) { return out; }
}
