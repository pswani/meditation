import type { ActiveCustomPlayRun } from '../../types/customPlay';
import type { ActivePlaylistRun } from '../../types/playlist';
import type { ActiveSession } from '../../types/timer';
import {
  DEFAULT_END_SOUND_LABEL,
  DEFAULT_INTERVAL_SOUND_LABEL,
  DEFAULT_START_SOUND_LABEL,
  normalizeTimerSoundLabel,
} from '../timerSound';
import {
  ACTIVE_CUSTOM_PLAY_RUN_STATE_KEY,
  ACTIVE_PLAYLIST_RUN_STATE_KEY,
  ACTIVE_TIMER_STATE_KEY,
  isActiveCustomPlayRun,
  isActivePlaylistRun,
  isActiveSession,
  isFiniteInteger,
  isFiniteNonNegativeNumber,
  isMeditationType,
  isObjectRecord,
  isValidIsoDate,
  normalizePlaylistItem,
} from './shared';

interface StoredActivePlaylistRunState {
  readonly activePlaylistRun: ActivePlaylistRun;
  readonly isPaused: boolean;
}

function normalizeLegacyActivePlaylistRunState(value: Record<string, unknown>): StoredActivePlaylistRunState | null {
  if (!isObjectRecord(value.activePlaylistRun) || typeof value.isPaused !== 'boolean') {
    return null;
  }

  const candidate = value.activePlaylistRun as Record<string, unknown>;
  if (
    typeof candidate.runId !== 'string' ||
    typeof candidate.playlistId !== 'string' ||
    typeof candidate.playlistName !== 'string' ||
    !isValidIsoDate(candidate.runStartedAt) ||
    !Array.isArray(candidate.items) ||
    !isFiniteInteger(candidate.currentIndex) ||
    !isValidIsoDate(candidate.currentItemStartedAt) ||
    !isFiniteInteger(candidate.currentItemStartedAtMs) ||
    !isFiniteNonNegativeNumber(candidate.currentItemRemainingSeconds) ||
    !isFiniteInteger(candidate.currentItemEndAtMs) ||
    !isFiniteNonNegativeNumber(candidate.completedItems) ||
    !isFiniteNonNegativeNumber(candidate.completedDurationSeconds) ||
    !isFiniteNonNegativeNumber(candidate.totalIntendedDurationSeconds)
  ) {
    return null;
  }

  const items = candidate.items
    .map(normalizePlaylistItem)
    .filter((entry): entry is ActivePlaylistRun['items'][number] => entry !== null)
    .map((item) => ({
      ...item,
      startSound: 'None',
      endSound: 'None',
    }));
  if (items.length === 0 || candidate.currentIndex < 0 || candidate.currentIndex >= items.length) {
    return null;
  }

  const currentItem = items[candidate.currentIndex]!;
  const durationSeconds = Math.round(currentItem.durationMinutes * 60);

  return {
    activePlaylistRun: {
      runId: candidate.runId,
      playlistId: candidate.playlistId,
      playlistName: candidate.playlistName,
      runStartedAt: candidate.runStartedAt,
      items,
      smallGapSeconds: 0,
      currentIndex: candidate.currentIndex,
      currentSegment: {
        phase: 'item',
        startedAt: candidate.currentItemStartedAt,
        startedAtMs: candidate.currentItemStartedAtMs,
        elapsedSeconds: Math.max(0, durationSeconds - candidate.currentItemRemainingSeconds),
        remainingSeconds: candidate.currentItemRemainingSeconds,
        endAtMs: candidate.currentItemEndAtMs,
      },
      completedItems: candidate.completedItems,
      completedDurationSeconds: candidate.completedDurationSeconds,
      totalIntendedDurationSeconds: candidate.totalIntendedDurationSeconds,
    },
    isPaused: value.isPaused,
  };
}

function normalizePersistedActiveSession(session: ActiveSession): ActiveSession {
  return {
    ...session,
    startSound: normalizeTimerSoundLabel(session.startSound, DEFAULT_START_SOUND_LABEL),
    endSound: normalizeTimerSoundLabel(session.endSound, DEFAULT_END_SOUND_LABEL),
    intervalSound: normalizeTimerSoundLabel(session.intervalSound, DEFAULT_INTERVAL_SOUND_LABEL),
    lastResumedAtMs: session.isPaused ? null : session.lastResumedAtMs,
  };
}

