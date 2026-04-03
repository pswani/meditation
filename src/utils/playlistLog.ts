import type { ActivePlaylistRunItem } from '../types/playlist';
import type { SessionLog, SessionLogStatus } from '../types/sessionLog';

interface BuildPlaylistItemLogEntryParams {
  readonly playlistId: string;
  readonly playlistName: string;
  readonly playlistRunId: string;
  readonly playlistRunStartedAt: string;
  readonly item: ActivePlaylistRunItem;
  readonly itemPosition: number;
  readonly itemCount: number;
  readonly startedAt: string;
  readonly endedAt: Date;
  readonly completedDurationSeconds: number;
  readonly status: SessionLogStatus;
}

export function buildPlaylistItemLogEntry({
  playlistId,
  playlistName,
  playlistRunId,
  playlistRunStartedAt,
  item,
  itemPosition,
  itemCount,
  startedAt,
  endedAt,
  completedDurationSeconds,
  status,
}: BuildPlaylistItemLogEntryParams): SessionLog {
  const intendedDurationSeconds = Math.round(item.durationMinutes * 60);
  const statusToken = status === 'completed' ? 'completed' : 'ended-early';
  const runToken = playlistRunId.slice(-24);

  return {
    id: `plog-${runToken}-${itemPosition}-${endedAt.getTime()}-${statusToken}`,
    startedAt,
    endedAt: endedAt.toISOString(),
    meditationType: item.meditationType,
    timerMode: 'fixed',
    intendedDurationSeconds,
    completedDurationSeconds: Math.max(0, Math.min(intendedDurationSeconds, completedDurationSeconds)),
    status,
    source: 'auto log',
    startSound: item.startSound,
    endSound: item.endSound,
    intervalEnabled: false,
    intervalMinutes: 0,
    intervalSound: 'None',
    playlistId,
    playlistName,
    playlistRunId,
    playlistRunStartedAt,
    playlistItemPosition: itemPosition,
    playlistItemCount: itemCount,
    customPlayId: item.customPlayId,
    customPlayName: item.customPlayName,
    customPlayRecordingLabel: item.customPlayRecordingLabel,
  };
}
