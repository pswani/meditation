import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCustomPlayMediaListUrl,
  CUSTOM_PLAY_MEDIA_DIRECTORY,
  CUSTOM_PLAY_MEDIA_LIST_ENDPOINT,
  findCustomPlayMediaAssetById,
  loadCustomPlayMediaAssets,
  resetCustomPlayMediaAssetCatalogForTests,
  listCustomPlayMediaAssets,
} from './mediaAssetApi';

describe('media asset api boundary', () => {
  beforeEach(() => {
    localStorage.clear();
    resetCustomPlayMediaAssetCatalogForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns custom-play media metadata entries with stable endpoint contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'media-vipassana-sit-20',
            label: 'Vipassana Sit (20 min)',
            meditationType: 'Vipassana',
            filePath: '/media/custom-plays/vipassana-sit-20.mp3',
            relativePath: 'custom-plays/vipassana-sit-20.mp3',
            durationSeconds: 1200,
            mimeType: 'audio/mpeg',
            sizeBytes: 9200000,
            updatedAt: '2026-03-24T08:00:00.000Z',
          },
        ],
      })
    );

    const assets = await listCustomPlayMediaAssets();

    expect(CUSTOM_PLAY_MEDIA_LIST_ENDPOINT).toBe('/api/media/custom-plays');
    expect(buildCustomPlayMediaListUrl()).toBe('/api/media/custom-plays');
    expect(buildCustomPlayMediaListUrl('http://192.168.1.25:8080/api')).toBe('http://192.168.1.25:8080/api/media/custom-plays');
    expect(assets.length).toBeGreaterThan(0);
    expect(assets[0]?.filePath).toContain(CUSTOM_PLAY_MEDIA_DIRECTORY);
    expect(assets[0]?.meditationType).toBe('Vipassana');
    expect(assets[0]?.relativePath).toBe('custom-plays/vipassana-sit-20.mp3');
    expect(assets[0]?.mimeType).toBe('audio/mpeg');
  });

  it('finds media metadata by id', () => {
    const asset = findCustomPlayMediaAssetById('media-vipassana-sit-20');
    expect(asset?.label).toMatch(/vipassana sit/i);
  });

  it('returns undefined for unknown media ids', () => {
    expect(findCustomPlayMediaAssetById('missing-media-id')).toBeNull();
  });

  it('falls back to built-in media metadata when the backend is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network unavailable'))
    );

    const result = await loadCustomPlayMediaAssets();
    const first = result.assets[0];

    expect(result.source).toBe('sample-fallback');
    expect(result.errorKind).toBe('unavailable');
    expect(result.errorMessage).toMatch(/built-in recording options/i);
    expect(first?.id).toBeTruthy();
    expect(first?.label).toBeTruthy();
    expect(first?.meditationType).toBeTruthy();
    expect(first?.durationSeconds).toBeGreaterThan(0);
    expect(first?.filePath).toContain('/media/custom-plays/');
    expect(first?.relativePath).toContain('custom-plays/');
  });

  it('surfaces invalid backend media payloads as explicit integration errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ not: 'an array' }),
      })
    );

    const result = await loadCustomPlayMediaAssets();

    expect(result.source).toBe('sample-fallback');
    expect(result.errorKind).toBe('invalid-response');
    expect(result.errorMessage).toMatch(/recording library data is unavailable right now/i);
  });

  it('surfaces backend http failures without pretending the backend is merely offline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'internal error',
      })
    );

    const result = await loadCustomPlayMediaAssets();

    expect(result.source).toBe('sample-fallback');
    expect(result.errorKind).toBe('backend-error');
    expect(result.errorMessage).toMatch(/loading failed/i);
  });

  it('updates lookup behavior after a successful backend media load', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'media-backend-only',
            label: 'Backend Only Session',
            meditationType: 'Sahaj',
            filePath: `${CUSTOM_PLAY_MEDIA_DIRECTORY}/backend-only.mp3`,
            relativePath: 'custom-plays/backend-only.mp3',
            durationSeconds: 300,
            mimeType: 'audio/mpeg',
            sizeBytes: 1000,
            updatedAt: '2026-03-26T12:00:00.000Z',
          },
        ],
      })
    );

    await loadCustomPlayMediaAssets();

    expect(findCustomPlayMediaAssetById('media-backend-only')?.label).toBe('Backend Only Session');
    expect(findCustomPlayMediaAssetById('media-backend-only')?.relativePath).toBe('custom-plays/backend-only.mp3');
    expect(findCustomPlayMediaAssetById('media-vipassana-sit-20')).toBeNull();
  });

  it('prefers the last successful backend media catalog when the backend later becomes unavailable', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'media-cached-backend-only',
            label: 'Cached Backend Session',
            meditationType: 'Sahaj',
            filePath: `${CUSTOM_PLAY_MEDIA_DIRECTORY}/cached-backend-only.mp3`,
            relativePath: 'custom-plays/cached-backend-only.mp3',
            durationSeconds: 480,
            mimeType: 'audio/mpeg',
            sizeBytes: 1000,
            updatedAt: '2026-03-26T12:00:00.000Z',
          },
        ],
      })
      .mockRejectedValueOnce(new Error('network unavailable'));
    vi.stubGlobal('fetch', fetchMock);

    await loadCustomPlayMediaAssets();
    const result = await loadCustomPlayMediaAssets();

    expect(result.source).toBe('cached-backend');
    expect(result.errorMessage).toMatch(/last saved recording library/i);
    expect(result.assets[0]?.id).toBe('media-cached-backend-only');
    expect(findCustomPlayMediaAssetById('media-cached-backend-only')?.label).toBe('Cached Backend Session');
  });

  it('derives a relative path when older backend payloads omit it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'media-older-shape',
            label: 'Older Shape',
            meditationType: 'Ajapa',
            filePath: '/media/custom-plays/older-shape.mp3',
            durationSeconds: 600,
            mimeType: 'audio/mpeg',
            sizeBytes: 1000,
            updatedAt: '2026-03-26T12:00:00.000Z',
          },
        ],
      })
    );

    const assets = await listCustomPlayMediaAssets();

    expect(assets[0]?.relativePath).toBe('custom-plays/older-shape.mp3');
  });
});
