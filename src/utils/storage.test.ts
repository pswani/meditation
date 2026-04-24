import { beforeEach, describe, expect, it } from 'vitest';
import type { ActiveCustomPlayRun, CustomPlay } from '../types/customPlay';
import type { LastUsedMeditation } from '../types/home';
import type { MediaAssetMetadata } from '../types/mediaAsset';
import type { Playlist } from '../types/playlist';
import type { SankalpaGoal } from '../types/sankalpa';
import type { SessionLog } from '../types/sessionLog';
import type { TimerSettings } from '../types/timer';
import type { SummarySnapshotData } from './summary';
import {
  loadActivePlaylistRunState,
  loadActiveCustomPlayRunState,
  loadActiveTimerState,
  loadCachedMediaAssetCatalog,
  loadCachedSummarySnapshot,
  loadCustomPlays,
  loadLastUsedMeditation,
  loadPlaylists,
  loadSankalpas,
  loadSessionLogs,
  loadTimerSettings,
  saveActivePlaylistRunState,
  saveActiveCustomPlayRunState,
  saveActiveTimerState,
  saveCachedMediaAssetCatalog,
  saveCachedSummarySnapshot,
  saveCustomPlays,
  saveLastUsedMeditation,
  savePlaylists,
  saveSankalpas,
  saveSessionLogs,
  saveTimerSettings,
} from './storage';

const rawTimerSettingsKey = 'meditation.timerSettings.v1';
const rawSessionLogsKey = 'meditation.sessionLogs.v1';
const rawCustomPlaysKey = 'meditation.customPlays.v1';
const rawPlaylistsKey = 'meditation.playlists.v1';
const rawSankalpasKey = 'meditation.sankalpas.v1';
const rawActiveTimerStateKey = 'meditation.activeTimerState.v1';
const rawActiveCustomPlayRunStateKey = 'meditation.activeCustomPlayRunState.v1';
const rawActivePlaylistRunStateKey = 'meditation.activePlaylistRunState.v1';
const rawLastUsedMeditationKey = 'meditation.lastUsedMeditation.v1';
const rawMediaAssetCatalogCacheKey = 'meditation.mediaAssetCatalogCache.v1';
const rawSummarySnapshotCacheKey = 'meditation.summarySnapshotCache.v1:/summaries?timeZone=America%2FChicago';

describe('storage timer settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and loads timer settings', () => {
    const settings: TimerSettings = {
      timerMode: 'fixed',
      durationMinutes: 25,
      lastFixedDurationMinutes: 25,
      meditationType: 'Ajapa',
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: true,
      intervalMinutes: 5,
      intervalSound: 'Gong',
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
      lastFixedDurationMinutes: 20,
      intervalSound: 'Temple Bell',
    });
  });

  it('normalizes legacy fixed timer settings with missing valid durations to the safe default duration', () => {
    localStorage.setItem(
      rawTimerSettingsKey,
      JSON.stringify({
        timerMode: 'fixed',
        durationMinutes: null,
        lastFixedDurationMinutes: 0,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
      })
    );

    expect(loadTimerSettings()).toEqual({
      timerMode: 'fixed',
      durationMinutes: 20,
      lastFixedDurationMinutes: 20,
      meditationType: 'Vipassana',
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: false,
      intervalMinutes: 5,
      intervalSound: 'Temple Bell',
    });
  });

  it('returns null when stored timer settings payload is invalid', () => {
    localStorage.setItem(rawTimerSettingsKey, JSON.stringify({ durationMinutes: '20' }));

    expect(loadTimerSettings()).toBeNull();
  });

  it('maps legacy timer sound labels onto the supported sounds when loading stored settings', () => {
    localStorage.setItem(
      rawTimerSettingsKey,
      JSON.stringify({
        timerMode: 'fixed',
        durationMinutes: 20,
        lastFixedDurationMinutes: 20,
        meditationType: 'Vipassana',
        startSound: 'Soft Chime',
        endSound: 'Wood Block',
        intervalEnabled: true,
        intervalMinutes: 5,
        intervalSound: 'Wood Block',
      })
    );

    expect(loadTimerSettings()).toMatchObject({
      startSound: 'Temple Bell',
      endSound: 'Gong',
      intervalSound: 'Gong',
    });
  });
});

