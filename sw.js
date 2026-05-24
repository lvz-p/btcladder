const CACHE_NAME = 'btcladder-v86.28';
const SHELL = [
  './index.html',
  './icon-192x192.png',
  './icon-512x512.png'
];

/* Install: cache the app shell */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

/* Activate: delete old caches */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Fetch strategy:
   - App shell (HTML, icons): cache-first — loads instantly offline
   - API calls (Binance, BitView): network-first — always try fresh data,
     fall back to cache if offline                                        */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isApi = url.hostname.includes('binance') ||
                url.hostname.includes('bitview') ||
                url.hostname.includes('coinbase') ||
                url.hostname.includes('bitstamp') ||
                url.hostname.includes('kraken');

  if (isApi) {
    /* Network-first for live data */
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    /* Cache-first for app shell */
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
