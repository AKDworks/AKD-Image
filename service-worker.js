// Increment this value when the offline bundle changes materially.
const CACHE_VERSION = 'akd-image-pwa-v22';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/pages/app.html',
  '/pages/about.html',
  '/pages/privacy.html',
  '/pages/licenses.html',
  '/pages/favorites.html',
  '/pages/compress.html',
  '/pages/gif-optimize.html',
  '/pages/resize.html',
  '/pages/watermark.html',
  '/pages/crop.html',
  '/pages/convert.html',
  '/pages/rotate.html',
  '/pages/effects.html',
  '/pages/blur.html',
  '/pages/meme.html',
  '/pages/split.html',
  '/pages/round.html',
  '/pages/pixelate.html',
  '/pages/exif.html',
  '/pages/base64.html',
  '/pages/favicon.html',
  '/pages/palette.html',
  '/pages/pdf.html',
  '/pages/collage.html',
  '/pages/annotate.html',
  '/pages/gif-trim.html',
  '/pages/gif-frames.html',
  '/css/main.css?v=94',
  '/css/vars.css?v=2',
  '/css/base.css?v=4',
  '/css/layout.css?v=13',
  '/css/components.css?v=24',
  '/css/pages.css?v=44',
  '/js/i18n.js?v=23',
  '/js/layout.js?v=29',
  '/js/pwa.js?v=5',
  '/js/core.js?v=42',
  '/js/favorites.js?v=3',
  '/js/image-worker.js?v=3',
  '/js/image-formats.js?v=1',
  '/js/gif-optimize.js?v=4',
  '/js/gif-frames.js?v=2',
  '/js/vendor/jszip.min.js',
  '/js/vendor/jspdf.umd.min.js',
  '/js/vendor/modern-gif/index.js?v=2.1.0',
  '/js/vendor/modern-gif/worker.js?v=2.1.0',
  '/assets/icons/favicon.svg?v=2',
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

const OFFLINE_ROUTES = {
  '/app': '/pages/app.html',
  '/about': '/pages/about.html',
  '/privacy': '/pages/privacy.html',
  '/licenses': '/pages/licenses.html',
  '/favorites': '/pages/favorites.html',
  '/compress': '/pages/compress.html',
  '/gif-optimize': '/pages/gif-optimize.html',
  '/resize': '/pages/resize.html',
  '/watermark': '/pages/watermark.html',
  '/crop': '/pages/crop.html',
  '/convert': '/pages/convert.html',
  '/rotate': '/pages/rotate.html',
  '/effects': '/pages/effects.html',
  '/blur': '/pages/blur.html',
  '/meme': '/pages/meme.html',
  '/split': '/pages/split.html',
  '/round': '/pages/round.html',
  '/pixelate': '/pages/pixelate.html',
  '/exif': '/pages/exif.html',
  '/base64': '/pages/base64.html',
  '/favicon': '/pages/favicon.html',
  '/palette': '/pages/palette.html',
  '/pdf': '/pages/pdf.html',
  '/collage': '/pages/collage.html',
  '/annotate': '/pages/annotate.html',
  '/gif-trim': '/pages/gif-trim.html',
  '/gif-frames': '/pages/gif-frames.html'
};

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

async function cacheFirstNavigation(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;

  const url = new URL(request.url);
  const fallbackPath = OFFLINE_ROUTES[url.pathname];
  if (fallbackPath) {
    const fallback = await caches.match(fallbackPath, { ignoreSearch: true });
    if (fallback) return fallback;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const homeFallback = await caches.match('/index.html', { ignoreSearch: true });
    return homeFallback || caches.match('/', { ignoreSearch: true });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
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
    event.respondWith(cacheFirstNavigation(request));
    return;
  }

  if (['style', 'script', 'font', 'image', 'worker'].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
  }
});