describe('storage durable offline snapshots', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and loads the last successful managed media catalog', () => {
    const mediaAssets: MediaAssetMetadata[] = [
      {
        id: 'media-1',
        label: 'Cached Session',
        meditationType: 'Vipassana',
        filePath: '/media/custom-plays/cached-session.mp3',
        relativePath: 'custom-plays/cached-session.mp3',
        durationSeconds: 900,
        mimeType: 'audio/mpeg',
        sizeBytes: 1000,
        updatedAt: '2026-04-04T09:00:00.000Z',
      },
    ];

    saveCachedMediaAssetCatalog(mediaAssets);

    expect(loadCachedMediaAssetCatalog()).toEqual(mediaAssets);
    expect(JSON.parse(localStorage.getItem(rawMediaAssetCatalogCacheKey) ?? '[]')).toHaveLength(1);
  });

  it('persists and loads cached summary snapshots by request key', () => {
    const snapshot: SummarySnapshotData = {
      overallSummary: {
        totalSessionLogs: 2,
        completedSessionLogs: 2,
        endedEarlySessionLogs: 0,
        totalDurationSeconds: 1800,
        averageDurationSeconds: 900,
        autoLogs: 1,
        manualLogs: 1,
      },
      byTypeSummary: [
        { meditationType: 'Vipassana', sessionLogs: 2, totalDurationSeconds: 1800 },
        { meditationType: 'Ajapa', sessionLogs: 0, totalDurationSeconds: 0 },
        { meditationType: 'Tratak', sessionLogs: 0, totalDurationSeconds: 0 },
        { meditationType: 'Kriya', sessionLogs: 0, totalDurationSeconds: 0 },
        { meditationType: 'Sahaj', sessionLogs: 0, totalDurationSeconds: 0 },
      ],
      bySourceSummary: [
        { source: 'auto log', sessionLogs: 1, completedSessionLogs: 1, endedEarlySessionLogs: 0, totalDurationSeconds: 900 },
        { source: 'manual log', sessionLogs: 1, completedSessionLogs: 1, endedEarlySessionLogs: 0, totalDurationSeconds: 900 },
      ],
      byTimeOfDaySummary: [
        { timeOfDayBucket: 'morning', sessionLogs: 1, completedSessionLogs: 1, endedEarlySessionLogs: 0, totalDurationSeconds: 900 },
        { timeOfDayBucket: 'afternoon', sessionLogs: 0, completedSessionLogs: 0, endedEarlySessionLogs: 0, totalDurationSeconds: 0 },
        { timeOfDayBucket: 'evening', sessionLogs: 1, completedSessionLogs: 1, endedEarlySessionLogs: 0, totalDurationSeconds: 900 },
        { timeOfDayBucket: 'night', sessionLogs: 0, completedSessionLogs: 0, endedEarlySessionLogs: 0, totalDurationSeconds: 0 },
      ],
    };

    saveCachedSummarySnapshot('/summaries?timeZone=America%2FChicago', snapshot);

    expect(loadCachedSummarySnapshot('/summaries?timeZone=America%2FChicago')).toEqual(snapshot);
    expect(JSON.parse(localStorage.getItem(rawSummarySnapshotCacheKey) ?? '{}')).toMatchObject({
      overallSummary: {
        totalSessionLogs: 2,
      },
    });
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
        timerMode: 'fixed',
        intendedDurationSeconds: 1200,
        completedDurationSeconds: 1200,
        status: 'completed',
        source: 'auto log',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 0,
        intervalSound: 'None',
        customPlayId: 'custom-play-1',
        customPlayName: 'Morning Focus',
        customPlayRecordingLabel: 'Breath emphasis',
      },
    ];

    saveSessionLogs(logs);
    expect(loadSessionLogs()).toEqual(logs);
  });

  it('keeps fixed completed logs whose actual practiced duration exceeds the planned timer duration', () => {
    const logs: SessionLog[] = [
      {
        id: 'log-overrun-completed',
        startedAt: '2026-03-24T10:00:00.000Z',
        endedAt: '2026-03-24T10:25:00.000Z',
        meditationType: 'Vipassana',
        timerMode: 'fixed',
        intendedDurationSeconds: 1200,
        completedDurationSeconds: 1500,
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
          timerMode: 'fixed',
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
        timerMode: 'fixed',
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

  it('drops semantically invalid session logs (type/date/duration coherence)', () => {
    localStorage.setItem(
      rawSessionLogsKey,
      JSON.stringify([
        {
          id: 'invalid-type',
          startedAt: '2026-03-24T10:00:00.000Z',
          endedAt: '2026-03-24T10:20:00.000Z',
          meditationType: 'Breathwork',
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
          id: 'invalid-date-order',
          startedAt: '2026-03-24T10:30:00.000Z',
          endedAt: '2026-03-24T10:20:00.000Z',
          meditationType: 'Vipassana',
          intendedDurationSeconds: 600,
          completedDurationSeconds: 600,
          status: 'completed',
          source: 'auto log',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
        },
        {
          id: 'invalid-duration-range',
          startedAt: '2026-03-24T10:00:00.000Z',
          endedAt: '2026-03-24T10:20:00.000Z',
          meditationType: 'Ajapa',
          intendedDurationSeconds: 1200,
          completedDurationSeconds: 1400,
          status: 'ended early',
          source: 'manual log',
          startSound: 'None',
          endSound: 'None',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
        },
      ])
    );

    expect(loadSessionLogs()).toEqual([]);
  });
});

describe('storage last used meditation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and loads a last used timer meditation context', () => {
    const lastUsedMeditation: LastUsedMeditation = {
      kind: 'timer',
      settings: {
        timerMode: 'fixed',
        durationMinutes: 27,
        lastFixedDurationMinutes: 27,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: true,
        intervalMinutes: 9,
        intervalSound: 'Gong',
      },
      usedAt: '2026-04-01T12:00:00.000Z',
    };

    saveLastUsedMeditation(lastUsedMeditation);

    expect(loadLastUsedMeditation()).toEqual(lastUsedMeditation);
  });

  it('maps legacy sound labels inside stored last used timer settings', () => {
    localStorage.setItem(
      rawLastUsedMeditationKey,
      JSON.stringify({
        kind: 'timer',
        settings: {
          timerMode: 'fixed',
          durationMinutes: 27,
          lastFixedDurationMinutes: 27,
          meditationType: 'Vipassana',
          startSound: 'Soft Chime',
          endSound: 'Temple Bell',
          intervalEnabled: true,
          intervalMinutes: 9,
          intervalSound: 'Wood Block',
        },
        usedAt: '2026-04-01T12:00:00.000Z',
      })
    );

    expect(loadLastUsedMeditation()).toMatchObject({
      kind: 'timer',
      settings: {
        startSound: 'Temple Bell',
        intervalSound: 'Gong',
      },
    });
  });

  it('drops invalid stored last used meditation payloads', () => {
    localStorage.setItem(
      rawLastUsedMeditationKey,
      JSON.stringify({
        kind: 'playlist',
        playlistId: 123,
        usedAt: 'not-a-date',
      })
    );

    expect(loadLastUsedMeditation()).toBeNull();
  });

  it('removes the stored last used meditation when saving null', () => {
    saveLastUsedMeditation({
      kind: 'playlist',
      playlistId: 'playlist-1',
      playlistName: 'Evening Sequence',
      usedAt: '2026-04-01T12:00:00.000Z',
    });

    saveLastUsedMeditation(null);

    expect(loadLastUsedMeditation()).toBeNull();
    expect(localStorage.getItem(rawLastUsedMeditationKey)).toBeNull();
  });

  it('persists and loads a last used custom play meditation context', () => {
    const lastUsedMeditation: LastUsedMeditation = {
      kind: 'custom-play',
      customPlayId: 'custom-play-1',
      customPlayName: 'Morning Focus',
      usedAt: '2026-04-02T12:00:00.000Z',
    };

    saveLastUsedMeditation(lastUsedMeditation);

    expect(loadLastUsedMeditation()).toEqual(lastUsedMeditation);
  });
});

