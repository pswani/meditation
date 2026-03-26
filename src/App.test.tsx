import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const ACTIVE_TIMER_STATE_KEY = 'meditation.activeTimerState.v1';
const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';
const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';
const CUSTOM_PLAYS_KEY = 'meditation.customPlays.v1';
const PLAYLISTS_KEY = 'meditation.playlists.v1';

function createJsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
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
  sessionLogs?: Array<Record<string, unknown>>;
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
  };

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method ?? 'GET';

    if (url.endsWith('/api/settings/timer') && method === 'GET') {
      return createJsonResponse(200, {
        id: 'default',
        ...store.settings,
        updatedAt: '2026-03-26T12:00:00.000Z',
      });
    }

    if (url.endsWith('/api/settings/timer') && method === 'PUT') {
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

    if (url.endsWith('/api/session-logs') && method === 'GET') {
      return createJsonResponse(200, [...store.sessionLogs]);
    }

    if (url.includes('/api/session-logs/') && method === 'PUT') {
      const sessionLog = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
      const existingIndex = store.sessionLogs.findIndex((entry) => entry.id === sessionLog.id);

      if (existingIndex >= 0) {
        store.sessionLogs[existingIndex] = sessionLog;
      } else {
        store.sessionLogs.unshift(sessionLog);
      }

      return createJsonResponse(200, sessionLog);
    }

    if (url.endsWith('/api/media/custom-plays') && method === 'GET') {
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

    return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
  });

  return { fetchMock, store };
}

async function flushBackendHydration() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('App shell', () => {
  beforeEach(() => {
    localStorage.clear();
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

    expect(screen.getByText(/active timer: vipassana/i)).toBeInTheDocument();
    expect(setItemSpy).not.toHaveBeenCalled();
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
          intendedDurationSeconds: 1200,
          remainingSeconds: 1200,
          meditationType: 'Vipassana',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
          endAtMs: Date.parse('2026-03-24T10:20:00.000Z'),
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
    expect(persistedState.activeSession?.remainingSeconds).toBe(900);

    fireEvent.click(screen.getByRole('button', { name: /^dismiss$/i }));
    expect(screen.queryByText(/recovered an active timer from your previous app state/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /resume active timer/i }));
    expect(screen.getByRole('heading', { level: 2, name: /\d{2}:\d{2}/i })).toBeInTheDocument();
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
          intendedDurationSeconds: 1200,
          remainingSeconds: 1200,
          meditationType: 'Ajapa',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
          endAtMs: Date.parse('2026-03-24T10:20:00.000Z'),
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

  it('completes a timer journey through pause, resume, auto log, and History', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T09:00:00.000Z'));

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
    );

    await flushBackendHydration();
    fireEvent.change(screen.getByLabelText(/duration \(minutes\)/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/meditation type/i), { target: { value: 'Vipassana' } });
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));

    expect(screen.getByRole('heading', { level: 2, name: '01:00' })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(20_000);
    });

    fireEvent.click(screen.getByRole('button', { name: /^pause$/i }));
    expect(screen.getByText(/^paused$/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '00:40' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^resume$/i }));
    act(() => {
      vi.advanceTimersByTime(40_000);
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

    localStorage.setItem(
      PLAYLISTS_KEY,
      JSON.stringify([
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
      ])
    );

    render(
      <MemoryRouter initialEntries={['/practice/playlists']}>
        <App />
      </MemoryRouter>
    );

    await flushBackendHydration();
    fireEvent.click(screen.getByRole('button', { name: /run playlist/i }));

    expect(screen.getByRole('heading', { level: 2, name: 'Lunch Reset' })).toBeInTheDocument();
    expect(screen.getByText(/current meditation type: vipassana/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText(/current meditation type: ajapa/i)).toBeInTheDocument();
    expect(screen.getByText(/completed so far: 1\/2 items/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByRole('heading', { level: 2, name: /playlist completed/i })).toBeInTheDocument();
    expect(screen.getByText(/lunch reset · 2\/2 items logged/i)).toBeInTheDocument();

    const storedLogs = JSON.parse(localStorage.getItem(SESSION_LOGS_KEY) ?? '[]');
    expect(storedLogs).toHaveLength(2);
    expect(storedLogs.every((entry: { source: string; status: string; playlistName?: string }) => entry.source === 'auto log')).toBe(true);
    expect(storedLogs.every((entry: { status: string }) => entry.status === 'completed')).toBe(true);
    expect(storedLogs.every((entry: { playlistName?: string }) => entry.playlistName === 'Lunch Reset')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /view history/i }));

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
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>
    );

    await flushBackendHydration();
    fireEvent.change(await screen.findByLabelText(/default duration \(minutes\)/i), { target: { value: '32' } });
    fireEvent.change(screen.getByLabelText(/default meditation type/i), { target: { value: 'Sahaj' } });
    fireEvent.click(screen.getByRole('button', { name: /save defaults/i }));

    await screen.findByText(/settings saved/i);
    firstRender.unmount();

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
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
});
