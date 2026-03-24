import { beforeEach, describe, expect, it } from 'vitest';
import type { CustomPlay } from '../types/customPlay';
import type { SessionLog } from '../types/sessionLog';
import type { TimerSettings } from '../types/timer';
import { loadCustomPlays, loadSessionLogs, loadTimerSettings, saveCustomPlays, saveSessionLogs, saveTimerSettings } from './storage';

const rawTimerSettingsKey = 'meditation.timerSettings.v1';
const rawSessionLogsKey = 'meditation.sessionLogs.v1';
const rawCustomPlaysKey = 'meditation.customPlays.v1';

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

  it('drops malformed log entries while keeping valid stored session logs', () => {
    localStorage.setItem(
      rawSessionLogsKey,
      JSON.stringify([
        {
          id: 'log-valid',
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
        {
          id: 'log-invalid-future-shape',
          startedAt: '2026-03-24T11:00:00.000Z',
          endedAt: '2026-03-24T11:15:00.000Z',
          meditationType: 'Ajapa',
          intendedDurationSeconds: 900,
          completedDurationSeconds: 900,
          status: 'done',
          source: 'manual log',
          startSound: 'None',
          endSound: 'None',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
        },
      ])
    );

    expect(loadSessionLogs()).toEqual([
      {
        id: 'log-valid',
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
    ]);
  });
});

describe('storage custom plays', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and loads extended custom-play fields', () => {
    const customPlays: CustomPlay[] = [
      {
        id: 'play-1',
        name: 'Morning Focus',
        meditationType: 'Vipassana',
        durationMinutes: 20,
        startSound: 'Soft Chime',
        endSound: 'Temple Bell',
        mediaAssetId: 'media-vipassana-sit-20',
        mediaAssetLabel: 'Vipassana Sit (20 min)',
        mediaAssetPath: '/media/custom-plays/vipassana-sit-20.mp3',
        recordingLabel: 'Session A',
        favorite: true,
        createdAt: '2026-03-24T08:00:00.000Z',
        updatedAt: '2026-03-24T08:00:00.000Z',
      },
    ];

    saveCustomPlays(customPlays);
    expect(loadCustomPlays()).toEqual(customPlays);
  });

  it('applies defaults for legacy custom-play entries while preserving valid shape', () => {
    localStorage.setItem(
      rawCustomPlaysKey,
      JSON.stringify([
        {
          id: 'legacy-play-1',
          name: 'Legacy Custom Play',
          meditationType: 'Ajapa',
          durationMinutes: 25,
          favorite: false,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
        },
      ])
    );

    expect(loadCustomPlays()).toEqual([
      {
        id: 'legacy-play-1',
        name: 'Legacy Custom Play',
        meditationType: 'Ajapa',
        durationMinutes: 25,
        startSound: 'None',
        endSound: 'Temple Bell',
        mediaAssetId: '',
        mediaAssetLabel: '',
        mediaAssetPath: '',
        recordingLabel: '',
        favorite: false,
        createdAt: '2026-03-24T08:00:00.000Z',
        updatedAt: '2026-03-24T08:00:00.000Z',
      },
    ]);
  });
});