describe('storage active custom play run', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and loads active custom play runtime recovery state', () => {
    const activeCustomPlayRun: ActiveCustomPlayRun = {
      runId: 'custom-play-1-1000',
      customPlayId: 'custom-play-1',
      customPlayName: 'Morning Focus',
      meditationType: 'Vipassana',
      recordingLabel: 'Breath emphasis',
      mediaAssetId: 'media-vipassana-sit-20',
      mediaLabel: 'Vipassana Sit (20 min)',
      mediaFilePath: '/media/custom-plays/vipassana-sit-20.mp3',
      durationSeconds: 1200,
      startedAt: '2026-04-02T12:00:00.000Z',
      startedAtMs: Date.parse('2026-04-02T12:00:00.000Z'),
      currentPositionSeconds: 315,
      isPaused: true,
      startSound: 'Temple Bell',
      endSound: 'Gong',
    };

    saveActiveCustomPlayRunState(activeCustomPlayRun);

    expect(loadActiveCustomPlayRunState()).toEqual(activeCustomPlayRun);
  });

  it('drops malformed active custom play runtime state', () => {
    localStorage.setItem(
      rawActiveCustomPlayRunStateKey,
      JSON.stringify({
        runId: 'broken',
        customPlayId: 'custom-play-1',
        customPlayName: 'Morning Focus',
      })
    );

    expect(loadActiveCustomPlayRunState()).toBeNull();
  });
});

