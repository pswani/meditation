import type { CustomPlay } from '../types/customPlay';
import type {
  ActivePlaylistRun,
  ActivePlaylistRunGapSegment,
  ActivePlaylistRunItem,
  ActivePlaylistRunItemSegment,
  Playlist,
} from '../types/playlist';
import { resolveCustomPlayMediaAsset } from './customPlay';

function buildItemSegment(durationSeconds: number, nowMs: number, elapsedSeconds = 0): ActivePlaylistRunItemSegment {
  const clampedElapsedSeconds = Math.max(0, Math.min(durationSeconds, Math.round(elapsedSeconds)));
  const remainingSeconds = Math.max(0, durationSeconds - clampedElapsedSeconds);

  return {
    phase: 'item',
    startedAt: new Date(nowMs - clampedElapsedSeconds * 1000).toISOString(),
    startedAtMs: nowMs - clampedElapsedSeconds * 1000,
    elapsedSeconds: clampedElapsedSeconds,
    remainingSeconds,
    endAtMs: nowMs + remainingSeconds * 1000,
  };
}

function buildGapSegment(durationSeconds: number, nowMs: number): ActivePlaylistRunGapSegment {
  return {
    phase: 'gap',
    startedAt: new Date(nowMs).toISOString(),
    startedAtMs: nowMs,
    remainingSeconds: durationSeconds,
    endAtMs: nowMs + durationSeconds * 1000,
  };
}

export function isAudioBackedPlaylistItem(item: ActivePlaylistRunItem | Playlist['items'][number]): boolean {
  return typeof item.customPlayId === 'string' && item.customPlayId.length > 0;
}

export function getPlaylistItemDurationSeconds(item: Pick<ActivePlaylistRunItem, 'durationMinutes'>): number {
  return Math.round(item.durationMinutes * 60);
}

export function buildPlaylistRuntimeItems(
  playlist: Playlist,
  customPlays: readonly CustomPlay[]
): { readonly items: readonly ActivePlaylistRunItem[] } | { readonly reason: 'playlist item unavailable' } {
  const runtimeItems: ActivePlaylistRunItem[] = [];

  for (const item of playlist.items) {
    if (!item.customPlayId) {
      runtimeItems.push({
        id: item.id,
        title: item.title,
        meditationType: item.meditationType,
        durationMinutes: item.durationMinutes,
        startSound: 'None',
        endSound: 'None',
      });
      continue;
    }

    const customPlay = customPlays.find((entry) => entry.id === item.customPlayId);
    if (!customPlay) {
      return { reason: 'playlist item unavailable' };
    }

    const mediaAsset = resolveCustomPlayMediaAsset(customPlay.mediaAssetId);
    if (!mediaAsset) {
      return { reason: 'playlist item unavailable' };
    }

    runtimeItems.push({
      id: item.id,
      title: item.title || customPlay.name,
      meditationType: customPlay.meditationType,
      durationMinutes: Math.round(mediaAsset.durationSeconds / 60),
      customPlayId: customPlay.id,
      customPlayName: customPlay.name,
      customPlayRecordingLabel: customPlay.recordingLabel || undefined,
      mediaAssetId: mediaAsset.id,
      mediaLabel: mediaAsset.label,
      mediaFilePath: mediaAsset.filePath,
      startSound: customPlay.startSound,
      endSound: customPlay.endSound,
    });
  }

  return {
    items: runtimeItems,
  };
}

export function buildActivePlaylistRun(
  playlist: Playlist,
  customPlays: readonly CustomPlay[],
  nowMs: number
): ActivePlaylistRun | null {
  const runtimeItemsResult = buildPlaylistRuntimeItems(playlist, customPlays);
  if ('reason' in runtimeItemsResult) {
    return null;
  }

  const firstItem = runtimeItemsResult.items[0];
  if (!firstItem) {
    return null;
  }

  return {
    runId: `${playlist.id}-${nowMs}`,
    playlistId: playlist.id,
    playlistName: playlist.name,
    runStartedAt: new Date(nowMs).toISOString(),
    items: runtimeItemsResult.items,
    smallGapSeconds: playlist.smallGapSeconds,
    currentIndex: 0,
    currentSegment: buildItemSegment(getPlaylistItemDurationSeconds(firstItem), nowMs),
    completedItems: 0,
    completedDurationSeconds: 0,
    totalIntendedDurationSeconds: runtimeItemsResult.items.reduce(
      (total, item) => total + getPlaylistItemDurationSeconds(item),
      0
    ),
  };
}

