import type { SessionLog } from '../types/sessionLog';
import type { ManualLogCreateRequest } from './manualLog';
import { requestJson } from './apiClient';
import { buildApiPath, buildApiUrl } from './apiConfig';
import { buildSyncMutationHeaders, type SyncMutationRequestOptions } from './syncApi';
import {
  DEFAULT_END_SOUND_LABEL,
  DEFAULT_INTERVAL_SOUND_LABEL,
  DEFAULT_START_SOUND_LABEL,
  normalizeTimerSoundLabel,
} from './timerSound';

export const SESSION_LOGS_COLLECTION_PATH = '/session-logs';
export const SESSION_LOGS_COLLECTION_ENDPOINT = buildApiPath(SESSION_LOGS_COLLECTION_PATH);
export const MANUAL_SESSION_LOGS_CREATE_PATH = '/session-logs/manual';
export const MANUAL_SESSION_LOGS_CREATE_ENDPOINT = buildApiPath(MANUAL_SESSION_LOGS_CREATE_PATH);

interface SessionLogListRequest {
  readonly startAt?: string;
  readonly endAt?: string;
  readonly meditationType?: SessionLog['meditationType'];
  readonly source?: SessionLog['source'];
  readonly page?: number;
  readonly size?: number;
  readonly apiBaseUrl?: string;
  readonly signal?: AbortSignal;
}

interface SessionLogApiResponse {
  readonly id: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly meditationType: SessionLog['meditationType'];
  readonly timerMode?: SessionLog['timerMode'];
  readonly intendedDurationSeconds: number | null;
  readonly completedDurationSeconds: number;
  readonly status: SessionLog['status'];
  readonly source: SessionLog['source'];
  readonly startSound: string;
  readonly endSound: string;
  readonly intervalEnabled: boolean;
  readonly intervalMinutes: number;
  readonly intervalSound: string;
  readonly playlistId?: string;
  readonly playlistName?: string;
  readonly playlistRunId?: string;
  readonly playlistRunStartedAt?: string;
  readonly playlistItemPosition?: number;
  readonly playlistItemCount?: number;
  readonly customPlayId?: string;
  readonly customPlayName?: string;
  readonly customPlayRecordingLabel?: string;
}

interface SessionLogListApiResponse {
  readonly items: unknown;
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly hasNextPage: boolean;
}

export interface SessionLogListResult {
  readonly items: SessionLog[];
  readonly page: number;
  readonly size: number;
  readonly totalItems: number;
  readonly hasNextPage: boolean;
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isSessionLogApiResponse(value: unknown): value is SessionLogApiResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    isValidIsoDate(candidate.startedAt) &&
    isValidIsoDate(candidate.endedAt) &&
    typeof candidate.meditationType === 'string' &&
    (candidate.timerMode === 'fixed' || candidate.timerMode === 'open-ended' || typeof candidate.timerMode === 'undefined') &&
    (typeof candidate.intendedDurationSeconds === 'number' || candidate.intendedDurationSeconds === null) &&
    typeof candidate.completedDurationSeconds === 'number' &&
    (candidate.status === 'completed' || candidate.status === 'ended early') &&
    (candidate.source === 'auto log' || candidate.source === 'manual log') &&
    typeof candidate.startSound === 'string' &&
    typeof candidate.endSound === 'string' &&
    typeof candidate.intervalEnabled === 'boolean' &&
    typeof candidate.intervalMinutes === 'number' &&
    typeof candidate.intervalSound === 'string' &&
    (typeof candidate.playlistId === 'string' || typeof candidate.playlistId === 'undefined' || candidate.playlistId === null) &&
    (typeof candidate.playlistName === 'string' || typeof candidate.playlistName === 'undefined' || candidate.playlistName === null) &&
    (typeof candidate.playlistRunId === 'string' || typeof candidate.playlistRunId === 'undefined' || candidate.playlistRunId === null) &&
    (typeof candidate.playlistRunStartedAt === 'string' ||
      typeof candidate.playlistRunStartedAt === 'undefined' ||
      candidate.playlistRunStartedAt === null) &&
    (typeof candidate.playlistItemPosition === 'number' ||
      typeof candidate.playlistItemPosition === 'undefined' ||
      candidate.playlistItemPosition === null) &&
    (typeof candidate.playlistItemCount === 'number' ||
      typeof candidate.playlistItemCount === 'undefined' ||
      candidate.playlistItemCount === null) &&
    (typeof candidate.customPlayId === 'string' || typeof candidate.customPlayId === 'undefined' || candidate.customPlayId === null) &&
    (typeof candidate.customPlayName === 'string' ||
      typeof candidate.customPlayName === 'undefined' ||
      candidate.customPlayName === null) &&
    (typeof candidate.customPlayRecordingLabel === 'string' ||
      typeof candidate.customPlayRecordingLabel === 'undefined' ||
      candidate.customPlayRecordingLabel === null)
  );
}

