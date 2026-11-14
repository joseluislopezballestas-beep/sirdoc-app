// SirDoc: funciona sin conexión una vez instalada (iPhone/Android desde el navegador)
const CACHE = 'sirdoc-1.3.0';
const V = '?v=1.3.0'; // debe coincidir con index.html: todos los archivos de una misma versión
const FILES = ['./', 'index.html', 'css/app.css' + V, 'js/util.js' + V, 'js/validate.js' + V, 'js/data.js' + V, 'js/logic.js' + V, 'js/app.js' + V,
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { // cache:'reload' evita guardar copias viejas de la caché HTTP del navegador (versiones mezcladas)
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' }))))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
