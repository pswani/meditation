import type { SankalpaGoal, SankalpaProgress } from '../../types/sankalpa';
import { formatDurationLabel } from '../../utils/sessionLog';
import { deriveDateRangeFromInputs, type SummaryDateRange } from '../../utils/summary';
import { getSankalpaCadenceWeeks, isRecurringCadenceGoal, timeOfDayBucketLabels } from '../../utils/sankalpa';

export type SummaryRangePreset = 'all-time' | 'last-7-days' | 'last-30-days' | 'custom';
export type SaveMessageTone = 'ok' | 'warn' | 'error';
export type SankalpaSaveAction = 'create' | 'edit' | 'archive' | 'unarchive' | 'delete' | 'mark-observance';

function pluralize(value: number, singular: string, plural = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function describeRecurringCadence(goal: SankalpaGoal): string {
  const cadenceWeeks = getSankalpaCadenceWeeks(goal) ?? 1;
  const qualifyingDaysPerWeek = goal.qualifyingDaysPerWeek ?? 0;
  const thresholdLabel =
    goal.goalType === 'duration-based'
      ? `${goal.targetValue} min`
      : pluralize(goal.targetValue, 'session log');

  return `At least ${thresholdLabel} on ${pluralize(qualifyingDaysPerWeek, 'day')} each week for ${pluralize(cadenceWeeks, 'week')}`;
}

export function describeSankalpa(goal: SankalpaGoal): string {
  if (goal.goalType === 'observance-based') {
    if (isRecurringCadenceGoal(goal)) {
      const cadenceWeeks = getSankalpaCadenceWeeks(goal) ?? 1;
      return `${goal.observanceLabel} ${pluralize(goal.qualifyingDaysPerWeek ?? 0, 'day')} each week for ${pluralize(cadenceWeeks, 'week')}`;
    }

    return `${goal.observanceLabel} for ${goal.days} day${goal.days === 1 ? '' : 's'}`;
  }

  if (isRecurringCadenceGoal(goal)) {
    return describeRecurringCadence(goal);
  }

  if (goal.goalType === 'duration-based') {
    return `${goal.targetValue} min in ${goal.days} day${goal.days === 1 ? '' : 's'}`;
  }

  return `${goal.targetValue} session log${goal.targetValue === 1 ? '' : 's'} in ${goal.days} day${goal.days === 1 ? '' : 's'}`;
}

export function progressDetail(progress: SankalpaProgress): string {
  if (progress.goal.goalType === 'observance-based') {
    if (isRecurringCadenceGoal(progress.goal)) {
      return `${progress.metRecurringWeekCount} / ${progress.targetRecurringWeekCount} weeks met`;
    }

    return `${progress.matchedObservanceCount} / ${progress.targetObservanceCount} observed dates`;
  }

  if (isRecurringCadenceGoal(progress.goal)) {
    return `${progress.metRecurringWeekCount} / ${progress.targetRecurringWeekCount} weeks met`;
  }

  if (progress.goal.goalType === 'duration-based') {
    return `${formatDurationLabel(progress.matchedDurationSeconds)} / ${formatDurationLabel(progress.targetDurationSeconds)}`;
  }

  return `${progress.matchedSessionCount} / ${progress.targetSessionCount} session logs`;
}

export function remainingDetail(progress: SankalpaProgress): string {
  if (progress.goal.goalType === 'observance-based') {
    if (isRecurringCadenceGoal(progress.goal)) {
      const activeWeek = progress.recurringWeeks.find((week) => week.status === 'active');
      const missedWeeks = progress.recurringWeeks.filter((week) => week.status === 'missed').length;
      if (activeWeek) {
        return `Current week ${activeWeek.qualifyingDayCount} / ${activeWeek.requiredQualifyingDayCount} observed days${missedWeeks > 0 ? ` · ${missedWeeks} missed` : ''}`;
      }

      const upcomingWeeks = progress.recurringWeeks.filter((week) => week.status === 'upcoming').length;
      if (upcomingWeeks > 0) {
        return `${upcomingWeeks} upcoming week${upcomingWeeks === 1 ? '' : 's'}${missedWeeks > 0 ? ` · ${missedWeeks} missed` : ''}`;
      }

      return `${missedWeeks} missed week${missedWeeks === 1 ? '' : 's'}`;
    }

    return `${progress.pendingObservanceCount} pending · ${progress.missedObservanceCount} missed`;
  }

  if (isRecurringCadenceGoal(progress.goal)) {
    const activeWeek = progress.recurringWeeks.find((week) => week.status === 'active');
    const missedWeeks = progress.recurringWeeks.filter((week) => week.status === 'missed').length;
    if (activeWeek) {
      return `Current week ${activeWeek.qualifyingDayCount} / ${activeWeek.requiredQualifyingDayCount} qualifying days${missedWeeks > 0 ? ` · ${missedWeeks} missed` : ''}`;
    }

    const upcomingWeeks = progress.recurringWeeks.filter((week) => week.status === 'upcoming').length;
    if (upcomingWeeks > 0) {
      return `${upcomingWeeks} upcoming week${upcomingWeeks === 1 ? '' : 's'}${missedWeeks > 0 ? ` · ${missedWeeks} missed` : ''}`;
    }

    return `${missedWeeks} missed week${missedWeeks === 1 ? '' : 's'}`;
  }

  if (progress.goal.goalType === 'duration-based') {
    const remainingSeconds = Math.max(0, progress.targetDurationSeconds - progress.matchedDurationSeconds);
    return `${formatDurationLabel(remainingSeconds)} remaining`;
  }

  const remainingSessions = Math.max(0, progress.targetSessionCount - progress.matchedSessionCount);
  return `${remainingSessions} session log${remainingSessions === 1 ? '' : 's'} remaining`;
}

export function filterDetail(goal: SankalpaGoal): string {
  if (goal.goalType === 'observance-based') {
    if (isRecurringCadenceGoal(goal)) {
      return 'Manual observance tracking · weekly cadence';
    }

    return 'Manual observance tracking';
  }

  const filters: string[] = [];
  if (goal.meditationType) {
    filters.push(`meditation type: ${goal.meditationType}`);
  }
  if (goal.timeOfDayBucket) {
    filters.push(`time of day: ${timeOfDayBucketLabels[goal.timeOfDayBucket]}`);
  }

  return filters.length > 0 ? filters.join(' · ') : 'No filters';
}

function formatDateInputLabel(dateInput: string): string {
  const parsed = deriveDateRangeFromInputs(dateInput, dateInput);
  if (!parsed?.startAtMs) {
    return dateInput;
  }

  return new Date(parsed.startAtMs).toLocaleDateString();
}

export function describeSummaryRangeLabel(
  preset: SummaryRangePreset,
  range: SummaryDateRange,
  customStartDate: string,
  customEndDate: string
): string {
  if (preset === 'all-time') {
    return 'All time';
  }

  if (preset === 'last-7-days') {
    return 'Last 7 days';
  }

  if (preset === 'last-30-days') {
    return 'Last 30 days';
  }

  if (range.startAtMs === null || range.endAtMs === null) {
    return 'Custom range';
  }

  return `${formatDateInputLabel(customStartDate)} - ${formatDateInputLabel(customEndDate)}`;
}

export function formatSummaryLoadMessage(error: unknown): string {
  const maybeError = error as { kind?: string; detail?: string } | null;
  if (maybeError?.kind === 'network') {
    return 'Showing a locally derived summary because the backend summary service could not be reached.';
  }

  if (typeof maybeError?.detail === 'string' && maybeError.detail.trim().length > 0) {
    return `Showing a locally derived summary because the backend summary service returned: ${maybeError.detail.trim()}`;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return `Showing a locally derived summary because the backend summary service returned: ${error.message.trim()}`;
  }

  return 'Showing a locally derived summary because the backend summary service is unavailable right now.';
}

export function formatOfflineSummaryMessage(): string {
  return 'Showing a locally derived summary while you are offline.';
}

export function formatUnavailableSummaryMessage(connectionMode: 'offline' | 'backend-unreachable' | 'online'): string {
  return connectionMode === 'backend-unreachable'
    ? 'Showing a locally derived summary because the backend summary service is unavailable right now.'
    : formatOfflineSummaryMessage();
}

export function formatCachedSummaryFallbackMessage(connectionMode: 'offline' | 'backend-unreachable' | 'online'): string {
  return connectionMode === 'backend-unreachable'
    ? 'Showing the last available summary because the backend summary service is unavailable right now.'
    : 'Showing the last available summary while you are offline.';
}

export function formatCachedSummaryLoadMessage(error: unknown): string {
  const maybeError = error as { kind?: string; detail?: string } | null;
  if (maybeError?.kind === 'network') {
    return 'Showing the last available summary because the backend summary service could not be reached.';
  }

  if (typeof maybeError?.detail === 'string' && maybeError.detail.trim().length > 0) {
    return `Showing the last available summary because the backend summary service returned: ${maybeError.detail.trim()}`;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return `Showing the last available summary because the backend summary service returned: ${error.message.trim()}`;
  }

  return 'Showing the last available summary because the backend summary service is unavailable right now.';
}

export function buildSankalpaSaveMessage(action: SankalpaSaveAction, tone: SaveMessageTone): string {
  if (tone === 'warn') {
    if (action === 'create') {
      return 'Sankalpa created locally because the backend could not be reached.';
    }
    if (action === 'edit') {
      return 'Sankalpa changes saved locally because the backend could not be reached.';
    }
    if (action === 'archive') {
      return 'Sankalpa archived locally because the backend could not be reached.';
    }
    if (action === 'unarchive') {
      return 'Sankalpa restored locally because the backend could not be reached.';
    }
    if (action === 'mark-observance') {
      return 'Observance check-in saved locally because the backend could not be reached.';
    }

    return 'Sankalpa deleted locally because the backend could not be reached.';
  }

  if (action === 'create') {
    return 'Sankalpa created.';
  }
  if (action === 'edit') {
    return 'Sankalpa updated.';
  }
  if (action === 'archive') {
    return 'Sankalpa archived.';
  }
  if (action === 'unarchive') {
    return 'Sankalpa restored.';
  }
  if (action === 'mark-observance') {
    return 'Observance check-in saved.';
  }

  return 'Sankalpa deleted.';
}
