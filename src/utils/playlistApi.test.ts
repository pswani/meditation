import { beforeEach, describe, expect, it } from 'vitest';
import { buildPlaylistDetailEndpoint, listPlaylistsFromApi, persistPlaylistsToApi, PLAYLISTS_COLLECTION_ENDPOINT } from './playlistApi';

const PLAYLISTS_STORAGE_KEY = 'meditation.playlists.v1';

describe('playlist api boundary', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exposes stable playlist endpoint contracts', () => {
    expect(PLAYLISTS_COLLECTION_ENDPOINT).toBe('/api/playlists');
    expect(buildPlaylistDetailEndpoint('playlist-1')).toBe('/api/playlists/playlist-1');
  });

  it('persists and lists playlists through api boundary', async () => {
    const playlists = [
      {
        id: 'playlist-1',
        name: 'Evening Sequence',
        favorite: false,
        createdAt: '2026-03-24T08:00:00.000Z',
        updatedAt: '2026-03-24T08:00:00.000Z',
        items: [
          {
            id: 'item-1',
            meditationType: 'Tratak' as const,
            durationMinutes: 14,
          },
        ],
      },
    ];

    await persistPlaylistsToApi(playlists);
    await expect(listPlaylistsFromApi()).resolves.toEqual(playlists);
  });

  it('returns normalized playlists through api list boundary', async () => {
    localStorage.setItem(
      PLAYLISTS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'playlist-valid',
          name: 'Valid Sequence',
          favorite: false,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
          items: [
            {
              id: 'item-1',
              meditationType: 'Ajapa',
              durationMinutes: 12,
            },
          ],
        },
        {
          id: 'playlist-invalid',
          name: 'Invalid Sequence',
          favorite: false,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
          items: [
            {
              id: 'item-2',
              meditationType: 'Breathwork',
              durationMinutes: 0,
            },
          ],
        },
      ])
    );

    await expect(listPlaylistsFromApi()).resolves.toEqual([
      {
        id: 'playlist-valid',
        name: 'Valid Sequence',
        favorite: false,
        createdAt: '2026-03-24T08:00:00.000Z',
        updatedAt: '2026-03-24T08:00:00.000Z',
        items: [
          {
            id: 'item-1',
            meditationType: 'Ajapa',
            durationMinutes: 12,
          },
        ],
      },
    ]);
  });
});
