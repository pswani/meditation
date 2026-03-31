import type { SessionLog, SessionLogStatus } from '../types/sessionLog';
import type { ActiveSession } from '../types/timer';

interface BuildSessionLogParams {
  readonly session: ActiveSession;
  readonly endedAt: Date;
  readonly completedDurationSeconds: number;
  readonly status: SessionLogStatus;
}

export function buildAutoLogEntry({ session, endedAt, completedDurationSeconds, status }: BuildSessionLogParams): SessionLog {
  const intendedDurationSeconds = session.timerMode === 'fixed' ? session.intendedDurationSeconds : null;
  const normalizedCompletedDurationSeconds = Number.isFinite(completedDurationSeconds) ? completedDurationSeconds : 0;
  const safeCompletedDurationSeconds =
    intendedDurationSeconds === null
      ? Math.max(0, normalizedCompletedDurationSeconds)
      : Math.max(0, Math.min(intendedDurationSeconds, normalizedCompletedDurationSeconds));

  return {
    id: `${session.startedAtMs}-${session.timerMode}-${status}-${Math.round(safeCompletedDurationSeconds)}`,
    startedAt: session.startedAt,
    endedAt: endedAt.toISOString(),
    meditationType: session.meditationType,
    timerMode: session.timerMode,
    intendedDurationSeconds,
    completedDurationSeconds: safeCompletedDurationSeconds,
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
  if (totalSeconds <= 0) {
    return '0 min';
  }

  if (totalSeconds < 60) {
    return '< 1 min';
  }

  const minutes = totalSeconds / 60;

  if (Number.isInteger(minutes)) {
    return `${minutes} min`;
  }

  return `${minutes.toFixed(1)} min`;
}

export function areSessionLogsEqual(left: SessionLog, right: SessionLog): boolean {
  return (
    left.id === right.id &&
    left.startedAt === right.startedAt &&
    left.endedAt === right.endedAt &&
    left.meditationType === right.meditationType &&
    left.timerMode === right.timerMode &&
    left.intendedDurationSeconds === right.intendedDurationSeconds &&
    left.completedDurationSeconds === right.completedDurationSeconds &&
    left.status === right.status &&
    left.source === right.source &&
    left.startSound === right.startSound &&
    left.endSound === right.endSound &&
    left.intervalEnabled === right.intervalEnabled &&
    left.intervalMinutes === right.intervalMinutes &&
    left.intervalSound === right.intervalSound &&
    left.playlistId === right.playlistId &&
    left.playlistName === right.playlistName &&
    left.playlistRunId === right.playlistRunId &&
    left.playlistRunStartedAt === right.playlistRunStartedAt &&
    left.playlistItemPosition === right.playlistItemPosition &&
    left.playlistItemCount === right.playlistItemCount
  );
}

export function formatPlannedDurationLabel(entry: Pick<SessionLog, 'timerMode' | 'intendedDurationSeconds'>): string {
  if (entry.timerMode === 'open-ended' || entry.intendedDurationSeconds === null) {
    return 'Open-ended';
  }

  return formatDurationLabel(entry.intendedDurationSeconds);
}
