// Pokédex conseguida: en modo usuario solo se ven los Pokémon que has capturado en tus partidas (se guarda en este navegador)
// c = especies conseguidas (de cualquier forma) · s = especies conseguidas shiny (su sprite shiny se puede ver en la Pokédex)
// f = formas exactas conseguidas: el número de la especie para su forma normal y el id de la forma para las demás
//     (Articuno de Galar registra solo esa forma, no el Articuno normal). Las megas y los Gigamax no cuentan aquí: son
//     transformaciones de combate y se ven con la especie.
const PDX = { c: new Set(), s: new Set(), f: new Set() };
{ const d = store.getJSON('ruleta-dex', {}); (d.c || []).forEach(n => PDX.c.add(n)); (d.s || []).forEach(n => PDX.s.add(n));
  // (partidas de antes de guardar las formas: lo que tenías cuenta como su forma normal)
  (d.f || d.c || []).forEach(id => PDX.f.add(id)); }
const dexHas = n => devMode || PDX.c.has(n);            // conseguido (o modo desarrollador)
const dexShiny = n => devMode || PDX.s.has(n);          // su shiny se puede ver en la Pokédex
// ¿tienes esta forma exacta? (id = número de la especie para la normal, o id de la forma); megas y Gigamax, con la especie
const dexHasForm = (n, id) => { if (devMode) return true; if (!id || id === n) return PDX.f.has(n);
  const r = FORM_OF.get(id); return r && (r[1][8] === 'mega' || r[1][8] === 'gmax') ? PDX.c.has(n) : PDX.f.has(id); };
// primera forma que tienes de una especie (0 = la normal; null si ninguna)
const dexFirstForm = n => PDX.f.has(n) ? 0 : ((FORMS[n] || []).find(f => PDX.f.has(f[0])) || [null])[0];
function dexRegister(n, shiny, form) {
  if (run && run.region === 'test') return;   // el Modo Test no cuenta para la Pokédex
  const id = form || n, nc = !PDX.c.has(n), nf = !PDX.f.has(id), ns = shiny && !PDX.s.has(n); if (!nc && !nf && !ns) return;
  PDX.c.add(n); PDX.f.add(id); if (shiny) PDX.s.add(n);
  store.setJSON('ruleta-dex', { c: [...PDX.c], s: [...PDX.s], f: [...PDX.f] });
  // la aventura enseña «Nuevo registro» (con esa forma exacta) después del «¡NUEVO!» (renderAdv)
  if ((nc || nf) && run) dexFresh.set(id, { n, form: form || 0, shiny: !!shiny });
}
const dexFresh = new Map();
