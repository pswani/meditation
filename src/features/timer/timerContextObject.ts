import { createContext } from 'react';
import type { CustomPlay, CustomPlayDraft, CustomPlaySaveResult } from '../../types/customPlay';
import type {
  ActivePlaylistRun,
  PlaylistDeleteResult,
  Playlist,
  PlaylistDraft,
  PlaylistRunStartResult,
  PlaylistRunOutcome,
  PlaylistValidationResult,
} from '../../types/playlist';
import type { SessionLog } from '../../types/sessionLog';
import type { TimerSettings } from '../../types/timer';
import type { createInitialTimerState } from './timerReducer';
import type { ManualLogInput, ManualLogSaveResult } from '../../utils/manualLog';

export interface TimerContextValue {
  readonly settings: TimerSettings;
  readonly validation: ReturnType<typeof createInitialTimerState>['validation'];
  readonly activeSession: ReturnType<typeof createInitialTimerState>['activeSession'];
  readonly lastOutcome: ReturnType<typeof createInitialTimerState>['lastOutcome'];
  readonly sessionLogs: readonly SessionLog[];
  readonly recentLogs: readonly SessionLog[];
  readonly customPlays: readonly CustomPlay[];
  readonly playlists: readonly Playlist[];
  readonly activePlaylistRun: ActivePlaylistRun | null;
  readonly playlistRunOutcome: PlaylistRunOutcome | null;
  readonly isPaused: boolean;
  readonly isPlaylistRunPaused: boolean;
  readonly recoveryMessage: string | null;
  readonly isSessionLogsLoading: boolean;
  readonly isSessionLogSyncing: boolean;
  readonly sessionLogSyncError: string | null;
  readonly isCustomPlaysLoading: boolean;
  readonly isCustomPlaySyncing: boolean;
  readonly customPlaySyncError: string | null;
  readonly isSettingsLoading: boolean;
  readonly isSettingsSyncing: boolean;
  readonly settingsSyncError: string | null;
  readonly setSettings: (settings: TimerSettings) => void;
  readonly saveCustomPlay: (draft: CustomPlayDraft, editId?: string) => Promise<CustomPlaySaveResult>;
  readonly deleteCustomPlay: (playId: string) => Promise<boolean>;
  readonly toggleFavoriteCustomPlay: (playId: string) => Promise<boolean>;
  readonly savePlaylist: (draft: PlaylistDraft, editId?: string) => PlaylistValidationResult;
  readonly deletePlaylist: (playlistId: string) => PlaylistDeleteResult;
  readonly toggleFavoritePlaylist: (playlistId: string) => void;
  readonly startPlaylistRun: (playlistId: string) => PlaylistRunStartResult;
  readonly pausePlaylistRun: () => void;
  readonly resumePlaylistRun: () => void;
  readonly endPlaylistRunEarly: () => void;
  readonly clearPlaylistRunOutcome: () => void;
  readonly addManualLog: (input: ManualLogInput) => Promise<ManualLogSaveResult>;
  readonly startSession: () => boolean;
  readonly pauseSession: () => void;
  readonly resumeSession: () => void;
  readonly endSessionEarly: () => void;
  readonly clearOutcome: () => void;
  readonly clearRecoveryMessage: () => void;
}

export const TimerContext = createContext<TimerContextValue | null>(null);