function normalizeSessionLogPayload(payload: unknown): SessionLog {
  if (!isSessionLogApiResponse(payload)) {
    throw new Error('Session log response is invalid.');
  }

  return {
    id: payload.id,
    startedAt: payload.startedAt,
    endedAt: payload.endedAt,
    meditationType: payload.meditationType,
    timerMode: payload.timerMode ?? 'fixed',
    intendedDurationSeconds: payload.intendedDurationSeconds,
    completedDurationSeconds: payload.completedDurationSeconds,
    status: payload.status,
    source: payload.source,
    startSound: normalizeTimerSoundLabel(payload.startSound, DEFAULT_START_SOUND_LABEL),
    endSound: normalizeTimerSoundLabel(payload.endSound, DEFAULT_END_SOUND_LABEL),
    intervalEnabled: payload.intervalEnabled,
    intervalMinutes: payload.intervalMinutes,
    intervalSound: normalizeTimerSoundLabel(payload.intervalSound, DEFAULT_INTERVAL_SOUND_LABEL),
    playlistId: payload.playlistId ?? undefined,
    playlistName: payload.playlistName ?? undefined,
    playlistRunId: payload.playlistRunId ?? undefined,
    playlistRunStartedAt: payload.playlistRunStartedAt ?? undefined,
    playlistItemPosition: payload.playlistItemPosition ?? undefined,
    playlistItemCount: payload.playlistItemCount ?? undefined,
    customPlayId: payload.customPlayId ?? undefined,
    customPlayName: payload.customPlayName ?? undefined,
    customPlayRecordingLabel: payload.customPlayRecordingLabel ?? undefined,
  };
}

function normalizeSessionLogCollection(payload: unknown): SessionLog[] {
  if (!Array.isArray(payload)) {
    throw new Error('Session log collection response is invalid.');
  }

  return payload
    .map(normalizeSessionLogPayload)
    .sort((left, right) => Date.parse(right.endedAt) - Date.parse(left.endedAt));
}

function normalizeSessionLogListPayload(payload: unknown): SessionLogListResult {
  if (Array.isArray(payload)) {
    const items = normalizeSessionLogCollection(payload);
    return {
      items,
      page: 0,
      size: items.length,
      totalItems: items.length,
      hasNextPage: false,
    };
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Session log collection response is invalid.');
  }

  const candidate = payload as SessionLogListApiResponse;
  if (
    !('items' in candidate) ||
    typeof candidate.page !== 'number' ||
    typeof candidate.size !== 'number' ||
    typeof candidate.totalItems !== 'number' ||
    typeof candidate.hasNextPage !== 'boolean'
  ) {
    throw new Error('Session log collection response is invalid.');
  }

  return {
    items: normalizeSessionLogCollection(candidate.items),
    page: candidate.page,
    size: candidate.size,
    totalItems: candidate.totalItems,
    hasNextPage: candidate.hasNextPage,
  };
}

function buildSessionLogQueryString(request: Omit<SessionLogListRequest, 'apiBaseUrl' | 'signal'> = {}): string {
  const query = new URLSearchParams();
  if (request.startAt) {
    query.set('startAt', request.startAt);
  }
  if (request.endAt) {
    query.set('endAt', request.endAt);
  }
  if (request.meditationType) {
    query.set('meditationType', request.meditationType);
  }
  if (request.source) {
    query.set('source', request.source);
  }
  if (typeof request.page === 'number') {
    query.set('page', String(request.page));
  }
  if (typeof request.size === 'number') {
    query.set('size', String(request.size));
  }

  const queryString = query.toString();
  return queryString.length > 0 ? `?${queryString}` : '';
}

export function buildSessionLogsCollectionPath(
  request: Omit<SessionLogListRequest, 'apiBaseUrl' | 'signal'> = {}
): string {
  return `${SESSION_LOGS_COLLECTION_PATH}${buildSessionLogQueryString(request)}`;
}

export function buildSessionLogDetailPath(sessionLogId: string): string {
  return `${SESSION_LOGS_COLLECTION_PATH}/${sessionLogId}`;
}

export function buildSessionLogsCollectionUrl(
  request: Omit<SessionLogListRequest, 'apiBaseUrl' | 'signal'> = {},
  apiBaseUrl?: string
): string {
  return buildApiUrl(buildSessionLogsCollectionPath(request), apiBaseUrl);
}

export function buildManualSessionLogCreateUrl(apiBaseUrl?: string): string {
  return buildApiUrl(MANUAL_SESSION_LOGS_CREATE_PATH, apiBaseUrl);
}

export function buildSessionLogDetailUrl(sessionLogId: string, apiBaseUrl?: string): string {
  return buildApiUrl(buildSessionLogDetailPath(sessionLogId), apiBaseUrl);
}

export async function listSessionLogsFromApi(request: SessionLogListRequest = {}): Promise<SessionLogListResult> {
  const payload = await requestJson<unknown>(buildSessionLogsCollectionPath(request), {
    apiBaseUrl: request.apiBaseUrl,
    signal: request.signal,
  });
  return normalizeSessionLogListPayload(payload);
}

export async function persistSessionLogToApi(
  sessionLog: SessionLog,
  options: SyncMutationRequestOptions = {}
): Promise<SessionLog> {
  const payload = await requestJson<unknown, SessionLog>(buildSessionLogDetailPath(sessionLog.id), {
    method: 'PUT',
    apiBaseUrl: options.apiBaseUrl,
    signal: options.signal,
    headers: buildSyncMutationHeaders(options.syncQueuedAt),
    body: sessionLog,
  });

  return normalizeSessionLogPayload(payload);
}

export async function createManualSessionLogInApi(
  request: ManualLogCreateRequest,
  apiBaseUrl?: string
): Promise<SessionLog> {
  const payload = await requestJson<unknown, ManualLogCreateRequest>(MANUAL_SESSION_LOGS_CREATE_PATH, {
    method: 'POST',
    apiBaseUrl,
    body: request,
  });

  return normalizeSessionLogPayload(payload);
}
