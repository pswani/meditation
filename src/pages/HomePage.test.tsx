import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';
const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';
const CUSTOM_PLAYS_KEY = 'meditation.customPlays.v1';
const PLAYLISTS_KEY = 'meditation.playlists.v1';
const SANKALPAS_KEY = 'meditation.sankalpas.v1';

async function waitForHomeQuickStartReady() {
  await waitFor(() => expect(screen.getByRole('button', { name: /start timer now/i })).toBeEnabled());
}

function createJsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

describe('HomePage UX', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders calm empty states when there is no stored activity', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/no session log entries yet today/i)).toBeInTheDocument();
    expect(screen.getByText(/no active sankalpa right now/i)).toBeInTheDocument();
    expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /next actions/i })).not.toBeInTheDocument();
  });

  it('shows populated today, sankalpa, and favorites content from local storage data', () => {
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

    expect(screen.getByRole('heading', { name: /sankalpa snapshot/i })).toBeInTheDocument();
    expect(screen.getByText(/duration goal/i)).toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: /timer setup/i })).toBeInTheDocument();
    expect(screen.getByText(/quick start needs valid defaults/i)).toBeInTheDocument();
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
          durationMinutes: 33,
          meditationType: 'Ajapa',
          startSound: 'Soft Chime',
          endSound: 'Wood Block',
          favorite: true,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
        },
      ])
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitForHomeQuickStartReady();
    fireEvent.click(screen.getByRole('button', { name: /^use$/i }));

    expect(await screen.findByRole('heading', { name: /timer setup/i })).toBeInTheDocument();
    expect(screen.getByText(/custom play "Morning Focus" applied to timer setup\./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration \(minutes\)/i)).toHaveValue(33);
    expect(screen.getByRole('combobox', { name: /meditation type/i })).toHaveValue('Ajapa');

    fireEvent.click(screen.getAllByRole('link', { name: /^home$/i })[0]);
    await waitForHomeQuickStartReady();
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

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitForHomeQuickStartReady();
    fireEvent.click(screen.getByRole('button', { name: /start timer now/i }));
    expect(screen.getByRole('heading', { level: 2, name: /\d{2}:\d{2}/i })).toBeInTheDocument();
    expect(screen.getByText(/stay present/i)).toBeInTheDocument();
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

    expect(screen.getByText(/loading favorite playlists from the backend/i)).toBeInTheDocument();
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
    expect(screen.queryByText(/loading favorite playlists from the backend/i)).not.toBeInTheDocument();
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

    await waitFor(() => expect(screen.getByText(/duration goal/i)).toBeInTheDocument());
    expect(screen.getByText(/60 min \/ 120 min/i)).toBeInTheDocument();
    expect(screen.queryByText(/no active sankalpa right now/i)).not.toBeInTheDocument();
  });
});
