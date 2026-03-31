import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { SankalpaGoal } from './types/sankalpa';
import type { SessionLog } from './types/sessionLog';
import { createSyncQueueEntry } from './utils/syncQueue';

const ACTIVE_TIMER_STATE_KEY = 'meditation.activeTimerState.v1';
const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';
const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';
const CUSTOM_PLAYS_KEY = 'meditation.customPlays.v1';
const PLAYLISTS_KEY = 'meditation.playlists.v1';
const SYNC_QUEUE_KEY = 'meditation.syncQueue.v1';

function createJsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}

const meditationTypes = ['Vipassana', 'Ajapa', 'Tratak', 'Kriya', 'Sahaj'] as const;
const sessionLogSources = ['auto log', 'manual log'] as const;
const timeOfDayBuckets = ['morning', 'afternoon', 'evening', 'night'] as const;

function getHourInTimeZone(isoTimestamp: string, timeZone?: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hourCycle: 'h23',
    timeZone: timeZone ?? 'UTC',
  }).formatToParts(new Date(isoTimestamp));
  const hourPart = parts.find((part) => part.type === 'hour');

  return hourPart ? Number(hourPart.value) : new Date(isoTimestamp).getUTCHours();
}

function getTimeOfDayBucket(sessionLog: SessionLog, timeZone?: string): (typeof timeOfDayBuckets)[number] {
  const hour = getHourInTimeZone(sessionLog.endedAt, timeZone);
  if (hour >= 5 && hour < 12) {
    return 'morning';
  }
  if (hour >= 12 && hour < 17) {
    return 'afternoon';
  }
  if (hour >= 17 && hour < 21) {
    return 'evening';
  }
  return 'night';
}

function deriveSummaryResponse(
  sessionLogs: readonly SessionLog[],
  options?: { startAt?: string | null; endAt?: string | null; timeZone?: string }
) {
  const startAtMs = options?.startAt ? Date.parse(options.startAt) : null;
  const endAtMs = options?.endAt ? Date.parse(options.endAt) : null;
  const filteredLogs = sessionLogs.filter((sessionLog) => {
    const endedAtMs = Date.parse(sessionLog.endedAt);
    if (startAtMs !== null && endedAtMs < startAtMs) {
      return false;
    }
    if (endAtMs !== null && endedAtMs > endAtMs) {
      return false;
    }
    return true;
  });
  const completedSessionLogs = filteredLogs.filter((entry) => entry.status === 'completed').length;
  const totalDurationSeconds = filteredLogs.reduce((total, entry) => total + entry.completedDurationSeconds, 0);

  return {
    overallSummary: {
      totalSessionLogs: filteredLogs.length,
      completedSessionLogs,
      endedEarlySessionLogs: filteredLogs.length - completedSessionLogs,
      totalDurationSeconds,
      averageDurationSeconds: filteredLogs.length === 0 ? 0 : Math.round(totalDurationSeconds / filteredLogs.length),
      autoLogs: filteredLogs.filter((entry) => entry.source === 'auto log').length,
      manualLogs: filteredLogs.filter((entry) => entry.source === 'manual log').length,
    },
    byTypeSummary: meditationTypes.map((meditationType) => {
      const matchingLogs = filteredLogs.filter((entry) => entry.meditationType === meditationType);
      return {
        meditationType,
        sessionLogs: matchingLogs.length,
        totalDurationSeconds: matchingLogs.reduce((total, entry) => total + entry.completedDurationSeconds, 0),
      };
    }),
    bySourceSummary: sessionLogSources.map((source) => {
      const matchingLogs = filteredLogs.filter((entry) => entry.source === source);
      const matchingCompletedLogs = matchingLogs.filter((entry) => entry.status === 'completed').length;
      return {
        source,
        sessionLogs: matchingLogs.length,
        completedSessionLogs: matchingCompletedLogs,
        endedEarlySessionLogs: matchingLogs.length - matchingCompletedLogs,
        totalDurationSeconds: matchingLogs.reduce((total, entry) => total + entry.completedDurationSeconds, 0),
      };
    }),
    byTimeOfDaySummary: timeOfDayBuckets.map((timeOfDayBucket) => {
      const matchingLogs = filteredLogs.filter((entry) => getTimeOfDayBucket(entry, options?.timeZone) === timeOfDayBucket);
      const matchingCompletedLogs = matchingLogs.filter((entry) => entry.status === 'completed').length;
      return {
        timeOfDayBucket,
        sessionLogs: matchingLogs.length,
        completedSessionLogs: matchingCompletedLogs,
        endedEarlySessionLogs: matchingLogs.length - matchingCompletedLogs,
        totalDurationSeconds: matchingLogs.reduce((total, entry) => total + entry.completedDurationSeconds, 0),
      };
    }),
  };
}

