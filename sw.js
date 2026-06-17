// ============================================================
//  Project G-Code Tutorial - Service Worker
//  Network-first for app files, cache fallback for offline use.
//  Bump CACHE_VERSION when deploying updates.
// ============================================================

const CACHE_VERSION = 'pgct-v2.29-read-aloud-stop';
const CACHE_NAME = CACHE_VERSION;

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './data/lessons.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;700&display=swap'
];

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
    url.pathname.endsWith('/data/lessons.js');
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
