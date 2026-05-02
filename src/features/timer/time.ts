import type { ActiveSession } from '../../types/timer';

export function formatRemainingTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export function getActiveSessionElapsedSeconds(session: ActiveSession, nowMs: number, nowPerformanceMs?: number): number {
  if (session.isPaused || session.lastResumedAtMs === null) {
    return session.elapsedSeconds;
  }

  if (nowPerformanceMs !== undefined && session.lastResumedAtPerformanceMs != null) {
    return session.elapsedSeconds + Math.max(0, Math.floor((nowPerformanceMs - session.lastResumedAtPerformanceMs) / 1000));
  }

  return session.elapsedSeconds + Math.max(0, Math.floor((nowMs - session.lastResumedAtMs) / 1000));
}

export function getActiveSessionElapsedMilliseconds(session: ActiveSession, nowMs: number, nowPerformanceMs?: number): number {
  const baseElapsedMs = session.elapsedSeconds * 1000;
  if (session.isPaused || session.lastResumedAtMs === null) {
    return baseElapsedMs;
  }

  if (nowPerformanceMs !== undefined && session.lastResumedAtPerformanceMs != null) {
    return baseElapsedMs + Math.max(0, nowPerformanceMs - session.lastResumedAtPerformanceMs);
  }

  return baseElapsedMs + Math.max(0, nowMs - session.lastResumedAtMs);
}

export function getActiveSessionRemainingSeconds(session: ActiveSession, nowMs: number, nowPerformanceMs?: number): number | null {
  if (session.intendedDurationSeconds === null) {
    return null;
  }

  return Math.max(0, session.intendedDurationSeconds - getActiveSessionElapsedSeconds(session, nowMs, nowPerformanceMs));
}

export function getActiveSessionClockSeconds(session: ActiveSession, nowMs: number, nowPerformanceMs?: number): number {
  return session.timerMode === 'open-ended'
    ? getActiveSessionElapsedSeconds(session, nowMs, nowPerformanceMs)
    : getActiveSessionRemainingSeconds(session, nowMs, nowPerformanceMs) ?? 0;
}