function deriveSankalpaProgressResponses(
  sankalpas: readonly SankalpaGoal[],
  sessionLogs: readonly SessionLog[],
  timeZone?: string
) {
  const nowMs = Date.parse('2026-03-26T12:00:00.000Z');

  return [...sankalpas]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .map((goal) => {
      const createdAtMs = Date.parse(goal.createdAt);
      const deadlineAtMs = createdAtMs + goal.days * 24 * 60 * 60 * 1000;
      const matchingLogs = sessionLogs.filter((sessionLog) => {
        const endedAtMs = Date.parse(sessionLog.endedAt);
        if (endedAtMs < createdAtMs || endedAtMs > deadlineAtMs) {
          return false;
        }
        if (goal.meditationType && sessionLog.meditationType !== goal.meditationType) {
          return false;
        }
        if (goal.timeOfDayBucket && getTimeOfDayBucket(sessionLog, timeZone) !== goal.timeOfDayBucket) {
          return false;
        }
        return true;
      });
      const matchedSessionCount = matchingLogs.length;
      const matchedDurationSeconds = matchingLogs.reduce((total, entry) => total + entry.completedDurationSeconds, 0);
      const targetSessionCount = goal.goalType === 'session-count-based' ? Math.round(goal.targetValue) : 0;
      const targetDurationSeconds = goal.goalType === 'duration-based' ? Math.round(goal.targetValue * 60) : 0;
      const targetValue = goal.goalType === 'duration-based' ? targetDurationSeconds : targetSessionCount;
      const progressValue = goal.goalType === 'duration-based' ? matchedDurationSeconds : matchedSessionCount;

      return {
        goal,
        status:
          progressValue >= targetValue ? 'completed' : nowMs > deadlineAtMs ? 'expired' : 'active',
        deadlineAt: new Date(deadlineAtMs).toISOString(),
        matchedSessionCount,
        matchedDurationSeconds,
        targetSessionCount,
        targetDurationSeconds,
        progressRatio: targetValue === 0 ? 0 : Math.min(progressValue / targetValue, 1),
      };
    });
}

