import type { Playlist, PlaylistDraft, PlaylistDraftItem, PlaylistValidationResult } from '../types/playlist';

function arePlaylistItemsEqual(left: Playlist['items'][number], right: Playlist['items'][number]): boolean {
  return (
    left.id === right.id &&
    left.title === right.title &&
    left.meditationType === right.meditationType &&
    left.durationMinutes === right.durationMinutes &&
    left.customPlayId === right.customPlayId
  );
}

export const MAX_PLAYLIST_SMALL_GAP_SECONDS = 30;

export function derivePlaylistItemTitle(item: Pick<PlaylistDraftItem, 'title' | 'meditationType' | 'customPlayId'>): string {
  const trimmedTitle = item.title.trim();
  if (trimmedTitle) {
    return trimmedTitle;
  }

  if (item.customPlayId) {
    return 'Linked custom play';
  }

  return item.meditationType || 'Meditation item';
}

export function createPlaylistDraftItem(overrides?: Partial<PlaylistDraftItem>): PlaylistDraftItem {
  return {
    id: `playlist-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    meditationType: '',
    durationMinutes: 10,
    customPlayId: '',
    ...overrides,
  };
}

export function createInitialPlaylistDraft(): PlaylistDraft {
  return {
    name: '',
    smallGapSeconds: 0,
    items: [createPlaylistDraftItem()],
  };
}

export function movePlaylistDraftItem(items: PlaylistDraftItem[], index: number, direction: -1 | 1): PlaylistDraftItem[] {
  const nextIndex = index + direction;
  if (index < 0 || index >= items.length || nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const reordered = [...items];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(nextIndex, 0, moved);
  return reordered;
}

export function computePlaylistTotalDurationMinutes(items: readonly Pick<PlaylistDraftItem, 'durationMinutes'>[]): number {
  return items.reduce((total, item) => total + (Number.isFinite(item.durationMinutes) ? item.durationMinutes : 0), 0);
}

export function computePlaylistGapTotalSeconds(itemCount: number, smallGapSeconds: number): number {
  if (!Number.isInteger(itemCount) || itemCount <= 1 || !Number.isInteger(smallGapSeconds) || smallGapSeconds <= 0) {
    return 0;
  }

  return (itemCount - 1) * smallGapSeconds;
}

export function computePlaylistTotalDurationSeconds(
  items: readonly Pick<PlaylistDraftItem, 'durationMinutes'>[],
  smallGapSeconds: number
): number {
  return Math.round(computePlaylistTotalDurationMinutes(items) * 60) + computePlaylistGapTotalSeconds(items.length, smallGapSeconds);
}

export function validatePlaylistDraft(draft: PlaylistDraft): PlaylistValidationResult {
  const errors: PlaylistValidationResult['errors'] = {
    itemErrors: {},
  };

  if (!draft.name.trim()) {
    errors.name = 'Playlist name is required.';
  }

  if (!Number.isInteger(draft.smallGapSeconds) || draft.smallGapSeconds < 0 || draft.smallGapSeconds > MAX_PLAYLIST_SMALL_GAP_SECONDS) {
    errors.smallGapSeconds = `Small gap must be between 0 and ${MAX_PLAYLIST_SMALL_GAP_SECONDS} seconds.`;
  }

  if (draft.items.length === 0) {
    errors.items = 'Playlist must contain at least 1 item.';
  }

  for (const item of draft.items) {
    const itemError: { meditationType?: string; durationMinutes?: string; customPlayId?: string } = {};

    if (!item.meditationType) {
      itemError.meditationType = 'Meditation type is required.';
    }

    if (Number.isNaN(item.durationMinutes) || item.durationMinutes <= 0) {
      itemError.durationMinutes = 'Duration must be greater than 0.';
    }

    if (itemError.meditationType || itemError.durationMinutes) {
      errors.itemErrors[item.id] = itemError;
    }
  }

  return {
    isValid: !errors.name && !errors.smallGapSeconds && !errors.items && Object.keys(errors.itemErrors).length === 0,
    errors,
  };
}

export function createPlaylist(draft: PlaylistDraft, now: Date): Playlist {
  const timestamp = now.toISOString();

  return {
    id: `playlist-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    name: draft.name.trim(),
    smallGapSeconds: draft.smallGapSeconds,
    items: draft.items.map((item) => ({
      id: item.id,
      title: derivePlaylistItemTitle(item),
      meditationType: item.meditationType as Playlist['items'][number]['meditationType'],
      durationMinutes: item.durationMinutes,
      customPlayId: item.customPlayId || undefined,
    })),
    favorite: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updatePlaylist(existing: Playlist, draft: PlaylistDraft, now: Date): Playlist {
  return {
    ...existing,
    name: draft.name.trim(),
    smallGapSeconds: draft.smallGapSeconds,
    items: draft.items.map((item) => ({
      id: item.id,
      title: derivePlaylistItemTitle(item),
      meditationType: item.meditationType as Playlist['items'][number]['meditationType'],
      durationMinutes: item.durationMinutes,
      customPlayId: item.customPlayId || undefined,
    })),
    updatedAt: now.toISOString(),
  };
}

export function arePlaylistsEqual(left: Playlist, right: Playlist): boolean {
  if (
    left.id !== right.id ||
    left.name !== right.name ||
    left.smallGapSeconds !== right.smallGapSeconds ||
    left.favorite !== right.favorite ||
    left.createdAt !== right.createdAt ||
    left.updatedAt !== right.updatedAt ||
    left.items.length !== right.items.length
  ) {
    return false;
  }

  return left.items.every((item, index) => arePlaylistItemsEqual(item, right.items[index]!));
}
