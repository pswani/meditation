import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildSankalpaCollectionUrl,
  buildSankalpaDetailPath,
  buildSankalpaDetailEndpoint,
  buildSankalpaDetailUrl,
  listSankalpaProgressFromApi,
  persistSankalpaToApi,
  SANKALPAS_COLLECTION_ENDPOINT,
} from './sankalpaApi';

describe('sankalpa api boundary', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes stable sankalpa endpoint contracts', () => {
    expect(SANKALPAS_COLLECTION_ENDPOINT).toBe('/api/sankalpas');
    expect(buildSankalpaDetailPath('goal-1')).toBe('/sankalpas/goal-1');
    expect(buildSankalpaDetailEndpoint('goal-1')).toBe('/api/sankalpas/goal-1');
    expect(buildSankalpaCollectionUrl()).toBe('/api/sankalpas');
    expect(buildSankalpaDetailUrl('goal-1', 'http://192.168.1.25:8080/api')).toBe('http://192.168.1.25:8080/api/sankalpas/goal-1');
  });

  it('normalizes sankalpa progress collections from the api', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          {
            goal: {
              id: 'goal-valid',
              goalType: 'session-count-based',
              targetValue: 5,
              days: 10,
              meditationType: 'Vipassana',
              timeOfDayBucket: 'morning',
              createdAt: '2026-03-24T08:00:00.000Z',
            },
            status: 'active',
            deadlineAt: '2026-04-03T08:00:00.000Z',
            matchedSessionCount: 2,
            matchedDurationSeconds: 1800,
            targetSessionCount: 5,
            targetDurationSeconds: 0,
            progressRatio: 0.4,
          },
        ],
      })
    );

    await expect(listSankalpaProgressFromApi({ timeZone: 'America/Chicago' })).resolves.toEqual([
      {
        goal: {
          id: 'goal-valid',
          goalType: 'session-count-based',
          targetValue: 5,
          days: 10,
          meditationType: 'Vipassana',
          timeOfDayBucket: 'morning',
          createdAt: '2026-03-24T08:00:00.000Z',
        },
        status: 'active',
        deadlineAt: '2026-04-03T08:00:00.000Z',
        matchedSessionCount: 2,
        matchedDurationSeconds: 1800,
        targetSessionCount: 5,
        targetDurationSeconds: 0,
        progressRatio: 0.4,
      },
    ]);
  });

  it('persists a sankalpa through the detail api boundary', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          goal: {
            id: 'goal-1',
            goalType: 'duration-based',
            targetValue: 12.5,
            days: 7,
            createdAt: '2026-03-24T08:00:00.000Z',
          },
          status: 'active',
          deadlineAt: '2026-03-31T08:00:00.000Z',
          matchedSessionCount: 0,
          matchedDurationSeconds: 0,
          targetSessionCount: 0,
          targetDurationSeconds: 750,
          progressRatio: 0,
        }),
      })
    );

    await expect(
      persistSankalpaToApi(
        {
          id: 'goal-1',
          goalType: 'duration-based',
          targetValue: 12.5,
          days: 7,
          createdAt: '2026-03-24T08:00:00.000Z',
        },
        { timeZone: 'America/Chicago' }
      )
    ).resolves.toMatchObject({
      goal: {
        id: 'goal-1',
        targetValue: 12.5,
      },
      targetDurationSeconds: 750,
    });
  });
});
