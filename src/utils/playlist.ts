import type { Playlist, PlaylistDraft, PlaylistDraftItem, PlaylistValidationResult } from '../types/playlist';

function arePlaylistItemsEqual(left: Playlist['items'][number], right: Playlist['items'][number]): boolean {
  return (
    left.id === right.id &&
    left.meditationType === right.meditationType &&
    left.durationMinutes === right.durationMinutes
  );
}

export function createPlaylistDraftItem(overrides?: Partial<PlaylistDraftItem>): PlaylistDraftItem {
  return {
    id: `playlist-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    meditationType: '',
    durationMinutes: 10,
    ...overrides,
  };
}

export function createInitialPlaylistDraft(): PlaylistDraft {
  return {
    name: '',
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

export function validatePlaylistDraft(draft: PlaylistDraft): PlaylistValidationResult {
  const errors: PlaylistValidationResult['errors'] = {
    itemErrors: {},
  };

  if (!draft.name.trim()) {
    errors.name = 'Playlist name is required.';
  }

  if (draft.items.length === 0) {
    errors.items = 'Playlist must contain at least 1 item.';
  }

  for (const item of draft.items) {
    const itemError: { meditationType?: string; durationMinutes?: string } = {};

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
    isValid: !errors.name && !errors.items && Object.keys(errors.itemErrors).length === 0,
    errors,
  };
}

export function createPlaylist(draft: PlaylistDraft, now: Date): Playlist {
  const timestamp = now.toISOString();

  return {
    id: `playlist-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    name: draft.name.trim(),
    items: draft.items.map((item) => ({
      id: item.id,
      meditationType: item.meditationType as Playlist['items'][number]['meditationType'],
      durationMinutes: item.durationMinutes,
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
    items: draft.items.map((item) => ({
      id: item.id,
      meditationType: item.meditationType as Playlist['items'][number]['meditationType'],
      durationMinutes: item.durationMinutes,
    })),
    updatedAt: now.toISOString(),
  };
}

export function arePlaylistsEqual(left: Playlist, right: Playlist): boolean {
  if (
    left.id !== right.id ||
    left.name !== right.name ||
    left.favorite !== right.favorite ||
    left.createdAt !== right.createdAt ||
    left.updatedAt !== right.updatedAt ||
    left.items.length !== right.items.length
  ) {
    return false;
  }

  return left.items.every((item, index) => arePlaylistItemsEqual(item, right.items[index]!));
}
