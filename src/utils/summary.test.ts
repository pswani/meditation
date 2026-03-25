import { describe, expect, it } from 'vitest';
import type { SessionLog } from '../types/sessionLog';
import {
  deriveDateInputForDayOffset,
  deriveDateRangeFromInputs,
  deriveOverallSummary,
  deriveSummaryBySource,
  deriveSummaryByTimeOfDay,
  deriveSummaryByType,
  deriveSummarySnapshot,
  filterSessionLogsByDateRange,
} from './summary';

const sampleLogs: SessionLog[] = [
  {
    id: '1',
    startedAt: new Date(2026, 2, 10, 6, 0, 0, 0).toISOString(),
    endedAt: new Date(2026, 2, 10, 6, 20, 0, 0).toISOString(),
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
    startedAt: new Date(2026, 2, 20, 14, 0, 0, 0).toISOString(),
    endedAt: new Date(2026, 2, 20, 14, 15, 0, 0).toISOString(),
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
    startedAt: new Date(2026, 2, 23, 19, 0, 0, 0).toISOString(),
    endedAt: new Date(2026, 2, 23, 19, 10, 0, 0).toISOString(),
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
  {
    id: '4',
    startedAt: new Date(2026, 2, 24, 7, 0, 0, 0).toISOString(),
    endedAt: new Date(2026, 2, 24, 7, 30, 0, 0).toISOString(),
    meditationType: 'Sahaj',
    intendedDurationSeconds: 1800,
    completedDurationSeconds: 1800,
    status: 'completed',
    source: 'manual log',
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

    expect(summary.totalSessionLogs).toBe(4);
    expect(summary.completedSessionLogs).toBe(3);
    expect(summary.endedEarlySessionLogs).toBe(1);
    expect(summary.totalDurationSeconds).toBe(4500);
    expect(summary.averageDurationSeconds).toBe(1125);
    expect(summary.autoLogs).toBe(2);
    expect(summary.manualLogs).toBe(2);
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
    expect(byType.find((row) => row.meditationType === 'Sahaj')).toMatchObject({
      sessionLogs: 1,
      totalDurationSeconds: 1800,
    });
  });

  it('derives by-source summary rows with stable source coverage', () => {
    const bySource = deriveSummaryBySource(sampleLogs);

    expect(bySource).toHaveLength(2);
    expect(bySource[0]).toMatchObject({
      source: 'auto log',
      sessionLogs: 2,
      completedSessionLogs: 2,
      endedEarlySessionLogs: 0,
      totalDurationSeconds: 1800,
    });
    expect(bySource[1]).toMatchObject({
      source: 'manual log',
      sessionLogs: 2,
      completedSessionLogs: 1,
      endedEarlySessionLogs: 1,
      totalDurationSeconds: 2700,
    });
  });

  it('derives by-time-of-day summary rows with stable bucket coverage', () => {
    const byTimeOfDay = deriveSummaryByTimeOfDay(sampleLogs);

    expect(byTimeOfDay).toHaveLength(4);
    expect(byTimeOfDay.find((entry) => entry.timeOfDayBucket === 'morning')).toMatchObject({
      sessionLogs: 2,
      completedSessionLogs: 2,
      endedEarlySessionLogs: 0,
      totalDurationSeconds: 3000,
    });
    expect(byTimeOfDay.find((entry) => entry.timeOfDayBucket === 'afternoon')).toMatchObject({
      sessionLogs: 1,
      completedSessionLogs: 0,
      endedEarlySessionLogs: 1,
      totalDurationSeconds: 900,
    });
    expect(byTimeOfDay.find((entry) => entry.timeOfDayBucket === 'evening')).toMatchObject({
      sessionLogs: 1,
      completedSessionLogs: 1,
      endedEarlySessionLogs: 0,
      totalDurationSeconds: 600,
    });
    expect(byTimeOfDay.find((entry) => entry.timeOfDayBucket === 'night')).toMatchObject({
      sessionLogs: 0,
      completedSessionLogs: 0,
      endedEarlySessionLogs: 0,
      totalDurationSeconds: 0,
    });
  });

  it('derives an input-safe date range and rejects malformed ranges', () => {
    expect(deriveDateRangeFromInputs('2026-03-20', '2026-03-24')).toMatchObject({
      startAtMs: expect.any(Number),
      endAtMs: expect.any(Number),
    });
    expect(deriveDateRangeFromInputs('2026-03-24', '2026-03-20')).toBeNull();
    expect(deriveDateRangeFromInputs('bad-input', '2026-03-20')).toBeNull();
  });

  it('filters summary logs by inclusive date-range boundaries', () => {
    const range = deriveDateRangeFromInputs('2026-03-20', '2026-03-23');
    if (!range) {
      throw new Error('Expected valid range');
    }

    const filtered = filterSessionLogsByDateRange(sampleLogs, range);
    expect(filtered.map((entry) => entry.id)).toEqual(['2', '3']);
  });

  it('keeps same-day boundary entries and preserves by-type counts for the filtered range', () => {
    const boundaryLogs: SessionLog[] = [
      {
        id: 'start-boundary',
        startedAt: new Date(2026, 2, 20, 0, 0, 0, 0).toISOString(),
        endedAt: new Date(2026, 2, 20, 0, 5, 0, 0).toISOString(),
        meditationType: 'Vipassana',
        intendedDurationSeconds: 300,
        completedDurationSeconds: 300,
        status: 'completed',
        source: 'auto log',
        startSound: 'None',
        endSound: 'None',
        intervalEnabled: false,
        intervalMinutes: 0,
        intervalSound: 'None',
      },
      {
        id: 'end-boundary',
        startedAt: new Date(2026, 2, 20, 23, 45, 0, 0).toISOString(),
        endedAt: new Date(2026, 2, 20, 23, 59, 59, 999).toISOString(),
        meditationType: 'Ajapa',
        intendedDurationSeconds: 900,
        completedDurationSeconds: 900,
        status: 'completed',
        source: 'manual log',
        startSound: 'None',
        endSound: 'None',
        intervalEnabled: false,
        intervalMinutes: 0,
        intervalSound: 'None',
      },
      {
        id: 'outside-range',
        startedAt: new Date(2026, 2, 21, 0, 0, 0, 0).toISOString(),
        endedAt: new Date(2026, 2, 21, 0, 10, 0, 0).toISOString(),
        meditationType: 'Kriya',
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

    const range = deriveDateRangeFromInputs('2026-03-20', '2026-03-20');
    if (!range) {
      throw new Error('Expected valid range');
    }

    const snapshot = deriveSummarySnapshot(boundaryLogs, range);
    expect(snapshot.sessionLogs.map((entry) => entry.id)).toEqual(['start-boundary', 'end-boundary']);
    expect(snapshot.byTypeSummary.find((entry) => entry.meditationType === 'Vipassana')).toMatchObject({ sessionLogs: 1 });
    expect(snapshot.byTypeSummary.find((entry) => entry.meditationType === 'Ajapa')).toMatchObject({ sessionLogs: 1 });
    expect(snapshot.byTypeSummary.find((entry) => entry.meditationType === 'Kriya')).toMatchObject({ sessionLogs: 0 });
  });

  it('builds a summary snapshot from a filtered date-range subset', () => {
    const range = deriveDateRangeFromInputs('2026-03-20', '2026-03-24');
    if (!range) {
      throw new Error('Expected valid range');
    }

    const snapshot = deriveSummarySnapshot(sampleLogs, range);
    expect(snapshot.sessionLogs.map((entry) => entry.id)).toEqual(['2', '3', '4']);
    expect(snapshot.overallSummary.totalSessionLogs).toBe(3);
    expect(snapshot.overallSummary.totalDurationSeconds).toBe(3300);
    expect(snapshot.byTypeSummary.find((entry) => entry.meditationType === 'Vipassana')?.sessionLogs).toBe(1);
    expect(snapshot.bySourceSummary.find((entry) => entry.source === 'manual log')).toMatchObject({
      sessionLogs: 2,
      totalDurationSeconds: 2700,
    });
    expect(snapshot.byTimeOfDaySummary.find((entry) => entry.timeOfDayBucket === 'morning')).toMatchObject({
      sessionLogs: 1,
      totalDurationSeconds: 1800,
    });
  });

  it('ignores session logs with unparseable endedAt values during snapshot derivation', () => {
    const logsWithMalformedDate: SessionLog[] = [
      ...sampleLogs,
      {
        ...sampleLogs[0],
        id: 'bad-date',
        endedAt: 'not-a-date',
      },
    ];

    const snapshot = deriveSummarySnapshot(logsWithMalformedDate, { startAtMs: null, endAtMs: null });
    expect(snapshot.sessionLogs.map((entry) => entry.id)).toEqual(['1', '2', '3', '4']);
  });

  it('derives date-input labels from day offsets', () => {
    const now = new Date(2026, 2, 24, 10, 0, 0, 0);
    expect(deriveDateInputForDayOffset(now, 0)).toBe('2026-03-24');
    expect(deriveDateInputForDayOffset(now, -7)).toBe('2026-03-17');
  });
});
