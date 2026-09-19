// Increment this value when the offline bundle changes materially.
const CACHE_VERSION = 'akd-image-pwa-3.5.1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const LOCAL_STATIC_HOSTS = new Set(['localhost', '127.0.0.1']);
const IS_LOCAL_STATIC_HOST = LOCAL_STATIC_HOSTS.has(self.location.hostname);
const LANGUAGES = ['ru', 'en', 'es'];
const OFFLINE_ROUTE_PATHS = [
  '/faq',
  '/about',
  '/privacy',
  '/licenses',
  '/favorites',
  '/compress',
  '/gif-optimize',
  '/resize',
  '/watermark',
  '/crop',
  '/convert',
  '/rotate',
  '/effects',
  '/blur',
  '/meme',
  '/split',
  '/round',
  '/pixelate',
  '/exif',
  '/base64',
  '/favicon',
  '/palette',
  '/pdf',
  '/collage',
  '/annotate',
  '/gif-trim',
  '/gif-frames'
];

function offlineDocumentUrl(route) {
  return IS_LOCAL_STATIC_HOST ? `/pages${route}.html` : route;
}

const PRECACHE_URLS = [
  '/css/light-theme.css?v=3.3.0',
  '/LICENSE.MaterialSymbols.txt',
  '/manifest.webmanifest',
  '/',
  ...(IS_LOCAL_STATIC_HOST ? ['/index.html'] : []),
  ...OFFLINE_ROUTE_PATHS.map(offlineDocumentUrl),
  ...(!IS_LOCAL_STATIC_HOST ? LANGUAGES.flatMap(language => [
    `/${language}/`,
    `/${language}/manifest.webmanifest`,
    ...OFFLINE_ROUTE_PATHS.map(route => `/${language}${route}`)
  ]) : []),
  '/css/main.css?v=3.3.15',
  '/css/main.css?v=3.3.0',
  '/css/vars.css?v=3.3.0',
  '/css/base.css?v=3.3.0',
  '/css/layout.css?v=3.3.0',
  '/css/components.css?v=3.3.8',
  '/css/pages.css?v=3.3.15',
  '/css/remove-background.css?v=3.3.0',
  '/js/i18n.js?v=3.5.1',
  '/js/layout.js?v=3.5.1',
  '/js/pwa.js?v=3.3.0',
  '/js/core.js?v=3.4.0',
  '/js/favorites.js?v=3.5.1',
  '/js/image-worker.js?v=3.3.0',
  '/js/image-formats.js?v=3.3.0',
  '/js/gif-optimize.js?v=3.3.0',
  '/js/gif-frames.js?v=3.3.0',
  '/js/editor.js?v=1.2.9',
  '/js/vendor/fabric.min.js?v=6.4.3',
  '/js/vendor/LICENSE.Fabric.md',
  '/js/vendor/jszip.min.js',
  '/js/vendor/jspdf.umd.min.js',
  '/js/vendor/modern-gif/index.js?v=2.1.0',
  '/js/vendor/modern-gif/worker.js?v=2.1.0',
  '/assets/icons/favicon.svg?v=3.3.0',
  '/assets/icons/app-icon-192.png',
  '/assets/icons/app-icon-512.png',
  '/assets/icons/app-icon-maskable-512.png',
  '/assets/icons/apple-touch-icon.png',
  '/fonts/Inter-400.woff2',
  '/fonts/Inter-500.woff2',
  '/fonts/Inter-600.woff2',
  '/fonts/Inter-700.woff2',
  '/fonts/Inter-800.woff2'
];

const OFFLINE_ROUTES = Object.fromEntries(
  [
    ...OFFLINE_ROUTE_PATHS.map(route => [route, offlineDocumentUrl(route)]),
    ...LANGUAGES.flatMap(language => OFFLINE_ROUTE_PATHS.map(route => [
      `/${language}${route}`,
      IS_LOCAL_STATIC_HOST ? offlineDocumentUrl(route) : `/${language}${route}`
    ]))
  ]
);

async function precache() {
  const cache = await caches.open(STATIC_CACHE);
  const results = await Promise.allSettled(PRECACHE_URLS.map(async url => {
    const request = new Request(url, { cache: 'reload' });
    const response = await fetch(request);
    if (!response.ok) throw new Error(`Failed to precache ${url}: ${response.status}`);
    await cache.put(request, response);
  }));
  const failed = results.find(result => result.status === 'rejected');
  if (failed) {
    await caches.delete(STATIC_CACHE);
    throw failed.reason;
  }
}

self.addEventListener('install', event => {
  event.waitUntil(precache());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter(name => name.startsWith('akd-image-pwa-') && ![STATIC_CACHE, RUNTIME_CACHE].includes(name))
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;

    const url = new URL(request.url);
    const fallbackPath = OFFLINE_ROUTES[url.pathname];
    if (fallbackPath) {
      const fallback = await caches.match(fallbackPath, { ignoreSearch: true });
      if (fallback) return fallback;
    }

    const language = url.pathname.match(/^\/(ru|en|es)(?:\/|$)/)?.[1];
    const homeFallback = await caches.match(
      language && !IS_LOCAL_STATIC_HOST ? `/${language}/` : '/',
      { ignoreSearch: true }
    );
    return homeFallback || new Response('AKD Image is unavailable offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (['style', 'script', 'font', 'image', 'worker'].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
  }
});
