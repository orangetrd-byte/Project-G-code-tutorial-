// ============================================================
//  Project G-Code Tutorial — Service Worker
//  Cache-first strategy for offline PWA support.
//  Bump CACHE_VERSION when deploying updates.
// ============================================================

const CACHE_VERSION = 'pgct-v2.17-endless-review';
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

// ─── INSTALL: pre-cache static assets ────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE: clean up old caches ───────────────────────────
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

// ─── FETCH: cache-first with network fallback ─────────────────
self.addEventListener('fetch', event => {
  // Skip non-GET and chrome-extension requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => {
          // Offline fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
