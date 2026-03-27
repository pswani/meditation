import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  areTimerSettingsEqual,
  buildTimerSettingsUrl,
  loadTimerSettingsFromApi,
  persistTimerSettingsToApi,
  TIMER_SETTINGS_ENDPOINT,
} from './timerSettingsApi';

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
    expect(settings.durationMinutes).toBe(24);
    expect(settings.meditationType).toBe('Vipassana');
  });

  it('persists timer settings through PUT', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'default',
          durationMinutes: 30,
          meditationType: 'Ajapa',
          startSound: 'Soft Chime',
          endSound: 'Temple Bell',
          intervalEnabled: true,
          intervalMinutes: 10,
          intervalSound: 'Wood Block',
        }),
      })
    );

    const saved = await persistTimerSettingsToApi({
      durationMinutes: 30,
      meditationType: 'Ajapa',
      startSound: 'Soft Chime',
      endSound: 'Temple Bell',
      intervalEnabled: true,
      intervalMinutes: 10,
      intervalSound: 'Wood Block',
    });

    expect(saved.intervalEnabled).toBe(true);
    expect(saved.intervalMinutes).toBe(10);
    expect(saved.intervalSound).toBe('Wood Block');
    expect(areTimerSettingsEqual(saved, {
      durationMinutes: 30,
      meditationType: 'Ajapa',
      startSound: 'Soft Chime',
      endSound: 'Temple Bell',
      intervalEnabled: true,
      intervalMinutes: 10,
      intervalSound: 'Wood Block',
    })).toBe(true);
  });
});