describe('storage custom plays', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and loads custom plays with the current linked-media shape', () => {
    const customPlays: CustomPlay[] = [
      {
        id: 'play-1',
        name: 'Morning Focus',
        meditationType: 'Vipassana',
        durationMinutes: 20,
        startSound: 'Temple Bell',
        endSound: 'Temple Bell',
        mediaAssetId: 'media-vipassana-sit-20',
        recordingLabel: 'Session A',
        favorite: true,
        createdAt: '2026-03-24T08:00:00.000Z',
        updatedAt: '2026-03-24T08:00:00.000Z',
      },
    ];

    saveCustomPlays(customPlays);
    expect(loadCustomPlays()).toEqual(customPlays);
  });

  it('maps legacy custom play sound labels onto the supported sounds when loading storage', () => {
    localStorage.setItem(
      rawCustomPlaysKey,
      JSON.stringify([
        {
          id: 'legacy-play-2',
          name: 'Legacy Mapped Play',
          meditationType: 'Vipassana',
          durationMinutes: 20,
          startSound: 'Soft Chime',
          endSound: 'Wood Block',
          favorite: false,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
        },
      ])
    );

    expect(loadCustomPlays()).toEqual([
      {
        id: 'legacy-play-2',
        name: 'Legacy Mapped Play',
        meditationType: 'Vipassana',
        durationMinutes: 20,
        startSound: 'Temple Bell',
        endSound: 'Gong',
        mediaAssetId: '',
        recordingLabel: '',
        favorite: false,
        createdAt: '2026-03-24T08:00:00.000Z',
        updatedAt: '2026-03-24T08:00:00.000Z',
      },
    ]);
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
        recordingLabel: '',
        favorite: false,
        createdAt: '2026-03-24T08:00:00.000Z',
        updatedAt: '2026-03-24T08:00:00.000Z',
      },
    ]);
  });

  it('drops legacy custom-play path fields during normalization while preserving supported data', () => {
    localStorage.setItem(
      rawCustomPlaysKey,
      JSON.stringify([
        {
          id: 'legacy-linked-play',
          name: 'Legacy Linked Play',
          meditationType: 'Vipassana',
          durationMinutes: 20,
          startSound: 'None',
          endSound: 'Temple Bell',
          mediaAssetId: 'media-vipassana-sit-20',
          mediaAssetLabel: 'Vipassana Sit (20 min)',
          mediaAssetPath: '/media/custom-plays/vipassana-sit-20.mp3',
          recordingLabel: 'Legacy note',
          favorite: false,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
        },
      ])
    );

    expect(loadCustomPlays()).toEqual([
      {
        id: 'legacy-linked-play',
        name: 'Legacy Linked Play',
        meditationType: 'Vipassana',
        durationMinutes: 20,
        startSound: 'None',
        endSound: 'Temple Bell',
        mediaAssetId: 'media-vipassana-sit-20',
        recordingLabel: 'Legacy note',
        favorite: false,
        createdAt: '2026-03-24T08:00:00.000Z',
        updatedAt: '2026-03-24T08:00:00.000Z',
      },
    ]);
  });

  it('drops custom-play entries with invalid meditation type or non-positive duration', () => {
    localStorage.setItem(
      rawCustomPlaysKey,
      JSON.stringify([
        {
          id: 'invalid-play-type',
          name: 'Invalid Type',
          meditationType: 'Breathwork',
          durationMinutes: 20,
          favorite: false,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
        },
        {
          id: 'invalid-play-duration',
          name: 'Invalid Duration',
          meditationType: 'Vipassana',
          durationMinutes: 0,
          favorite: false,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
        },
      ])
    );

    expect(loadCustomPlays()).toEqual([]);
  });
});

