import { requestJson } from './apiClient';
import { buildApiPath, buildApiUrl } from './apiConfig';
import type { OverallSummary, SummaryBySource, SummaryByTimeOfDay, SummaryByType, SummarySnapshotData } from './summary';

export const SUMMARIES_COLLECTION_PATH = '/summaries';
export const SUMMARIES_COLLECTION_ENDPOINT = buildApiPath(SUMMARIES_COLLECTION_PATH);

interface SummaryApiRequest {
  readonly startAt?: string;
  readonly endAt?: string;
}

const meditationTypes = new Set(['Vipassana', 'Ajapa', 'Tratak', 'Kriya', 'Sahaj']);
const sessionLogSources = new Set(['auto log', 'manual log']);
const timeOfDayBuckets = new Set(['morning', 'afternoon', 'evening', 'night']);

function hasValidSummaryOverall(value: unknown): value is OverallSummary {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.totalSessionLogs === 'number' &&
    typeof candidate.completedSessionLogs === 'number' &&
    typeof candidate.endedEarlySessionLogs === 'number' &&
    typeof candidate.totalDurationSeconds === 'number' &&
    typeof candidate.averageDurationSeconds === 'number' &&
    typeof candidate.autoLogs === 'number' &&
    typeof candidate.manualLogs === 'number'
  );
}

function hasValidSummaryByTypeCollection(value: unknown): value is SummaryByType[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        meditationTypes.has((entry as Record<string, unknown>).meditationType as string) &&
        typeof (entry as Record<string, unknown>).sessionLogs === 'number' &&
        typeof (entry as Record<string, unknown>).totalDurationSeconds === 'number'
    )
  );
}

function hasValidSummaryBySourceCollection(value: unknown): value is SummaryBySource[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        sessionLogSources.has((entry as Record<string, unknown>).source as string) &&
        typeof (entry as Record<string, unknown>).sessionLogs === 'number' &&
        typeof (entry as Record<string, unknown>).completedSessionLogs === 'number' &&
        typeof (entry as Record<string, unknown>).endedEarlySessionLogs === 'number' &&
        typeof (entry as Record<string, unknown>).totalDurationSeconds === 'number'
    )
  );
}

function hasValidSummaryByTimeOfDayCollection(value: unknown): value is SummaryByTimeOfDay[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        timeOfDayBuckets.has((entry as Record<string, unknown>).timeOfDayBucket as string) &&
        typeof (entry as Record<string, unknown>).sessionLogs === 'number' &&
        typeof (entry as Record<string, unknown>).completedSessionLogs === 'number' &&
        typeof (entry as Record<string, unknown>).endedEarlySessionLogs === 'number' &&
        typeof (entry as Record<string, unknown>).totalDurationSeconds === 'number'
    )
  );
}

function normalizeSummaryResponse(payload: unknown): SummarySnapshotData {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Summary response is invalid.');
  }

  const candidate = payload as Record<string, unknown>;
  if (
    !hasValidSummaryOverall(candidate.overallSummary) ||
    !hasValidSummaryByTypeCollection(candidate.byTypeSummary) ||
    !hasValidSummaryBySourceCollection(candidate.bySourceSummary) ||
    !hasValidSummaryByTimeOfDayCollection(candidate.byTimeOfDaySummary)
  ) {
    throw new Error('Summary response is invalid.');
  }

  return {
    overallSummary: candidate.overallSummary,
    byTypeSummary: candidate.byTypeSummary,
    bySourceSummary: candidate.bySourceSummary,
    byTimeOfDaySummary: candidate.byTimeOfDaySummary,
  };
}

function buildSummaryQueryString(request: SummaryApiRequest = {}): string {
  const query = new URLSearchParams();
  if (request.startAt) {
    query.set('startAt', request.startAt);
  }
  if (request.endAt) {
    query.set('endAt', request.endAt);
  }

  const queryString = query.toString();
  return queryString.length > 0 ? `?${queryString}` : '';
}

export function buildSummariesPath(request: SummaryApiRequest = {}): string {
  return `${SUMMARIES_COLLECTION_PATH}${buildSummaryQueryString(request)}`;
}

export function buildSummariesUrl(request: SummaryApiRequest = {}, apiBaseUrl?: string): string {
  return buildApiUrl(buildSummariesPath(request), apiBaseUrl);
}

export async function loadSummaryFromApi(
  request: SummaryApiRequest = {},
  apiBaseUrl?: string,
  signal?: AbortSignal
): Promise<SummarySnapshotData> {
  const payload = await requestJson<unknown>(buildSummariesPath(request), { apiBaseUrl, signal });
  return normalizeSummaryResponse(payload);
}
