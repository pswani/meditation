import { getOfflineAppServiceWorkerPath } from './offlineCacheVersion';

const OFFLINE_APP_SERVICE_WORKER_PATH = getOfflineAppServiceWorkerPath();
const CACHE_URLS_MESSAGE_TYPE = 'CACHE_URLS';

function normalizeOfflineCacheUrl(url: string, locationLike: Pick<Location, 'origin'>): string | null {
  try {
    const resolvedUrl = new URL(url, locationLike.origin);
    if (resolvedUrl.origin !== locationLike.origin) {
      return null;
    }

    return `${resolvedUrl.pathname}${resolvedUrl.search}`;
  } catch {
    return null;
  }
}

function collectElementCacheUrls(
  documentLike: Pick<Document, 'querySelectorAll'>,
  locationLike: Pick<Location, 'origin'>
): string[] {
  const urls = new Set<string>();
  const elements = documentLike.querySelectorAll<HTMLLinkElement | HTMLScriptElement | HTMLImageElement | HTMLSourceElement>(
    'link[href], script[src], img[src], source[src], audio[src]'
  );

  for (const element of elements) {
    const rawUrl =
      'href' in element && typeof element.href === 'string' && element.href.length > 0
        ? element.href
        : 'src' in element && typeof element.src === 'string' && element.src.length > 0
          ? element.src
          : null;

    if (!rawUrl) {
      continue;
    }

    const normalizedUrl = normalizeOfflineCacheUrl(rawUrl, locationLike);
    if (normalizedUrl) {
      urls.add(normalizedUrl);
    }
  }

  return [...urls];
}

export function collectOfflineAppCacheUrls(
  documentLike: Pick<Document, 'querySelectorAll'> = document,
  locationLike: Pick<Location, 'origin' | 'pathname'> = window.location
): string[] {
  const urls = new Set<string>(['/', '/manifest.webmanifest']);
  const currentPath = normalizeOfflineCacheUrl(locationLike.pathname, locationLike);
  if (currentPath) {
    urls.add(currentPath);
  }

  for (const url of collectElementCacheUrls(documentLike, locationLike)) {
    urls.add(url);
  }

  return [...urls];
}

function postCacheUrlsMessage(serviceWorker: Pick<ServiceWorker, 'postMessage'> | null, urls: readonly string[]): boolean {
  if (!serviceWorker || urls.length === 0) {
    return false;
  }

  serviceWorker.postMessage({
    type: CACHE_URLS_MESSAGE_TYPE,
    payload: {
      urls,
    },
  });

  return true;
}

function getPreferredServiceWorker(registration: ServiceWorkerRegistration | null): ServiceWorker | null {
  if (!registration) {
    return null;
  }

  return registration.active ?? registration.waiting ?? registration.installing ?? null;
}

function normalizeOfflineCacheUrls(urls: readonly string[], locationLike: Pick<Location, 'origin'> = window.location): string[] {
  const normalizedUrls = new Set<string>();

  for (const url of urls) {
    const normalizedUrl = normalizeOfflineCacheUrl(url, locationLike);
    if (normalizedUrl) {
      normalizedUrls.add(normalizedUrl);
    }
  }

  return [...normalizedUrls];
}

export async function precacheUrlsForOffline(urls: readonly string[]): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  const normalizedUrls = normalizeOfflineCacheUrls(urls);
  if (normalizedUrls.length === 0) {
    return false;
  }

  if (navigator.serviceWorker.controller && postCacheUrlsMessage(navigator.serviceWorker.controller, normalizedUrls)) {
    return true;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return postCacheUrlsMessage(getPreferredServiceWorker(registration), normalizedUrls);
  } catch {
    return false;
  }
}

export async function registerOfflineAppServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(OFFLINE_APP_SERVICE_WORKER_PATH);
    void precacheUrlsForOffline(collectOfflineAppCacheUrls());
    return registration;
  } catch {
    return null;
  }
}
