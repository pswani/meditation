import type {
  SankalpaGoal,
  SankalpaObservanceDay,
  SankalpaObservanceRecord,
  SankalpaProgress,
  SankalpaStatus,
  TimeOfDayBucket,
} from '../types/sankalpa';
import { isMeditationType, isTimeOfDayBucket } from '../types/referenceData';
import { ApiClientError, requestJson } from './apiClient';
import { buildApiPath, buildApiUrl } from './apiConfig';
import { buildSyncMutationHeaders, extractSyncDeleteCurrentRecord } from './syncApi';

export const SANKALPAS_COLLECTION_PATH = '/sankalpas';
export const SANKALPAS_COLLECTION_ENDPOINT = buildApiPath(SANKALPAS_COLLECTION_PATH);

interface SankalpaGoalApiResponse {
  readonly id: string;
  readonly title?: string | null;
  readonly goalType: SankalpaGoal['goalType'];
  readonly targetValue: number;
  readonly days: number;
  readonly qualifyingDaysPerWeek?: number | null;
  readonly meditationType?: SankalpaGoal['meditationType'] | null;
  readonly timeOfDayBucket?: TimeOfDayBucket | null;
  readonly observanceLabel?: string | null;
  readonly observanceRecords?: SankalpaObservanceRecordApiResponse[] | null;
  readonly createdAt: string;
  readonly archived?: boolean;
}

interface SankalpaObservanceRecordApiResponse {
  readonly date: string;
  readonly status: SankalpaObservanceRecord['status'];
}

interface SankalpaObservanceDayApiResponse {
  readonly date: string;
  readonly status: SankalpaObservanceDay['status'];
  readonly isFuture: boolean;
}

interface SankalpaProgressApiResponse {
  readonly goal: SankalpaGoalApiResponse;
  readonly status: SankalpaStatus;
  readonly deadlineAt: string;
  readonly matchedSessionCount: number;
  readonly matchedDurationSeconds: number;
  readonly targetSessionCount: number;
  readonly targetDurationSeconds: number;
  readonly metRecurringWeekCount?: number;
  readonly targetRecurringWeekCount?: number;
  readonly recurringWeeks?: SankalpaProgress['recurringWeeks'] | null;
  readonly matchedObservanceCount?: number;
  readonly missedObservanceCount?: number;
  readonly pendingObservanceCount?: number;
  readonly targetObservanceCount?: number;
  readonly observanceDays?: SankalpaObservanceDayApiResponse[] | null;
  readonly progressRatio: number;
}

interface SankalpaApiOptions {
  readonly apiBaseUrl?: string;
  readonly signal?: AbortSignal;
  readonly timeZone?: string;
  readonly syncQueuedAt?: string;
}

interface SankalpaDeleteApiResponse {
  readonly outcome: 'deleted' | 'stale';
  readonly currentRecord?: SankalpaProgressApiResponse | null;
  readonly currentSankalpa?: SankalpaProgressApiResponse | null;
}

export type SankalpaDeleteResult =
  | {
      readonly outcome: 'deleted';
    }
  | {
      readonly outcome: 'stale';
      readonly currentSankalpa: SankalpaProgress;
    };

const goalTypes = new Set(['duration-based', 'session-count-based', 'observance-based']);
const statuses = new Set(['active', 'completed', 'expired', 'archived']);

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isValidObservanceDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidObservanceRecordPayload(value: unknown): value is SankalpaObservanceRecordApiResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return isValidObservanceDate(candidate.date) && (candidate.status === 'observed' || candidate.status === 'missed');
}

function isValidObservanceDayPayload(value: unknown): value is SankalpaObservanceDayApiResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    isValidObservanceDate(candidate.date) &&
    (candidate.status === 'pending' || candidate.status === 'observed' || candidate.status === 'missed') &&
    typeof candidate.isFuture === 'boolean'
  );
}

