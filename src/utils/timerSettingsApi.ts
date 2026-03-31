import type { TimerSettings } from '../types/timer';
import { requestJson } from './apiClient';
import { buildApiPath, buildApiUrl } from './apiConfig';
import { buildSyncMutationHeaders, type SyncMutationRequestOptions } from './syncApi';
import {
  normalizeFixedDurationMinutes,
  normalizeTimerMode,
  resolveLastFixedDurationMinutes,
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

  const timerMode = normalizeTimerMode(payload.timerMode);
  const lastFixedDurationMinutes = resolveLastFixedDurationMinutes(payload.durationMinutes, payload.lastFixedDurationMinutes);
  const durationMinutes = normalizeFixedDurationMinutes(timerMode, payload.durationMinutes, payload.lastFixedDurationMinutes);

  return {
    timerMode,
    durationMinutes,
    lastFixedDurationMinutes,
    meditationType: payload.meditationType as TimerSettings['meditationType'],
    startSound: payload.startSound,
    endSound: payload.endSound,
    intervalEnabled: payload.intervalEnabled,
    intervalMinutes: payload.intervalMinutes,
    intervalSound: payload.intervalSound,
  };
}

export function buildTimerSettingsUrl(apiBaseUrl?: string): string {
  return buildApiUrl(TIMER_SETTINGS_PATH, apiBaseUrl);
}

export function areTimerSettingsEqual(left: TimerSettings, right: TimerSettings): boolean {
  const leftTimerMode = normalizeTimerMode(left.timerMode);
  const rightTimerMode = normalizeTimerMode(right.timerMode);
  const leftLastFixedDurationMinutes = resolveLastFixedDurationMinutes(left.durationMinutes, left.lastFixedDurationMinutes);
  const rightLastFixedDurationMinutes = resolveLastFixedDurationMinutes(right.durationMinutes, right.lastFixedDurationMinutes);

  return (
    leftTimerMode === rightTimerMode &&
    normalizeFixedDurationMinutes(leftTimerMode, left.durationMinutes, left.lastFixedDurationMinutes) ===
      normalizeFixedDurationMinutes(rightTimerMode, right.durationMinutes, right.lastFixedDurationMinutes) &&
    leftLastFixedDurationMinutes === rightLastFixedDurationMinutes &&
    left.meditationType === right.meditationType &&
    left.startSound === right.startSound &&
    left.endSound === right.endSound &&
    left.intervalEnabled === right.intervalEnabled &&
    left.intervalMinutes === right.intervalMinutes &&
    left.intervalSound === right.intervalSound
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