function createStatefulBackendFetchMock(options?: {
  settings?: {
    durationMinutes: number;
    meditationType: string;
    startSound: string;
    endSound: string;
    intervalEnabled: boolean;
    intervalMinutes: number;
    intervalSound: string;
  };
  sessionLogs?: SessionLog[];
  customPlays?: Array<Record<string, unknown>>;
  playlists?: Array<Record<string, unknown>>;
  sankalpas?: SankalpaGoal[];
}) {
  const store = {
    settings: {
      durationMinutes: 20,
      meditationType: '',
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: false,
      intervalMinutes: 5,
      intervalSound: 'Temple Bell',
      ...(options?.settings ?? {}),
    },
    sessionLogs: [...(options?.sessionLogs ?? [])],
    customPlays: [...(options?.customPlays ?? [])],
    playlists: [...(options?.playlists ?? [])],
    sankalpas: [...(options?.sankalpas ?? [])],
  };

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const requestUrl = new URL(url, 'http://localhost');
    const method = init?.method ?? 'GET';

    if (requestUrl.pathname === '/api/settings/timer' && method === 'GET') {
      return createJsonResponse(200, {
        id: 'default',
        ...store.settings,
        updatedAt: '2026-03-26T12:00:00.000Z',
      });
    }

    if (requestUrl.pathname === '/api/settings/timer' && method === 'PUT') {
      store.settings = {
        ...store.settings,
        ...(typeof init?.body === 'string' ? JSON.parse(init.body) : {}),
      };

      return createJsonResponse(200, {
        id: 'default',
        ...store.settings,
        updatedAt: '2026-03-26T12:05:00.000Z',
      });
    }

    if (requestUrl.pathname === '/api/session-logs' && method === 'GET') {
      return createJsonResponse(200, [...store.sessionLogs]);
    }

    if (requestUrl.pathname === '/api/session-logs/manual' && method === 'POST') {
      const requestBody =
        typeof init?.body === 'string'
          ? (JSON.parse(init.body) as {
              durationMinutes: number;
              meditationType: string;
              sessionTimestamp: string;
            })
          : {
              durationMinutes: 0,
              meditationType: '',
              sessionTimestamp: new Date().toISOString(),
            };
      const completedDurationSeconds = Math.round(requestBody.durationMinutes * 60);
      const endedAt = new Date(requestBody.sessionTimestamp);
      const startedAt = new Date(endedAt.getTime() - completedDurationSeconds * 1000);
      const sessionLog = {
        id: `manual-log-${store.sessionLogs.length + 1}`,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        meditationType: requestBody.meditationType,
        intendedDurationSeconds: completedDurationSeconds,
        completedDurationSeconds,
        status: 'completed',
        source: 'manual log',
        startSound: 'None',
        endSound: 'None',
        intervalEnabled: false,
        intervalMinutes: 0,
        intervalSound: 'None',
      };

      store.sessionLogs.unshift(sessionLog);
      return createJsonResponse(200, sessionLog);
    }

    if (requestUrl.pathname.startsWith('/api/session-logs/') && method === 'PUT') {
      const sessionLog = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
      const existingIndex = store.sessionLogs.findIndex((entry) => entry.id === sessionLog.id);

      if (existingIndex >= 0) {
        store.sessionLogs[existingIndex] = sessionLog;
      } else {
        store.sessionLogs.unshift(sessionLog);
      }

      return createJsonResponse(200, sessionLog);
    }

    if (requestUrl.pathname === '/api/custom-plays' && method === 'GET') {
      return createJsonResponse(200, [...store.customPlays]);
    }

    if (requestUrl.pathname.startsWith('/api/custom-plays/') && method === 'PUT') {
      const customPlay = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
      const existingIndex = store.customPlays.findIndex((entry) => entry.id === customPlay.id);

      if (existingIndex >= 0) {
        store.customPlays[existingIndex] = customPlay;
      } else {
        store.customPlays.unshift(customPlay);
      }

      return createJsonResponse(200, customPlay);
    }

    if (requestUrl.pathname.startsWith('/api/custom-plays/') && method === 'DELETE') {
      const customPlayId = requestUrl.pathname.split('/').at(-1);
      store.customPlays = store.customPlays.filter((entry) => entry.id !== customPlayId);
      return createJsonResponse(204, {});
    }

    if (requestUrl.pathname === '/api/playlists' && method === 'GET') {
      return createJsonResponse(200, [...store.playlists]);
    }

    if (requestUrl.pathname.startsWith('/api/playlists/') && method === 'PUT') {
      const playlist = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
      const existingIndex = store.playlists.findIndex((entry) => entry.id === playlist.id);

      if (existingIndex >= 0) {
        store.playlists[existingIndex] = playlist;
      } else {
        store.playlists.unshift(playlist);
      }

      return createJsonResponse(200, playlist);
    }

    if (requestUrl.pathname.startsWith('/api/playlists/') && method === 'DELETE') {
      const playlistId = requestUrl.pathname.split('/').at(-1);
      store.playlists = store.playlists.filter((entry) => entry.id !== playlistId);
      return createJsonResponse(204, {});
    }

    if (requestUrl.pathname === '/api/media/custom-plays' && method === 'GET') {
      return createJsonResponse(200, [
        {
          id: 'media-vipassana-sit-20',
          label: 'Vipassana Sit (20 min)',
          filePath: '/media/custom-plays/vipassana-sit-20.mp3',
          relativePath: 'custom-plays/vipassana-sit-20.mp3',
          durationSeconds: 1200,
          mimeType: 'audio/mpeg',
          sizeBytes: 9200000,
          updatedAt: '2026-03-24T08:00:00.000Z',
        },
      ]);
    }

    if (requestUrl.pathname === '/api/summaries' && method === 'GET') {
      return createJsonResponse(
        200,
        deriveSummaryResponse(store.sessionLogs, {
          startAt: requestUrl.searchParams.get('startAt'),
          endAt: requestUrl.searchParams.get('endAt'),
          timeZone: requestUrl.searchParams.get('timeZone') ?? undefined,
        })
      );
    }

    if (requestUrl.pathname === '/api/sankalpas' && method === 'GET') {
      return createJsonResponse(
        200,
        deriveSankalpaProgressResponses(store.sankalpas, store.sessionLogs, requestUrl.searchParams.get('timeZone') ?? undefined)
      );
    }

    return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
  });

  return { fetchMock, store };
}

async function flushBackendHydration() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  await waitFor(() =>
    expect(screen.queryByText(/loading timer defaults from the backend/i)).not.toBeInTheDocument()
  );
}

async function flushAsyncEffects() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function waitForPracticeHydration() {
  await waitFor(() =>
    expect(screen.queryByText(/loading timer defaults from the backend/i)).not.toBeInTheDocument()
  );
  await waitFor(() => expect(screen.queryByText(/loading custom plays from the backend/i)).not.toBeInTheDocument());
}

