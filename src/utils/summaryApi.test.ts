import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSummariesPath, buildSummariesUrl, loadSummaryFromApi, SUMMARIES_COLLECTION_ENDPOINT } from './summaryApi';

describe('summary api boundary', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds stable summary endpoint paths with optional query parameters', () => {
    expect(SUMMARIES_COLLECTION_ENDPOINT).toBe('/api/summaries');
    expect(buildSummariesPath()).toBe('/summaries');
    expect(buildSummariesPath({ startAt: '2026-03-20T00:00:00.000Z', endAt: '2026-03-26T23:59:59.999Z' })).toBe(
      '/summaries?startAt=2026-03-20T00%3A00%3A00.000Z&endAt=2026-03-26T23%3A59%3A59.999Z'
    );
    expect(buildSummariesPath({ timeZone: 'America/Chicago' })).toBe('/summaries?timeZone=America%2FChicago');
    expect(buildSummariesUrl({ startAt: '2026-03-20T00:00:00.000Z' }, 'http://127.0.0.1:8080/api')).toBe(
      'http://127.0.0.1:8080/api/summaries?startAt=2026-03-20T00%3A00%3A00.000Z'
    );
  });

  it('loads and normalizes summary data from the backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          overallSummary: {
            totalSessionLogs: 2,
            completedSessionLogs: 1,
            endedEarlySessionLogs: 1,
            totalDurationSeconds: 1500,
            averageDurationSeconds: 750,
            autoLogs: 1,
            manualLogs: 1,
          },
          byTypeSummary: [
            { meditationType: 'Vipassana', sessionLogs: 1, totalDurationSeconds: 900 },
            { meditationType: 'Ajapa', sessionLogs: 1, totalDurationSeconds: 600 },
            { meditationType: 'Tratak', sessionLogs: 0, totalDurationSeconds: 0 },
            { meditationType: 'Kriya', sessionLogs: 0, totalDurationSeconds: 0 },
            { meditationType: 'Sahaj', sessionLogs: 0, totalDurationSeconds: 0 },
          ],
          bySourceSummary: [
            {
              source: 'auto log',
              sessionLogs: 1,
              completedSessionLogs: 1,
              endedEarlySessionLogs: 0,
              totalDurationSeconds: 900,
            },
            {
              source: 'manual log',
              sessionLogs: 1,
              completedSessionLogs: 0,
              endedEarlySessionLogs: 1,
              totalDurationSeconds: 600,
            },
          ],
          byTimeOfDaySummary: [
            {
              timeOfDayBucket: 'morning',
              sessionLogs: 1,
              completedSessionLogs: 1,
              endedEarlySessionLogs: 0,
              totalDurationSeconds: 900,
            },
            {
              timeOfDayBucket: 'afternoon',
              sessionLogs: 0,
              completedSessionLogs: 0,
              endedEarlySessionLogs: 0,
              totalDurationSeconds: 0,
            },
            {
              timeOfDayBucket: 'evening',
              sessionLogs: 1,
              completedSessionLogs: 0,
              endedEarlySessionLogs: 1,
              totalDurationSeconds: 600,
            },
            {
              timeOfDayBucket: 'night',
              sessionLogs: 0,
              completedSessionLogs: 0,
              endedEarlySessionLogs: 0,
              totalDurationSeconds: 0,
            },
          ],
        }),
      })
    );

    const summary = await loadSummaryFromApi({
      startAt: '2026-03-20T00:00:00.000Z',
      endAt: '2026-03-26T23:59:59.999Z',
    });

    expect(summary.overallSummary.totalSessionLogs).toBe(2);
    expect(summary.byTypeSummary[0]?.meditationType).toBe('Vipassana');
    expect(summary.bySourceSummary[1]?.source).toBe('manual log');
    expect(summary.byTimeOfDaySummary[2]?.timeOfDayBucket).toBe('evening');
  });

  it('rejects invalid summary responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          overallSummary: {
            totalSessionLogs: 1,
          },
          byTypeSummary: [],
          bySourceSummary: [],
          byTimeOfDaySummary: [],
        }),
      })
    );

    await expect(loadSummaryFromApi()).rejects.toThrow('Summary response is invalid.');
  });
});
