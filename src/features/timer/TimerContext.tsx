import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { CustomPlay } from '../../types/customPlay';
import type { ActivePlaylistRun, Playlist, PlaylistRunOutcome } from '../../types/playlist';
import type { SankalpaGoal } from '../../types/sankalpa';
import type { ActiveSession } from '../../types/timer';
import { createCustomPlay, updateCustomPlay, validateCustomPlayDraft } from '../../utils/customPlay';
import { buildManualLogEntry, validateManualLogInput } from '../../utils/manualLog';
import { createPlaylist, updatePlaylist, validatePlaylistDraft } from '../../utils/playlist';
import { persistPlaylistsToApi } from '../../utils/playlistApi';
import { buildPlaylistItemLogEntry } from '../../utils/playlistLog';
import { evaluatePlaylistDelete, evaluatePlaylistRunStart } from '../../utils/playlistRunPolicy';
import {
  loadActivePlaylistRunState,
  loadActiveTimerState,
  loadCustomPlays,
  loadPlaylists,
  loadSankalpas,
  loadSessionLogs,
  loadTimerSettings,
  saveActivePlaylistRunState,
  saveActiveTimerState,
  saveCustomPlays,
  saveSankalpas,
  saveSessionLogs,
  saveTimerSettings,
} from '../../utils/storage';
import { defaultTimerSettings } from './constants';
import { createInitialTimerState, timerReducer } from './timerReducer';
import { TimerContext, type TimerContextValue } from './timerContextObject';

interface TimerHydration {
  readonly activeSession: ActiveSession | null;
  readonly isPaused: boolean;
  readonly activePlaylistRun: ActivePlaylistRun | null;
  readonly isPlaylistRunPaused: boolean;
  readonly recoveryMessage: string | null;
  readonly activeTimerPersistedSnapshot: string;
  readonly activePlaylistRunPersistedSnapshot: string;
}