describe('storage playlists', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and loads playlists', () => {
    const playlists: Playlist[] = [
      {
        id: 'playlist-1',
        name: 'Morning Sequence',
        smallGapSeconds: 0,
        favorite: true,
        createdAt: '2026-03-24T08:00:00.000Z',
        updatedAt: '2026-03-24T08:00:00.000Z',
        items: [
          {
            id: 'item-1',
            title: 'Vipassana',
            meditationType: 'Vipassana',
            durationMinutes: 10,
          },
        ],
      },
    ];

    savePlaylists(playlists);
    expect(loadPlaylists()).toEqual(playlists);
  });

  it('drops malformed playlist entries while preserving valid ones', () => {
    localStorage.setItem(
      rawPlaylistsKey,
      JSON.stringify([
        {
          id: 'playlist-valid',
          name: 'Valid Sequence',
          smallGapSeconds: 0,
          favorite: false,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
          items: [
            {
              id: 'item-1',
              title: 'Ajapa',
              meditationType: 'Ajapa',
              durationMinutes: 12,
            },
          ],
        },
        {
          id: 'playlist-invalid',
          name: 'Invalid Sequence',
          favorite: false,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
          items: [
            {
              id: 'item-2',
              meditationType: 'Breathwork',
              durationMinutes: 0,
            },
          ],
        },
      ])
    );

    expect(loadPlaylists()).toEqual([
      {
        id: 'playlist-valid',
        name: 'Valid Sequence',
        smallGapSeconds: 0,
        favorite: false,
        createdAt: '2026-03-24T08:00:00.000Z',
        updatedAt: '2026-03-24T08:00:00.000Z',
        items: [
          {
            id: 'item-1',
            title: 'Ajapa',
            meditationType: 'Ajapa',
            durationMinutes: 12,
          },
        ],
      },
    ]);
  });
});

