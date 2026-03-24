import type { SessionLog, SessionLogStatus } from '../types/sessionLog';
import type { ActiveSession } from '../types/timer';

interface BuildSessionLogParams {
  readonly session: ActiveSession;
  readonly endedAt: Date;
  readonly completedDurationSeconds: number;
  readonly status: SessionLogStatus;
}

export function buildAutoLogEntry({ session, endedAt, completedDurationSeconds, status }: BuildSessionLogParams): SessionLog {
  return {
    id: `${session.startedAtMs}-${status}-${Math.round(completedDurationSeconds)}`,
    startedAt: session.startedAt,
    endedAt: endedAt.toISOString(),
    meditationType: session.meditationType,
    intendedDurationSeconds: session.intendedDurationSeconds,
    completedDurationSeconds: Math.max(0, Math.min(session.intendedDurationSeconds, completedDurationSeconds)),
    status,
    source: 'auto log',
    startSound: session.startSound,
    endSound: session.endSound,
    intervalEnabled: session.intervalEnabled,
    intervalMinutes: session.intervalMinutes,
    intervalSound: session.intervalSound,
  };
}

export function formatDurationLabel(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return '< 1 min';
  }

  const minutes = totalSeconds / 60;

  if (Number.isInteger(minutes)) {
    return `${minutes} min`;
  }

  return `${minutes.toFixed(1)} min`;
}