export function getPlaylistRunCurrentItem(activePlaylistRun: ActivePlaylistRun | null): ActivePlaylistRunItem | null {
  if (!activePlaylistRun) {
    return null;
  }

  return activePlaylistRun.items[activePlaylistRun.currentIndex] ?? null;
}

export function getPlaylistRunUpcomingItem(activePlaylistRun: ActivePlaylistRun | null): ActivePlaylistRunItem | null {
  if (!activePlaylistRun) {
    return null;
  }

  const offset = activePlaylistRun.currentSegment.phase === 'gap' ? 0 : 1;
  return activePlaylistRun.items[activePlaylistRun.currentIndex + offset] ?? null;
}

export function computePlaylistRunRemainingSeconds(activePlaylistRun: ActivePlaylistRun): number {
  const currentItem = getPlaylistRunCurrentItem(activePlaylistRun);
  const futureItems = activePlaylistRun.items.slice(activePlaylistRun.currentIndex + 1);
  const futureItemSeconds = futureItems.reduce((total, item) => total + getPlaylistItemDurationSeconds(item), 0);
  const futureGapCount = futureItems.length;
  const currentGapRemainder = activePlaylistRun.currentSegment.phase === 'gap' ? activePlaylistRun.currentSegment.remainingSeconds : 0;
  const currentItemRemainder =
    activePlaylistRun.currentSegment.phase === 'item'
      ? activePlaylistRun.currentSegment.remainingSeconds
      : currentItem
      ? getPlaylistItemDurationSeconds(currentItem)
      : 0;

  return (
    currentItemRemainder +
    currentGapRemainder +
    futureItemSeconds +
    futureGapCount * activePlaylistRun.smallGapSeconds
  );
}

export function pausePlaylistRun(activePlaylistRun: ActivePlaylistRun, nowMs: number): ActivePlaylistRun {
  if (activePlaylistRun.currentSegment.phase === 'gap') {
    const remainingSeconds = Math.max(0, Math.ceil((activePlaylistRun.currentSegment.endAtMs - nowMs) / 1000));
    return {
      ...activePlaylistRun,
      currentSegment: {
        ...activePlaylistRun.currentSegment,
        remainingSeconds,
        endAtMs: nowMs + remainingSeconds * 1000,
      },
    };
  }

  const currentItem = getPlaylistRunCurrentItem(activePlaylistRun);
  if (!currentItem) {
    return activePlaylistRun;
  }

  const durationSeconds = getPlaylistItemDurationSeconds(currentItem);
  const elapsedSeconds = isAudioBackedPlaylistItem(currentItem)
    ? activePlaylistRun.currentSegment.elapsedSeconds
    : Math.max(0, durationSeconds - Math.ceil((activePlaylistRun.currentSegment.endAtMs - nowMs) / 1000));

  return {
    ...activePlaylistRun,
    currentSegment: buildItemSegment(durationSeconds, nowMs, elapsedSeconds),
  };
}

export function resumePlaylistRun(activePlaylistRun: ActivePlaylistRun, nowMs: number): ActivePlaylistRun {
  if (activePlaylistRun.currentSegment.phase === 'gap') {
    return {
      ...activePlaylistRun,
      currentSegment: buildGapSegment(activePlaylistRun.currentSegment.remainingSeconds, nowMs),
    };
  }

  const currentItem = getPlaylistRunCurrentItem(activePlaylistRun);
  if (!currentItem) {
    return activePlaylistRun;
  }

  return {
    ...activePlaylistRun,
    currentSegment: buildItemSegment(
      getPlaylistItemDurationSeconds(currentItem),
      nowMs,
      activePlaylistRun.currentSegment.elapsedSeconds
    ),
  };
}