describe('storage sankalpas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and loads valid sankalpas', () => {
    const sankalpas: SankalpaGoal[] = [
      {
        id: 'goal-1',
        title: '120 min in 7 days',
        goalType: 'duration-based',
        targetValue: 120,
        days: 7,
        createdAt: '2026-03-24T08:00:00.000Z',
        archived: false,
      },
      {
        id: 'goal-2',
        title: 'Morning discipline',
        goalType: 'session-count-based',
        targetValue: 5,
        days: 14,
        qualifyingDaysPerWeek: 4,
        meditationType: 'Vipassana',
        timeOfDayBucket: 'morning',
        createdAt: '2026-03-24T08:30:00.000Z',
        archived: false,
      },
      {
        id: 'goal-3',
        title: 'Meal before 7 PM for 3 days',
        goalType: 'observance-based',
        targetValue: 3,
        days: 3,
        observanceLabel: 'Meal before 7 PM',
        observanceRecords: [
          { date: '2026-04-05', status: 'observed' },
          { date: '2026-04-06', status: 'missed' },
        ],
        createdAt: '2026-04-05T08:30:00.000Z',
        archived: false,
      },
    ];

    saveSankalpas(sankalpas);
    expect(loadSankalpas()).toEqual(sankalpas);
  });

  it('drops malformed sankalpa entries while preserving valid ones', () => {
    localStorage.setItem(
      rawSankalpasKey,
      JSON.stringify([
        {
          id: 'goal-valid',
          goalType: 'session-count-based',
          targetValue: 3,
          days: 14,
          qualifyingDaysPerWeek: 4,
          meditationType: 'Ajapa',
          timeOfDayBucket: 'evening',
          createdAt: '2026-03-24T08:00:00.000Z',
        },
        {
          id: 'goal-invalid-type',
          goalType: 'duration-based',
          targetValue: 30,
          days: 7,
          meditationType: 'Breathwork',
          createdAt: '2026-03-24T08:00:00.000Z',
        },
        {
          id: 'goal-invalid-days',
          goalType: 'session-count-based',
          targetValue: 2,
          days: 10,
          qualifyingDaysPerWeek: 4,
          createdAt: '2026-03-24T08:00:00.000Z',
        },
        {
          id: 'goal-invalid-created-at',
          goalType: 'duration-based',
          targetValue: 60,
          days: 7,
          createdAt: 'not-a-date',
        },
        {
          id: 'goal-invalid-observance',
          goalType: 'observance-based',
          targetValue: 3,
          days: 3,
          observanceLabel: '',
          createdAt: '2026-04-05T08:00:00.000Z',
        },
      ])
    );

    expect(loadSankalpas()).toEqual([
      {
        id: 'goal-valid',
        goalType: 'session-count-based',
        targetValue: 3,
        days: 14,
        qualifyingDaysPerWeek: 4,
        meditationType: 'Ajapa',
        timeOfDayBucket: 'evening',
        observanceLabel: undefined,
        observanceRecords: undefined,
        createdAt: '2026-03-24T08:00:00.000Z',
        archived: false,
      },
    ]);
  });
});

