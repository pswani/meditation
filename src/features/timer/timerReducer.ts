import { defaultTimerSettings } from './constants';
import { getActiveSessionElapsedMilliseconds, getActiveSessionElapsedSeconds } from './time';
import type { SessionLog } from '../../types/sessionLog';
import type { ActiveSession, TimerOutcome, TimerSettings, TimerValidationResult } from '../../types/timer';
import { buildAutoLogEntry } from '../../utils/sessionLog';
import { normalizeFixedDurationMinutes } from '../../utils/timerSettingsNormalization';
import { validateTimerSettings } from '../../utils/timerValidation';

export interface TimerState {
  readonly settings: TimerSettings;
  readonly activeSession: ActiveSession | null;
  readonly lastOutcome: TimerOutcome | null;
  readonly sessionLogs: readonly SessionLog[];
  readonly validation: TimerValidationResult;
}

export type TimerAction =
  | { type: 'SET_SETTINGS'; payload: TimerSettings }
  | { type: 'REPLACE_SESSION_LOGS'; payload: readonly SessionLog[] }
  | { type: 'START_SESSION'; nowMs: number; settings?: TimerSettings }
  | { type: 'SYNC_TICK'; nowMs: number }
  | { type: 'PAUSE_SESSION'; nowMs: number }
  | { type: 'RESUME_SESSION'; nowMs: number }
  | { type: 'END_EARLY'; nowMs: number }
  | { type: 'ADD_SESSION_LOG'; payload: SessionLog }
  | { type: 'CLEAR_OUTCOME' };

export function createInitialTimerState(settings: TimerSettings, sessionLogs: readonly SessionLog[]): TimerState {
  const merged: TimerSettings = {
    ...defaultTimerSettings,
    ...settings,
  };

  return {
    settings: merged,
    activeSession: null,
    lastOutcome: null,
    sessionLogs,
    validation: validateTimerSettings(merged),
  };
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'SET_SETTINGS': {
      return {
        ...state,
        settings: action.payload,
        validation: validateTimerSettings(action.payload),
      };
    }
    case 'START_SESSION': {
      const sessionSettings = action.settings ?? state.settings;
      const validation = validateTimerSettings(sessionSettings);
      if (!validation.isValid || !sessionSettings.meditationType) {
        return {
          ...state,
        };
      }

      const fixedDurationMinutes = normalizeFixedDurationMinutes(
        sessionSettings.timerMode,
        sessionSettings.durationMinutes,
        sessionSettings.lastFixedDurationMinutes
      );
      if (sessionSettings.timerMode === 'fixed' && fixedDurationMinutes === null) {
        return {
          ...state,
        };
      }
      const durationSeconds =
        sessionSettings.timerMode === 'fixed' && fixedDurationMinutes !== null ? Math.round(fixedDurationMinutes * 60) : null;
      const startedAt = new Date(action.nowMs).toISOString();

      return {
        ...state,
        lastOutcome: null,
        activeSession: {
          startedAt,
          startedAtMs: action.nowMs,
          timerMode: sessionSettings.timerMode,
          intendedDurationSeconds: durationSeconds,
          elapsedSeconds: 0,
          isPaused: false,
          lastResumedAtMs: action.nowMs,
          meditationType: sessionSettings.meditationType,
          startSound: sessionSettings.startSound,
          endSound: sessionSettings.endSound,
          intervalEnabled: sessionSettings.intervalEnabled,
          intervalMinutes: sessionSettings.intervalMinutes,
          intervalSound: sessionSettings.intervalSound,
        },
      };
    }
    case 'REPLACE_SESSION_LOGS': {
      return {
        ...state,
        sessionLogs: [...action.payload],
      };
    }
    case 'SYNC_TICK': {
      if (!state.activeSession || state.activeSession.isPaused) {
        return state;
      }

      const intendedDurationSeconds = state.activeSession.intendedDurationSeconds;

      if (
        state.activeSession.timerMode === 'fixed' &&
        intendedDurationSeconds !== null &&
        getActiveSessionElapsedMilliseconds(state.activeSession, action.nowMs) >= intendedDurationSeconds * 1000
      ) {
        return finalizeSession(state, 'completed', action.nowMs, intendedDurationSeconds);
      }

      return state;
    }
    case 'PAUSE_SESSION': {
      if (!state.activeSession || state.activeSession.isPaused) {
        return state;
      }

      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          elapsedSeconds: getActiveSessionElapsedSeconds(state.activeSession, action.nowMs),
          isPaused: true,
          lastResumedAtMs: null,
        },
      };
    }
    case 'RESUME_SESSION': {
      if (!state.activeSession || !state.activeSession.isPaused) {
        return state;
      }

      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          isPaused: false,
          lastResumedAtMs: action.nowMs,
        },
      };
    }
    case 'END_EARLY': {
      if (!state.activeSession) {
        return state;
      }

      const completedDurationSeconds = getActiveSessionElapsedSeconds(state.activeSession, action.nowMs);
      const finalStatus = state.activeSession.timerMode === 'open-ended' ? 'completed' : 'ended early';
      return finalizeSession(state, finalStatus, action.nowMs, completedDurationSeconds);
    }
    case 'ADD_SESSION_LOG': {
      return {
        ...state,
        sessionLogs: appendSessionLog(state.sessionLogs, action.payload),
      };
    }
    case 'CLEAR_OUTCOME': {
      return {
        ...state,
        lastOutcome: null,
      };
    }
    default:
      return state;
  }
}

function finalizeSession(
  state: TimerState,
  status: 'completed' | 'ended early',
  nowMs: number,
  completedDurationSeconds: number
): TimerState {
  if (!state.activeSession) {
    return state;
  }

  const normalizedCompletedDurationSeconds =
    state.activeSession.intendedDurationSeconds === null
      ? Math.max(0, completedDurationSeconds)
      : Math.max(0, Math.min(state.activeSession.intendedDurationSeconds, completedDurationSeconds));
  const logEntry = buildAutoLogEntry({
    session: {
      ...state.activeSession,
      elapsedSeconds: normalizedCompletedDurationSeconds,
      isPaused: true,
      lastResumedAtMs: null,
    },
    endedAt: new Date(nowMs),
    completedDurationSeconds: normalizedCompletedDurationSeconds,
    status,
  });

  return {
    ...state,
    activeSession: null,
    lastOutcome: {
      status,
      endedAt: new Date(nowMs).toISOString(),
      completedDurationSeconds: logEntry.completedDurationSeconds,
      timerMode: logEntry.timerMode,
    },
    sessionLogs: appendSessionLog(state.sessionLogs, logEntry),
  };
}

function appendSessionLog(existing: readonly SessionLog[], next: SessionLog): readonly SessionLog[] {
  return [...existing, next].sort((first, second) => parseSessionEndedAt(second.endedAt) - parseSessionEndedAt(first.endedAt));
}

function parseSessionEndedAt(endedAt: string): number {
  const parsed = Date.parse(endedAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}
