// Arranque: teclado global, sprites guardados y primera escena

// ---- Teclado: flechas para moverse por los menús, Escape para volver ----
document.addEventListener('keydown', e => {
  if (state.scene === 'menu' && ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault();
    const dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
    markActive((cursor + dir + items.length) % items.length);
    items[cursor].el.focus();
  }
  if (infoOpen) return;
  if (e.key === 'Escape') { if (['roulette', 'chosen'].includes(state.scene)) goPlay(); else if (state.scene !== 'home') goMenu(); }
  if (state.scene === 'home' && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
    e.preventDefault();
    const opts = [...document.querySelectorAll('.home-opt')];
    const i = opts.indexOf(document.activeElement);
    opts[(i + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length].focus();
    beep(740, 0.05, 0.03);
  }
});

// ---- Arranque ----
// datos de versiones antiguas que ya no se usan (música de evolución y sprites o gritos subidos desde una carpeta)
['ruleta-evo-music', 'ruleta-evo-music-name', 'ruleta-cries'].forEach(k => store.remove(k));
try { indexedDB.deleteDatabase('ruleta-sprites'); indexedDB.deleteDatabase('ruleta-cries'); } catch (e) {}
function start(saved) {
  buildMenu();
  initAdv();
  const g = saved && saved.chosen && GENS.find(x => x.id === saved.chosen);
  if (saved && saved.scene === 'chosen' && g) pick(g);
  else if (saved && saved.scene === 'roulette') show('roulette');
  else show('home');
  document.fonts && document.fonts.ready.then(() => { if (state.scene === 'roulette') drawWheel(); });
}
// en claude.ai, al recargar el artefacto en caliente se vuelve a la misma escena
window.claude?.hot?.snapshot?.(() => ({ scene: state.scene, chosen: state.chosen }));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
