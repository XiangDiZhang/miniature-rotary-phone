// Cajas de ayuda: al pasar el ratón por encima de algo con descripción (objetos de la mochila, medallas, megapiedras,
// marcas del líder…) sale una caja con el estilo de las fichas de los Pokémon: fondo de panel, franja diagonal con su color,
// barrita brillante arriba y, si lo tiene, su icono. Sustituye a la ayuda del navegador (el atributo title).
// «Nombre: descripción» se parte en un título y su texto. Con el dedo no sale (no hay «pasar por encima»).
(() => {
  const box = document.createElement('div'); box.className = 'tipbox'; box.setAttribute('role', 'tooltip'); box.hidden = true;
  document.body.appendChild(box);
  let cur = null, timer = 0;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const hide = () => { clearTimeout(timer); cur = null; box.hidden = true; box.classList.remove('in'); };
  function place(el) {
    const r = el.getBoundingClientRect(), b = box.getBoundingClientRect(), m = 8;
    let x = r.left + r.width / 2 - b.width / 2, y = r.top - b.height - 10, below = false;
    if (y < m) { y = r.bottom + 10; below = true; }
    x = Math.max(m, Math.min(innerWidth - b.width - m, x)); y = Math.max(m, Math.min(innerHeight - b.height - m, y));
    box.style.left = x + 'px'; box.style.top = y + 'px'; box.classList.toggle('below', below);
    box.style.setProperty('--ax', Math.max(14, Math.min(b.width - 14, r.left + r.width / 2 - x)) + 'px');
  }
  function show(el) {
    const t = el.dataset.tip; if (!t) return;
    const i = t.indexOf(': '), head = i > 0 && i < 48 ? t.slice(0, i) : '', body = head ? t.slice(i + 2) : t;
    const cs = getComputedStyle(el), c = cs.getPropertyValue('--c').trim() || cs.getPropertyValue('--tc').trim() || '';
    const img = el.querySelector('img'), ico = img && img.getBoundingClientRect().width < 90 ? `<span class="tip-ico"><img src="${img.src}" alt=""${img.classList.contains('px') || img.classList.contains('item') ? ' class="px"' : ''}></span>` : '';
    box.style.setProperty('--c', c || 'var(--cyan)');
    box.innerHTML = `${ico}<div class="tip-tx">${head ? `<b>${esc(head)}</b>` : ''}<span>${esc(body)}</span></div>`;
    box.classList.toggle('has-ico', !!ico);
    box.hidden = false; box.classList.remove('in'); place(el); void box.offsetWidth; box.classList.add('in');
  }
  document.addEventListener('pointerover', e => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const el = e.target.closest && e.target.closest('[title], [data-tip]'); if (!el || el === cur) return;
    // el atributo title pasa a data-tip (así no sale también la ayuda del navegador)
    if (el.hasAttribute('title')) { const t = el.getAttribute('title'); el.removeAttribute('title'); if (t) el.dataset.tip = t; if (!el.getAttribute('aria-label') && t && !el.textContent.trim()) el.setAttribute('aria-label', t); }
    if (!el.dataset.tip) return;
    clearTimeout(timer); cur = el;
    timer = setTimeout(() => { if (cur === el && el.isConnected) show(el); }, box.hidden ? 260 : 60);
  });
  document.addEventListener('pointerout', e => { if (cur && (!e.relatedTarget || !cur.contains(e.relatedTarget))) hide(); });
  ['pointerdown', 'scroll', 'wheel', 'keydown'].forEach(ev => addEventListener(ev, hide, { capture: true, passive: true }));
  // si el elemento desaparece (la mochila se vuelve a dibujar…), la caja también
  setInterval(() => { if (cur && !cur.isConnected) hide(); }, 400);
})();
