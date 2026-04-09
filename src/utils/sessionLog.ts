import type { ActiveCustomPlayRun } from '../types/customPlay';
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
      : status === 'ended early'
        ? Math.max(0, Math.min(intendedDurationSeconds, normalizedCompletedDurationSeconds))
        : Math.max(0, normalizedCompletedDurationSeconds);

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

interface BuildCustomPlayLogEntryParams {
  readonly customPlayRun: ActiveCustomPlayRun;
  readonly endedAt: Date;
  readonly completedDurationSeconds: number;
  readonly status: SessionLogStatus;
}

export function buildCustomPlayLogEntry({
  customPlayRun,
  endedAt,
  completedDurationSeconds,
  status,
}: BuildCustomPlayLogEntryParams): SessionLog {
  const intendedDurationSeconds = customPlayRun.durationSeconds;
  const safeCompletedDurationSeconds = Math.max(0, Math.min(intendedDurationSeconds, Math.round(completedDurationSeconds)));
  const statusToken = status === 'completed' ? 'completed' : 'ended-early';

  return {
    id: `custom-play-log-${customPlayRun.runId}-${statusToken}`,
    startedAt: customPlayRun.startedAt,
    endedAt: endedAt.toISOString(),
    meditationType: customPlayRun.meditationType,
    timerMode: 'fixed',
    intendedDurationSeconds,
    completedDurationSeconds: safeCompletedDurationSeconds,
    status,
    source: 'auto log',
    startSound: customPlayRun.startSound,
    endSound: customPlayRun.endSound,
    intervalEnabled: false,
    intervalMinutes: 0,
    intervalSound: 'None',
    customPlayId: customPlayRun.customPlayId,
    customPlayName: customPlayRun.customPlayName,
    customPlayRecordingLabel: customPlayRun.recordingLabel || undefined,
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
  const roundedMinutes = Number(minutes.toFixed(1));

  if (Number.isInteger(roundedMinutes)) {
    return `${roundedMinutes} min`;
  }

  return `${roundedMinutes.toFixed(1)} min`;
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
    left.playlistItemCount === right.playlistItemCount &&
    left.customPlayId === right.customPlayId &&
    left.customPlayName === right.customPlayName &&
    left.customPlayRecordingLabel === right.customPlayRecordingLabel
  );
}

export function formatPlannedDurationLabel(entry: Pick<SessionLog, 'timerMode' | 'intendedDurationSeconds'>): string {
  if (entry.timerMode === 'open-ended' || entry.intendedDurationSeconds === null) {
    return 'Open-ended';
  }

  return formatDurationLabel(entry.intendedDurationSeconds);
}
