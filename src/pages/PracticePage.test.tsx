import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncStatusProvider } from '../features/sync/SyncStatusProvider';
import { TimerProvider } from '../features/timer/TimerContext';
import PracticePage from './PracticePage';

const ACTIVE_PLAYLIST_RUN_STATE_KEY = 'meditation.activePlaylistRunState.v1';
const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';

function createJsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function stubPracticeFetchWithTimerSettings(settings: {
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

      if (url.endsWith('/api/playlists') && method === 'GET') {
        return createJsonResponse(200, []);
      }

      return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
    })
  );
}

async function waitForPracticeSettingsHydration() {
  await waitFor(() =>
    expect(screen.queryByText(/loading timer defaults from the backend before starting a session/i)).not.toBeInTheDocument()
  );
}

describe('PracticePage UX', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps required meditation type error hidden until start attempt', async () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText(/meditation type is required/i)).not.toBeInTheDocument();
    await waitForPracticeSettingsHydration();

    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    expect(screen.getByText(/meditation type is required/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /meditation type/i })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('combobox', { name: /meditation type/i })).toHaveAttribute(
      'aria-describedby',
      'practice-meditation-type-error'
    );
  });

  it('renders and dismisses entry guidance passed from route state', () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/practice',
            state: {
              entryMessage: 'Quick start needs valid defaults.',
            },
          },
        ]}
      >
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/quick start needs valid defaults/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^dismiss$/i }));
    expect(screen.queryByText(/quick start needs valid defaults/i)).not.toBeInTheDocument();
  });

  it('keeps management-heavy practice tools collapsed until requested', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    const toolsToggle = screen.getByRole('button', { name: /show tools/i });
    expect(toolsToggle).toBeInTheDocument();
    expect(toolsToggle).toHaveAttribute('aria-expanded', 'false');
    expect(toolsToggle).toHaveAttribute('aria-controls', 'practice-tools-content');
    expect(screen.queryByRole('heading', { name: /custom plays/i })).not.toBeInTheDocument();

    fireEvent.click(toolsToggle);
    expect(screen.getByRole('button', { name: /hide tools/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: /custom plays/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open playlists/i })).toBeInTheDocument();
  });

  it('restores the last fixed duration after switching from open-ended mode back to fixed', async () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeSettingsHydration();
    fireEvent.change(screen.getByLabelText(/duration \(minutes\)/i), { target: { value: '24' } });
    fireEvent.click(screen.getByRole('radio', { name: /open-ended/i }));

    expect(screen.queryByLabelText(/duration \(minutes\)/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start open-ended session/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /fixed duration/i }));

    const durationInput = screen.getByLabelText(/duration \(minutes\)/i) as HTMLInputElement;
    expect(durationInput.value).toBe('24');
    expect(screen.getByRole('button', { name: /start session/i })).toBeInTheDocument();
  });

  it('keeps practice timer edits session-scoped instead of overwriting saved defaults', async () => {
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
    stubPracticeFetchWithTimerSettings({
      durationMinutes: 20,
      meditationType: 'Vipassana',
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: false,
      intervalMinutes: 5,
      intervalSound: 'Temple Bell',
    });

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeSettingsHydration();
    fireEvent.change(screen.getByLabelText(/duration \(minutes\)/i), { target: { value: '31' } });
    fireEvent.change(screen.getByRole('combobox', { name: /meditation type/i }), { target: { value: 'Ajapa' } });

    expect(JSON.parse(localStorage.getItem(TIMER_SETTINGS_KEY) ?? '{}')).toMatchObject({
      durationMinutes: 20,
      lastFixedDurationMinutes: 20,
      meditationType: 'Vipassana',
    });
  });

  it('exposes explicit expanded state for advanced timer settings', async () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeSettingsHydration();
    const advancedToggle = screen.getByRole('button', { name: /show advanced options/i });
    expect(advancedToggle).toHaveAttribute('aria-expanded', 'false');
    expect(advancedToggle).toHaveAttribute('aria-controls', 'advanced-timer-settings');

    fireEvent.click(advancedToggle);

    expect(screen.getByRole('button', { name: /hide advanced options/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText(/^start sound \(optional\)$/i)).toBeInTheDocument();
  });

  it('disables timer start and shows guidance when playlist run is active', async () => {
    localStorage.setItem(
      ACTIVE_PLAYLIST_RUN_STATE_KEY,
      JSON.stringify({
        activePlaylistRun: {
          runId: 'playlist-1-1000',
          playlistId: 'playlist-1',
          playlistName: 'Morning Sequence',
          runStartedAt: '2026-03-24T10:00:00.000Z',
          items: [
            {
              id: 'item-1',
              meditationType: 'Vipassana',
              durationMinutes: 10,
            },
          ],
          currentIndex: 0,
          currentItemStartedAt: '2026-03-24T10:00:00.000Z',
          currentItemStartedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          currentItemRemainingSeconds: 500,
          currentItemEndAtMs: Date.parse('2099-03-24T10:10:00.000Z'),
          completedItems: 0,
          completedDurationSeconds: 0,
          totalIntendedDurationSeconds: 600,
        },
        isPaused: false,
      })
    );

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    await waitForPracticeSettingsHydration();

    const startButton = screen.getByRole('button', { name: /start session/i });
    expect(startButton).toBeDisabled();
    const guidanceText = screen.getByText(/resume or end the playlist run before starting a separate timer session/i);
    expect(guidanceText).toBeInTheDocument();

    const guidanceBanner = guidanceText.closest('.status-banner');
    expect(guidanceBanner).not.toBeNull();
    expect(startButton).toHaveAttribute('aria-describedby', 'timer-start-blocked-message');
    expect(within(guidanceBanner ?? document.body).getByRole('button', { name: /resume playlist run/i })).toBeInTheDocument();
  });

  it('locks timer-setting controls until backend timer settings finish hydrating', async () => {
    let resolveSettingsResponse: ((response: ReturnType<typeof createJsonResponse>) => void) | null = null;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/settings/timer') && method === 'GET') {
          return await new Promise((resolve) => {
            resolveSettingsResponse = resolve;
          });
        }

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
      })
    );

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/practice" element={<PracticePage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/duration \(minutes\)/i)).toBeDisabled();
    expect(screen.getByRole('combobox', { name: /meditation type/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /show advanced options/i })).toBeDisabled();

    resolveSettingsResponse?.(
      createJsonResponse(200, {
        id: 'default',
        durationMinutes: 24,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
        updatedAt: '2026-03-26T12:00:00.000Z',
      })
    );

    await waitFor(() => expect(screen.getByLabelText(/duration \(minutes\)/i)).toBeEnabled());
    expect(screen.getByRole('combobox', { name: /meditation type/i })).toBeEnabled();
  });
});
