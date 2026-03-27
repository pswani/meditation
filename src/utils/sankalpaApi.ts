import type { SankalpaGoal, SankalpaProgress, SankalpaStatus, TimeOfDayBucket } from '../types/sankalpa';
import { requestJson } from './apiClient';
import { buildApiPath, buildApiUrl } from './apiConfig';

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

const meditationTypes = new Set(['Vipassana', 'Ajapa', 'Tratak', 'Kriya', 'Sahaj']);
const goalTypes = new Set(['duration-based', 'session-count-based']);
const statuses = new Set(['active', 'completed', 'expired']);
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
    isValidIsoDate(candidate.createdAt)
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

export function buildSankalpaDetailPath(sankalpaId: string): string {
  return `${SANKALPAS_COLLECTION_PATH}/${sankalpaId}`;
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

export async function listSankalpaProgressFromApi(apiBaseUrl?: string, signal?: AbortSignal): Promise<SankalpaProgress[]> {
  const payload = await requestJson<unknown>(SANKALPAS_COLLECTION_PATH, { apiBaseUrl, signal });
  return normalizeProgressCollection(payload);
}

export async function persistSankalpaToApi(sankalpa: SankalpaGoal, apiBaseUrl?: string): Promise<SankalpaProgress> {
  const payload = await requestJson<unknown, SankalpaGoal>(buildSankalpaDetailPath(sankalpa.id), {
    method: 'PUT',
    apiBaseUrl,
    body: sankalpa,
  });

  return normalizeProgressPayload(payload);
}