function isValidGoalPayload(value: unknown): value is SankalpaGoalApiResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const qualifyingDaysPerWeek =
    typeof candidate.qualifyingDaysPerWeek === 'number' ? candidate.qualifyingDaysPerWeek : null;
  const days = typeof candidate.days === 'number' ? candidate.days : null;
  const hasValidBaseShape = (
    typeof candidate.id === 'string' &&
    (typeof candidate.title === 'undefined' ||
      candidate.title === null ||
      typeof candidate.title === 'string') &&
    goalTypes.has(candidate.goalType as string) &&
    typeof candidate.targetValue === 'number' &&
    Number.isFinite(candidate.targetValue) &&
    candidate.targetValue > 0 &&
    typeof candidate.days === 'number' &&
    Number.isInteger(candidate.days) &&
    candidate.days > 0 &&
    (typeof candidate.qualifyingDaysPerWeek === 'undefined' ||
      candidate.qualifyingDaysPerWeek === null ||
      (qualifyingDaysPerWeek !== null &&
        Number.isInteger(qualifyingDaysPerWeek) &&
        qualifyingDaysPerWeek > 0 &&
        qualifyingDaysPerWeek <= 7)) &&
    (typeof candidate.meditationType === 'undefined' ||
      candidate.meditationType === null ||
      isMeditationType(candidate.meditationType)) &&
    (typeof candidate.timeOfDayBucket === 'undefined' ||
      candidate.timeOfDayBucket === null ||
      isTimeOfDayBucket(candidate.timeOfDayBucket)) &&
    (typeof candidate.observanceLabel === 'undefined' ||
      candidate.observanceLabel === null ||
      typeof candidate.observanceLabel === 'string') &&
    (typeof candidate.observanceRecords === 'undefined' ||
      candidate.observanceRecords === null ||
      (Array.isArray(candidate.observanceRecords) && candidate.observanceRecords.every(isValidObservanceRecordPayload))) &&
    isValidIsoDate(candidate.createdAt) &&
    (typeof candidate.archived === 'undefined' || typeof candidate.archived === 'boolean')
  );

  if (!hasValidBaseShape) {
    return false;
  }

  if (
    qualifyingDaysPerWeek !== null &&
    days !== null &&
    days % 7 !== 0
  ) {
    return false;
  }

  return true;
}

function isValidProgressPayload(value: unknown): value is SankalpaProgressApiResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    isValidGoalPayload(candidate.goal) &&
    statuses.has(candidate.status as string) &&
    isValidIsoDate(candidate.deadlineAt) &&
    typeof candidate.matchedSessionCount === 'number' &&
    typeof candidate.matchedDurationSeconds === 'number' &&
    typeof candidate.targetSessionCount === 'number' &&
    typeof candidate.targetDurationSeconds === 'number' &&
    (typeof candidate.metRecurringWeekCount === 'undefined' || typeof candidate.metRecurringWeekCount === 'number') &&
    (typeof candidate.targetRecurringWeekCount === 'undefined' || typeof candidate.targetRecurringWeekCount === 'number') &&
    (typeof candidate.recurringWeeks === 'undefined' ||
      candidate.recurringWeeks === null ||
      (Array.isArray(candidate.recurringWeeks) &&
        candidate.recurringWeeks.every(
          (entry) =>
            typeof entry.weekIndex === 'number' &&
            typeof entry.startDate === 'string' &&
            typeof entry.endDate === 'string' &&
            typeof entry.qualifyingDayCount === 'number' &&
            typeof entry.requiredQualifyingDayCount === 'number' &&
            (entry.status === 'met' || entry.status === 'active' || entry.status === 'missed' || entry.status === 'upcoming')
        ))) &&
    (typeof candidate.matchedObservanceCount === 'undefined' || typeof candidate.matchedObservanceCount === 'number') &&
    (typeof candidate.missedObservanceCount === 'undefined' || typeof candidate.missedObservanceCount === 'number') &&
    (typeof candidate.pendingObservanceCount === 'undefined' || typeof candidate.pendingObservanceCount === 'number') &&
    (typeof candidate.targetObservanceCount === 'undefined' || typeof candidate.targetObservanceCount === 'number') &&
    (typeof candidate.observanceDays === 'undefined' ||
      candidate.observanceDays === null ||
      (Array.isArray(candidate.observanceDays) && candidate.observanceDays.every(isValidObservanceDayPayload))) &&
    typeof candidate.progressRatio === 'number'
  );
}

function normalizeGoalPayload(payload: SankalpaGoalApiResponse): SankalpaGoal {
  return {
    id: payload.id,
    title: payload.title?.trim() || undefined,
    goalType: payload.goalType,
    targetValue: payload.targetValue,
    days: payload.days,
    qualifyingDaysPerWeek: payload.qualifyingDaysPerWeek ?? undefined,
    meditationType: payload.meditationType ?? undefined,
    timeOfDayBucket: payload.timeOfDayBucket ?? undefined,
    observanceLabel: payload.observanceLabel?.trim() || undefined,
    observanceRecords:
      payload.observanceRecords?.map((record) => ({
        date: record.date,
        status: record.status,
      })) ?? undefined,
    createdAt: payload.createdAt,
    archived: payload.archived ?? false,
  };
}

