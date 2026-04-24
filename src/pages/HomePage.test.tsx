import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';
const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';
const CUSTOM_PLAYS_KEY = 'meditation.customPlays.v1';
const PLAYLISTS_KEY = 'meditation.playlists.v1';
const SANKALPAS_KEY = 'meditation.sankalpas.v1';
const LAST_USED_MEDITATION_KEY = 'meditation.lastUsedMeditation.v1';
const ACTIVE_TIMER_STATE_KEY = 'meditation.activeTimerState.v1';

async function waitForHomeQuickStartReady() {
  await waitFor(() => expect(screen.getByRole('button', { name: /start timer now/i })).toBeEnabled());
}

async function waitForHomePageReady() {
  expect(await screen.findByRole('button', { name: /start timer now/i })).toBeInTheDocument();
}

function createJsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function stubHomeFetchWithTimerSettings(settings: {
  durationMinutes: number;
  meditationType: string;
  startSound: string;
  endSound: string;
  intervalEnabled: boolean;
  intervalMinutes: number;
  intervalSound: string;
}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? 'GET';

      if (url.endsWith('/api/settings/timer') && method === 'GET') {
        return createJsonResponse(200, {
          id: 'default',
          ...settings,
          updatedAt: '2026-03-26T12:00:00.000Z',
        });
      }

      if (url.endsWith('/api/session-logs') && method === 'GET') {
        return createJsonResponse(200, []);
      }

      if (url.endsWith('/api/media/custom-plays') && method === 'GET') {
        return createJsonResponse(200, []);
      }

      if (url.endsWith('/api/sankalpas') && method === 'GET') {
        return createJsonResponse(200, []);
      }

      if (url.includes('/api/sankalpas?') && method === 'GET') {
        return createJsonResponse(200, []);
      }

      if (url.endsWith('/api/playlists') && method === 'GET') {
        return createJsonResponse(200, []);
      }

      return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
    })
  );
}