function normalizeLegacyActiveTimerState(activeSession: Record<string, unknown>, isPaused: boolean): ActiveSession | null {
  const intendedDurationSeconds =
    typeof activeSession.intendedDurationSeconds === 'number' && activeSession.intendedDurationSeconds > 0
      ? activeSession.intendedDurationSeconds
      : null;
  const endAtMs = typeof activeSession.endAtMs === 'number' && Number.isInteger(activeSession.endAtMs) ? activeSession.endAtMs : null;
  const storedRemainingSeconds =
    typeof activeSession.remainingSeconds === 'number' && activeSession.remainingSeconds >= 0
      ? activeSession.remainingSeconds
      : null;

  if (
    !isValidIsoDate(activeSession.startedAt) ||
    typeof activeSession.startedAtMs !== 'number' ||
    !Number.isInteger(activeSession.startedAtMs) ||
    intendedDurationSeconds === null ||
    endAtMs === null ||
    storedRemainingSeconds === null ||
    !isMeditationType(activeSession.meditationType) ||
    typeof activeSession.startSound !== 'string' ||
    typeof activeSession.endSound !== 'string' ||
    typeof activeSession.intervalEnabled !== 'boolean' ||
    typeof activeSession.intervalMinutes !== 'number' ||
    activeSession.intervalMinutes < 0 ||
    typeof activeSession.intervalSound !== 'string'
  ) {
    return null;
  }

  const nowMs = Date.now();
  const elapsedSeconds = isPaused
    ? Math.max(0, intendedDurationSeconds - storedRemainingSeconds)
    : Math.max(0, intendedDurationSeconds - Math.max(0, Math.ceil((endAtMs - nowMs) / 1000)));

  return {
    startedAt: activeSession.startedAt,
    startedAtMs: activeSession.startedAtMs,
    timerMode: 'fixed',
    intendedDurationSeconds,
    elapsedSeconds,
    isPaused,
    lastResumedAtMs: isPaused ? null : nowMs,
    meditationType: activeSession.meditationType,
    startSound: normalizeTimerSoundLabel(activeSession.startSound, DEFAULT_START_SOUND_LABEL),
    endSound: normalizeTimerSoundLabel(activeSession.endSound, DEFAULT_END_SOUND_LABEL),
    intervalEnabled: activeSession.intervalEnabled,
    intervalMinutes: activeSession.intervalMinutes,
    intervalSound: normalizeTimerSoundLabel(activeSession.intervalSound, DEFAULT_INTERVAL_SOUND_LABEL),
  };
}

export function loadActiveTimerState(): ActiveSession | null {
  const raw = localStorage.getItem(ACTIVE_TIMER_STATE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isActiveSession(parsed)) {
      return normalizePersistedActiveSession(parsed);
    }

    if (!isObjectRecord(parsed) || !isObjectRecord(parsed.activeSession)) {
      return null;
    }

    if (isActiveSession(parsed.activeSession)) {
      return normalizePersistedActiveSession(parsed.activeSession);
    }

    if (typeof parsed.isPaused !== 'boolean') {
      return null;
    }

    return normalizeLegacyActiveTimerState(parsed.activeSession as Record<string, unknown>, parsed.isPaused);
  } catch {
    return null;
  }
}

export function saveActiveTimerState(activeSession: ActiveSession | null): void {
  if (!activeSession) {
    localStorage.removeItem(ACTIVE_TIMER_STATE_KEY);
    return;
  }

  localStorage.setItem(ACTIVE_TIMER_STATE_KEY, JSON.stringify(normalizePersistedActiveSession(activeSession)));
}

export function loadActiveCustomPlayRunState(): ActiveCustomPlayRun | null {
  const raw = localStorage.getItem(ACTIVE_CUSTOM_PLAY_RUN_STATE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isActiveCustomPlayRun(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveActiveCustomPlayRunState(activeCustomPlayRun: ActiveCustomPlayRun | null): void {
  if (!activeCustomPlayRun) {
    localStorage.removeItem(ACTIVE_CUSTOM_PLAY_RUN_STATE_KEY);
    return;
  }

  localStorage.setItem(ACTIVE_CUSTOM_PLAY_RUN_STATE_KEY, JSON.stringify(activeCustomPlayRun));
}

export function loadActivePlaylistRunState(): StoredActivePlaylistRunState | null {
  const raw = localStorage.getItem(ACTIVE_PLAYLIST_RUN_STATE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObjectRecord(parsed)) {
      return null;
    }

    const candidate = parsed as Record<string, unknown>;
    if (!isActivePlaylistRun(candidate.activePlaylistRun) || typeof candidate.isPaused !== 'boolean') {
      return normalizeLegacyActivePlaylistRunState(candidate);
    }

    return {
      activePlaylistRun: candidate.activePlaylistRun,
      isPaused: candidate.isPaused,
    };
  } catch {
    return null;
  }
}

export function saveActivePlaylistRunState(activePlaylistRun: ActivePlaylistRun | null, isPaused: boolean): void {
  if (!activePlaylistRun) {
    localStorage.removeItem(ACTIVE_PLAYLIST_RUN_STATE_KEY);
    return;
  }

  localStorage.setItem(
    ACTIVE_PLAYLIST_RUN_STATE_KEY,
    JSON.stringify({
      activePlaylistRun,
      isPaused,
    } satisfies StoredActivePlaylistRunState)
  );
}