describe('App shell', () => {
  beforeEach(() => {
    localStorage.clear();
    setNavigatorOnline(true);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders home route with functional quick-start content and Sankalpa navigation label', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    expect(screen.getAllByText('Sankalpa').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /start timer now/i })).toBeInTheDocument();
  });

  it('renders settings route with functional defaults form', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save defaults/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/default duration \(minutes\)/i)).toBeInTheDocument();
  });

  it('reflects saved defaults from Settings in timer setup', async () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>
    );

    await flushBackendHydration();
    fireEvent.change(screen.getByLabelText(/default duration \(minutes\)/i), { target: { value: '32' } });
    fireEvent.change(screen.getByLabelText(/default meditation type/i), { target: { value: 'Sahaj' } });
    fireEvent.click(screen.getByRole('button', { name: /save defaults/i }));
    expect(await screen.findByText(/settings saved/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('link', { name: /^Practice$/i })[0]);

    expect(screen.getByRole('heading', { name: /timer setup/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/duration \(minutes\)/i)).toHaveValue(32);
    expect(screen.getByRole('combobox', { name: /meditation type/i })).toHaveValue('Sahaj');
  });

  it('shows a global active timer resume banner outside Practice', async () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
    );

    await flushBackendHydration();
    const meditationTypeSelect = screen.getAllByLabelText(/meditation type/i)[0];
    fireEvent.change(meditationTypeSelect, { target: { value: 'Vipassana' } });
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));

    fireEvent.click(screen.getByRole('button', { name: /view history/i }));

    expect(screen.getByText(/active timer: vipassana/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /resume active timer/i }));
    expect(screen.getByRole('heading', { level: 2, name: /\d{2}:\d{2}/i })).toBeInTheDocument();
  });

  it('avoids redundant persistence writes on a stable initial mount', () => {
    localStorage.setItem(
      TIMER_SETTINGS_KEY,
      JSON.stringify({
        durationMinutes: 20,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
      })
    );
    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([
        {
          id: 'log-1',
          startedAt: '2026-03-24T09:40:00.000Z',
          endedAt: '2026-03-24T10:00:00.000Z',
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
      ])
    );
    localStorage.setItem(
      CUSTOM_PLAYS_KEY,
      JSON.stringify([
        {
          id: 'play-1',
          name: 'Morning Focus',
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
      ])
    );
    localStorage.setItem(
      PLAYLISTS_KEY,
      JSON.stringify([
        {
          id: 'playlist-1',
          name: 'Morning Sequence',
          favorite: false,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
          items: [
            {
              id: 'item-1',
              meditationType: 'Vipassana',
              durationMinutes: 10,
            },
          ],
        },
      ])
    );
    localStorage.setItem(
      ACTIVE_TIMER_STATE_KEY,
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

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    setItemSpy.mockClear();
    removeItemSpy.mockClear();

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/paused timer: vipassana/i)).toBeInTheDocument();
    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(setItemSpy).toHaveBeenCalledWith(SYNC_QUEUE_KEY, '[]');
    expect(removeItemSpy).not.toHaveBeenCalled();
  });

  it('rehydrates a persisted active timer and lets the user resume it from the shell', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T10:05:00.000Z'));

    localStorage.setItem(
      ACTIVE_TIMER_STATE_KEY,
      JSON.stringify({
        activeSession: {
          startedAt: '2026-03-24T10:00:00.000Z',
          startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          timerMode: 'fixed',
          intendedDurationSeconds: 1200,
          elapsedSeconds: 0,
          isPaused: false,
          lastResumedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          meditationType: 'Vipassana',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
        },
        isPaused: false,
      })
    );

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/recovered an active timer from your previous app state/i)).toBeInTheDocument();
    expect(screen.getByText(/active timer: vipassana/i)).toBeInTheDocument();

    const persistedState = JSON.parse(localStorage.getItem(ACTIVE_TIMER_STATE_KEY) ?? '{}');
    expect(persistedState.elapsedSeconds).toBe(300);

    fireEvent.click(screen.getByRole('button', { name: /^dismiss$/i }));
    expect(screen.queryByText(/recovered an active timer from your previous app state/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /resume active timer/i }));
    expect(screen.getByRole('heading', { level: 2, name: /\d{2}:\d{2}/i })).toBeInTheDocument();
  });

  it('rehydrates a paused active timer with paused shell messaging and resume flow', () => {
    localStorage.setItem(
      ACTIVE_TIMER_STATE_KEY,
      JSON.stringify({
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
      })
    );

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/recovered a paused timer from your previous app state/i)).toBeInTheDocument();
    expect(screen.getByText(/paused timer: vipassana/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /resume paused timer/i }));
    expect(screen.getByText(/^paused$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^resume$/i })).toBeInTheDocument();
  });

  it('clears paused fixed sessions that are already complete when the app reloads', () => {
    localStorage.setItem(
      ACTIVE_TIMER_STATE_KEY,
      JSON.stringify({
        startedAt: '2026-03-24T10:00:00.000Z',
        startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
        timerMode: 'fixed',
        intendedDurationSeconds: 1200,
        elapsedSeconds: 1200,
        isPaused: true,
        lastResumedAtMs: null,
        meditationType: 'Ajapa',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 0,
        intervalSound: 'None',
      })
    );

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/previous active timer was cleared because it could not be safely resumed/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resume paused timer/i })).not.toBeInTheDocument();
    expect(localStorage.getItem(ACTIVE_TIMER_STATE_KEY)).toBeNull();
  });

  it('clears stale persisted active timer state that can no longer be safely resumed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T10:25:00.000Z'));

    localStorage.setItem(
      ACTIVE_TIMER_STATE_KEY,
      JSON.stringify({
        activeSession: {
          startedAt: '2026-03-24T10:00:00.000Z',
          startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          timerMode: 'fixed',
          intendedDurationSeconds: 1200,
          elapsedSeconds: 0,
          isPaused: false,
          lastResumedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          meditationType: 'Ajapa',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
        },
        isPaused: false,
      })
    );

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/previous active timer was cleared because it could not be safely resumed/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resume active timer/i })).not.toBeInTheDocument();
    expect(localStorage.getItem(ACTIVE_TIMER_STATE_KEY)).toBeNull();
  });

  it('redirects /sankalpa to the Sankalpa route', () => {
    render(
      <MemoryRouter initialEntries={['/sankalpa']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Sankalpa' })).toBeInTheDocument();
    expect(screen.getByText(/review summaries and track sankalpa progress/i)).toBeInTheDocument();
  });

  it('redirects unknown routes to Home', () => {
    render(
      <MemoryRouter initialEntries={['/does-not-exist']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /quick start/i })).toBeInTheDocument();
  });

  it('queues an offline manual log locally and syncs it after reconnection', async () => {
    setNavigatorOnline(false);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('offline'))
    );

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/you are offline/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/meditation type/i), { target: { value: 'Vipassana' } });
    fireEvent.click(screen.getByRole('button', { name: /save manual log/i }));

    expect(await screen.findByText(/manual log saved to history/i)).toBeInTheDocument();
    expect(screen.getByText(/this session log will sync when the backend is reachable/i)).toBeInTheDocument();

    const queuedEntries = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) ?? '[]');
    expect(queuedEntries).toHaveLength(1);
    expect(queuedEntries[0].entityType).toBe('session-log');

    const { fetchMock, store } = createStatefulBackendFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    setNavigatorOnline(true);
    fireEvent(window, new Event('online'));

    await waitFor(() => expect(JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) ?? '[]')).toHaveLength(0));
    expect(store.sessionLogs).toHaveLength(1);
    expect(store.sessionLogs[0]?.source).toBe('manual log');
  });

  it('boots offline from cached history with a pending queue entry and flushes it after reconnection', async () => {
    const queuedSessionLog: SessionLog = {
      id: 'offline-log-1',
      startedAt: '2026-03-26T11:35:00.000Z',
      endedAt: '2026-03-26T12:00:00.000Z',
      meditationType: 'Vipassana',
      intendedDurationSeconds: 1500,
      completedDurationSeconds: 1500,
      status: 'completed',
      source: 'manual log',
      startSound: 'None',
      endSound: 'None',
      intervalEnabled: false,
      intervalMinutes: 0,
      intervalSound: 'None',
    };

    localStorage.setItem(SESSION_LOGS_KEY, JSON.stringify([queuedSessionLog]));
    localStorage.setItem(
      SYNC_QUEUE_KEY,
      JSON.stringify([
        createSyncQueueEntry({
          entityType: 'session-log',
          operation: 'upsert',
          recordId: queuedSessionLog.id,
          payload: queuedSessionLog,
          queuedAt: '2026-03-26T12:01:00.000Z',
        }),
      ])
    );

    setNavigatorOnline(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/1 change will stay on this device and sync when the backend is reachable again/i)
    ).toBeInTheDocument();
    expect(await screen.findByText(/showing 1 of 1 filtered entries/i)).toBeInTheDocument();
    expect(screen.getByText(/^manual log$/i)).toBeInTheDocument();

    const { fetchMock, store } = createStatefulBackendFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    setNavigatorOnline(true);
    fireEvent(window, new Event('online'));

    await waitFor(() => expect(JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) ?? '[]')).toHaveLength(0));
    expect(store.sessionLogs).toHaveLength(1);
    expect(store.sessionLogs[0]?.id).toBe('offline-log-1');
    await waitFor(() =>
      expect(
        screen.queryByText(/1 change will stay on this device and sync when the backend is reachable again/i)
      ).not.toBeInTheDocument()
    );
  });

  it('retries only failed queued work after a partial reconnection failure', async () => {
    setNavigatorOnline(false);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/meditation type/i), { target: { value: 'Ajapa' } });
    fireEvent.change(screen.getByLabelText(/duration \(minutes\)/i), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: /save manual log/i }));

    expect(await screen.findByText(/manual log saved to history/i)).toBeInTheDocument();
    expect(screen.getByText(/this session log will sync when the backend is reachable/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('link', { name: /^Practice$/i })[0]);
    await waitForPracticeHydration();
    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));
    fireEvent.change(screen.getByLabelText(/custom play name/i), { target: { value: 'Offline Focus' } });
    fireEvent.change(screen.getByLabelText(/custom play meditation type/i), { target: { value: 'Vipassana' } });
    fireEvent.change(screen.getByLabelText(/custom play duration \(minutes\)/i), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: /create custom play/i }));

    expect(await screen.findByText(/custom play "Offline Focus" saved\./i)).toBeInTheDocument();
    expect(screen.getByText(/saved locally while offline\. this custom play will sync when the backend is reachable/i)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) ?? '[]')).toHaveLength(2);

    const { fetchMock: baseFetchMock, store } = createStatefulBackendFetchMock();
    let customPlayPutAttempts = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const requestUrl = new URL(url, 'http://localhost');
      const method = init?.method ?? 'GET';

      if (requestUrl.pathname.startsWith('/api/custom-plays/') && method === 'PUT') {
        customPlayPutAttempts += 1;
        if (customPlayPutAttempts === 1) {
          throw new TypeError('temporary offline');
        }
      }

      return baseFetchMock(input, init);
    });

    vi.stubGlobal('fetch', fetchMock);
    setNavigatorOnline(true);
    fireEvent(window, new Event('online'));

    await waitFor(() => expect(store.sessionLogs).toHaveLength(1));
    await waitFor(() => {
      const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) ?? '[]');
      expect(queue).toHaveLength(1);
      expect(queue[0].entityType).toBe('custom-play');
      expect(queue[0].state).toBe('failed');
    });
    expect(store.customPlays).toHaveLength(0);
    expect(customPlayPutAttempts).toBe(1);
    expect(screen.getByText(/1 change still need another sync attempt/i)).toBeInTheDocument();
    expect(screen.getByText('Offline Focus')).toBeInTheDocument();

    setNavigatorOnline(false);
    fireEvent(window, new Event('offline'));
    setNavigatorOnline(true);
    fireEvent(window, new Event('online'));

    await waitFor(() => expect(JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) ?? '[]')).toHaveLength(0));
    expect(store.sessionLogs).toHaveLength(1);
    expect(store.customPlays).toHaveLength(1);
    expect(store.customPlays[0]?.name).toBe('Offline Focus');
    expect(customPlayPutAttempts).toBe(2);
    await waitFor(() =>
      expect(screen.queryByText(/1 change still need another sync attempt/i)).not.toBeInTheDocument()
    );
  });

  it('completes a timer journey through pause, resume, auto log, and History', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T09:00:00.000Z'));
    const { fetchMock } = createStatefulBackendFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
    );

    await flushAsyncEffects();
    fireEvent.change(screen.getByLabelText(/duration \(minutes\)/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/meditation type/i), { target: { value: 'Vipassana' } });
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));

    expect(screen.getByRole('heading', { level: 2, name: '01:00' })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(20_000);
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole('button', { name: /^pause$/i }));
    expect(screen.getByText(/^paused$/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '00:40' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^resume$/i }));
    await act(async () => {
      vi.advanceTimersByTime(120_000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole('heading', { level: 2, name: /session completed/i })).toBeInTheDocument();
    expect(screen.getByText(/an auto log was added to history/i)).toBeInTheDocument();

    const storedLogs = JSON.parse(localStorage.getItem(SESSION_LOGS_KEY) ?? '[]');
    expect(storedLogs).toHaveLength(1);
    expect(storedLogs[0].status).toBe('completed');
    expect(storedLogs[0].source).toBe('auto log');
    expect(storedLogs[0].completedDurationSeconds).toBe(60);

    fireEvent.click(screen.getByRole('button', { name: /view history/i }));

    expect(screen.getByRole('heading', { level: 1, name: 'History' })).toBeInTheDocument();
    expect(screen.getAllByText(/^vipassana$/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/^completed$/i)).toBeInTheDocument();
    expect(screen.getByText(/^auto log$/i)).toBeInTheDocument();
    expect(screen.getByText(/showing 1 of 1 filtered entries/i)).toBeInTheDocument();
  });

  it('completes a playlist journey and records per-item auto logs in History', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T11:00:00.000Z'));
    const { fetchMock, store } = createStatefulBackendFetchMock({
      playlists: [
        {
          id: 'playlist-1',
          name: 'Lunch Reset',
          favorite: false,
          createdAt: '2026-03-25T08:00:00.000Z',
          updatedAt: '2026-03-25T08:00:00.000Z',
          items: [
            {
              id: 'item-1',
              meditationType: 'Vipassana',
              durationMinutes: 1,
            },
            {
              id: 'item-2',
              meditationType: 'Ajapa',
              durationMinutes: 1,
            },
          ],
        },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);

    const firstRender = render(
      <MemoryRouter initialEntries={['/practice/playlists']}>
        <App />
      </MemoryRouter>
    );

    await flushAsyncEffects();
    fireEvent.click(screen.getByRole('button', { name: /run playlist/i }));

    expect(screen.getByRole('heading', { level: 2, name: 'Lunch Reset' })).toBeInTheDocument();
    expect(screen.getByText(/current meditation type: vipassana/i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(60_000);
      await Promise.resolve();
      await Promise.resolve();
    });
    await flushAsyncEffects();

    expect(screen.getByText(/current meditation type: ajapa/i)).toBeInTheDocument();
    expect(screen.getByText(/completed so far: 1\/2 items/i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(60_000);
      await Promise.resolve();
      await Promise.resolve();
    });
    await flushAsyncEffects();

    expect(screen.getByRole('heading', { level: 2, name: /playlist completed/i })).toBeInTheDocument();
    expect(screen.getByText(/lunch reset · 2\/2 items logged/i)).toBeInTheDocument();

    expect(store.sessionLogs).toHaveLength(2);
    expect(store.sessionLogs.every((entry: { source: string; status: string; playlistName?: string }) => entry.source === 'auto log')).toBe(true);
    expect(store.sessionLogs.every((entry: { status: string }) => entry.status === 'completed')).toBe(true);
    expect(store.sessionLogs.every((entry: { playlistName?: string }) => entry.playlistName === 'Lunch Reset')).toBe(true);

    firstRender.unmount();

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    await flushAsyncEffects();
    expect(screen.getByRole('heading', { level: 1, name: 'History' })).toBeInTheDocument();
    expect(screen.getByText(/playlist run started at/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^playlist$/i)).toHaveLength(2);
    expect(screen.getAllByText(/^auto log$/i)).toHaveLength(2);
  });

  it('holds Home quick start until backend timer settings finish loading', async () => {
    let resolveSettings: ((value: unknown) => void) | null = null;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/settings/timer') && method === 'GET') {
          const body = await new Promise((resolve) => {
            resolveSettings = resolve;
          });

          return createJsonResponse(200, body);
        }

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/media/custom-plays') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
      })
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /start timer now/i })).toBeDisabled();
    expect(screen.getByText(/loading timer defaults from the backend/i)).toBeInTheDocument();

    resolveSettings?.({
      id: 'default',
      durationMinutes: 25,
      meditationType: 'Vipassana',
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: false,
      intervalMinutes: 5,
      intervalSound: 'Temple Bell',
    });

    await waitFor(() => expect(screen.getByRole('button', { name: /start timer now/i })).toBeEnabled());
    expect(screen.getByText(/default timer: 25 min/i)).toBeInTheDocument();
  });

  it('starts a timer from Home after backend defaults hydrate', async () => {
    const { fetchMock } = createStatefulBackendFetchMock({
      settings: {
        durationMinutes: 18,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /start timer now/i })).toBeEnabled());
    expect(screen.getByText(/default timer: 18 min/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /start timer now/i }));

    expect(await screen.findByRole('heading', { level: 2, name: '18:00' })).toBeInTheDocument();
    expect(screen.getByText(/stay present/i)).toBeInTheDocument();
  });

  it('persists backend timer settings and rehydrates them on a fresh app mount', async () => {
    const { fetchMock } = createStatefulBackendFetchMock({
      settings: {
        durationMinutes: 20,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    const firstRender = render(
      <StrictMode>
        <MemoryRouter initialEntries={['/settings']}>
          <App />
        </MemoryRouter>
      </StrictMode>
    );

    await flushBackendHydration();
    fireEvent.change(await screen.findByLabelText(/default duration \(minutes\)/i), { target: { value: '32' } });
    fireEvent.change(screen.getByLabelText(/default meditation type/i), { target: { value: 'Sahaj' } });
    fireEvent.click(screen.getByRole('button', { name: /save defaults/i }));

    await screen.findByText(/settings saved/i);
    firstRender.unmount();

    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/practice']}>
          <App />
        </MemoryRouter>
      </StrictMode>
    );

    expect(await screen.findByLabelText(/duration \(minutes\)/i)).toHaveValue(32);
    expect(screen.getByRole('combobox', { name: /meditation type/i })).toHaveValue('Sahaj');
  });

  it('syncs an ended-early timer session to backend history and rehydrates it on a fresh mount', async () => {
    const { fetchMock, store } = createStatefulBackendFetchMock({
      settings: {
        durationMinutes: 12,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    const firstRender = render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
    );

    await flushBackendHydration();
    fireEvent.click(await screen.findByRole('button', { name: /start session/i }));
    fireEvent.click(await screen.findByRole('button', { name: /end early/i }));
    fireEvent.click(within(screen.getByRole('dialog', { name: /end session early confirmation/i })).getByRole('button', { name: /^end early$/i }));

    await waitFor(() => expect(store.sessionLogs).toHaveLength(1));
    firstRender.unmount();

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/showing 1 of 1 filtered entries/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Vipassana$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^ended early$/i).length).toBeGreaterThan(0);
  });

  it('syncs a manual log to backend history and rehydrates it on a fresh mount', async () => {
    const { fetchMock, store } = createStatefulBackendFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    const firstRender = render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    await flushBackendHydration();
    fireEvent.change(screen.getByLabelText(/meditation type/i), { target: { value: 'Ajapa' } });
    fireEvent.change(screen.getByLabelText(/duration \(minutes\)/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/session timestamp/i), { target: { value: '2026-03-30T07:00' } });
    fireEvent.click(screen.getByRole('button', { name: /save manual log/i }));

    expect(await screen.findByText(/manual log saved to history/i)).toBeInTheDocument();
    await waitFor(() => expect(store.sessionLogs).toHaveLength(1));
    firstRender.unmount();

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/showing 1 of 1 filtered entries/i)).toBeInTheDocument();
    expect(screen.getByText(/^manual log$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Ajapa$/i).length).toBeGreaterThan(0);
  });

  it('feeds a backend manual log into summary and sankalpa progress on the Sankalpa screen, including a fresh mount', async () => {
    const { fetchMock, store } = createStatefulBackendFetchMock({
      sankalpas: [
        {
          id: 'goal-ajapa',
          goalType: 'session-count-based',
          targetValue: 1,
          days: 7,
          meditationType: 'Ajapa',
          createdAt: '2026-03-24T08:00:00.000Z',
        },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);

    const firstRender = render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    await flushBackendHydration();
    fireEvent.change(screen.getByLabelText(/meditation type/i), { target: { value: 'Ajapa' } });
    fireEvent.change(screen.getByLabelText(/duration \(minutes\)/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/session timestamp/i), { target: { value: '2026-03-30T07:00' } });
    fireEvent.click(screen.getByRole('button', { name: /save manual log/i }));

    expect(await screen.findByText(/manual log saved to history/i)).toBeInTheDocument();
    await waitFor(() => expect(store.sessionLogs).toHaveLength(1));

    fireEvent.click(screen.getAllByRole('link', { name: /^Sankalpa$/i })[0]);

    expect(await screen.findByText(/manual log: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/progress: 1 \/ 1 session logs · 0 session logs remaining/i)).toBeInTheDocument();
    firstRender.unmount();

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText(/manual log: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/1 session log in 7 days/i)).toBeInTheDocument();
    expect(screen.getByText(/progress: 1 \/ 1 session logs · 0 session logs remaining/i)).toBeInTheDocument();
  });

  it('persists a backend custom play and rehydrates it on a fresh app mount', async () => {
    const { fetchMock, store } = createStatefulBackendFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    const firstRender = render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
    );

    await flushBackendHydration();
    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));
    fireEvent.change(screen.getByLabelText(/custom play name/i), { target: { value: 'Sunrise Sit' } });
    fireEvent.change(screen.getByLabelText(/custom play meditation type/i), { target: { value: 'Vipassana' } });
    fireEvent.change(screen.getByLabelText(/custom play duration \(minutes\)/i), { target: { value: '24' } });
    await screen.findByRole('option', { name: /vipassana sit \(20 min\)/i });
    fireEvent.change(screen.getByLabelText(/media session \(optional\)/i), { target: { value: 'media-vipassana-sit-20' } });
    fireEvent.click(screen.getByRole('button', { name: /create custom play/i }));

    expect(await screen.findByText(/custom play "Sunrise Sit" saved\./i)).toBeInTheDocument();
    await waitFor(() => expect(store.customPlays).toHaveLength(1));
    firstRender.unmount();

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
    );

    await flushBackendHydration();
    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));

    expect(screen.getByText('Sunrise Sit')).toBeInTheDocument();
    expect(await screen.findByText(/media session: vipassana sit \(20 min\)/i)).toBeInTheDocument();
  });
});
