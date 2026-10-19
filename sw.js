// Service worker: el juego se puede instalar (versión instalable) y funciona sin internet.
// Cada archivo que se pide se guarda; la siguiente vez se sirve guardado al momento y, por detrás, se actualiza si hay internet.
// (Los archivos del juego llevan ?v=… al publicar una versión nueva, así que nunca se mezcla una versión vieja con una nueva.)
const CACHE = 'ruleta-pokemon-v1';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './manifest.webmanifest']).catch(() => {}))); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req);
    const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    // la página se pide siempre a la red primero (así se ve la última versión); el resto, primero lo guardado
    return req.mode === 'navigate' ? net.then(r => r || hit) : hit || net;
  }));
});
