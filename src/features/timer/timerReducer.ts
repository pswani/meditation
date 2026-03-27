import { defaultTimerSettings } from './constants';
import type { SessionLog } from '../../types/sessionLog';
import type { ActiveSession, TimerOutcome, TimerSettings, TimerValidationResult } from '../../types/timer';
import { buildAutoLogEntry } from '../../utils/sessionLog';
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
  | { type: 'START_SESSION'; nowMs: number }
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
      const validation = validateTimerSettings(state.settings);
      if (!validation.isValid || !state.settings.meditationType) {
        return {
          ...state,
          validation,
        };
      }

      const durationSeconds = Math.round(state.settings.durationMinutes * 60);
      const startedAt = new Date(action.nowMs).toISOString();

      return {
        ...state,
        validation,
        lastOutcome: null,
        activeSession: {
          startedAt,
          startedAtMs: action.nowMs,
          intendedDurationSeconds: durationSeconds,
          remainingSeconds: durationSeconds,
          meditationType: state.settings.meditationType,
          startSound: state.settings.startSound,
          endSound: state.settings.endSound,
          intervalEnabled: state.settings.intervalEnabled,
          intervalMinutes: state.settings.intervalMinutes,
          intervalSound: state.settings.intervalSound,
          endAtMs: action.nowMs + durationSeconds * 1000,
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
      if (!state.activeSession) {
        return state;
      }

      const remainingSeconds = Math.max(0, Math.ceil((state.activeSession.endAtMs - action.nowMs) / 1000));

      if (remainingSeconds > 0) {
        return {
          ...state,
          activeSession: {
            ...state.activeSession,
            remainingSeconds,
          },
        };
      }

      return finalizeSession(state, 'completed', action.nowMs, 0);
    }
    case 'PAUSE_SESSION': {
      if (!state.activeSession) {
        return state;
      }

      const remainingSeconds = Math.max(0, Math.ceil((state.activeSession.endAtMs - action.nowMs) / 1000));

      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          remainingSeconds,
          endAtMs: action.nowMs + remainingSeconds * 1000,
        },
      };
    }
    case 'RESUME_SESSION': {
      if (!state.activeSession) {
        return state;
      }

      return {
        ...state,
        activeSession: {
          ...state.activeSession,
          endAtMs: action.nowMs + state.activeSession.remainingSeconds * 1000,
        },
      };
    }
    case 'END_EARLY': {
      if (!state.activeSession) {
        return state;
      }

      const remainingSeconds = Math.max(0, Math.ceil((state.activeSession.endAtMs - action.nowMs) / 1000));
      return finalizeSession(state, 'ended early', action.nowMs, remainingSeconds);
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
  remainingSeconds: number
): TimerState {
  if (!state.activeSession) {
    return state;
  }

  const completedDurationSeconds = state.activeSession.intendedDurationSeconds - remainingSeconds;
  const logEntry = buildAutoLogEntry({
    session: state.activeSession,
    endedAt: new Date(nowMs),
    completedDurationSeconds,
    status,
  });

  return {
    ...state,
    activeSession: null,
    lastOutcome: {
      status,
      endedAt: new Date(nowMs).toISOString(),
      completedDurationSeconds: logEntry.completedDurationSeconds,
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