function buildPersistedSnapshot(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function buildActiveTimerStateSnapshot(activeSession: ActiveSession | null, isPaused: boolean): string {
  if (!activeSession) {
    return 'null';
  }

  return JSON.stringify({
    activeSession,
    isPaused,
  });
}

function buildActivePlaylistRunStateSnapshot(activePlaylistRun: ActivePlaylistRun | null, isPaused: boolean): string {
  if (!activePlaylistRun) {
    return 'null';
  }

  return JSON.stringify({
    activePlaylistRun,
    isPaused,
  });
}

function recoverActiveSession(
  storedActiveSession: ActiveSession | null,
  isPaused: boolean,
  nowMs: number
): { readonly activeSession: ActiveSession | null; readonly recoveryMessage: string | null } {
  if (!storedActiveSession) {
    return {
      activeSession: null,
      recoveryMessage: null,
    };
  }

  if (isPaused) {
    return {
      activeSession: storedActiveSession,
      recoveryMessage: 'Recovered an active timer from your previous app state.',
    };
  }

  const remainingSeconds = Math.ceil((storedActiveSession.endAtMs - nowMs) / 1000);
  if (remainingSeconds <= 0) {
    return {
      activeSession: null,
      recoveryMessage: 'Your previous active timer was cleared because it could not be safely resumed.',
    };
  }

  return {
    activeSession: {
      ...storedActiveSession,
      remainingSeconds,
    },
    recoveryMessage: 'Recovered an active timer from your previous app state.',
  };
}

function recoverActivePlaylistRun(
  storedActivePlaylistRun: ActivePlaylistRun | null,
  isPaused: boolean,
  nowMs: number
): { readonly activePlaylistRun: ActivePlaylistRun | null; readonly recoveryMessage: string | null } {
  if (!storedActivePlaylistRun) {
    return {
      activePlaylistRun: null,
      recoveryMessage: null,
    };
  }

  if (isPaused) {
    return {
      activePlaylistRun: storedActivePlaylistRun,
      recoveryMessage: 'Recovered an active playlist run from your previous app state.',
    };
  }

  const remainingSeconds = Math.ceil((storedActivePlaylistRun.currentItemEndAtMs - nowMs) / 1000);
  if (remainingSeconds <= 0) {
    return {
      activePlaylistRun: null,
      recoveryMessage: 'Your previous playlist run was cleared because it could not be safely resumed.',
    };
  }

  return {
    activePlaylistRun: {
      ...storedActivePlaylistRun,
      currentItemRemainingSeconds: remainingSeconds,
    },
    recoveryMessage: 'Recovered an active playlist run from your previous app state.',
  };
}

function createTimerHydration(nowMs: number): TimerHydration {
  const storedTimerState = loadActiveTimerState();
  const storedPlaylistRunState = loadActivePlaylistRunState();
  const timerRecovery = recoverActiveSession(storedTimerState?.activeSession ?? null, storedTimerState?.isPaused ?? false, nowMs);
  const playlistRecovery = recoverActivePlaylistRun(
    storedPlaylistRunState?.activePlaylistRun ?? null,
    storedPlaylistRunState?.isPaused ?? false,
    nowMs
  );

  return {
    activeSession: timerRecovery.activeSession,
    isPaused: timerRecovery.activeSession ? (storedTimerState?.isPaused ?? false) : false,
    activePlaylistRun: playlistRecovery.activePlaylistRun,
    isPlaylistRunPaused: playlistRecovery.activePlaylistRun ? (storedPlaylistRunState?.isPaused ?? false) : false,
    recoveryMessage: timerRecovery.recoveryMessage ?? playlistRecovery.recoveryMessage,
    activeTimerPersistedSnapshot: buildPersistedSnapshot(storedTimerState),
    activePlaylistRunPersistedSnapshot: buildPersistedSnapshot(storedPlaylistRunState),
  };
}

export function TimerProvider({ children }: { readonly children: ReactNode }) {
  const [initialTimerSettings] = useState(() => loadTimerSettings() ?? defaultTimerSettings);
  const [initialSessionLogs] = useState(() => loadSessionLogs());
  const [hydration] = useState<TimerHydration>(() => createTimerHydration(Date.now()));
  const [initialCustomPlays] = useState(() => loadCustomPlays());
  const [initialPlaylists] = useState(() => loadPlaylists());
  const [initialSankalpas] = useState(() => loadSankalpas());
  const [state, dispatch] = useReducer(
    timerReducer,
    undefined,
    () => {
      const initialState = createInitialTimerState(initialTimerSettings, initialSessionLogs);

      return {
        ...initialState,
        activeSession: hydration.activeSession,
      };
    }
  );
  const [isPaused, setIsPaused] = useState(hydration.isPaused);
  const [customPlays, setCustomPlays] = useState<CustomPlay[]>(initialCustomPlays);
  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists);
  const [sankalpas, setSankalpas] = useState<SankalpaGoal[]>(initialSankalpas);
  const [activePlaylistRun, setActivePlaylistRun] = useState<ActivePlaylistRun | null>(hydration.activePlaylistRun);
  const [playlistRunOutcome, setPlaylistRunOutcome] = useState<PlaylistRunOutcome | null>(null);
  const [isPlaylistRunPaused, setIsPlaylistRunPaused] = useState(hydration.isPlaylistRunPaused);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(hydration.recoveryMessage);
  const timerSettingsSnapshotRef = useRef(buildPersistedSnapshot(initialTimerSettings));
  const sessionLogsSnapshotRef = useRef(buildPersistedSnapshot(initialSessionLogs));
  const customPlaysSnapshotRef = useRef(buildPersistedSnapshot(initialCustomPlays));
  const playlistsSnapshotRef = useRef(buildPersistedSnapshot(initialPlaylists));
  const sankalpasSnapshotRef = useRef(buildPersistedSnapshot(initialSankalpas));
  const activeTimerSnapshotRef = useRef(hydration.activeTimerPersistedSnapshot);
  const activePlaylistRunSnapshotRef = useRef(hydration.activePlaylistRunPersistedSnapshot);

  useEffect(() => {
    if (!state.activeSession) {
      setIsPaused(false);
    }
  }, [state.activeSession]);

  useEffect(() => {
    if (!activePlaylistRun) {
      setIsPlaylistRunPaused(false);
    }
  }, [activePlaylistRun]);

  useEffect(() => {
    const snapshot = buildPersistedSnapshot(state.settings);
    if (timerSettingsSnapshotRef.current === snapshot) {
      return;
    }

    saveTimerSettings(state.settings);
    timerSettingsSnapshotRef.current = snapshot;
  }, [state.settings]);

  useEffect(() => {
    const snapshot = buildPersistedSnapshot(state.sessionLogs);
    if (sessionLogsSnapshotRef.current === snapshot) {
      return;
    }

    saveSessionLogs([...state.sessionLogs]);
    sessionLogsSnapshotRef.current = snapshot;
  }, [state.sessionLogs]);

  useEffect(() => {
    const snapshot = buildPersistedSnapshot(customPlays);
    if (customPlaysSnapshotRef.current === snapshot) {
      return;
    }

    saveCustomPlays(customPlays);
    customPlaysSnapshotRef.current = snapshot;
  }, [customPlays]);

  useEffect(() => {
    const snapshot = buildPersistedSnapshot(playlists);
    if (playlistsSnapshotRef.current === snapshot) {
      return;
    }

    playlistsSnapshotRef.current = snapshot;
    void persistPlaylistsToApi(playlists);
  }, [playlists]);

  useEffect(() => {
    const snapshot = buildActiveTimerStateSnapshot(state.activeSession, isPaused);
    if (activeTimerSnapshotRef.current === snapshot) {
      return;
    }

    saveActiveTimerState(state.activeSession, isPaused);
    activeTimerSnapshotRef.current = snapshot;
  }, [isPaused, state.activeSession]);

  useEffect(() => {
    const snapshot = buildActivePlaylistRunStateSnapshot(activePlaylistRun, isPlaylistRunPaused);
    if (activePlaylistRunSnapshotRef.current === snapshot) {
      return;
    }

    saveActivePlaylistRunState(activePlaylistRun, isPlaylistRunPaused);
    activePlaylistRunSnapshotRef.current = snapshot;
  }, [activePlaylistRun, isPlaylistRunPaused]);

  useEffect(() => {
    const snapshot = buildPersistedSnapshot(sankalpas);
    if (sankalpasSnapshotRef.current === snapshot) {
      return;
    }

    saveSankalpas(sankalpas);
    sankalpasSnapshotRef.current = snapshot;
  }, [sankalpas]);

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

  useEffect(() => {
    if (!activePlaylistRun || isPlaylistRunPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const nowMs = Date.now();
      const currentItem = activePlaylistRun.items[activePlaylistRun.currentIndex];
      if (!currentItem) {
        return;
      }

      const remainingSeconds = Math.max(0, Math.ceil((activePlaylistRun.currentItemEndAtMs - nowMs) / 1000));

      if (remainingSeconds > 0) {
        if (remainingSeconds !== activePlaylistRun.currentItemRemainingSeconds) {
          setActivePlaylistRun({
            ...activePlaylistRun,
            currentItemRemainingSeconds: remainingSeconds,
          });
        }
        return;
      }

      const intendedDurationSeconds = Math.round(currentItem.durationMinutes * 60);
      const completedLog = buildPlaylistItemLogEntry({
        playlistId: activePlaylistRun.playlistId,
        playlistName: activePlaylistRun.playlistName,
        playlistRunId: activePlaylistRun.runId,
        playlistRunStartedAt: activePlaylistRun.runStartedAt,
        item: currentItem,
        itemPosition: activePlaylistRun.currentIndex + 1,
        itemCount: activePlaylistRun.items.length,
        startedAt: activePlaylistRun.currentItemStartedAt,
        endedAt: new Date(nowMs),
        completedDurationSeconds: intendedDurationSeconds,
        status: 'completed',
      });

      dispatch({ type: 'ADD_SESSION_LOG', payload: completedLog });

      const completedItems = activePlaylistRun.completedItems + 1;
      const completedDurationSeconds = activePlaylistRun.completedDurationSeconds + intendedDurationSeconds;
      const nextIndex = activePlaylistRun.currentIndex + 1;

      if (nextIndex >= activePlaylistRun.items.length) {
        setActivePlaylistRun(null);
        setIsPlaylistRunPaused(false);
        setPlaylistRunOutcome({
          status: 'completed',
          playlistName: activePlaylistRun.playlistName,
          completedItems,
          totalItems: activePlaylistRun.items.length,
          completedDurationSeconds,
          endedAt: new Date(nowMs).toISOString(),
        });
        return;
      }

      const nextItem = activePlaylistRun.items[nextIndex];
      if (!nextItem) {
        return;
      }
      const nextDurationSeconds = Math.round(nextItem.durationMinutes * 60);

      setActivePlaylistRun({
        ...activePlaylistRun,
        currentIndex: nextIndex,
        currentItemStartedAt: new Date(nowMs).toISOString(),
        currentItemStartedAtMs: nowMs,
        currentItemRemainingSeconds: nextDurationSeconds,
        currentItemEndAtMs: nowMs + nextDurationSeconds * 1000,
        completedItems,
        completedDurationSeconds,
      });
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activePlaylistRun, isPlaylistRunPaused]);

  const value = useMemo<TimerContextValue>(
    () => ({
      settings: state.settings,
      validation: state.validation,
      activeSession: state.activeSession,
      lastOutcome: state.lastOutcome,
      sessionLogs: state.sessionLogs,
      recentLogs: state.sessionLogs.slice(0, 20),
      customPlays,
      playlists,
      sankalpas,
      activePlaylistRun,
      playlistRunOutcome,
      isPaused,
      isPlaylistRunPaused,
      recoveryMessage,
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
      savePlaylist: (draft, editId) => {
        const validation = validatePlaylistDraft(draft);
        if (!validation.isValid) {
          return validation;
        }

        setPlaylists((current) => {
          if (editId) {
            return current.map((playlist) => (playlist.id === editId ? updatePlaylist(playlist, draft, new Date()) : playlist));
          }

          return [createPlaylist(draft, new Date()), ...current];
        });

        return validation;
      },
      deletePlaylist: (playlistId) => {
        const result = evaluatePlaylistDelete(playlistId, activePlaylistRun);
        if (!result.deleted) {
          return result;
        }

        setPlaylists((current) => current.filter((playlist) => playlist.id !== playlistId));
        return result;
      },
      toggleFavoritePlaylist: (playlistId) =>
        setPlaylists((current) =>
          current.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  favorite: !playlist.favorite,
                  updatedAt: new Date().toISOString(),
                }
              : playlist
          )
        ),
      startPlaylistRun: (playlistId) => {
        const startResult = evaluatePlaylistRunStart({
          playlistId,
          playlists,
          activeTimerSession: Boolean(state.activeSession),
          activePlaylistRun,
        });

        if (!startResult.started) {
          return startResult;
        }

        const playlist = playlists.find((entry) => entry.id === playlistId);
        if (!playlist) {
          return {
            started: false,
            reason: 'playlist not found',
          };
        }

        const nowMs = Date.now();
        const runStartedAt = new Date(nowMs).toISOString();
        const firstItem = playlist.items[0];
        if (!firstItem) {
          return {
            started: false,
            reason: 'playlist has no items',
          };
        }
        const firstDurationSeconds = Math.round(firstItem.durationMinutes * 60);

        setPlaylistRunOutcome(null);
        setIsPlaylistRunPaused(false);
        setActivePlaylistRun({
          runId: `${playlist.id}-${nowMs}`,
          playlistId: playlist.id,
          playlistName: playlist.name,
          runStartedAt,
          items: playlist.items,
          currentIndex: 0,
          currentItemStartedAt: runStartedAt,
          currentItemStartedAtMs: nowMs,
          currentItemRemainingSeconds: firstDurationSeconds,
          currentItemEndAtMs: nowMs + firstDurationSeconds * 1000,
          completedItems: 0,
          completedDurationSeconds: 0,
          totalIntendedDurationSeconds: Math.round(
            playlist.items.reduce((total, item) => total + item.durationMinutes, 0) * 60
          ),
        });

        return startResult;
      },
      pausePlaylistRun: () => {
        if (!activePlaylistRun) {
          return;
        }

        const nowMs = Date.now();
        const remainingSeconds = Math.max(0, Math.ceil((activePlaylistRun.currentItemEndAtMs - nowMs) / 1000));

        setActivePlaylistRun({
          ...activePlaylistRun,
          currentItemRemainingSeconds: remainingSeconds,
          currentItemEndAtMs: nowMs + remainingSeconds * 1000,
        });
        setIsPlaylistRunPaused(true);
      },
      resumePlaylistRun: () => {
        if (!activePlaylistRun) {
          return;
        }

        const nowMs = Date.now();
        setActivePlaylistRun({
          ...activePlaylistRun,
          currentItemEndAtMs: nowMs + activePlaylistRun.currentItemRemainingSeconds * 1000,
        });
        setIsPlaylistRunPaused(false);
      },
      endPlaylistRunEarly: () => {
        if (!activePlaylistRun) {
          return;
        }

        const nowMs = Date.now();
        const currentItem = activePlaylistRun.items[activePlaylistRun.currentIndex];
        if (!currentItem) {
          return;
        }

        const remainingSeconds = Math.max(0, Math.ceil((activePlaylistRun.currentItemEndAtMs - nowMs) / 1000));
        const intendedDurationSeconds = Math.round(currentItem.durationMinutes * 60);
        const completedCurrentItemSeconds = intendedDurationSeconds - remainingSeconds;

        const endedEarlyLog = buildPlaylistItemLogEntry({
          playlistId: activePlaylistRun.playlistId,
          playlistName: activePlaylistRun.playlistName,
          playlistRunId: activePlaylistRun.runId,
          playlistRunStartedAt: activePlaylistRun.runStartedAt,
          item: currentItem,
          itemPosition: activePlaylistRun.currentIndex + 1,
          itemCount: activePlaylistRun.items.length,
          startedAt: activePlaylistRun.currentItemStartedAt,
          endedAt: new Date(nowMs),
          completedDurationSeconds: completedCurrentItemSeconds,
          status: 'ended early',
        });

        dispatch({ type: 'ADD_SESSION_LOG', payload: endedEarlyLog });

        setPlaylistRunOutcome({
          status: 'ended early',
          playlistName: activePlaylistRun.playlistName,
          completedItems: activePlaylistRun.completedItems,
          totalItems: activePlaylistRun.items.length,
          completedDurationSeconds: activePlaylistRun.completedDurationSeconds + completedCurrentItemSeconds,
          endedAt: new Date(nowMs).toISOString(),
        });
        setActivePlaylistRun(null);
        setIsPlaylistRunPaused(false);
      },
      clearPlaylistRunOutcome: () => setPlaylistRunOutcome(null),
      addManualLog: (input) => {
        const validation = validateManualLogInput(input);
        if (!validation.isValid) {
          return validation;
        }

        dispatch({
          type: 'ADD_SESSION_LOG',
          payload: buildManualLogEntry(input, new Date()),
        });

        return validation;
      },
      addSankalpa: (goal) => setSankalpas((current) => [goal, ...current]),
      startSession: () => {
        if (activePlaylistRun) {
          return false;
        }

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
      clearRecoveryMessage: () => setRecoveryMessage(null),
    }),
    [activePlaylistRun, customPlays, isPaused, isPlaylistRunPaused, playlistRunOutcome, playlists, recoveryMessage, sankalpas, state]
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