function normalizeProgressPayload(payload: unknown): SankalpaProgress {
  if (!isValidProgressPayload(payload)) {
    throw new Error('Sankalpa response is invalid.');
  }

  return {
    goal: normalizeGoalPayload(payload.goal),
    status: payload.status,
    deadlineAt: payload.deadlineAt,
    matchedSessionCount: payload.matchedSessionCount,
    matchedDurationSeconds: payload.matchedDurationSeconds,
    targetSessionCount: payload.targetSessionCount,
    targetDurationSeconds: payload.targetDurationSeconds,
    metRecurringWeekCount: payload.metRecurringWeekCount ?? 0,
    targetRecurringWeekCount: payload.targetRecurringWeekCount ?? 0,
    recurringWeeks:
      payload.recurringWeeks?.map((week) => ({
        weekIndex: week.weekIndex,
        startDate: week.startDate,
        endDate: week.endDate,
        qualifyingDayCount: week.qualifyingDayCount,
        requiredQualifyingDayCount: week.requiredQualifyingDayCount,
        status: week.status,
      })) ?? [],
    matchedObservanceCount: payload.matchedObservanceCount ?? 0,
    missedObservanceCount: payload.missedObservanceCount ?? 0,
    pendingObservanceCount: payload.pendingObservanceCount ?? 0,
    targetObservanceCount: payload.targetObservanceCount ?? 0,
    observanceDays:
      payload.observanceDays?.map((entry) => ({
        date: entry.date,
        status: entry.status,
        isFuture: entry.isFuture,
      })) ?? [],
    progressRatio: payload.progressRatio,
  };
}

function normalizeProgressCollection(payload: unknown): SankalpaProgress[] {
  if (!Array.isArray(payload)) {
    throw new Error('Sankalpa collection response is invalid.');
  }

  return payload.map(normalizeProgressPayload);
}

function normalizeDeleteResult(payload: unknown): SankalpaDeleteResult {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Sankalpa delete response is invalid.');
  }

  const candidate = payload as SankalpaDeleteApiResponse;
  if (candidate.outcome === 'deleted') {
    return { outcome: 'deleted' };
  }

  const currentRecord = extractSyncDeleteCurrentRecord(candidate as unknown as Record<string, unknown>, ['currentSankalpa']);
  if (candidate.outcome === 'stale' && currentRecord) {
    return {
      outcome: 'stale',
      currentSankalpa: normalizeProgressPayload(currentRecord),
    };
  }

  throw new Error('Sankalpa delete response is invalid.');
}

export function buildSankalpaDetailPath(sankalpaId: string): string {
  return `${SANKALPAS_COLLECTION_PATH}/${sankalpaId}`;
}

function buildSankalpaQueryString(timeZone?: string): string {
  if (!timeZone) {
    return '';
  }

  return `?${new URLSearchParams({ timeZone }).toString()}`;
}

function buildSankalpaCollectionPath(timeZone?: string): string {
  return `${SANKALPAS_COLLECTION_PATH}${buildSankalpaQueryString(timeZone)}`;
}

function buildSankalpaDetailRequestPath(sankalpaId: string, timeZone?: string): string {
  return `${buildSankalpaDetailPath(sankalpaId)}${buildSankalpaQueryString(timeZone)}`;
}

export function buildSankalpaDetailEndpoint(sankalpaId: string): string {
  return buildApiPath(buildSankalpaDetailPath(sankalpaId));
}

export function buildSankalpaCollectionUrl(apiBaseUrl?: string): string {
  return buildApiUrl(SANKALPAS_COLLECTION_PATH, apiBaseUrl);
}

export function buildSankalpaDetailUrl(sankalpaId: string, apiBaseUrl?: string): string {
  return buildApiUrl(buildSankalpaDetailPath(sankalpaId), apiBaseUrl);
}

export async function listSankalpaProgressFromApi(options: SankalpaApiOptions = {}): Promise<SankalpaProgress[]> {
  const payload = await requestJson<unknown>(buildSankalpaCollectionPath(options.timeZone), {
    apiBaseUrl: options.apiBaseUrl,
    signal: options.signal,
  });
  return normalizeProgressCollection(payload);
}

export async function persistSankalpaToApi(sankalpa: SankalpaGoal, options: SankalpaApiOptions = {}): Promise<SankalpaProgress> {
  const payload = await requestJson<unknown, SankalpaGoal>(buildSankalpaDetailRequestPath(sankalpa.id, options.timeZone), {
    method: 'PUT',
    apiBaseUrl: options.apiBaseUrl,
    signal: options.signal,
    headers: buildSyncMutationHeaders(options.syncQueuedAt),
    body: sankalpa,
  });

  return normalizeProgressPayload(payload);
}

export async function deleteSankalpaFromApi(
  sankalpaId: string,
  options: SankalpaApiOptions = {}
): Promise<SankalpaDeleteResult> {
  const url = buildApiUrl(buildSankalpaDetailRequestPath(sankalpaId, options.timeZone), options.apiBaseUrl);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...buildSyncMutationHeaders(options.syncQueuedAt),
      },
      signal: options.signal,
    });
  } catch {
    throw new ApiClientError('Unable to reach the API right now.', url, {
      kind: 'network',
    });
  }

  if (response.status === 204) {
    return {
      outcome: 'deleted',
    };
  }

  if (!response.ok) {
    let detail: string | null = null;

    try {
      const responseText = await response.text();
      detail = responseText.trim() ? responseText : null;
    } catch {
      detail = null;
    }

    throw new ApiClientError(`API request failed with status ${response.status}.`, url, {
      status: response.status,
      detail,
      kind: 'http',
    });
  }

  const payload = await response.json();
  return normalizeDeleteResult(payload);
}
