// Sprites y medallas: vienen incluidos con el juego (assets/sprites/*.js, generados con herramientas/generar-sprites.ps1)
// SPR.normal / SPR.shiny: nº de especie o id de forma -> { u: imagen (data URL), px: pixel art, fb/fw/fx: suelo, ancho y centro, pc: colores }
// SPR.badge: nº de medalla -> { u }
const SPR = { normal: new Map(), shiny: new Map(), badge: new Map(), item: new Map() };   // item: iconos de las megapiedras (por nombre de archivo)
// Rendimiento: las imágenes van dentro del código como data URL (textos de miles de caracteres). Pegadas una y otra vez en el HTML
// (equipo, línea de fases, medallas, Pokédex…) el navegador tiene que leerlas y descodificarlas cada vez. Si el navegador lo permite,
// cada imagen se convierte, la primera vez que se usa, en un enlace blob: corto que reutiliza la imagen ya descodificada.
let blobOK = false;
function toBlobURL(d) {
  const i = d.indexOf(','), bin = atob(d.slice(i + 1)), a = new Uint8Array(bin.length);
  for (let k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k);
  return URL.createObjectURL(new Blob([a], { type: d.slice(5, d.indexOf(';')) || 'image/png' }));
}
class SprRec {
  constructor(d, px, fb, fw, fx, pc) { this.d = d; this.b = null; this.px = px; this.fb = fb; this.fw = fw; this.fx = fx; this.pc = pc; }
  get u() { if (blobOK && !this.b) { try { this.b = toBlobURL(this.d); } catch (e) { blobOK = false; } } return this.b || this.d; }
}
{
  const packs = { normal: typeof SPRITES_NORMAL !== 'undefined' && SPRITES_NORMAL, shiny: typeof SPRITES_SHINY !== 'undefined' && SPRITES_SHINY };
  for (const kind in packs) for (const id in packs[kind] || {}) {
    const [u, px, fb, fw, fx, c1, c2] = packs[kind][id];
    SPR[kind].set(+id, new SprRec(u, !!px, fb, fw, fx, c1 ? [c1, c2] : null));
  }
  if (typeof SPRITES_BADGE !== 'undefined') for (const id in SPRITES_BADGE) SPR.badge.set(+id, new SprRec(SPRITES_BADGE[id]));
  if (typeof SPRITES_ITEM !== 'undefined') for (const k in SPRITES_ITEM) SPR.item.set(k, new SprRec(SPRITES_ITEM[k]));
  // ¿se pueden usar enlaces blob: aquí? (en algunos sitios incrustados no): se prueba con una imagen y, si carga, se usan a partir de entonces
  try { const t = SPR.normal.get(25); if (t && window.URL && URL.createObjectURL) { const im = new Image(); im.onload = () => { blobOK = true; }; im.src = toBlobURL(t.d); } } catch (e) {}
}

// cuadro del sprite en la Pokédex y en el equipo: apoyado en el suelo y con su sombra (o un rombo con sus colores si no hay sprite)
function spriteCell(n, ty) {
  const rec = (shinyMode && SPR.shiny.get(n)) || SPR.normal.get(n);
  if (rec) return `<span class="sp" style="--sw:${(rec.fw || 0.5).toFixed(3)};--sx:${(rec.fx || 0.5).toFixed(3)}"><span class="bob"><img src="${rec.u}" alt=""${rec.px ? ' class="px"' : ''} style="--fb:${(rec.fb || 0).toFixed(4)}" loading="lazy" decoding="async"></span></span>`;
  const c1 = TYPE_COLORS[ty[0]] || '#8592ab', c2 = TYPE_COLORS[ty[1] || ty[0]] || c1;
  return `<span class="sp"><span class="bob ph-wrap"><i class="ph" style="--c1:${c1};--c2:${c2}"></i></span></span>`;
}

// botón ✦ SHINY de la Pokédex
function syncShiny() {
  $('shinyBtn').textContent = '✦ SHINY · ' + (shinyMode ? 'ON' : 'OFF');
  $('shinyBtn').setAttribute('aria-pressed', shinyMode);
  $('shinyBtn').classList.toggle('on', shinyMode);
}
$('shinyBtn').onclick = () => {
  shinyMode = !shinyMode;
  store.set('ruleta-shiny', shinyMode ? '1' : '0');
  beep(shinyMode ? 988 : 660, 0.06, 0.03); syncShiny(); renderDex();
};
syncShiny();
