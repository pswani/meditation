const CACHE_VERSION = '2026-04-04-offline-app-sync-v1';
const APP_SHELL_CACHE = `meditation-app-shell-${CACHE_VERSION}`;
const STATIC_ASSET_CACHE = `meditation-static-assets-${CACHE_VERSION}`;
const MEDIA_ASSET_CACHE = `meditation-media-assets-${CACHE_VERSION}`;
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
          await mediaCache.put(url.href, response.clone());
          return;
        }

        await staticCache.put(url.href, response.clone());
      } catch {
        // Ignore best-effort cache population failures.
      }
    })
  );
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

function buildPartialContentResponse(response, rangeHeader) {
  return response.arrayBuffer().then((arrayBuffer) => {
    const bytesLength = arrayBuffer.byteLength;
    const match = /bytes=(\d+)-(\d+)?/.exec(rangeHeader);
    if (!match) {
      return new Response(null, { status: 416 });
    }

    const start = Number.parseInt(match[1], 10);
    const end = match[2] ? Number.parseInt(match[2], 10) : bytesLength - 1;
    const boundedEnd = Math.min(end, bytesLength - 1);

    if (Number.isNaN(start) || Number.isNaN(boundedEnd) || start >= bytesLength || start > boundedEnd) {
      return new Response(null, { status: 416 });
    }

    const slicedBuffer = arrayBuffer.slice(start, boundedEnd + 1);
    const headers = new Headers(response.headers);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Content-Length', String(slicedBuffer.byteLength));
    headers.set('Content-Range', `bytes ${start}-${boundedEnd}/${bytesLength}`);

    return new Response(slicedBuffer, {
      status: 206,
      statusText: 'Partial Content',
      headers,
    });
  });
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
    const cachedResponse = (await mediaCache.match(request.url)) || (await caches.match(request.url));
    if (cachedResponse) {
      return buildPartialContentResponse(cachedResponse, rangeHeader);
    }

    return fetch(request);
  }

  try {
    const response = await fetch(request);
    if (response.ok && response.status === 200) {
      await mediaCache.put(request.url, response.clone());
    }
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
