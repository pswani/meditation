import type { SessionLog, SessionLogSource } from '../types/sessionLog';
import type { TimeOfDayBucket } from '../types/sankalpa';
import type { MeditationType } from '../types/timer';
import { meditationTypes, sessionLogSources } from '../types/referenceData';
import { getTimeOfDayBucket, timeOfDayBuckets } from './sankalpa';

export interface OverallSummary {
  readonly totalSessionLogs: number;
  readonly completedSessionLogs: number;
  readonly endedEarlySessionLogs: number;
  readonly totalDurationSeconds: number;
  readonly averageDurationSeconds: number;
  readonly autoLogs: number;
  readonly manualLogs: number;
}

export interface SummaryByType {
  readonly meditationType: MeditationType;
  readonly sessionLogs: number;
  readonly totalDurationSeconds: number;
}

export interface SummaryBySource {
  readonly source: SessionLogSource;
  readonly sessionLogs: number;
  readonly completedSessionLogs: number;
  readonly endedEarlySessionLogs: number;
  readonly totalDurationSeconds: number;
}

export interface SummaryByTimeOfDay {
  readonly timeOfDayBucket: TimeOfDayBucket;
  readonly sessionLogs: number;
  readonly completedSessionLogs: number;
  readonly endedEarlySessionLogs: number;
  readonly totalDurationSeconds: number;
}

export interface SummaryDateRange {
  readonly startAtMs: number | null;
  readonly endAtMs: number | null;
}

export interface SummarySnapshot {
  readonly sessionLogs: readonly SessionLog[];
  readonly overallSummary: OverallSummary;
  readonly byTypeSummary: SummaryByType[];
  readonly bySourceSummary: SummaryBySource[];
  readonly byTimeOfDaySummary: SummaryByTimeOfDay[];
}

export interface SummarySnapshotData {
  readonly overallSummary: OverallSummary;
  readonly byTypeSummary: SummaryByType[];
  readonly bySourceSummary: SummaryBySource[];
  readonly byTimeOfDaySummary: SummaryByTimeOfDay[];
}

function parseDateInputToBoundaryMs(value: string, boundary: 'start' | 'end'): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const boundaryDate =
    boundary === 'start'
      ? new Date(year, month - 1, day, 0, 0, 0, 0)
      : new Date(year, month - 1, day, 23, 59, 59, 999);

  const isSameLocalDate =
    boundaryDate.getFullYear() === year && boundaryDate.getMonth() === month - 1 && boundaryDate.getDate() === day;
  if (!isSameLocalDate) {
    return null;
  }

  return boundaryDate.getTime();
}

export function deriveDateRangeFromInputs(startDateInput: string, endDateInput: string): SummaryDateRange | null {
  const trimmedStart = startDateInput.trim();
  const trimmedEnd = endDateInput.trim();

  const startAtMs = trimmedStart ? parseDateInputToBoundaryMs(trimmedStart, 'start') : null;
  const endAtMs = trimmedEnd ? parseDateInputToBoundaryMs(trimmedEnd, 'end') : null;

  if ((trimmedStart && startAtMs === null) || (trimmedEnd && endAtMs === null)) {
    return null;
  }

  if (startAtMs !== null && endAtMs !== null && startAtMs > endAtMs) {
    return null;
  }

  return {
    startAtMs,
    endAtMs,
  };
}

