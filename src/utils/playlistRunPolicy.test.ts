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
      activeTimerSession: false,
      activePlaylistRun: null,
    });

    expect(result).toEqual({ started: true });
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
});
