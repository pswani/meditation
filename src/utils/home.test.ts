import { describe, expect, it } from 'vitest';
import type { SessionLog } from '../types/sessionLog';
import { deriveTodayActivitySummary, selectRecentSessionLogs } from './home';

const baseLog: SessionLog = {
  id: 'log-1',
  startedAt: '2026-03-24T11:00:00.000Z',
  endedAt: '2026-03-24T11:20:00.000Z',
  meditationType: 'Vipassana',
  intendedDurationSeconds: 1200,
  completedDurationSeconds: 1200,
  status: 'completed',
  source: 'auto log',
  startSound: 'None',
  endSound: 'Temple Bell',
  intervalEnabled: false,
  intervalMinutes: 0,
  intervalSound: 'None',
};

describe('home helpers', () => {
  it('derives today activity summary from session logs', () => {
    const summary = deriveTodayActivitySummary(
      [
        baseLog,
        {
          ...baseLog,
          id: 'log-2',
          endedAt: '2026-03-24T12:00:00.000Z',
          completedDurationSeconds: 600,
          status: 'ended early',
        },
        {
          ...baseLog,
          id: 'log-3',
          endedAt: '2026-03-23T12:00:00.000Z',
        },
      ],
      new Date('2026-03-24T18:00:00.000Z')
    );

    expect(summary).toEqual({
      sessionLogCount: 2,
      completedCount: 1,
      endedEarlyCount: 1,
      totalDurationSeconds: 1800,
    });
  });

  it('selects recent logs up to a requested limit', () => {
    const logs = [
      baseLog,
      { ...baseLog, id: 'log-2' },
      { ...baseLog, id: 'log-3' },
    ];

    expect(selectRecentSessionLogs(logs, 2).map((entry) => entry.id)).toEqual(['log-1', 'log-2']);
  });
});
