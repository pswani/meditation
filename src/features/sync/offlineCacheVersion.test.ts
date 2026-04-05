import { describe, expect, it } from 'vitest';
import {
  FALLBACK_OFFLINE_CACHE_VERSION,
  getOfflineAppAssetVersion,
  getOfflineAppServiceWorkerPath,
  normalizeOfflineCacheVersion,
} from './offlineCacheVersion';

describe('offline cache version helpers', () => {
  it('normalizes missing or blank versions to the fallback', () => {
    expect(normalizeOfflineCacheVersion(undefined)).toBe(FALLBACK_OFFLINE_CACHE_VERSION);
    expect(normalizeOfflineCacheVersion(null)).toBe(FALLBACK_OFFLINE_CACHE_VERSION);
    expect(normalizeOfflineCacheVersion('   ')).toBe(FALLBACK_OFFLINE_CACHE_VERSION);
  });

  it('keeps explicit asset versions stable for service-worker registration', () => {
    expect(getOfflineAppAssetVersion('release-20260405')).toBe('release-20260405');
    expect(getOfflineAppServiceWorkerPath('release 2026-04-05')).toBe('/offline-sw.js?v=release%202026-04-05');
  });
});
