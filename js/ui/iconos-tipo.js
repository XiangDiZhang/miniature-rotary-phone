// Iconos de tipo (símbolos SVG reutilizables) y marcadores de color por tipo
const slugT = t => 'ty-' + norm(t);
$('typeDefs').innerHTML = Object.entries(TYPE_ICONS).map(([t, d]) => `<symbol id="${slugT(t)}" viewBox="0 0 24 24" fill="currentColor">${d}</symbol>`).join('');

// color del tipo y tinta legible encima (oscura sobre tipos claros como Eléctrico)
const typeVars = t => { const c = TYPE_COLORS[t] || '#8592ab'; return `--t:${c};--ink:${lum(c) > 0.55 ? '#0b0f1a' : '#ffffff'}`; };
const typeSvg = t => `<svg aria-hidden="true"><use href="#${slugT(t)}"/></svg>`;
const typeIcon = t => `<span class="ti" style="${typeVars(t)}" title="${t}" role="img" aria-label="${t}">${typeSvg(t)}</span>`;
// rombo con los colores de sus tipos: lo que se ve en lugar del sprite si no has cargado sprites
const typePh = ty => `<i class="ph" style="--c1:${TYPE_COLORS[ty[0]]};--c2:${TYPE_COLORS[ty[1] || ty[0]]}"></i>`;
