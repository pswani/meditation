import type { TimerSettings } from '../types/timer';
import { requestJson } from './apiClient';
import { buildApiPath, buildApiUrl } from './apiConfig';
import { buildSyncMutationHeaders, type SyncMutationRequestOptions } from './syncApi';
import {
  normalizeTimerSettings,
} from './timerSettingsNormalization';

export const TIMER_SETTINGS_PATH = '/settings/timer';
export const TIMER_SETTINGS_ENDPOINT = buildApiPath(TIMER_SETTINGS_PATH);

interface TimerSettingsApiResponse {
  readonly id?: string;
  readonly timerMode?: TimerSettings['timerMode'];
  readonly durationMinutes?: number | null;
  readonly lastFixedDurationMinutes?: number;
  readonly meditationType: string;
  readonly startSound: string;
  readonly endSound: string;
  readonly intervalEnabled: boolean;
  readonly intervalMinutes: number;
  readonly intervalSound: string;
  readonly updatedAt?: string;
}

function isTimerSettingsApiResponse(value: unknown): value is TimerSettingsApiResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.timerMode === 'fixed' || candidate.timerMode === 'open-ended' || typeof candidate.timerMode === 'undefined') &&
    (typeof candidate.durationMinutes === 'number' || candidate.durationMinutes === null || typeof candidate.durationMinutes === 'undefined') &&
    (typeof candidate.lastFixedDurationMinutes === 'number' || typeof candidate.lastFixedDurationMinutes === 'undefined') &&
    typeof candidate.meditationType === 'string' &&
    typeof candidate.startSound === 'string' &&
    typeof candidate.endSound === 'string' &&
    typeof candidate.intervalEnabled === 'boolean' &&
    typeof candidate.intervalMinutes === 'number' &&
    typeof candidate.intervalSound === 'string'
  );
}

function normalizeTimerSettingsPayload(payload: unknown): TimerSettings {
  if (!isTimerSettingsApiResponse(payload)) {
    throw new Error('Timer settings response is invalid.');
  }

  return normalizeTimerSettings({
    ...payload,
    meditationType: payload.meditationType as TimerSettings['meditationType'],
  });
}

export function buildTimerSettingsUrl(apiBaseUrl?: string): string {
  return buildApiUrl(TIMER_SETTINGS_PATH, apiBaseUrl);
}

export function areTimerSettingsEqual(left: TimerSettings, right: TimerSettings): boolean {
  const normalizedLeft = normalizeTimerSettings(left);
  const normalizedRight = normalizeTimerSettings(right);

  return (
    normalizedLeft.timerMode === normalizedRight.timerMode &&
    normalizedLeft.durationMinutes === normalizedRight.durationMinutes &&
    normalizedLeft.lastFixedDurationMinutes === normalizedRight.lastFixedDurationMinutes &&
    normalizedLeft.meditationType === normalizedRight.meditationType &&
    normalizedLeft.startSound === normalizedRight.startSound &&
    normalizedLeft.endSound === normalizedRight.endSound &&
    normalizedLeft.intervalEnabled === normalizedRight.intervalEnabled &&
    normalizedLeft.intervalMinutes === normalizedRight.intervalMinutes &&
    normalizedLeft.intervalSound === normalizedRight.intervalSound
  );
}

export async function loadTimerSettingsFromApi(apiBaseUrl?: string): Promise<TimerSettings> {
  const payload = await requestJson<unknown>(TIMER_SETTINGS_PATH, { apiBaseUrl });
  return normalizeTimerSettingsPayload(payload);
}

export async function persistTimerSettingsToApi(
  settings: TimerSettings,
  options: SyncMutationRequestOptions = {}
): Promise<TimerSettings> {
  const payload = await requestJson<unknown, TimerSettings>(TIMER_SETTINGS_PATH, {
    method: 'PUT',
    apiBaseUrl: options.apiBaseUrl,
    signal: options.signal,
    headers: buildSyncMutationHeaders(options.syncQueuedAt),
    body: settings,
  });

  return normalizeTimerSettingsPayload(payload);
}
