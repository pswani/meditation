import { createContext, useContext } from 'react';
import type {
  ActiveCustomPlayRun,
  CustomPlay,
  CustomPlayDraft,
  CustomPlayRunOutcome,
  CustomPlayRunStartResult,
  CustomPlaySaveResult,
} from '../../types/customPlay';

export interface CustomPlayContextValue {
  readonly customPlays: readonly CustomPlay[];
  readonly activeCustomPlayRun: ActiveCustomPlayRun | null;
  readonly customPlayRunOutcome: CustomPlayRunOutcome | null;
  readonly isCustomPlaysLoading: boolean;
  readonly isCustomPlaySyncing: boolean;
  readonly customPlaySyncError: string | null;
  readonly customPlayRuntimeMessage: string | null;
  readonly saveCustomPlay: (draft: CustomPlayDraft, editId?: string) => Promise<CustomPlaySaveResult>;
  readonly deleteCustomPlay: (playId: string) => Promise<boolean>;
  readonly toggleFavoriteCustomPlay: (playId: string) => Promise<boolean>;
  readonly startCustomPlayRun: (playId: string) => CustomPlayRunStartResult;
  readonly pauseCustomPlayRun: () => void;
  readonly resumeCustomPlayRun: () => void;
  readonly updateCustomPlayRunProgress: (currentPositionSeconds: number) => void;
  readonly completeCustomPlayRun: (currentPositionSeconds?: number) => void;
  readonly endCustomPlayRunEarly: (currentPositionSeconds?: number) => void;
  readonly clearCustomPlayRunOutcome: () => void;
  readonly reportCustomPlayRuntimeIssue: (message: string | null) => void;
  readonly clearCustomPlayRuntimeMessage: () => void;
}

export const CustomPlayContext = createContext<CustomPlayContextValue | null>(null);

export function useCustomPlay(): CustomPlayContextValue {
  const ctx = useContext(CustomPlayContext);
  if (!ctx) {
    throw new Error('useCustomPlay must be used inside TimerProvider');
  }
  return ctx;
}
