import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CustomPlay } from '../types/customPlay';
import {
  buildCustomPlayCollectionUrl,
  buildCustomPlayDetailPath,
  buildCustomPlayDetailUrl,
  CUSTOM_PLAYS_COLLECTION_ENDPOINT,
  deleteCustomPlayFromApi,
  listCustomPlaysFromApi,
  persistCustomPlayToApi,
} from './customPlayApi';
import { SYNC_QUEUED_AT_HEADER } from './syncApi';

const customPlay: CustomPlay = {
  id: 'custom-play-1',
  name: 'Morning Focus',
  meditationType: 'Vipassana',
  durationMinutes: 33,
  startSound: 'Soft Chime',
  endSound: 'Wood Block',
  mediaAssetId: 'media-vipassana-sit-20',
  recordingLabel: 'Breath emphasis',
  favorite: false,
  createdAt: '2026-03-26T10:00:00.000Z',
  updatedAt: '2026-03-26T10:00:00.000Z',
};

describe('custom play api boundary', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes stable custom play endpoint contracts', () => {
    expect(CUSTOM_PLAYS_COLLECTION_ENDPOINT).toBe('/api/custom-plays');
    expect(buildCustomPlayDetailPath('custom-play-1')).toBe('/custom-plays/custom-play-1');
    expect(buildCustomPlayCollectionUrl()).toBe('/api/custom-plays');
    expect(buildCustomPlayDetailUrl('custom-play-1', 'http://192.168.1.25:8080/api')).toBe(
      'http://192.168.1.25:8080/api/custom-plays/custom-play-1'
    );
  });

  it('lists custom plays from the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [customPlay],
      })
    );

    await expect(listCustomPlaysFromApi()).resolves.toEqual([customPlay]);
  });

  it('persists and deletes custom plays through the backend endpoints', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => customPlay,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

    vi.stubGlobal('fetch', fetchMock);

    const saved = await persistCustomPlayToApi(customPlay, {
      syncQueuedAt: '2026-03-27T10:15:00.000Z',
    });
    expect(saved).toEqual(customPlay);

    await expect(
      deleteCustomPlayFromApi(customPlay.id, {
        syncQueuedAt: '2026-03-27T10:20:00.000Z',
      })
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/custom-plays/custom-play-1',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          [SYNC_QUEUED_AT_HEADER]: '2026-03-27T10:15:00.000Z',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/custom-plays/custom-play-1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          [SYNC_QUEUED_AT_HEADER]: '2026-03-27T10:20:00.000Z',
        }),
      })
    );
  });
});
