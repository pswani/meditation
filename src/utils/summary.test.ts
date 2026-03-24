import { describe, expect, it } from 'vitest';
import type { SessionLog } from '../types/sessionLog';
import { deriveOverallSummary, deriveSummaryByType } from './summary';

const sampleLogs: SessionLog[] = [
  {
    id: '1',
    startedAt: '2026-03-20T05:00:00.000Z',
    endedAt: '2026-03-20T05:20:00.000Z',
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
  },
  {
    id: '2',
    startedAt: '2026-03-21T13:00:00.000Z',
    endedAt: '2026-03-21T13:15:00.000Z',
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
  {
    id: '3',
    startedAt: '2026-03-22T19:00:00.000Z',
    endedAt: '2026-03-22T19:10:00.000Z',
    meditationType: 'Vipassana',
    intendedDurationSeconds: 600,
    completedDurationSeconds: 600,
    status: 'completed',
    source: 'auto log',
    startSound: 'None',
    endSound: 'None',
    intervalEnabled: false,
    intervalMinutes: 0,
    intervalSound: 'None',
  },
];

describe('summary helpers', () => {
  it('derives overall summary metrics from session logs', () => {
    const summary = deriveOverallSummary(sampleLogs);

    expect(summary.totalSessionLogs).toBe(3);
    expect(summary.completedSessionLogs).toBe(2);
    expect(summary.endedEarlySessionLogs).toBe(1);
    expect(summary.totalDurationSeconds).toBe(2700);
    expect(summary.averageDurationSeconds).toBe(900);
    expect(summary.autoLogs).toBe(2);
    expect(summary.manualLogs).toBe(1);
  });

  it('derives by-type summary rows while preserving meditation type coverage', () => {
    const byType = deriveSummaryByType(sampleLogs);

    expect(byType).toHaveLength(5);
    expect(byType.find((row) => row.meditationType === 'Vipassana')).toMatchObject({
      sessionLogs: 2,
      totalDurationSeconds: 1800,
    });
    expect(byType.find((row) => row.meditationType === 'Ajapa')).toMatchObject({
      sessionLogs: 1,
      totalDurationSeconds: 900,
    });
    expect(byType.find((row) => row.meditationType === 'Kriya')).toMatchObject({
      sessionLogs: 0,
      totalDurationSeconds: 0,
    });
  });
});