export function deriveDateInputForDayOffset(now: Date, dayOffset: number): string {
  const anchor = new Date(now);
  anchor.setDate(anchor.getDate() + dayOffset);
  const year = anchor.getFullYear();
  const month = `${anchor.getMonth() + 1}`.padStart(2, '0');
  const day = `${anchor.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function filterSessionLogsByDateRange(sessionLogs: readonly SessionLog[], dateRange: SummaryDateRange): SessionLog[] {
  const lowerBound = dateRange.startAtMs ?? Number.NEGATIVE_INFINITY;
  const upperBound = dateRange.endAtMs ?? Number.POSITIVE_INFINITY;

  if (lowerBound > upperBound) {
    return [];
  }

  return sessionLogs.filter((entry) => {
    const endedAtMs = Date.parse(entry.endedAt);
    return Number.isFinite(endedAtMs) && endedAtMs >= lowerBound && endedAtMs <= upperBound;
  });
}

export function deriveOverallSummary(sessionLogs: readonly SessionLog[]): OverallSummary {
  if (sessionLogs.length === 0) {
    return {
      totalSessionLogs: 0,
      completedSessionLogs: 0,
      endedEarlySessionLogs: 0,
      totalDurationSeconds: 0,
      averageDurationSeconds: 0,
      autoLogs: 0,
      manualLogs: 0,
    };
  }

  const completedSessionLogs = sessionLogs.filter((entry) => entry.status === 'completed').length;
  const endedEarlySessionLogs = sessionLogs.length - completedSessionLogs;
  const totalDurationSeconds = sessionLogs.reduce((total, entry) => total + entry.completedDurationSeconds, 0);
  const autoLogs = sessionLogs.filter((entry) => entry.source === 'auto log').length;
  const manualLogs = sessionLogs.length - autoLogs;

  return {
    totalSessionLogs: sessionLogs.length,
    completedSessionLogs,
    endedEarlySessionLogs,
    totalDurationSeconds,
    averageDurationSeconds: Math.round(totalDurationSeconds / sessionLogs.length),
    autoLogs,
    manualLogs,
  };
}

export function deriveSummaryByType(sessionLogs: readonly SessionLog[]): SummaryByType[] {
  return meditationTypes.map((meditationType) => {
    const typeLogs = sessionLogs.filter((entry) => entry.meditationType === meditationType);
    return {
      meditationType,
      sessionLogs: typeLogs.length,
      totalDurationSeconds: typeLogs.reduce((total, entry) => total + entry.completedDurationSeconds, 0),
    };
  });
}

export function deriveSummaryBySource(sessionLogs: readonly SessionLog[]): SummaryBySource[] {
  return sessionLogSources.map((source) => {
    const sourceLogs = sessionLogs.filter((entry) => entry.source === source);
    const completedSessionLogs = sourceLogs.filter((entry) => entry.status === 'completed').length;

    return {
      source,
      sessionLogs: sourceLogs.length,
      completedSessionLogs,
      endedEarlySessionLogs: sourceLogs.length - completedSessionLogs,
      totalDurationSeconds: sourceLogs.reduce((total, entry) => total + entry.completedDurationSeconds, 0),
    };
  });
}

export function deriveSummaryByTimeOfDay(sessionLogs: readonly SessionLog[]): SummaryByTimeOfDay[] {
  return timeOfDayBuckets.map((timeOfDayBucket) => {
    const bucketLogs = sessionLogs.filter((entry) => getTimeOfDayBucket(new Date(entry.endedAt)) === timeOfDayBucket);
    const completedSessionLogs = bucketLogs.filter((entry) => entry.status === 'completed').length;

    return {
      timeOfDayBucket,
      sessionLogs: bucketLogs.length,
      completedSessionLogs,
      endedEarlySessionLogs: bucketLogs.length - completedSessionLogs,
      totalDurationSeconds: bucketLogs.reduce((total, entry) => total + entry.completedDurationSeconds, 0),
    };
  });
}

export function deriveSummarySnapshot(
  sessionLogs: readonly SessionLog[],
  dateRange: SummaryDateRange = { startAtMs: null, endAtMs: null }
): SummarySnapshot {
  const filteredLogs = filterSessionLogsByDateRange(sessionLogs, dateRange);

  return {
    sessionLogs: filteredLogs,
    ...deriveSummarySnapshotData(filteredLogs),
  };
}

export function deriveSummarySnapshotData(sessionLogs: readonly SessionLog[]): SummarySnapshotData {
  return {
    overallSummary: deriveOverallSummary(sessionLogs),
    byTypeSummary: deriveSummaryByType(sessionLogs),
    bySourceSummary: deriveSummaryBySource(sessionLogs),
    byTimeOfDaySummary: deriveSummaryByTimeOfDay(sessionLogs),
  };
}
