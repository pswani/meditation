import { describe, expect, it } from 'vitest';
import {
  CUSTOM_PLAY_MEDIA_DIRECTORY,
  CUSTOM_PLAY_MEDIA_LIST_ENDPOINT,
  findCustomPlayMediaAssetById,
  listCustomPlayMediaAssets,
} from './mediaAssetApi';

describe('media asset api boundary', () => {
  it('returns custom-play media metadata entries with stable endpoint contract', async () => {
    const assets = await listCustomPlayMediaAssets();

    expect(CUSTOM_PLAY_MEDIA_LIST_ENDPOINT).toBe('/api/media/custom-plays');
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

  it('returns metadata entries with required selection fields', async () => {
    const assets = await listCustomPlayMediaAssets();
    const first = assets[0];

    expect(first?.id).toBeTruthy();
    expect(first?.label).toBeTruthy();
    expect(first?.durationSeconds).toBeGreaterThan(0);
    expect(first?.filePath).toContain('/media/custom-plays/');
  });
});
