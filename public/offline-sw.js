function resolveCacheVersion() {
  try {
    const serviceWorkerUrl = new URL(self.location.href);
    const version = serviceWorkerUrl.searchParams.get('v');
    return version && version.trim().length > 0 ? version.trim() : 'dev';
  } catch {
    return 'dev';
  }
}

const CACHE_VERSION = resolveCacheVersion();
const APP_SHELL_CACHE = `meditation-app-shell-${CACHE_VERSION}`;
const STATIC_ASSET_CACHE = `meditation-static-assets-${CACHE_VERSION}`;
const MEDIA_ASSET_CACHE = `meditation-media-assets-${CACHE_VERSION}`;
const MEDIA_CACHE_INDEX_URL = '/__offline__/media-cache-index';
const MAX_CACHEABLE_MEDIA_BYTES = 25 * 1024 * 1024;
const MAX_MEDIA_CACHE_ENTRIES = 12;
const APP_SHELL_URL = '/';
const MANIFEST_URL = '/manifest.webmanifest';
const CACHE_URLS_MESSAGE_TYPE = 'CACHE_URLS';

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isStaticAssetRequest(request, url) {
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font' || request.destination === 'image') {
    return true;
  }

  return url.pathname.startsWith('/assets/') || url.pathname === MANIFEST_URL;
}

function isMediaRequest(url) {
  return url.pathname.startsWith('/media/');
}

async function cacheAppShell() {
  const cache = await caches.open(APP_SHELL_CACHE);
  await cache.addAll([APP_SHELL_URL, MANIFEST_URL]);
}

async function cacheUrls(urls) {
  const staticCache = await caches.open(STATIC_ASSET_CACHE);
  const mediaCache = await caches.open(MEDIA_ASSET_CACHE);

  await Promise.all(
    urls.map(async (urlValue) => {
      try {
        const url = new URL(urlValue, self.location.origin);
        if (!isSameOrigin(url)) {
          return;
        }

        const response = await fetch(url.href, {
          cache: 'reload',
        });

        if (!response.ok || response.type === 'opaque') {
          return;
        }

        if (isMediaRequest(url)) {
          await cacheMediaResponse(mediaCache, url.href, response);
          return;
        }

        await staticCache.put(url.href, response.clone());
      } catch {
        // Ignore best-effort cache population failures.
      }
    })
  );
}

function readContentLength(response) {
  const rawContentLength = response.headers.get('content-length');
  if (!rawContentLength) {
    return null;
  }

  const contentLength = Number.parseInt(rawContentLength, 10);
  return Number.isFinite(contentLength) && contentLength >= 0 ? contentLength : null;
}

function isCacheableMediaResponse(response) {
  if (!response.ok || response.status !== 200 || response.type === 'opaque') {
    return false;
  }

  const contentLength = readContentLength(response);
  return contentLength !== null && contentLength <= MAX_CACHEABLE_MEDIA_BYTES;
}

async function readMediaCacheIndex(cache) {
  const response = await cache.match(MEDIA_CACHE_INDEX_URL);
  if (!response) {
    return [];
  }

  try {
    const payload = await response.json();
    return Array.isArray(payload?.urls)
      ? payload.urls.filter((value) => typeof value === 'string' && value.length > 0)
      : [];
  } catch {
    return [];
  }
}

async function writeMediaCacheIndex(cache, urls) {
  await cache.put(
    MEDIA_CACHE_INDEX_URL,
    new Response(JSON.stringify({ urls }), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  );
}

async function rememberCachedMediaUrl(cache, url) {
  const currentUrls = await readMediaCacheIndex(cache);
  const nextUrls = [...currentUrls.filter((value) => value !== url), url];
  const overflowCount = Math.max(0, nextUrls.length - MAX_MEDIA_CACHE_ENTRIES);
  const evictedUrls = nextUrls.slice(0, overflowCount);
  const retainedUrls = nextUrls.slice(overflowCount);

  await Promise.all(evictedUrls.map((value) => cache.delete(value)));
  await writeMediaCacheIndex(cache, retainedUrls);
}

async function cacheMediaResponse(cache, cacheKey, response) {
  if (!isCacheableMediaResponse(response)) {
    return false;
  }

  await cache.put(cacheKey, response.clone());
  await rememberCachedMediaUrl(cache, cacheKey);
  return true;
}

async function deleteOldCaches() {
  const expectedCaches = new Set([APP_SHELL_CACHE, STATIC_ASSET_CACHE, MEDIA_ASSET_CACHE]);
  const cacheNames = await caches.keys();

  await Promise.all(
    cacheNames.map((cacheName) => {
      if (expectedCaches.has(cacheName)) {
        return Promise.resolve(false);
      }

      return caches.delete(cacheName);
    })
  );
}

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(APP_SHELL_CACHE);
      await cache.put(APP_SHELL_URL, response.clone());
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match(APP_SHELL_URL)) || Response.error();
  }
}

async function handleStaticAssetRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_ASSET_CACHE);
    await cache.put(request, response.clone());
  }

  return response;
}

async function handleMediaRequest(request) {
  const rangeHeader = request.headers.get('range');
  const mediaCache = await caches.open(MEDIA_ASSET_CACHE);

  if (rangeHeader) {
    try {
      return await fetch(request);
    } catch {
      return new Response(null, {
        status: 503,
        statusText: 'Offline media range requests are unavailable.',
        headers: {
          'X-Meditation-Offline-Media': 'range-unsupported',
        },
      });
    }
  }

  try {
    const response = await fetch(request);
    await cacheMediaResponse(mediaCache, request.url, response);
    return response;
  } catch {
    return (await mediaCache.match(request.url)) || Response.error();
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    cacheAppShell().then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    deleteOldCaches().then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== CACHE_URLS_MESSAGE_TYPE) {
    return;
  }

  const urls = Array.isArray(event.data.payload?.urls) ? event.data.payload.urls : [];
  event.waitUntil(cacheUrls(urls));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (!isSameOrigin(url)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (isMediaRequest(url)) {
    event.respondWith(handleMediaRequest(request));
    return;
  }

  if (isStaticAssetRequest(request, url)) {
    event.respondWith(handleStaticAssetRequest(request));
  }
});
