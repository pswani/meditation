import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildSankalpaCollectionUrl,
  buildSankalpaDetailEndpoint,
  buildSankalpaDetailUrl,
  listSankalpasFromApi,
  persistSankalpasToApi,
  SANKALPAS_COLLECTION_ENDPOINT,
} from './sankalpaApi';

const SANKALPAS_STORAGE_KEY = 'meditation.sankalpas.v1';

describe('sankalpa api boundary', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exposes stable sankalpa endpoint contracts', () => {
    expect(SANKALPAS_COLLECTION_ENDPOINT).toBe('/api/sankalpas');
    expect(buildSankalpaDetailEndpoint('goal-1')).toBe('/api/sankalpas/goal-1');
    expect(buildSankalpaCollectionUrl()).toBe('/api/sankalpas');
    expect(buildSankalpaDetailUrl('goal-1', 'http://192.168.1.25:8080/api')).toBe('http://192.168.1.25:8080/api/sankalpas/goal-1');
  });

  it('persists and lists sankalpas through api boundary', () => {
    const sankalpas = [
      {
        id: 'goal-1',
        goalType: 'duration-based' as const,
        targetValue: 120,
        days: 7,
        createdAt: '2026-03-24T08:00:00.000Z',
      },
    ];

    persistSankalpasToApi(sankalpas);
    expect(listSankalpasFromApi()).toEqual(sankalpas);
  });

  it('returns normalized sankalpas through api list boundary', () => {
    localStorage.setItem(
      SANKALPAS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'goal-valid',
          goalType: 'session-count-based',
          targetValue: 5,
          days: 10,
          meditationType: 'Vipassana',
          timeOfDayBucket: 'morning',
          createdAt: '2026-03-24T08:00:00.000Z',
        },
        {
          id: 'goal-invalid',
          goalType: 'session-count-based',
          targetValue: 2.5,
          days: 0,
          meditationType: 'Breathwork',
          timeOfDayBucket: 'late-night',
          createdAt: 'invalid-date',
        },
      ])
    );

    expect(listSankalpasFromApi()).toEqual([
      {
        id: 'goal-valid',
        goalType: 'session-count-based',
        targetValue: 5,
        days: 10,
        meditationType: 'Vipassana',
        timeOfDayBucket: 'morning',
        createdAt: '2026-03-24T08:00:00.000Z',
      },
    ]);
  });

  it('returns an empty list for malformed persisted payloads through api boundary', () => {
    localStorage.setItem(SANKALPAS_STORAGE_KEY, '{bad-json');
    expect(listSankalpasFromApi()).toEqual([]);

    localStorage.setItem(SANKALPAS_STORAGE_KEY, JSON.stringify({ id: 'goal-1' }));
    expect(listSankalpasFromApi()).toEqual([]);
  });
});
