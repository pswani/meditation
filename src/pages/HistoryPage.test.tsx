import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncStatusProvider } from '../features/sync/SyncStatusProvider';
import { TimerProvider } from '../features/timer/TimerContext';
import HistoryPage from './HistoryPage';

const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';
const historyTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const historyDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function createJsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function getExpectedHistoryRange(startedAt: string, endedAt: string) {
  const startedAtDate = new Date(startedAt);
  const endedAtDate = new Date(endedAt);
  const sameDay =
    startedAtDate.getFullYear() === endedAtDate.getFullYear() &&
    startedAtDate.getMonth() === endedAtDate.getMonth() &&
    startedAtDate.getDate() === endedAtDate.getDate();

  return {
    startLabel: historyDateTimeFormatter.format(startedAtDate),
    endLabel: sameDay ? historyTimeFormatter.format(endedAtDate) : historyDateTimeFormatter.format(endedAtDate),
  };
}

describe('HistoryPage UX', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

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

        if (url.endsWith('/api/session-logs/manual') && method === 'POST') {
          const requestBody = JSON.parse(String(init?.body ?? '{}')) as {
            durationMinutes: number;
            meditationType: string;
            sessionTimestamp: string;
          };
          const durationSeconds = Math.round(requestBody.durationMinutes * 60);
          const endedAt = new Date(requestBody.sessionTimestamp);
          const startedAt = new Date(endedAt.getTime() - durationSeconds * 1000);

          return createJsonResponse(200, {
            id: 'manual-log-created',
            startedAt: startedAt.toISOString(),
            endedAt: endedAt.toISOString(),
            meditationType: requestBody.meditationType,
            intendedDurationSeconds: durationSeconds,
            completedDurationSeconds: durationSeconds,
            status: 'completed',
            source: 'manual log',
            startSound: 'None',
            endSound: 'None',
            intervalEnabled: false,
            intervalMinutes: 0,
            intervalSound: 'None',
          });
        }

        if (url.includes('/api/session-logs/') && method === 'PUT') {
          return createJsonResponse(200, typeof init?.body === 'string' ? JSON.parse(init.body) : {});
        }

        return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
      })
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows timestamp helper text and save success feedback for manual log', async () => {
    render(
      <MemoryRouter initialEntries={['/history']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/use your local date and time when the session ended/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/session timestamp/i)).toHaveAttribute('aria-describedby', 'manual-log-timestamp-hint');

    fireEvent.change(screen.getByLabelText(/meditation type/i), { target: { value: 'Vipassana' } });
    fireEvent.click(screen.getByRole('button', { name: /save manual log/i }));

    expect(await screen.findByText(/manual log saved to history/i)).toBeInTheDocument();
    expect(await screen.findByText(/^manual log$/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/duration \(minutes\)/i), { target: { value: '25' } });
    expect(screen.queryByText(/manual log saved to history/i)).not.toBeInTheDocument();
  });

  it('lets manual logs be saved as open-ended sessions with calm history copy', async () => {
    render(
      <MemoryRouter initialEntries={['/history']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('radio', { name: /open-ended/i }));

    expect(screen.getByText(/history will show this entry as open-ended/i)).toBeInTheDocument();
    expect(screen.getByText(/when the open-ended session ended/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/meditation type/i), { target: { value: 'Vipassana' } });
    fireEvent.change(screen.getByLabelText(/duration \(minutes\)/i), { target: { value: '18' } });
    fireEvent.change(screen.getByLabelText(/session timestamp/i), { target: { value: '2026-03-26T07:18' } });
    fireEvent.click(screen.getByRole('button', { name: /save manual log/i }));

    expect(await screen.findByText(/manual log saved to history/i)).toBeInTheDocument();
    const historyItem = screen.getByText(/planned: open-ended/i).closest('.history-item');
    expect(historyItem).not.toBeNull();
    expect(within(historyItem as HTMLElement).getByText(/^open-ended$/i)).toBeInTheDocument();
    expect(within(historyItem as HTMLElement).getByText(/planned: open-ended/i)).toBeInTheDocument();
    expect(within(historyItem as HTMLElement).getByText(/completed: 18 min/i)).toBeInTheDocument();
  });

  it('prioritizes recent logs and keeps manual log collapsed when logs exist', () => {
    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([
        {
          id: 'log-1',
          startedAt: '2026-03-24T11:00:00.000Z',
          endedAt: '2026-03-24T11:10:00.000Z',
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
      ])
    );

    render(
      <MemoryRouter initialEntries={['/history']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /recent session logs/i })).toBeInTheDocument();
    const manualLogSummaryText = screen.getByText(/^add manual log$/i);
    const manualLogDisclosure = manualLogSummaryText.closest('details');
    const manualLogSummary = manualLogSummaryText.closest('summary');

    expect(manualLogSummary).not.toBeNull();
    expect(manualLogDisclosure).not.toBeNull();
    expect(manualLogDisclosure).not.toHaveAttribute('open');

    fireEvent.click(manualLogSummary ?? manualLogSummaryText);
    expect(manualLogDisclosure).toHaveAttribute('open');
    expect(screen.getByText(/use your local date and time when the session ended/i)).toBeInTheDocument();
  });

  it('supports source/status filtering and show-more progressive reveal', () => {
    const logs = Array.from({ length: 25 }, (_, index) => {
      const minute = String(index).padStart(2, '0');
      return {
        id: `log-${index}`,
        startedAt: `2026-03-24T10:${minute}:00.000Z`,
        endedAt: `2026-03-24T10:${minute}:30.000Z`,
        meditationType: index % 2 === 0 ? 'Vipassana' : 'Ajapa',
        intendedDurationSeconds: 600,
        completedDurationSeconds: index % 2 === 0 ? 600 : 300,
        status: index % 2 === 0 ? 'completed' : 'ended early',
        source: index % 3 === 0 ? 'manual log' : 'auto log',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 0,
        intervalSound: 'None',
      };
    });

    localStorage.setItem(SESSION_LOGS_KEY, JSON.stringify(logs));

    render(
      <MemoryRouter initialEntries={['/history']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/showing 20 of 25 filtered entries/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show more session logs/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show more session logs/i }));
    expect(screen.getByText(/showing 25 of 25 filtered entries/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show more session logs/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/source filter/i), { target: { value: 'manual log' } });
    expect(screen.getByText(/showing 9 of 9 filtered entries/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/status filter/i), { target: { value: 'ended early' } });
    expect(screen.getByText(/showing 4 of 4 filtered entries/i)).toBeInTheDocument();
  });

  it('differentiates manual vs auto logs and allows filtering by source', () => {
    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([
        {
          id: 'auto-log-1',
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
          id: 'manual-log-1',
          startedAt: '2026-03-24T09:30:00.000Z',
          endedAt: '2026-03-24T09:45:00.000Z',
          meditationType: 'Ajapa',
          intendedDurationSeconds: 900,
          completedDurationSeconds: 900,
          status: 'completed',
          source: 'manual log',
          startSound: 'None',
          endSound: 'None',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
        },
      ])
    );

    render(
      <MemoryRouter initialEntries={['/history']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/^auto log$/i)).toBeInTheDocument();
    expect(screen.getByText(/^manual log$/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/source filter/i), { target: { value: 'manual log' } });

    expect(screen.queryByText(/^auto log$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^manual log$/i)).toBeInTheDocument();
    expect(screen.getByText(/showing 1 of 1 filtered entries/i)).toBeInTheDocument();
  });

  it('keeps the meditation-type correction rule calm and discoverable in history', () => {
    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([
        {
          id: 'auto-log-1',
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
          id: 'manual-log-1',
          startedAt: '2026-03-24T09:30:00.000Z',
          endedAt: '2026-03-24T09:45:00.000Z',
          meditationType: 'Ajapa',
          intendedDurationSeconds: 900,
          completedDurationSeconds: 900,
          status: 'completed',
          source: 'manual log',
          startSound: 'None',
          endSound: 'None',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
        },
      ])
    );

    render(
      <MemoryRouter initialEntries={['/history']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/only manual logs can change meditation type later; auto-created history stays read-only/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /change meditation type/i })).toHaveLength(1);
  });

  it('updates meditation type only for manual logs while keeping the rest of the history entry unchanged', async () => {
    const autoLog = {
      id: 'auto-log-1',
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
    };
    const manualLog = {
      id: 'manual-log-1',
      startedAt: '2026-03-24T09:30:00.000Z',
      endedAt: '2026-03-24T09:45:00.000Z',
      meditationType: 'Ajapa',
      intendedDurationSeconds: 900,
      completedDurationSeconds: 900,
      status: 'completed',
      source: 'manual log',
      startSound: 'None',
      endSound: 'None',
      intervalEnabled: false,
      intervalMinutes: 0,
      intervalSound: 'None',
    };

    localStorage.setItem(SESSION_LOGS_KEY, JSON.stringify([autoLog, manualLog]));

    render(
      <MemoryRouter initialEntries={['/history']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    const expectedManualRange = getExpectedHistoryRange(manualLog.startedAt, manualLog.endedAt);
    fireEvent.click(screen.getByRole('button', { name: /change meditation type/i }));

    const editor = screen.getByText(/only this manual log changes here/i).closest('.history-edit-panel');
    expect(editor).not.toBeNull();
    fireEvent.change(within(editor as HTMLElement).getByRole('combobox'), { target: { value: 'Kriya' } });
    fireEvent.click(within(editor as HTMLElement).getByRole('button', { name: /save meditation type/i }));

    expect(await screen.findByText(/meditation type updated for the manual log/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /history/i })).toBeInTheDocument();
    expect(screen.getByText(/^Kriya$/i, { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(expectedManualRange.startLabel, { selector: 'time' })).toBeInTheDocument();
    expect(screen.getByText(expectedManualRange.endLabel, { selector: 'time' })).toBeInTheDocument();
    expect(screen.getByText(/completed: 15 min/i)).toBeInTheDocument();
    expect(screen.getByText(/^Vipassana$/i, { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /change meditation type/i })).toHaveLength(1);
  });

  it('shows a calm session time range for auto and manual logs', () => {
    const autoLog = {
      id: 'auto-log-1',
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
    };
    const manualLog = {
      id: 'manual-log-1',
      startedAt: '2026-03-24T09:30:00.000Z',
      endedAt: '2026-03-24T09:45:00.000Z',
      meditationType: 'Ajapa',
      intendedDurationSeconds: 900,
      completedDurationSeconds: 900,
      status: 'completed',
      source: 'manual log',
      startSound: 'None',
      endSound: 'None',
      intervalEnabled: false,
      intervalMinutes: 0,
      intervalSound: 'None',
    };

    localStorage.setItem(SESSION_LOGS_KEY, JSON.stringify([autoLog, manualLog]));

    render(
      <MemoryRouter initialEntries={['/history']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    const expectedAutoRange = getExpectedHistoryRange(autoLog.startedAt, autoLog.endedAt);
    const expectedManualRange = getExpectedHistoryRange(manualLog.startedAt, manualLog.endedAt);

    expect(screen.getByText(expectedAutoRange.startLabel, { selector: 'time' })).toBeInTheDocument();
    expect(screen.getByText(expectedAutoRange.endLabel, { selector: 'time' })).toBeInTheDocument();
    expect(screen.getByText(expectedManualRange.startLabel, { selector: 'time' })).toBeInTheDocument();
    expect(screen.getByText(expectedManualRange.endLabel, { selector: 'time' })).toBeInTheDocument();
    expect(screen.getAllByText(/^to$/i)).toHaveLength(2);
  });

  it('keeps playlist context readable while showing the item time range', () => {
    const playlistLog = {
      id: 'playlist-log-1',
      startedAt: '2026-03-24T10:00:00.000Z',
      endedAt: '2026-03-24T10:12:00.000Z',
      meditationType: 'Vipassana',
      intendedDurationSeconds: 720,
      completedDurationSeconds: 720,
      status: 'completed',
      source: 'auto log',
      startSound: 'None',
      endSound: 'Temple Bell',
      intervalEnabled: false,
      intervalMinutes: 0,
      intervalSound: 'None',
      playlistId: 'playlist-1',
      playlistName: 'Morning Flow',
      playlistRunId: 'playlist-run-1',
      playlistRunStartedAt: '2026-03-24T10:00:00.000Z',
      playlistItemPosition: 1,
      playlistItemCount: 2,
    };

    localStorage.setItem(SESSION_LOGS_KEY, JSON.stringify([playlistLog]));

    render(
      <MemoryRouter initialEntries={['/history']}>
        <SyncStatusProvider>
          <TimerProvider>
            <Routes>
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </TimerProvider>
        </SyncStatusProvider>
      </MemoryRouter>
    );

    const expectedPlaylistRange = getExpectedHistoryRange(playlistLog.startedAt, playlistLog.endedAt);

    expect(screen.getByText(/^playlist run started at/i)).toBeInTheDocument();
    expect(screen.getByText(/playlist: morning flow · item 1\/2/i)).toBeInTheDocument();
    expect(screen.getByText(expectedPlaylistRange.startLabel, { selector: 'time' })).toBeInTheDocument();
    expect(screen.getByText(expectedPlaylistRange.endLabel, { selector: 'time' })).toBeInTheDocument();
  });
});
