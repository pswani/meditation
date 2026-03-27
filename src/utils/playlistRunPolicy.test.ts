import { describe, expect, it } from 'vitest';
import { evaluatePlaylistDelete, evaluatePlaylistRunStart } from './playlistRunPolicy';

const samplePlaylist = {
  id: 'playlist-1',
  name: 'Morning Sequence',
  favorite: false,
  createdAt: '2026-03-23T10:00:00.000Z',
  updatedAt: '2026-03-23T10:00:00.000Z',
  items: [
    {
      id: 'item-1',
      meditationType: 'Vipassana' as const,
      durationMinutes: 15,
    },
  ],
};

describe('playlist run policy', () => {
  it('blocks playlist start when timer session is active', () => {
    const result = evaluatePlaylistRunStart({
      playlistId: samplePlaylist.id,
      playlists: [samplePlaylist],
      isPlaylistsLoading: false,
      activeTimerSession: true,
      activePlaylistRun: null,
    });

    expect(result).toEqual({
      started: false,
      reason: 'timer session active',
    });
  });

  it('blocks playlist start when another playlist run is active', () => {
    const result = evaluatePlaylistRunStart({
      playlistId: samplePlaylist.id,
      playlists: [samplePlaylist],
      isPlaylistsLoading: false,
      activeTimerSession: false,
      activePlaylistRun: {
        runId: 'run-1',
        playlistId: samplePlaylist.id,
        playlistName: samplePlaylist.name,
        runStartedAt: '2026-03-23T10:00:00.000Z',
        items: samplePlaylist.items,
        currentIndex: 0,
        currentItemStartedAt: '2026-03-23T10:00:00.000Z',
        currentItemStartedAtMs: 1711197600000,
        currentItemRemainingSeconds: 900,
        currentItemEndAtMs: 1711198500000,
        completedItems: 0,
        completedDurationSeconds: 0,
        totalIntendedDurationSeconds: 900,
      },
    });

    expect(result).toEqual({
      started: false,
      reason: 'playlist run active',
    });
  });

  it('allows playlist start when no blockers exist', () => {
    const result = evaluatePlaylistRunStart({
      playlistId: samplePlaylist.id,
      playlists: [samplePlaylist],
      isPlaylistsLoading: false,
      activeTimerSession: false,
      activePlaylistRun: null,
    });

    expect(result).toEqual({ started: true });
  });

  it('blocks playlist start when playlist is missing', () => {
    const result = evaluatePlaylistRunStart({
      playlistId: 'missing-playlist',
      playlists: [samplePlaylist],
      isPlaylistsLoading: false,
      activeTimerSession: false,
      activePlaylistRun: null,
    });

    expect(result).toEqual({
      started: false,
      reason: 'playlist not found',
    });
  });

  it('blocks playlist start when selected playlist has no items', () => {
    const result = evaluatePlaylistRunStart({
      playlistId: 'empty-playlist',
      playlists: [
        {
          ...samplePlaylist,
          id: 'empty-playlist',
          items: [],
        },
      ],
      isPlaylistsLoading: false,
      activeTimerSession: false,
      activePlaylistRun: null,
    });

    expect(result).toEqual({
      started: false,
      reason: 'playlist has no items',
    });
  });

  it('blocks deleting the actively running playlist', () => {
    const result = evaluatePlaylistDelete(samplePlaylist.id, {
      runId: 'run-1',
      playlistId: samplePlaylist.id,
      playlistName: samplePlaylist.name,
      runStartedAt: '2026-03-23T10:00:00.000Z',
      items: samplePlaylist.items,
      currentIndex: 0,
      currentItemStartedAt: '2026-03-23T10:00:00.000Z',
      currentItemStartedAtMs: 1711197600000,
      currentItemRemainingSeconds: 900,
      currentItemEndAtMs: 1711198500000,
      completedItems: 0,
      completedDurationSeconds: 0,
      totalIntendedDurationSeconds: 900,
    });

    expect(result).toEqual({
      deleted: false,
      reason: 'playlist run active',
    });
  });

  it('allows deleting playlist when no active run blocks it', () => {
    expect(evaluatePlaylistDelete(samplePlaylist.id, null)).toEqual({
      deleted: true,
    });
  });

  it('blocks playlist start while playlists are still hydrating from the backend', () => {
    const result = evaluatePlaylistRunStart({
      playlistId: samplePlaylist.id,
      playlists: [samplePlaylist],
      isPlaylistsLoading: true,
      activeTimerSession: false,
      activePlaylistRun: null,
    });

    expect(result).toEqual({
      started: false,
      reason: 'playlists loading',
    });
  });
});
