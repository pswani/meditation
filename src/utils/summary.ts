import type { SessionLog } from '../types/sessionLog';
import type { MeditationType } from '../types/timer';

const meditationTypeOrder: readonly MeditationType[] = ['Vipassana', 'Ajapa', 'Tratak', 'Kriya', 'Sahaj'];

export interface OverallSummary {
  readonly totalSessionLogs: number;
  readonly completedSessionLogs: number;
  readonly endedEarlySessionLogs: number;
  readonly totalDurationSeconds: number;
  readonly averageDurationSeconds: number;
  readonly autoLogs: number;
  readonly manualLogs: number;
}

export interface SummaryByType {
  readonly meditationType: MeditationType;
  readonly sessionLogs: number;
  readonly totalDurationSeconds: number;
}

export function deriveOverallSummary(sessionLogs: readonly SessionLog[]): OverallSummary {
  if (sessionLogs.length === 0) {
    return {
      totalSessionLogs: 0,
      completedSessionLogs: 0,
      endedEarlySessionLogs: 0,
      totalDurationSeconds: 0,
      averageDurationSeconds: 0,
      autoLogs: 0,
      manualLogs: 0,
    };
  }

  const completedSessionLogs = sessionLogs.filter((entry) => entry.status === 'completed').length;
  const endedEarlySessionLogs = sessionLogs.length - completedSessionLogs;
  const totalDurationSeconds = sessionLogs.reduce((total, entry) => total + entry.completedDurationSeconds, 0);
  const autoLogs = sessionLogs.filter((entry) => entry.source === 'auto log').length;
  const manualLogs = sessionLogs.length - autoLogs;

  return {
    totalSessionLogs: sessionLogs.length,
    completedSessionLogs,
    endedEarlySessionLogs,
    totalDurationSeconds,
    averageDurationSeconds: Math.round(totalDurationSeconds / sessionLogs.length),
    autoLogs,
    manualLogs,
  };
}

export function deriveSummaryByType(sessionLogs: readonly SessionLog[]): SummaryByType[] {
  return meditationTypeOrder.map((meditationType) => {
    const typeLogs = sessionLogs.filter((entry) => entry.meditationType === meditationType);
    return {
      meditationType,
      sessionLogs: typeLogs.length,
      totalDurationSeconds: typeLogs.reduce((total, entry) => total + entry.completedDurationSeconds, 0),
    };
  });
}