export function updatePlaylistRunTimedProgress(activePlaylistRun: ActivePlaylistRun, nowMs: number): ActivePlaylistRun {
  if (activePlaylistRun.currentSegment.phase !== 'item') {
    return activePlaylistRun;
  }

  const currentItem = getPlaylistRunCurrentItem(activePlaylistRun);
  if (!currentItem || isAudioBackedPlaylistItem(currentItem)) {
    return activePlaylistRun;
  }

  const remainingSeconds = Math.max(0, Math.ceil((activePlaylistRun.currentSegment.endAtMs - nowMs) / 1000));
  const durationSeconds = getPlaylistItemDurationSeconds(currentItem);
  if (remainingSeconds === activePlaylistRun.currentSegment.remainingSeconds) {
    return activePlaylistRun;
  }

  return {
    ...activePlaylistRun,
    currentSegment: {
      ...activePlaylistRun.currentSegment,
      remainingSeconds,
      elapsedSeconds: durationSeconds - remainingSeconds,
    },
  };
}

export function updatePlaylistRunAudioProgress(activePlaylistRun: ActivePlaylistRun, currentPositionSeconds: number): ActivePlaylistRun {
  if (activePlaylistRun.currentSegment.phase !== 'item') {
    return activePlaylistRun;
  }

  const currentItem = getPlaylistRunCurrentItem(activePlaylistRun);
  if (!currentItem || !isAudioBackedPlaylistItem(currentItem)) {
    return activePlaylistRun;
  }

  const durationSeconds = getPlaylistItemDurationSeconds(currentItem);
  const elapsedSeconds = Math.max(0, Math.min(durationSeconds, Math.round(currentPositionSeconds)));
  if (elapsedSeconds === activePlaylistRun.currentSegment.elapsedSeconds) {
    return activePlaylistRun;
  }

  return {
    ...activePlaylistRun,
    currentSegment: {
      ...activePlaylistRun.currentSegment,
      elapsedSeconds,
      remainingSeconds: Math.max(0, durationSeconds - elapsedSeconds),
    },
  };
}

export function completePlaylistRunCurrentSegment(activePlaylistRun: ActivePlaylistRun, nowMs: number): ActivePlaylistRun | null {
  if (activePlaylistRun.currentSegment.phase === 'gap') {
    const currentItem = getPlaylistRunCurrentItem(activePlaylistRun);
    if (!currentItem) {
      return null;
    }

    return {
      ...activePlaylistRun,
      currentSegment: buildItemSegment(getPlaylistItemDurationSeconds(currentItem), nowMs),
    };
  }

  const currentItem = getPlaylistRunCurrentItem(activePlaylistRun);
  if (!currentItem) {
    return null;
  }

  const completedItems = activePlaylistRun.completedItems + 1;
  const completedDurationSeconds =
    activePlaylistRun.completedDurationSeconds + getPlaylistItemDurationSeconds(currentItem);
  const nextIndex = activePlaylistRun.currentIndex + 1;

  if (nextIndex >= activePlaylistRun.items.length) {
    return null;
  }

  if (activePlaylistRun.smallGapSeconds > 0) {
    return {
      ...activePlaylistRun,
      currentIndex: nextIndex,
      currentSegment: buildGapSegment(activePlaylistRun.smallGapSeconds, nowMs),
      completedItems,
      completedDurationSeconds,
    };
  }

  const nextItem = activePlaylistRun.items[nextIndex];
  if (!nextItem) {
    return null;
  }

  return {
    ...activePlaylistRun,
    currentIndex: nextIndex,
    currentSegment: buildItemSegment(getPlaylistItemDurationSeconds(nextItem), nowMs),
    completedItems,
    completedDurationSeconds,
  };
}

export function buildCompletedPlaylistRunSnapshot(activePlaylistRun: ActivePlaylistRun): ActivePlaylistRun {
  const currentItem = getPlaylistRunCurrentItem(activePlaylistRun);
  if (!currentItem || activePlaylistRun.currentSegment.phase !== 'item') {
    return activePlaylistRun;
  }

  return {
    ...activePlaylistRun,
    currentSegment: {
      ...activePlaylistRun.currentSegment,
      elapsedSeconds: getPlaylistItemDurationSeconds(currentItem),
      remainingSeconds: 0,
    },
  };
}
