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
    expect(result.errorMessage).toMatch(/built-in media session options/i);
    expect(first?.id).toBeTruthy();
    expect(first?.label).toBeTruthy();
    expect(first?.durationSeconds).toBeGreaterThan(0);
    expect(first?.filePath).toContain('/media/custom-plays/');
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
    expect(findCustomPlayMediaAssetById('media-vipassana-sit-20')).toBeNull();
  });
});
