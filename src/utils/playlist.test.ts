import { describe, expect, it } from 'vitest';
import {
  arePlaylistsEqual,
  computePlaylistTotalDurationMinutes,
  createInitialPlaylistDraft,
  movePlaylistDraftItem,
  validatePlaylistDraft,
} from './playlist';

describe('playlist helpers', () => {
  it('validates playlist name, item presence, and item fields', () => {
    const result = validatePlaylistDraft({
      name: '',
      items: [
        {
          id: 'item-1',
          meditationType: '',
          durationMinutes: 0,
        },
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.name).toMatch(/required/i);
    expect(result.errors.itemErrors['item-1'].meditationType).toMatch(/required/i);
    expect(result.errors.itemErrors['item-1'].durationMinutes).toMatch(/greater than 0/i);
  });

  it('moves playlist draft items while preserving explicit order', () => {
    const draft = createInitialPlaylistDraft();
    const items = [
      { ...draft.items[0], id: 'a', meditationType: 'Vipassana' as const, durationMinutes: 10 },
      { ...draft.items[0], id: 'b', meditationType: 'Ajapa' as const, durationMinutes: 20 },
      { ...draft.items[0], id: 'c', meditationType: 'Tratak' as const, durationMinutes: 30 },
    ];

    const movedDown = movePlaylistDraftItem(items, 0, 1);
    expect(movedDown.map((item) => item.id)).toEqual(['b', 'a', 'c']);

    const movedUp = movePlaylistDraftItem(movedDown, 2, -1);
    expect(movedUp.map((item) => item.id)).toEqual(['b', 'c', 'a']);
  });

  it('derives total playlist duration from ordered items', () => {
    const total = computePlaylistTotalDurationMinutes([
      { durationMinutes: 10 },
      { durationMinutes: 15 },
      { durationMinutes: 20 },
    ]);

    expect(total).toBe(45);
  });

  it('ignores non-finite durations in derived total', () => {
    const total = computePlaylistTotalDurationMinutes([
      { durationMinutes: 10 },
      { durationMinutes: Number.NaN },
      { durationMinutes: Number.POSITIVE_INFINITY },
      { durationMinutes: 5 },
    ]);

    expect(total).toBe(15);
  });

  it('keeps draft order unchanged when move indices are out of bounds', () => {
    const draft = createInitialPlaylistDraft();
    const items = [
      { ...draft.items[0], id: 'a', meditationType: 'Vipassana' as const, durationMinutes: 10 },
      { ...draft.items[0], id: 'b', meditationType: 'Ajapa' as const, durationMinutes: 20 },
    ];

    expect(movePlaylistDraftItem(items, -1, 1).map((item) => item.id)).toEqual(['a', 'b']);
    expect(movePlaylistDraftItem(items, 1, 1).map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('compares playlists by ordered item content', () => {
    const left = {
      id: 'playlist-1',
      name: 'Morning',
      favorite: false,
      createdAt: '2026-03-24T10:00:00.000Z',
      updatedAt: '2026-03-24T10:10:00.000Z',
      items: [
        { id: 'item-1', meditationType: 'Vipassana' as const, durationMinutes: 10 },
        { id: 'item-2', meditationType: 'Ajapa' as const, durationMinutes: 15 },
      ],
    };

    expect(arePlaylistsEqual(left, { ...left, items: [...left.items] })).toBe(true);
    expect(
      arePlaylistsEqual(left, {
        ...left,
        items: [
          { id: 'item-2', meditationType: 'Ajapa' as const, durationMinutes: 15 },
          { id: 'item-1', meditationType: 'Vipassana' as const, durationMinutes: 10 },
        ],
      })
    ).toBe(false);
  });
});
