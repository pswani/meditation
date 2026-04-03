import { describe, expect, it } from 'vitest';
import type { CustomPlay } from '../types/customPlay';
import type { Playlist } from '../types/playlist';
import {
  buildActivePlaylistRun,
  buildPlaylistRuntimeItems,
  completePlaylistRunCurrentSegment,
  computePlaylistRunRemainingSeconds,
  getPlaylistRunCurrentItem,
} from './playlistRuntime';

const basePlaylist: Playlist = {
  id: 'playlist-1',
  name: 'Morning Sequence',
  smallGapSeconds: 10,
  favorite: false,
  createdAt: '2026-03-24T08:00:00.000Z',
  updatedAt: '2026-03-24T08:00:00.000Z',
  items: [
    {
      id: 'item-1',
      title: 'Recorded Vipassana',
      meditationType: 'Vipassana',
      durationMinutes: 20,
      customPlayId: 'custom-play-1',
    },
    {
      id: 'item-2',
      title: 'Ajapa Sit',
      meditationType: 'Ajapa',
      durationMinutes: 5,
    },
  ],
};

const linkedCustomPlay: CustomPlay = {
  id: 'custom-play-1',
  name: 'Recorded Vipassana',
  meditationType: 'Vipassana',
  durationMinutes: 20,
  startSound: 'Temple Bell',
  endSound: 'Gong',
  mediaAssetId: 'media-vipassana-sit-20',
  recordingLabel: 'Vipassana Sit (20 min)',
  favorite: false,
  createdAt: '2026-03-24T08:00:00.000Z',
  updatedAt: '2026-03-24T08:00:00.000Z',
};

describe('playlistRuntime', () => {
  it('resolves linked recording metadata when building runtime items', () => {
    const result = buildPlaylistRuntimeItems(basePlaylist, [linkedCustomPlay]);
    expect('items' in result).toBe(true);
    if (!('items' in result)) {
      return;
    }

    expect(result.items[0]).toMatchObject({
      id: 'item-1',
      title: 'Recorded Vipassana',
      meditationType: 'Vipassana',
      customPlayId: 'custom-play-1',
      customPlayName: 'Recorded Vipassana',
      customPlayRecordingLabel: 'Vipassana Sit (20 min)',
      mediaAssetId: 'media-vipassana-sit-20',
      mediaLabel: 'Vipassana Sit (20 min)',
      mediaFilePath: '/media/custom-plays/vipassana-sit-20.mp3',
      startSound: 'Temple Bell',
      endSound: 'Gong',
    });
  });

  it('fails fast when a linked recording cannot be resolved', () => {
    expect(buildPlaylistRuntimeItems(basePlaylist, [])).toEqual({
      reason: 'playlist item unavailable',
    });
  });

  it('tracks remaining runtime and inserts a gap between items', () => {
    const run = buildActivePlaylistRun(basePlaylist, [linkedCustomPlay], Date.parse('2026-03-24T10:00:00.000Z'));
    expect(run).not.toBeNull();
    if (!run) {
      return;
    }

    expect(getPlaylistRunCurrentItem(run)).toMatchObject({
      id: 'item-1',
      customPlayId: 'custom-play-1',
    });
    expect(computePlaylistRunRemainingSeconds(run)).toBe(1510);

    const gapRun = completePlaylistRunCurrentSegment(run, Date.parse('2026-03-24T10:20:00.000Z'));
    expect(gapRun).not.toBeNull();
    if (!gapRun) {
      return;
    }

    expect(gapRun.currentIndex).toBe(1);
    expect(gapRun.currentSegment).toMatchObject({
      phase: 'gap',
      remainingSeconds: 10,
    });
    expect(gapRun.completedItems).toBe(1);
    expect(gapRun.completedDurationSeconds).toBe(1200);
    expect(computePlaylistRunRemainingSeconds(gapRun)).toBe(310);

    const resumedItemRun = completePlaylistRunCurrentSegment(gapRun, Date.parse('2026-03-24T10:20:10.000Z'));
    expect(resumedItemRun).not.toBeNull();
    if (!resumedItemRun) {
      return;
    }

    expect(resumedItemRun.currentIndex).toBe(1);
    expect(resumedItemRun.currentSegment).toMatchObject({
      phase: 'item',
      remainingSeconds: 300,
    });
  });
});
