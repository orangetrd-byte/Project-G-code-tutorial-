// ============================================================
//  Project G-Code Tutorial - Service Worker
//  Network-first for app files, cache fallback for offline use.
//  Bump CACHE_VERSION when deploying updates.
// ============================================================

const BUILD_VERSION = '2026.07.13.06';
const CACHE_VERSION = 'pgct-' + BUILD_VERSION;
const CACHE_NAME = CACHE_VERSION;

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './data/lessons.js',
  './data/reference/index.json',
  './data/reference/metadata.json',
  './data/reference/mill-g-codes.json',
  './data/reference/mill-m-codes.json',
  './data/reference/lathe-g-codes.json',
  './data/reference/lathe-m-codes.json',
  './data/reference/programming-symbols.json',
  './data/reference/blueprint-gdt-symbols.json',
  './data/reference/operation-sheet-symbols.json',
  './data/reference/marlin-3d-printer-g-codes.json',
  './data/reference/marlin-3d-printer-m-codes.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap'
].filter(url => !url.startsWith('https://fonts.googleapis.com'));

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

function shouldNetworkFirst(request) {
  const url = new URL(request.url);
  if (request.mode === 'navigate') return true;
  if (url.origin !== location.origin) return false;
  return request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/data/lessons.js') ||
    url.pathname.includes('/data/reference/');
}

function putFreshResponse(request, response) {
  if (!response || response.status !== 200 || response.type === 'opaque') return response;
  const cloned = response.clone();
  caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
  return response;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;
  const fetchUrl = new URL(event.request.url);
  if (fetchUrl.origin !== location.origin) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503, statusText: 'Offline' })));
    return;
  }

  if (shouldNetworkFirst(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(response => putFreshResponse(event.request, response))
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => putFreshResponse(event.request, response));
    })
  );
});
