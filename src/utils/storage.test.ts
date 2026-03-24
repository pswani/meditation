import { beforeEach, describe, expect, it } from 'vitest';
import type { TimerSettings } from '../types/timer';
import { loadTimerSettings, saveTimerSettings } from './storage';

const rawTimerSettingsKey = 'meditation.timerSettings.v1';

describe('storage timer settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and loads timer settings', () => {
    const settings: TimerSettings = {
      durationMinutes: 25,
      meditationType: 'Ajapa',
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: true,
      intervalMinutes: 5,
      intervalSound: 'Soft Chime',
    };

    saveTimerSettings(settings);
    expect(loadTimerSettings()).toEqual(settings);
  });

  it('applies default interval sound fallback when stored value omits intervalSound', () => {
    localStorage.setItem(
      rawTimerSettingsKey,
      JSON.stringify({
        durationMinutes: 20,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
      })
    );

    expect(loadTimerSettings()).toMatchObject({
      intervalSound: 'Temple Bell',
    });
  });
});
