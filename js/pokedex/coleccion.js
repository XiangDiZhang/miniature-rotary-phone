// Pokédex conseguida: en modo usuario solo se ven los Pokémon que has capturado en tus partidas (se guarda en este navegador)
// c = especies conseguidas · s = especies conseguidas shiny (su sprite shiny se puede ver en la Pokédex)
const PDX = { c: new Set(), s: new Set() };
{ const d = store.getJSON('ruleta-dex', {}); (d.c || []).forEach(n => PDX.c.add(n)); (d.s || []).forEach(n => PDX.s.add(n)); }
const dexHas = n => devMode || PDX.c.has(n);            // conseguido (o modo desarrollador)
const dexShiny = n => devMode || PDX.s.has(n);          // su shiny se puede ver en la Pokédex
function dexRegister(n, shiny) {
  const nc = !PDX.c.has(n), ns = shiny && !PDX.s.has(n); if (!nc && !ns) return;
  PDX.c.add(n); if (shiny) PDX.s.add(n);
  store.setJSON('ruleta-dex', { c: [...PDX.c], s: [...PDX.s] });
  if (nc && run) dexFresh.set(n, !!shiny);   // la aventura enseña «Nuevo registro» después del «¡NUEVO!» (renderAdv)
}
const dexFresh = new Map();
