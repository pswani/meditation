import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  areTimerSettingsEqual,
  buildTimerSettingsUrl,
  loadTimerSettingsFromApi,
  persistTimerSettingsToApi,
  TIMER_SETTINGS_ENDPOINT,
} from './timerSettingsApi';
import { SYNC_QUEUED_AT_HEADER } from './syncApi';

describe('timer settings api boundary', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads timer settings from the stable endpoint contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'default',
          timerMode: 'fixed',
          durationMinutes: 24,
          meditationType: 'Vipassana',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 5,
          intervalSound: 'Temple Bell',
        }),
      })
    );

    const settings = await loadTimerSettingsFromApi();

    expect(TIMER_SETTINGS_ENDPOINT).toBe('/api/settings/timer');
    expect(buildTimerSettingsUrl()).toBe('/api/settings/timer');
    expect(buildTimerSettingsUrl('http://192.168.1.25:8080/api')).toBe('http://192.168.1.25:8080/api/settings/timer');
    expect(settings.timerMode).toBe('fixed');
    expect(settings.durationMinutes).toBe(24);
    expect(settings.meditationType).toBe('Vipassana');
  });

  it('persists timer settings through PUT', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'default',
        timerMode: 'fixed',
        durationMinutes: 30,
        meditationType: 'Ajapa',
        startSound: 'Soft Chime',
        endSound: 'Temple Bell',
        intervalEnabled: true,
        intervalMinutes: 10,
        intervalSound: 'Wood Block',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const saved = await persistTimerSettingsToApi(
      {
        timerMode: 'fixed',
        durationMinutes: 30,
        meditationType: 'Ajapa',
        startSound: 'Soft Chime',
        endSound: 'Temple Bell',
        intervalEnabled: true,
        intervalMinutes: 10,
        intervalSound: 'Wood Block',
      },
      {
        syncQueuedAt: '2026-03-27T10:15:00.000Z',
      }
    );

    expect(saved.intervalEnabled).toBe(true);
    expect(saved.intervalMinutes).toBe(10);
    expect(saved.intervalSound).toBe('Wood Block');
    expect(areTimerSettingsEqual(saved, {
      timerMode: 'fixed',
      durationMinutes: 30,
      meditationType: 'Ajapa',
      startSound: 'Soft Chime',
      endSound: 'Temple Bell',
      intervalEnabled: true,
      intervalMinutes: 10,
      intervalSound: 'Wood Block',
    })).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/settings/timer',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          [SYNC_QUEUED_AT_HEADER]: '2026-03-27T10:15:00.000Z',
        }),
      })
    );
  });
});
