import { createContext, useContext } from 'react';
import type { SessionLog } from '../../types/sessionLog';
import type { ManualLogInput, ManualLogSaveResult } from '../../utils/manualLog';
import type { SessionLogMeditationTypeEditResult } from './timerContextObject';

export interface SessionLogContextValue {
  readonly sessionLogs: readonly SessionLog[];
  readonly recentLogs: readonly SessionLog[];
  readonly isSessionLogsLoading: boolean;
  readonly isSessionLogSyncing: boolean;
  readonly sessionLogSyncError: string | null;
  readonly addManualLog: (input: ManualLogInput) => Promise<ManualLogSaveResult>;
  readonly canChangeSessionLogMeditationType: (entry: SessionLog) => boolean;
  readonly updateSessionLogMeditationType: (
    entry: SessionLog,
    meditationType: SessionLog['meditationType']
  ) => SessionLogMeditationTypeEditResult;
}

export const SessionLogContext = createContext<SessionLogContextValue | null>(null);

export function useSessionLog(): SessionLogContextValue {
  const ctx = useContext(SessionLogContext);
  if (!ctx) {
    throw new Error('useSessionLog must be used inside TimerProvider');
  }
  return ctx;
}
