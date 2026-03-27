import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Playlist } from '../types/playlist';
import {
  buildPlaylistCollectionUrl,
  buildPlaylistDetailEndpoint,
  buildPlaylistDetailPath,
  buildPlaylistDetailUrl,
  deletePlaylistFromApi,
  listPlaylistsFromApi,
  persistPlaylistToApi,
  PLAYLISTS_COLLECTION_ENDPOINT,
} from './playlistApi';
import { SYNC_QUEUED_AT_HEADER } from './syncApi';

const playlist: Playlist = {
  id: 'playlist-1',
  name: 'Evening Sequence',
  favorite: false,
  createdAt: '2026-03-24T08:00:00.000Z',
  updatedAt: '2026-03-24T08:00:00.000Z',
  items: [
    {
      id: 'item-1',
      meditationType: 'Tratak',
      durationMinutes: 14,
    },
  ],
};

describe('playlist api boundary', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes stable playlist endpoint contracts', () => {
    expect(PLAYLISTS_COLLECTION_ENDPOINT).toBe('/api/playlists');
    expect(buildPlaylistDetailPath('playlist-1')).toBe('/playlists/playlist-1');
    expect(buildPlaylistDetailEndpoint('playlist-1')).toBe('/api/playlists/playlist-1');
    expect(buildPlaylistCollectionUrl()).toBe('/api/playlists');
    expect(buildPlaylistDetailUrl('playlist-1', 'http://192.168.1.25:8080/api')).toBe(
      'http://192.168.1.25:8080/api/playlists/playlist-1'
    );
  });

  it('lists playlists from the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [playlist],
      })
    );

    await expect(listPlaylistsFromApi()).resolves.toEqual([playlist]);
  });

  it('persists and deletes playlists through the backend endpoints', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => playlist,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

    vi.stubGlobal('fetch', fetchMock);

    const saved = await persistPlaylistToApi(playlist, {
      syncQueuedAt: '2026-03-27T10:15:00.000Z',
    });
    expect(saved).toEqual(playlist);

    await expect(
      deletePlaylistFromApi(playlist.id, {
        syncQueuedAt: '2026-03-27T10:20:00.000Z',
      })
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/playlists/playlist-1',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          [SYNC_QUEUED_AT_HEADER]: '2026-03-27T10:15:00.000Z',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/playlists/playlist-1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          [SYNC_QUEUED_AT_HEADER]: '2026-03-27T10:20:00.000Z',
        }),
      })
    );
  });
});
