import { useEffect, useMemo, useReducer, useState } from 'react';
import type { ReactNode } from 'react';
import type { CustomPlay } from '../../types/customPlay';
import { createCustomPlay, updateCustomPlay, validateCustomPlayDraft } from '../../utils/customPlay';
import { buildManualLogEntry, validateManualLogInput } from '../../utils/manualLog';
import {
  loadCustomPlays,
  loadSessionLogs,
  loadTimerSettings,
  saveCustomPlays,
  saveSessionLogs,
  saveTimerSettings,
} from '../../utils/storage';
import { defaultTimerSettings } from './constants';
import { createInitialTimerState, timerReducer } from './timerReducer';
import { TimerContext, type TimerContextValue } from './timerContextObject';

export function TimerProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(
    timerReducer,
    undefined,
    () => createInitialTimerState(loadTimerSettings() ?? defaultTimerSettings, loadSessionLogs())
  );
  const [isPaused, setIsPaused] = useState(false);
  const [customPlays, setCustomPlays] = useState<CustomPlay[]>(() => loadCustomPlays());

  useEffect(() => {
    if (!state.activeSession) {
      setIsPaused(false);
    }
  }, [state.activeSession]);

  useEffect(() => {
    saveTimerSettings(state.settings);
  }, [state.settings]);

  useEffect(() => {
    saveSessionLogs([...state.sessionLogs]);
  }, [state.sessionLogs]);

  useEffect(() => {
    saveCustomPlays(customPlays);
  }, [customPlays]);

  useEffect(() => {
    if (!state.activeSession || isPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      dispatch({ type: 'SYNC_TICK', nowMs: Date.now() });
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [state.activeSession, isPaused]);

  const value = useMemo<TimerContextValue>(
    () => ({
      settings: state.settings,
      validation: state.validation,
      activeSession: state.activeSession,
      lastOutcome: state.lastOutcome,
      recentLogs: state.sessionLogs.slice(0, 20),
      customPlays,
      isPaused,
      setSettings: (settings) => dispatch({ type: 'SET_SETTINGS', payload: settings }),
      saveCustomPlay: (draft, editId) => {
        const validation = validateCustomPlayDraft(draft);
        if (!validation.isValid) {
          return validation;
        }

        setCustomPlays((current) => {
          if (editId) {
            return current.map((play) => (play.id === editId ? updateCustomPlay(play, draft, new Date()) : play));
          }

          return [createCustomPlay(draft, new Date()), ...current];
        });

        return validation;
      },
      deleteCustomPlay: (playId) =>
        setCustomPlays((current) => current.filter((play) => play.id !== playId)),
      toggleFavoriteCustomPlay: (playId) =>
        setCustomPlays((current) =>
          current.map((play) =>
            play.id === playId
              ? {
                  ...play,
                  favorite: !play.favorite,
                  updatedAt: new Date().toISOString(),
                }
              : play
          )
        ),
      addManualLog: (input) => {
        const validation = validateManualLogInput(input);
        if (!validation.isValid) {
          return validation;
        }

        dispatch({
          type: 'ADD_MANUAL_LOG',
          payload: buildManualLogEntry(input, new Date()),
        });

        return validation;
      },
      startSession: () => {
        if (!state.validation.isValid || !state.settings.meditationType) {
          dispatch({ type: 'SET_SETTINGS', payload: state.settings });
          return false;
        }

        dispatch({ type: 'START_SESSION', nowMs: Date.now() });
        setIsPaused(false);
        return true;
      },
      pauseSession: () => {
        dispatch({ type: 'PAUSE_SESSION', nowMs: Date.now() });
        setIsPaused(true);
      },
      resumeSession: () => {
        dispatch({ type: 'RESUME_SESSION', nowMs: Date.now() });
        setIsPaused(false);
      },
      endSessionEarly: () => {
        dispatch({ type: 'END_EARLY', nowMs: Date.now() });
        setIsPaused(false);
      },
      clearOutcome: () => dispatch({ type: 'CLEAR_OUTCOME' }),
    }),
    [customPlays, isPaused, state]
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
