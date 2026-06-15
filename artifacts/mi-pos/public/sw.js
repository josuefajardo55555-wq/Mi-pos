const CACHE_NAME = 'mi-pos-v3';

const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon-maskable.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Skip cross-origin and Firebase requests entirely
  if (url.hostname.includes('firebase') || url.hostname.includes('google')) return;

  // Skip Vite HMR and dev-server internals
  if (url.pathname.startsWith('/@') || url.pathname.includes('__vite')) return;

  // Network-first for HTML, JS and CSS (always get fresh app code)
  const isAppShell = url.pathname === '/' || url.pathname.endsWith('.html')
    || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')
    || url.pathname.includes('/assets/');

  if (isAppShell) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static assets (icons, manifest)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return res;
      });
    })
  );
});
