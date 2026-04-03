import type { SankalpaGoal, SankalpaProgress, SankalpaStatus, TimeOfDayBucket } from '../types/sankalpa';
import { ApiClientError, requestJson } from './apiClient';
import { buildApiPath, buildApiUrl } from './apiConfig';
import { buildSyncMutationHeaders } from './syncApi';

export const SANKALPAS_COLLECTION_PATH = '/sankalpas';
export const SANKALPAS_COLLECTION_ENDPOINT = buildApiPath(SANKALPAS_COLLECTION_PATH);

interface SankalpaGoalApiResponse {
  readonly id: string;
  readonly goalType: SankalpaGoal['goalType'];
  readonly targetValue: number;
  readonly days: number;
  readonly meditationType?: SankalpaGoal['meditationType'] | null;
  readonly timeOfDayBucket?: TimeOfDayBucket | null;
  readonly createdAt: string;
  readonly archived?: boolean;
}

interface SankalpaProgressApiResponse {
  readonly goal: SankalpaGoalApiResponse;
  readonly status: SankalpaStatus;
  readonly deadlineAt: string;
  readonly matchedSessionCount: number;
  readonly matchedDurationSeconds: number;
  readonly targetSessionCount: number;
  readonly targetDurationSeconds: number;
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

const meditationTypes = new Set(['Vipassana', 'Ajapa', 'Tratak', 'Kriya', 'Sahaj']);
const goalTypes = new Set(['duration-based', 'session-count-based']);
const statuses = new Set(['active', 'completed', 'expired', 'archived']);
const timeOfDayBuckets = new Set(['morning', 'afternoon', 'evening', 'night']);

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isValidGoalPayload(value: unknown): value is SankalpaGoalApiResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    goalTypes.has(candidate.goalType as string) &&
    typeof candidate.targetValue === 'number' &&
    Number.isFinite(candidate.targetValue) &&
    candidate.targetValue > 0 &&
    typeof candidate.days === 'number' &&
    Number.isInteger(candidate.days) &&
    candidate.days > 0 &&
    (typeof candidate.meditationType === 'undefined' ||
      candidate.meditationType === null ||
      meditationTypes.has(candidate.meditationType as string)) &&
    (typeof candidate.timeOfDayBucket === 'undefined' ||
      candidate.timeOfDayBucket === null ||
      timeOfDayBuckets.has(candidate.timeOfDayBucket as string)) &&
    isValidIsoDate(candidate.createdAt) &&
    (typeof candidate.archived === 'undefined' || typeof candidate.archived === 'boolean')
  );
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
    typeof candidate.progressRatio === 'number'
  );
}

function normalizeGoalPayload(payload: SankalpaGoalApiResponse): SankalpaGoal {
  return {
    id: payload.id,
    goalType: payload.goalType,
    targetValue: payload.targetValue,
    days: payload.days,
    meditationType: payload.meditationType ?? undefined,
    timeOfDayBucket: payload.timeOfDayBucket ?? undefined,
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

  if (candidate.outcome === 'stale' && candidate.currentSankalpa) {
    return {
      outcome: 'stale',
      currentSankalpa: normalizeProgressPayload(candidate.currentSankalpa),
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
