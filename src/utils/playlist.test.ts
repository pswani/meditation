import { describe, expect, it } from 'vitest';
import {
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
});