describe('storage active runtime state', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and loads active timer state snapshot', () => {
    saveActiveTimerState({
      startedAt: '2026-03-24T10:00:00.000Z',
      startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
      timerMode: 'fixed',
      intendedDurationSeconds: 1200,
      elapsedSeconds: 300,
      isPaused: true,
      lastResumedAtMs: null,
      meditationType: 'Vipassana',
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: false,
      intervalMinutes: 0,
      intervalSound: 'None',
    });

    expect(loadActiveTimerState()).toEqual({
      startedAt: '2026-03-24T10:00:00.000Z',
      startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
      timerMode: 'fixed',
      intendedDurationSeconds: 1200,
      elapsedSeconds: 300,
      isPaused: true,
      lastResumedAtMs: null,
      meditationType: 'Vipassana',
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: false,
      intervalMinutes: 0,
      intervalSound: 'None',
    });
  });

  it('normalizes legacy wrapped active timer payloads into the current session model', () => {
    localStorage.setItem(
      rawActiveTimerStateKey,
      JSON.stringify({
        activeSession: {
          startedAt: '2026-03-24T10:00:00.000Z',
          startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          intendedDurationSeconds: 1200,
          remainingSeconds: 600,
          meditationType: 'Vipassana',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
          endAtMs: Date.parse('2026-03-24T10:20:00.000Z'),
        },
        isPaused: true,
      })
    );

    expect(loadActiveTimerState()).toMatchObject({
      timerMode: 'fixed',
      intendedDurationSeconds: 1200,
      elapsedSeconds: 600,
      isPaused: true,
      lastResumedAtMs: null,
      meditationType: 'Vipassana',
    });
  });

  it('removes active timer snapshot when there is no active session', () => {
    saveActiveTimerState({
      startedAt: '2026-03-24T10:00:00.000Z',
      startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
      timerMode: 'fixed',
      intendedDurationSeconds: 1200,
      elapsedSeconds: 300,
      isPaused: false,
      lastResumedAtMs: Date.parse('2026-03-24T10:15:00.000Z'),
      meditationType: 'Vipassana',
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: false,
      intervalMinutes: 0,
      intervalSound: 'None',
    });
    saveActiveTimerState(null);

    expect(localStorage.getItem(rawActiveTimerStateKey)).toBeNull();
    expect(loadActiveTimerState()).toBeNull();
  });

  it('persists and loads active playlist run state snapshot', () => {
    saveActivePlaylistRunState(
      {
        runId: 'playlist-1-1000',
        playlistId: 'playlist-1',
        playlistName: 'Morning Sequence',
        runStartedAt: '2026-03-24T10:00:00.000Z',
        items: [
          {
            id: 'item-1',
            title: 'Ajapa',
            meditationType: 'Ajapa',
            durationMinutes: 10,
            startSound: 'None',
            endSound: 'None',
          },
        ],
        smallGapSeconds: 0,
        currentIndex: 0,
        currentSegment: {
          phase: 'item',
          startedAt: '2026-03-24T10:00:00.000Z',
          startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          elapsedSeconds: 100,
          remainingSeconds: 500,
          endAtMs: Date.parse('2026-03-24T10:10:00.000Z'),
        },
        completedItems: 0,
        completedDurationSeconds: 0,
        totalIntendedDurationSeconds: 600,
      },
      false
    );

    expect(loadActivePlaylistRunState()).toEqual({
      activePlaylistRun: {
        runId: 'playlist-1-1000',
        playlistId: 'playlist-1',
        playlistName: 'Morning Sequence',
        runStartedAt: '2026-03-24T10:00:00.000Z',
        items: [
          {
            id: 'item-1',
            title: 'Ajapa',
            meditationType: 'Ajapa',
            durationMinutes: 10,
            startSound: 'None',
            endSound: 'None',
          },
        ],
        smallGapSeconds: 0,
        currentIndex: 0,
        currentSegment: {
          phase: 'item',
          startedAt: '2026-03-24T10:00:00.000Z',
          startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          elapsedSeconds: 100,
          remainingSeconds: 500,
          endAtMs: Date.parse('2026-03-24T10:10:00.000Z'),
        },
        completedItems: 0,
        completedDurationSeconds: 0,
        totalIntendedDurationSeconds: 600,
      },
      isPaused: false,
    });
  });

  it('drops malformed active playlist run snapshots', () => {
    localStorage.setItem(
      rawActivePlaylistRunStateKey,
      JSON.stringify({
        activePlaylistRun: {
          runId: 'playlist-1-1000',
          playlistId: 'playlist-1',
          playlistName: 'Morning Sequence',
          runStartedAt: '2026-03-24T10:00:00.000Z',
          items: [
            {
              id: 'item-1',
              meditationType: 'Breathwork',
              durationMinutes: 10,
            },
          ],
          currentIndex: 0,
          currentItemStartedAt: '2026-03-24T10:00:00.000Z',
          currentItemStartedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          currentItemRemainingSeconds: 500,
          currentItemEndAtMs: Date.parse('2026-03-24T10:10:00.000Z'),
          completedItems: 0,
          completedDurationSeconds: 0,
          totalIntendedDurationSeconds: 600,
        },
        isPaused: false,
      })
    );

    expect(loadActivePlaylistRunState()).toBeNull();
  });
});
