// Sprites y medallas: vienen incluidos con el juego (assets/sprites/*.js, generados con herramientas/generar-sprites.ps1)
// SPR.normal / SPR.shiny: nº de especie o id de forma -> { u: imagen (data URL), px: pixel art, fb/fw/fx: suelo, ancho y centro, pc: colores }
// SPR.badge: nº de medalla -> { u }
const SPR = { normal: new Map(), shiny: new Map(), badge: new Map() };
{
  const packs = { normal: typeof SPRITES_NORMAL !== 'undefined' && SPRITES_NORMAL, shiny: typeof SPRITES_SHINY !== 'undefined' && SPRITES_SHINY };
  for (const kind in packs) for (const id in packs[kind] || {}) {
    const [u, px, fb, fw, fx, c1, c2] = packs[kind][id];
    SPR[kind].set(+id, { u, px: !!px, fb, fw, fx, pc: c1 ? [c1, c2] : null });
  }
  if (typeof SPRITES_BADGE !== 'undefined') for (const id in SPRITES_BADGE) SPR.badge.set(+id, { u: SPRITES_BADGE[id] });
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
