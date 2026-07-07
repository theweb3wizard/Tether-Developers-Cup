const CACHE = 'pozo-v1';

const STATIC_URLS = [
  '/',
  '/pool',
  '/wallet',
  '/asado',
  '/history',
  '/onboarding',
  '/favicon.ico',
  '/icon-192.svg',
  '/icon-512.svg',
  '/manifest.json',
  '/IMG/hero-icon.png',
  '/IMG/onboarding-goat.png',
  '/IMG/empty-pozo.png',
  '/IMG/empty-asado.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(STATIC_URLS).catch(() => {
        // Individual urls may fail — PWA still works, just slower on repeat visit
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Static assets: cache-first
  if (url.pathname.match(/\.(png|svg|ico|json|js|css)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, clone));
        return res;
      }))
    );
    return;
  }

  // Pages & everything else: network-first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, clone));
        return res;
      })
      .catch(() => caches.match(request).then((cached) => {
        if (cached) return cached;
        // Offline fallback
        return caches.match('/');
      }))
  );
});