describe('HomePage UX', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders calm empty states when there is no stored activity', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitForHomePageReady();
    expect(screen.getByText(/no session log entries yet today/i)).toBeInTheDocument();
    expect(screen.getByText(/no active sankalpa right now/i)).toBeInTheDocument();
    expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument();
    expect(screen.getByText(/your last started timer, custom play, or playlist will appear here/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /next actions/i })).not.toBeInTheDocument();
  });

  it('shows populated today, sankalpa, and favorites content from local storage data', async () => {
    const now = new Date();
    const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([
        {
          id: 'log-1',
          startedAt: twentyMinutesAgo,
          endedAt: now.toISOString(),
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
          name: 'Morning Breath Focus',
          durationMinutes: 25,
          meditationType: 'Ajapa',
          favorite: true,
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
          name: 'Evening Sequence',
          favorite: true,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
          items: [
            {
              id: 'playlist-item-1',
              name: 'Sequence Start',
              durationMinutes: 10,
              meditationType: 'Vipassana',
              startSound: 'None',
              endSound: 'Temple Bell',
            },
          ],
        },
      ])
    );
    localStorage.setItem(
      SANKALPAS_KEY,
      JSON.stringify([
        {
          id: 'goal-1',
          goalType: 'duration-based',
          targetValue: 180,
          days: 7,
          createdAt: oneDayAgo,
        },
      ])
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitForHomePageReady();
    expect(screen.getByRole('heading', { name: /sankalpa snapshot/i })).toBeInTheDocument();
    expect(screen.getAllByText(/180 min in 7 days/i)).not.toHaveLength(0);
    expect(screen.getByText(/progress:/i)).toBeInTheDocument();
    expect(screen.getByText(/morning breath focus/i)).toBeInTheDocument();
    expect(screen.getByText(/evening sequence/i)).toBeInTheDocument();
  });

  it('shows quick-start guidance on Practice when defaults are invalid', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitForHomeQuickStartReady();
    fireEvent.click(screen.getByRole('button', { name: /start timer now/i }));

    expect(await screen.findByRole('heading', { name: /timer setup/i })).toBeInTheDocument();
    expect(await screen.findByText(/quick start needs valid defaults/i)).toBeInTheDocument();
  });

  it('keeps Home quick start aligned to saved defaults after Practice edits', async () => {
    localStorage.setItem(
      TIMER_SETTINGS_KEY,
      JSON.stringify({
        timerMode: 'fixed',
        durationMinutes: 20,
        lastFixedDurationMinutes: 20,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
      })
    );
    stubHomeFetchWithTimerSettings({
      durationMinutes: 20,
      meditationType: 'Vipassana',
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: false,
      intervalMinutes: 5,
      intervalSound: 'Temple Bell',
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitForHomeQuickStartReady();
    expect(screen.getByText(/default timer: 20 min · vipassana/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open practice/i }));
    expect(await screen.findByRole('heading', { name: /timer setup/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/duration \(minutes\)/i), { target: { value: '33' } });
    fireEvent.change(screen.getByRole('combobox', { name: /meditation type/i }), { target: { value: 'Ajapa' } });

    fireEvent.click(screen.getAllByRole('link', { name: /^home$/i })[0]);
    await waitForHomeQuickStartReady();
    expect(screen.getByText(/default timer: 20 min · vipassana/i)).toBeInTheDocument();
  });

  it('preloads a favorite custom play without overwriting the saved Home defaults', async () => {
    localStorage.setItem(
      TIMER_SETTINGS_KEY,
      JSON.stringify({
        timerMode: 'fixed',
        durationMinutes: 20,
        lastFixedDurationMinutes: 20,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
      })
    );
    localStorage.setItem(
      CUSTOM_PLAYS_KEY,
      JSON.stringify([
        {
          id: 'play-1',
          name: 'Morning Focus',
          durationMinutes: 20,
          meditationType: 'Ajapa',
          startSound: 'Temple Bell',
          endSound: 'Gong',
          mediaAssetId: 'media-vipassana-sit-20',
          recordingLabel: 'Breath emphasis',
          favorite: true,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
        },
      ])
    );
    stubHomeFetchWithTimerSettings({
      durationMinutes: 20,
      meditationType: 'Vipassana',
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: false,
      intervalMinutes: 5,
      intervalSound: 'Temple Bell',
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitForHomeQuickStartReady();
    fireEvent.click(screen.getByRole('button', { name: /^start$/i }));

    expect(await screen.findByRole('heading', { name: /morning focus/i })).toBeInTheDocument();
    expect(screen.getByText(/recording: vipassana sit \(20 min\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('link', { name: /^home$/i })[0]);
    const quickStartHeading = await screen.findByRole('heading', { name: /quick start/i });
    const quickStartPanel = quickStartHeading.closest('section');
    expect(quickStartPanel).not.toBeNull();
    expect(within(quickStartPanel as HTMLElement).getByRole('button', { name: /open custom play/i })).toBeEnabled();
    expect(screen.getByText(/default timer: 20 min · vipassana/i)).toBeInTheDocument();
  });

  it('starts and routes to the active timer when quick-start defaults are valid', async () => {
    localStorage.setItem(
      TIMER_SETTINGS_KEY,
      JSON.stringify({
        durationMinutes: 15,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
      })
    );
    stubHomeFetchWithTimerSettings({
      durationMinutes: 15,
      meditationType: 'Vipassana',
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: false,
      intervalMinutes: 5,
      intervalSound: 'Temple Bell',
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitForHomeQuickStartReady();
    fireEvent.click(screen.getByRole('button', { name: /start timer now/i }));
    expect(await screen.findByRole('heading', { level: 2, name: /\d{2}:\d{2}/i })).toBeInTheDocument();
    expect(screen.getByText(/stay present/i)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(LAST_USED_MEDITATION_KEY) ?? 'null')).toMatchObject({
      kind: 'timer',
      settings: {
        durationMinutes: 15,
        meditationType: 'Vipassana',
      },
    });
  });

  it('keeps the Home resume-active-timer action enabled while timer settings are still hydrating', async () => {
    localStorage.setItem(
      ACTIVE_TIMER_STATE_KEY,
      JSON.stringify({
        startedAt: '2026-04-09T12:00:00.000Z',
        startedAtMs: Date.parse('2026-04-09T12:00:00.000Z'),
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

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/settings/timer') && method === 'GET') {
          return new Promise(() => {});
        }

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/media/custom-plays') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/sankalpas') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.includes('/api/sankalpas?') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/playlists') && method === 'GET') {
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

    const quickStartHeading = await screen.findByRole('heading', { name: /quick start/i });
    const quickStartPanel = quickStartHeading.closest('section');
    expect(quickStartPanel).not.toBeNull();

    const resumeButton = within(quickStartPanel as HTMLElement).getByRole('button', { name: /open active timer/i });
    expect(resumeButton).toBeEnabled();

    fireEvent.click(resumeButton);

    expect(await screen.findByText(/stay present/i)).toBeInTheDocument();
  });

  it('starts the last used timer shortcut from Home without relying on saved defaults', async () => {
    localStorage.setItem(
      TIMER_SETTINGS_KEY,
      JSON.stringify({
        timerMode: 'fixed',
        durationMinutes: 20,
        lastFixedDurationMinutes: 20,
        meditationType: '',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
      })
    );
    localStorage.setItem(
      LAST_USED_MEDITATION_KEY,
      JSON.stringify({
        kind: 'timer',
        settings: {
          timerMode: 'fixed',
          durationMinutes: 27,
          lastFixedDurationMinutes: 27,
          meditationType: 'Ajapa',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: true,
          intervalMinutes: 9,
          intervalSound: 'Gong',
        },
        usedAt: '2026-04-01T12:00:00.000Z',
      })
    );
    stubHomeFetchWithTimerSettings({
      durationMinutes: 20,
      meditationType: '',
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: false,
      intervalMinutes: 5,
      intervalSound: 'Temple Bell',
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitForHomeQuickStartReady();
    expect(screen.getByText(/last used: timer · 27 min · ajapa/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /start last used meditation/i }));

    expect(screen.getByRole('heading', { level: 2, name: /\d{2}:\d{2}/i })).toBeInTheDocument();
    expect(screen.getByText(/stay present/i)).toBeInTheDocument();
  });

  it('starts the last used playlist shortcut from Home', async () => {
    localStorage.setItem(
      LAST_USED_MEDITATION_KEY,
      JSON.stringify({
        kind: 'playlist',
        playlistId: 'playlist-1',
        playlistName: 'Evening Sequence',
        usedAt: '2026-04-01T12:00:00.000Z',
      })
    );
    localStorage.setItem(
      PLAYLISTS_KEY,
      JSON.stringify([
        {
          id: 'playlist-1',
          name: 'Evening Sequence',
          favorite: true,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
          items: [
            {
              id: 'playlist-item-1',
              durationMinutes: 10,
              meditationType: 'Vipassana',
            },
          ],
        },
      ])
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/settings/timer') && method === 'GET') {
          return createJsonResponse(200, {
            id: 'default',
            durationMinutes: 20,
            meditationType: 'Vipassana',
            startSound: 'None',
            endSound: 'Temple Bell',
            intervalEnabled: false,
            intervalMinutes: 5,
            intervalSound: 'Temple Bell',
            updatedAt: '2026-03-26T12:00:00.000Z',
          });
        }

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/media/custom-plays') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/sankalpas') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.includes('/api/sankalpas?') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/playlists') && method === 'GET') {
          return createJsonResponse(200, [
            {
              id: 'playlist-1',
              name: 'Evening Sequence',
              favorite: true,
              createdAt: '2026-03-24T08:00:00.000Z',
              updatedAt: '2026-03-24T08:00:00.000Z',
              items: [
                {
                  id: 'playlist-item-1',
                  durationMinutes: 10,
                  meditationType: 'Vipassana',
                },
              ],
            },
          ]);
        }

        return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
      })
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/last used: playlist · evening sequence/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /start last used meditation/i }));

    expect(await screen.findByRole('heading', { name: /evening sequence/i })).toBeInTheDocument();
    expect(screen.getByText(/item 1 of 1/i)).toBeInTheDocument();
  });

  it('clears a stale last used playlist shortcut after playlists finish hydrating without that playlist', async () => {
    localStorage.setItem(
      LAST_USED_MEDITATION_KEY,
      JSON.stringify({
        kind: 'playlist',
        playlistId: 'playlist-missing',
        playlistName: 'Missing Sequence',
        usedAt: '2026-04-01T12:00:00.000Z',
      })
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/settings/timer') && method === 'GET') {
          return createJsonResponse(200, {
            id: 'default',
            durationMinutes: 20,
            meditationType: 'Vipassana',
            startSound: 'None',
            endSound: 'Temple Bell',
            intervalEnabled: false,
            intervalMinutes: 5,
            intervalSound: 'Temple Bell',
            updatedAt: '2026-03-26T12:00:00.000Z',
          });
        }

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/media/custom-plays') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/sankalpas') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.includes('/api/sankalpas?') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/playlists') && method === 'GET') {
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

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /start last used meditation/i })).not.toBeInTheDocument()
    );
    expect(screen.getByText(/your last started timer, custom play, or playlist will appear here/i)).toBeInTheDocument();
    expect(localStorage.getItem(LAST_USED_MEDITATION_KEY)).toBeNull();
  });

  it('keeps favorite playlist shortcuts disabled until backend playlists finish hydrating', async () => {
    localStorage.setItem(
      PLAYLISTS_KEY,
      JSON.stringify([
        {
          id: 'playlist-1',
          name: 'Evening Sequence',
          favorite: true,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
          items: [
            {
              id: 'playlist-item-1',
              durationMinutes: 10,
              meditationType: 'Vipassana',
            },
          ],
        },
      ])
    );

    let resolvePlaylists: ((value: unknown) => void) | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/settings/timer') && method === 'GET') {
          return createJsonResponse(200, {
            id: 'default',
            durationMinutes: 20,
            meditationType: '',
            startSound: 'None',
            endSound: 'Temple Bell',
            intervalEnabled: false,
            intervalMinutes: 5,
            intervalSound: 'Temple Bell',
            updatedAt: '2026-03-26T12:00:00.000Z',
          });
        }

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/media/custom-plays') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/playlists') && method === 'GET') {
          const body = await new Promise((resolve) => {
            resolvePlaylists = resolve;
          });

          return createJsonResponse(200, body);
        }

        return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
      })
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading favorite playlists/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^run$/i })).toBeDisabled();

    resolvePlaylists?.([
      {
        id: 'playlist-1',
        name: 'Evening Sequence',
        favorite: true,
        createdAt: '2026-03-24T08:00:00.000Z',
        updatedAt: '2026-03-24T08:00:00.000Z',
        items: [
          {
            id: 'playlist-item-1',
            durationMinutes: 10,
            meditationType: 'Vipassana',
          },
        ],
      },
    ]);

    await waitFor(() => expect(screen.getByRole('button', { name: /^run$/i })).toBeEnabled());
    expect(screen.queryByText(/loading favorite playlists/i)).not.toBeInTheDocument();
  });

  it('shows the sankalpa snapshot from the backend when sankalpa progress loads successfully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/settings/timer') && method === 'GET') {
          return createJsonResponse(200, {
            id: 'default',
            durationMinutes: 20,
            meditationType: 'Vipassana',
            startSound: 'None',
            endSound: 'Temple Bell',
            intervalEnabled: false,
            intervalMinutes: 5,
            intervalSound: 'Temple Bell',
            updatedAt: '2026-03-26T12:00:00.000Z',
          });
        }

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/media/custom-plays') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/playlists') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.includes('/api/sankalpas') && method === 'GET') {
          return createJsonResponse(200, [
            {
              goal: {
                id: 'goal-1',
                goalType: 'duration-based',
                targetValue: 120,
                days: 7,
                meditationType: 'Vipassana',
                createdAt: '2026-03-24T08:00:00.000Z',
              },
              status: 'active',
              deadlineAt: '2026-03-31T08:00:00.000Z',
              matchedSessionCount: 2,
              matchedDurationSeconds: 3600,
              targetSessionCount: 0,
              targetDurationSeconds: 7200,
              progressRatio: 0.5,
            },
          ]);
        }

        return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
      })
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByText(/120 min in 7 days/i)).not.toHaveLength(0));
    expect(screen.getByText(/60 min \/ 120 min/i)).toBeInTheDocument();
    expect(screen.queryByText(/no active sankalpa right now/i)).not.toBeInTheDocument();
  });

  it('shows an observance-based sankalpa snapshot when that is the top active goal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/settings/timer') && method === 'GET') {
          return createJsonResponse(200, {
            id: 'default',
            durationMinutes: 20,
            meditationType: 'Vipassana',
            startSound: 'None',
            endSound: 'Temple Bell',
            intervalEnabled: false,
            intervalMinutes: 5,
            intervalSound: 'Temple Bell',
            updatedAt: '2026-03-26T12:00:00.000Z',
          });
        }

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/media/custom-plays') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.endsWith('/api/playlists') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        if (url.includes('/api/sankalpas') && method === 'GET') {
          return createJsonResponse(200, [
            {
              goal: {
                id: 'goal-observance',
                goalType: 'observance-based',
                targetValue: 3,
                days: 3,
                observanceLabel: 'Meal before 7 PM',
                observanceRecords: [{ date: '2026-04-05', status: 'observed' }],
                createdAt: '2026-04-05T08:00:00.000Z',
              },
              status: 'active',
              deadlineAt: '2026-04-07T23:59:59.999Z',
              matchedSessionCount: 0,
              matchedDurationSeconds: 0,
              targetSessionCount: 0,
              targetDurationSeconds: 0,
              matchedObservanceCount: 1,
              missedObservanceCount: 0,
              pendingObservanceCount: 2,
              targetObservanceCount: 3,
              observanceDays: [
                { date: '2026-04-05', status: 'observed', isFuture: false },
                { date: '2026-04-06', status: 'pending', isFuture: false },
                { date: '2026-04-07', status: 'pending', isFuture: false },
              ],
              progressRatio: 1 / 3,
            },
          ]);
        }

        return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
      })
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/meal before 7 pm/i)).toBeInTheDocument());
    expect(screen.getByText(/1 \/ 3 observed dates/i)).toBeInTheDocument();
  });
});
