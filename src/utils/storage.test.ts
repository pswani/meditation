import { beforeEach, describe, expect, it } from 'vitest';
import type { SessionLog } from '../types/sessionLog';
import type { TimerSettings } from '../types/timer';
import { loadSessionLogs, loadTimerSettings, saveSessionLogs, saveTimerSettings } from './storage';

const rawTimerSettingsKey = 'meditation.timerSettings.v1';
const rawSessionLogsKey = 'meditation.sessionLogs.v1';

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

  it('returns null when stored timer settings payload is invalid', () => {
    localStorage.setItem(rawTimerSettingsKey, JSON.stringify({ durationMinutes: '20' }));

    expect(loadTimerSettings()).toBeNull();
  });
});

describe('storage session logs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and loads session logs for local-first integration boundaries', () => {
    const logs: SessionLog[] = [
      {
        id: 'log-1',
        startedAt: '2026-03-24T10:00:00.000Z',
        endedAt: '2026-03-24T10:20:00.000Z',
        meditationType: 'Vipassana',
        intendedDurationSeconds: 1200,
        completedDurationSeconds: 1200,
        status: 'completed',
        source: 'auto log',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 0,
        intervalSound: 'None',
      },
    ];

    saveSessionLogs(logs);
    expect(loadSessionLogs()).toEqual(logs);
  });

  it('falls back to an empty list when stored session logs are malformed', () => {
    localStorage.setItem(rawSessionLogsKey, '{not-json');
    expect(loadSessionLogs()).toEqual([]);
  });

  it('falls back to an empty list when stored session logs are not an array', () => {
    localStorage.setItem(rawSessionLogsKey, JSON.stringify({ id: 'log-1' }));
    expect(loadSessionLogs()).toEqual([]);
  });
});
