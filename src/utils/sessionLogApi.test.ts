import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildManualSessionLogCreateUrl,
  buildSessionLogDetailUrl,
  buildSessionLogsCollectionUrl,
  createManualSessionLogInApi,
  listSessionLogsFromApi,
  MANUAL_SESSION_LOGS_CREATE_ENDPOINT,
  persistSessionLogToApi,
  SESSION_LOGS_COLLECTION_ENDPOINT,
} from './sessionLogApi';
import { SYNC_QUEUED_AT_HEADER } from './syncApi';

describe('session log api boundary', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads session logs and preserves recency ordering', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: 'log-older',
            startedAt: '2026-03-26T10:00:00.000Z',
            endedAt: '2026-03-26T10:10:00.000Z',
            meditationType: 'Vipassana',
            intendedDurationSeconds: 600,
            completedDurationSeconds: 600,
            status: 'completed',
            source: 'auto log',
            startSound: 'None',
            endSound: 'Temple Bell',
            intervalEnabled: false,
            intervalMinutes: 0,
            intervalSound: 'None',
          },
          {
            id: 'log-newer',
            startedAt: '2026-03-26T11:00:00.000Z',
            endedAt: '2026-03-26T11:20:00.000Z',
            meditationType: 'Ajapa',
            intendedDurationSeconds: 1200,
            completedDurationSeconds: 900,
            status: 'ended early',
            source: 'manual log',
            startSound: 'None',
            endSound: 'None',
            intervalEnabled: false,
            intervalMinutes: 0,
            intervalSound: 'None',
          },
        ],
      })
    );

    const sessionLogs = await listSessionLogsFromApi();

    expect(SESSION_LOGS_COLLECTION_ENDPOINT).toBe('/api/session-logs');
    expect(buildSessionLogsCollectionUrl()).toBe('/api/session-logs');
    expect(buildSessionLogDetailUrl('log-1', 'http://192.168.1.25:8080/api')).toBe('http://192.168.1.25:8080/api/session-logs/log-1');
    expect(sessionLogs.map((entry) => entry.id)).toEqual(['log-newer', 'log-older']);
  });

  it('persists a session log through the detail endpoint', async () => {
    const sessionLog = {
      id: 'log-1',
      startedAt: '2026-03-26T10:00:00.000Z',
      endedAt: '2026-03-26T10:20:00.000Z',
      meditationType: 'Vipassana' as const,
      intendedDurationSeconds: 1200,
      completedDurationSeconds: 1200,
      status: 'completed' as const,
      source: 'auto log' as const,
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: false,
      intervalMinutes: 0,
      intervalSound: 'None',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => sessionLog,
    });

    vi.stubGlobal('fetch', fetchMock);

    const saved = await persistSessionLogToApi(sessionLog, {
      syncQueuedAt: '2026-03-27T10:15:00.000Z',
    });

    expect(saved.id).toBe('log-1');
    expect(saved.completedDurationSeconds).toBe(1200);
    expect(saved.status).toBe('completed');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/session-logs/log-1',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          [SYNC_QUEUED_AT_HEADER]: '2026-03-27T10:15:00.000Z',
        }),
      })
    );
  });

  it('creates a manual session log through the dedicated create endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'manual-log-1',
        startedAt: '2026-03-26T11:00:00.000Z',
        endedAt: '2026-03-26T11:20:00.000Z',
        meditationType: 'Vipassana',
        intendedDurationSeconds: 1200,
        completedDurationSeconds: 1200,
        status: 'completed',
        source: 'manual log',
        startSound: 'None',
        endSound: 'None',
        intervalEnabled: false,
        intervalMinutes: 0,
        intervalSound: 'None',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const saved = await createManualSessionLogInApi({
      durationMinutes: 20,
      meditationType: 'Vipassana',
      sessionTimestamp: '2026-03-26T11:20:00.000Z',
    });

    expect(MANUAL_SESSION_LOGS_CREATE_ENDPOINT).toBe('/api/session-logs/manual');
    expect(buildManualSessionLogCreateUrl()).toBe('/api/session-logs/manual');
    expect(saved.id).toBe('manual-log-1');
    expect(saved.source).toBe('manual log');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/session-logs/manual',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});
