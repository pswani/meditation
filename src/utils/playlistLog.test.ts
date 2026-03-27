import { describe, expect, it } from 'vitest';
import { buildPlaylistItemLogEntry } from './playlistLog';

describe('playlist logging helpers', () => {
  it('creates a completed playlist session log entry with playlist metadata', () => {
    const entry = buildPlaylistItemLogEntry({
      playlistId: 'playlist-1',
      playlistName: 'Morning Sequence',
      playlistRunId: 'run-123',
      playlistRunStartedAt: '2026-03-23T10:00:00.000Z',
      item: {
        id: 'item-1',
        meditationType: 'Vipassana',
        durationMinutes: 10,
      },
      itemPosition: 1,
      itemCount: 3,
      startedAt: '2026-03-23T10:00:00.000Z',
      endedAt: new Date('2026-03-23T10:10:00.000Z'),
      completedDurationSeconds: 600,
      status: 'completed',
    });

    expect(entry.source).toBe('auto log');
    expect(entry.status).toBe('completed');
    expect(entry.playlistName).toBe('Morning Sequence');
    expect(entry.playlistRunId).toBe('run-123');
    expect(entry.playlistRunStartedAt).toBe('2026-03-23T10:00:00.000Z');
    expect(entry.playlistItemPosition).toBe(1);
    expect(entry.playlistItemCount).toBe(3);
    expect(entry.completedDurationSeconds).toBe(600);
  });

  it('caps ended-early completed duration to intended item duration', () => {
    const entry = buildPlaylistItemLogEntry({
      playlistId: 'playlist-1',
      playlistName: 'Morning Sequence',
      playlistRunId: 'run-123',
      playlistRunStartedAt: '2026-03-23T10:00:00.000Z',
      item: {
        id: 'item-2',
        meditationType: 'Ajapa',
        durationMinutes: 12,
      },
      itemPosition: 2,
      itemCount: 3,
      startedAt: '2026-03-23T10:10:00.000Z',
      endedAt: new Date('2026-03-23T10:12:00.000Z'),
      completedDurationSeconds: 2000,
      status: 'ended early',
    });

    expect(entry.status).toBe('ended early');
    expect(entry.intendedDurationSeconds).toBe(720);
    expect(entry.completedDurationSeconds).toBe(720);
  });

  it('keeps generated playlist session log ids within the backend length limit', () => {
    const entry = buildPlaylistItemLogEntry({
      playlistId: 'playlist-1774637352085-r7i2bm',
      playlistName: 'Morning Sequence',
      playlistRunId: 'playlist-1774637352085-r7i2bm',
      playlistRunStartedAt: '2026-03-23T10:00:00.000Z',
      item: {
        id: 'playlist-item-1774637333199-x1b3d4',
        meditationType: 'Ajapa',
        durationMinutes: 12,
      },
      itemPosition: 2,
      itemCount: 3,
      startedAt: '2026-03-23T10:10:00.000Z',
      endedAt: new Date('2026-03-23T10:12:00.000Z'),
      completedDurationSeconds: 120,
      status: 'ended early',
    });

    expect(entry.id.length).toBeLessThanOrEqual(64);
    expect(entry.id).toMatch(/^plog-/);
  });

  it('clamps negative completed duration to zero', () => {
    const entry = buildPlaylistItemLogEntry({
      playlistId: 'playlist-1',
      playlistName: 'Morning Sequence',
      playlistRunId: 'run-123',
      playlistRunStartedAt: '2026-03-23T10:00:00.000Z',
      item: {
        id: 'item-3',
        meditationType: 'Tratak',
        durationMinutes: 8,
      },
      itemPosition: 3,
      itemCount: 3,
      startedAt: '2026-03-23T10:22:00.000Z',
      endedAt: new Date('2026-03-23T10:23:00.000Z'),
      completedDurationSeconds: -42,
      status: 'ended early',
    });

    expect(entry.completedDurationSeconds).toBe(0);
  });
});
