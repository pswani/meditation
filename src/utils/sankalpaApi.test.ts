import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildSankalpaCollectionUrl,
  deleteSankalpaFromApi,
  buildSankalpaDetailPath,
  buildSankalpaDetailEndpoint,
  buildSankalpaDetailUrl,
  listSankalpaProgressFromApi,
  persistSankalpaToApi,
  SANKALPAS_COLLECTION_ENDPOINT,
} from './sankalpaApi';
import { SYNC_QUEUED_AT_HEADER } from './syncApi';

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
              title: 'Morning Count Goal',
              goalType: 'session-count-based',
              targetValue: 5,
              days: 10,
              meditationType: 'Vipassana',
              timeOfDayBucket: 'morning',
              createdAt: '2026-03-24T08:00:00.000Z',
              archived: false,
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
          title: 'Morning Count Goal',
          goalType: 'session-count-based',
          targetValue: 5,
          days: 10,
          qualifyingDaysPerWeek: undefined,
          meditationType: 'Vipassana',
          timeOfDayBucket: 'morning',
          observanceLabel: undefined,
          observanceRecords: undefined,
          createdAt: '2026-03-24T08:00:00.000Z',
          archived: false,
        },
        status: 'active',
        deadlineAt: '2026-04-03T08:00:00.000Z',
        matchedSessionCount: 2,
        matchedDurationSeconds: 1800,
        targetSessionCount: 5,
        targetDurationSeconds: 0,
        metRecurringWeekCount: 0,
        targetRecurringWeekCount: 0,
        recurringWeeks: [],
        matchedObservanceCount: 0,
        missedObservanceCount: 0,
        pendingObservanceCount: 0,
        targetObservanceCount: 0,
        observanceDays: [],
        progressRatio: 0.4,
      },
    ]);
  });

  it('persists a sankalpa through the detail api boundary', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        goal: {
          id: 'goal-1',
          title: 'Morning Vipassana Focus',
          goalType: 'duration-based',
          targetValue: 12.5,
          days: 7,
          createdAt: '2026-03-24T08:00:00.000Z',
          archived: true,
        },
        status: 'archived',
        deadlineAt: '2026-03-31T08:00:00.000Z',
        matchedSessionCount: 0,
        matchedDurationSeconds: 0,
        targetSessionCount: 0,
        targetDurationSeconds: 750,
        progressRatio: 0,
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      persistSankalpaToApi(
        {
          id: 'goal-1',
          title: 'Morning Vipassana Focus',
          goalType: 'duration-based',
          targetValue: 12.5,
          days: 7,
          createdAt: '2026-03-24T08:00:00.000Z',
          archived: true,
        },
        {
          timeZone: 'America/Chicago',
          syncQueuedAt: '2026-03-27T10:15:00.000Z',
        }
      )
    ).resolves.toMatchObject({
      goal: {
        id: 'goal-1',
        title: 'Morning Vipassana Focus',
        targetValue: 12.5,
        archived: true,
      },
      targetDurationSeconds: 750,
      metRecurringWeekCount: 0,
      targetRecurringWeekCount: 0,
      recurringWeeks: [],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/sankalpas/goal-1?timeZone=America%2FChicago',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          [SYNC_QUEUED_AT_HEADER]: '2026-03-27T10:15:00.000Z',
        }),
      })
    );
  });

  it('deletes sankalpas through the detail api boundary', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      deleteSankalpaFromApi('goal-1', {
        timeZone: 'America/Chicago',
        syncQueuedAt: '2026-03-27T10:20:00.000Z',
      })
    ).resolves.toEqual({
      outcome: 'deleted',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/sankalpas/goal-1?timeZone=America%2FChicago',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          [SYNC_QUEUED_AT_HEADER]: '2026-03-27T10:20:00.000Z',
        }),
      })
    );
  });

  it('returns the current sankalpa when a stale delete loses reconciliation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          outcome: 'stale',
          currentRecord: {
            goal: {
              id: 'goal-1',
              title: 'Morning Vipassana Focus',
              goalType: 'duration-based',
              targetValue: 12.5,
              days: 7,
              createdAt: '2026-03-24T08:00:00.000Z',
              archived: true,
            },
            status: 'archived',
            deadlineAt: '2026-03-31T08:00:00.000Z',
            matchedSessionCount: 0,
            matchedDurationSeconds: 0,
            targetSessionCount: 0,
            targetDurationSeconds: 750,
            progressRatio: 0,
          },
        }),
      })
    );

    await expect(deleteSankalpaFromApi('goal-1')).resolves.toEqual({
      outcome: 'stale',
      currentSankalpa: {
        goal: {
          id: 'goal-1',
          title: 'Morning Vipassana Focus',
          goalType: 'duration-based',
          targetValue: 12.5,
          days: 7,
          qualifyingDaysPerWeek: undefined,
          meditationType: undefined,
          timeOfDayBucket: undefined,
          observanceLabel: undefined,
          observanceRecords: undefined,
          createdAt: '2026-03-24T08:00:00.000Z',
          archived: true,
        },
        status: 'archived',
        deadlineAt: '2026-03-31T08:00:00.000Z',
        matchedSessionCount: 0,
        matchedDurationSeconds: 0,
        targetSessionCount: 0,
        targetDurationSeconds: 750,
        metRecurringWeekCount: 0,
        targetRecurringWeekCount: 0,
        recurringWeeks: [],
        matchedObservanceCount: 0,
        missedObservanceCount: 0,
        pendingObservanceCount: 0,
        targetObservanceCount: 0,
        observanceDays: [],
        progressRatio: 0,
      },
    });
  });

  it('normalizes observance-based sankalpas from the api', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          {
            goal: {
              id: 'goal-observance',
              title: 'Meal before 7 PM for 3 days',
              goalType: 'observance-based',
              targetValue: 3,
              days: 3,
              observanceLabel: 'Meal before 7 PM',
              observanceRecords: [
                { date: '2026-04-05', status: 'observed' },
                { date: '2026-04-06', status: 'missed' },
              ],
              createdAt: '2026-04-05T12:00:00.000Z',
              archived: false,
            },
            status: 'active',
            deadlineAt: '2026-04-07T23:59:59.999Z',
            matchedSessionCount: 0,
            matchedDurationSeconds: 0,
            targetSessionCount: 0,
            targetDurationSeconds: 0,
            matchedObservanceCount: 1,
            missedObservanceCount: 1,
            pendingObservanceCount: 1,
            targetObservanceCount: 3,
            observanceDays: [
              { date: '2026-04-05', status: 'observed', isFuture: false },
              { date: '2026-04-06', status: 'missed', isFuture: false },
              { date: '2026-04-07', status: 'pending', isFuture: false },
            ],
            progressRatio: 1 / 3,
          },
        ],
      })
    );

    await expect(listSankalpaProgressFromApi()).resolves.toEqual([
      {
        goal: {
          id: 'goal-observance',
          title: 'Meal before 7 PM for 3 days',
          goalType: 'observance-based',
          targetValue: 3,
          days: 3,
          qualifyingDaysPerWeek: undefined,
          meditationType: undefined,
          timeOfDayBucket: undefined,
          observanceLabel: 'Meal before 7 PM',
          observanceRecords: [
            { date: '2026-04-05', status: 'observed' },
            { date: '2026-04-06', status: 'missed' },
          ],
          createdAt: '2026-04-05T12:00:00.000Z',
          archived: false,
        },
        status: 'active',
        deadlineAt: '2026-04-07T23:59:59.999Z',
        matchedSessionCount: 0,
        matchedDurationSeconds: 0,
        targetSessionCount: 0,
        targetDurationSeconds: 0,
        metRecurringWeekCount: 0,
        targetRecurringWeekCount: 0,
        recurringWeeks: [],
        matchedObservanceCount: 1,
        missedObservanceCount: 1,
        pendingObservanceCount: 1,
        targetObservanceCount: 3,
        observanceDays: [
          { date: '2026-04-05', status: 'observed', isFuture: false },
          { date: '2026-04-06', status: 'missed', isFuture: false },
          { date: '2026-04-07', status: 'pending', isFuture: false },
        ],
        progressRatio: 1 / 3,
      },
    ]);
  });

  it('normalizes recurring cadence sankalpas from the api', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          {
            goal: {
              id: 'goal-recurring',
              goalType: 'duration-based',
              targetValue: 15,
              days: 28,
              qualifyingDaysPerWeek: 5,
              meditationType: 'Tratak',
              createdAt: '2026-04-05T12:00:00.000Z',
              archived: false,
            },
            status: 'active',
            deadlineAt: '2026-05-02T23:59:59.999Z',
            matchedSessionCount: 12,
            matchedDurationSeconds: 10800,
            targetSessionCount: 0,
            targetDurationSeconds: 0,
            metRecurringWeekCount: 2,
            targetRecurringWeekCount: 4,
            recurringWeeks: [
              { weekIndex: 1, startDate: '2026-04-05', endDate: '2026-04-11', qualifyingDayCount: 5, requiredQualifyingDayCount: 5, status: 'met' },
              { weekIndex: 2, startDate: '2026-04-12', endDate: '2026-04-18', qualifyingDayCount: 4, requiredQualifyingDayCount: 5, status: 'active' },
            ],
            progressRatio: 0.5,
          },
        ],
      })
    );

    await expect(listSankalpaProgressFromApi()).resolves.toEqual([
      {
        goal: {
          id: 'goal-recurring',
          goalType: 'duration-based',
          targetValue: 15,
          days: 28,
          qualifyingDaysPerWeek: 5,
          meditationType: 'Tratak',
          timeOfDayBucket: undefined,
          observanceLabel: undefined,
          observanceRecords: undefined,
          createdAt: '2026-04-05T12:00:00.000Z',
          archived: false,
        },
        status: 'active',
        deadlineAt: '2026-05-02T23:59:59.999Z',
        matchedSessionCount: 12,
        matchedDurationSeconds: 10800,
        targetSessionCount: 0,
        targetDurationSeconds: 0,
        metRecurringWeekCount: 2,
        targetRecurringWeekCount: 4,
        recurringWeeks: [
          { weekIndex: 1, startDate: '2026-04-05', endDate: '2026-04-11', qualifyingDayCount: 5, requiredQualifyingDayCount: 5, status: 'met' },
          { weekIndex: 2, startDate: '2026-04-12', endDate: '2026-04-18', qualifyingDayCount: 4, requiredQualifyingDayCount: 5, status: 'active' },
        ],
        matchedObservanceCount: 0,
        missedObservanceCount: 0,
        pendingObservanceCount: 0,
        targetObservanceCount: 0,
        observanceDays: [],
        progressRatio: 0.5,
      },
    ]);
  });
});
