import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import type { SessionLog } from '../types/sessionLog';

const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';
const SANKALPAS_KEY = 'meditation.sankalpas.v1';

function createSessionLog(
  id: string,
  endedAt: string,
  source: SessionLog['source'],
  status: SessionLog['status'],
  completedDurationSeconds: number
): SessionLog {
  const endedAtMs = Date.parse(endedAt);
  const startedAt = new Date(endedAtMs - completedDurationSeconds * 1000).toISOString();

  return {
    id,
    startedAt,
    endedAt,
    meditationType: 'Vipassana',
    intendedDurationSeconds: Math.max(300, completedDurationSeconds),
    completedDurationSeconds,
    status,
    source,
    startSound: 'None',
    endSound: 'Temple Bell',
    intervalEnabled: false,
    intervalMinutes: 0,
    intervalSound: 'None',
  };
}

describe('Sankalpa summary UX', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not repersist sankalpas on initial mount when stored data is already current', () => {
    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([createSessionLog('log-1', new Date(2026, 2, 24, 7, 30, 0, 0).toISOString(), 'auto log', 'completed', 1200)])
    );
    localStorage.setItem(
      SANKALPAS_KEY,
      JSON.stringify([
        {
          id: 'goal-1',
          goalType: 'duration-based',
          targetValue: 180,
          days: 7,
          createdAt: '2026-03-23T08:00:00.000Z',
        },
      ])
    );

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    setItemSpy.mockClear();

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/180 min in 7 days/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /duration goal/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /session-count goal/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /^duration-based$/i })).not.toBeInTheDocument();
    expect(setItemSpy).not.toHaveBeenCalledWith(SANKALPAS_KEY, expect.any(String));
  });

  it('does not render summary metrics for an invalid custom date range', () => {
    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([
        createSessionLog('log-1', new Date(2026, 2, 24, 7, 30, 0, 0).toISOString(), 'auto log', 'completed', 1200),
        createSessionLog('log-2', new Date(2026, 2, 23, 18, 15, 0, 0).toISOString(), 'manual log', 'ended early', 600),
      ])
    );

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/total completed duration/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/summary range/i), { target: { value: 'custom' } });
    fireEvent.change(screen.getByLabelText(/^start date$/i), { target: { value: '2026-03-24' } });
    fireEvent.change(screen.getByLabelText(/^end date$/i), { target: { value: '2026-03-20' } });

    expect(screen.getByText(/custom date range is invalid/i)).toBeInTheDocument();
    expect(screen.getByText(/fix custom range to view summary/i)).toBeInTheDocument();
    expect(screen.queryByText(/total completed duration/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/by meditation type/i)).not.toBeInTheDocument();
  });

  it('shows by-time-of-day summary and explicit by-source labels', () => {
    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([
        createSessionLog('log-1', new Date(2026, 2, 24, 6, 0, 0, 0).toISOString(), 'auto log', 'completed', 900),
        createSessionLog('log-2', new Date(2026, 2, 24, 19, 0, 0, 0).toISOString(), 'manual log', 'ended early', 600),
      ])
    );

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    const timeOfDayHeading = screen.getByRole('heading', { name: /by time of day/i });
    expect(timeOfDayHeading).toBeInTheDocument();

    const timeOfDaySection = timeOfDayHeading.closest('.summary-by-type');
    expect(timeOfDaySection).not.toBeNull();
    if (!timeOfDaySection) {
      throw new Error('Expected by-time-of-day section to exist');
    }

    expect(within(timeOfDaySection).getByText(/morning \(5:00-11:59\)/i)).toBeInTheDocument();
    expect(within(timeOfDaySection).getByText(/evening \(17:00-20:59\)/i)).toBeInTheDocument();

    const bySourceHeading = screen.getByRole('heading', { name: /by source/i });
    const bySourceSection = bySourceHeading.closest('.summary-by-type');
    expect(bySourceSection).not.toBeNull();
    if (!bySourceSection) {
      throw new Error('Expected by-source section to exist');
    }

    const manualSourceRow = within(bySourceSection).getByText(/^manual log$/i).closest('li');
    expect(manualSourceRow).not.toBeNull();

    if (!manualSourceRow) {
      throw new Error('Expected manual source row to exist');
    }

    expect(within(manualSourceRow).getByText(/completed: 0/i)).toBeInTheDocument();
    expect(within(manualSourceRow).getByText(/ended early: 1/i)).toBeInTheDocument();
  });

  it('prefers backend summary data when the summary API responds', async () => {
    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([createSessionLog('log-1', new Date(2026, 2, 24, 6, 0, 0, 0).toISOString(), 'auto log', 'completed', 900)])
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        if (url.includes('/api/summaries')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              overallSummary: {
                totalSessionLogs: 5,
                completedSessionLogs: 4,
                endedEarlySessionLogs: 1,
                totalDurationSeconds: 3600,
                averageDurationSeconds: 720,
                autoLogs: 2,
                manualLogs: 3,
              },
              byTypeSummary: [
                { meditationType: 'Vipassana', sessionLogs: 2, totalDurationSeconds: 1800 },
                { meditationType: 'Ajapa', sessionLogs: 1, totalDurationSeconds: 600 },
                { meditationType: 'Tratak', sessionLogs: 1, totalDurationSeconds: 600 },
                { meditationType: 'Kriya', sessionLogs: 1, totalDurationSeconds: 600 },
                { meditationType: 'Sahaj', sessionLogs: 0, totalDurationSeconds: 0 },
              ],
              bySourceSummary: [
                {
                  source: 'auto log',
                  sessionLogs: 2,
                  completedSessionLogs: 2,
                  endedEarlySessionLogs: 0,
                  totalDurationSeconds: 1800,
                },
                {
                  source: 'manual log',
                  sessionLogs: 3,
                  completedSessionLogs: 2,
                  endedEarlySessionLogs: 1,
                  totalDurationSeconds: 1800,
                },
              ],
              byTimeOfDaySummary: [
                {
                  timeOfDayBucket: 'morning',
                  sessionLogs: 3,
                  completedSessionLogs: 2,
                  endedEarlySessionLogs: 1,
                  totalDurationSeconds: 1800,
                },
                {
                  timeOfDayBucket: 'afternoon',
                  sessionLogs: 1,
                  completedSessionLogs: 1,
                  endedEarlySessionLogs: 0,
                  totalDurationSeconds: 900,
                },
                {
                  timeOfDayBucket: 'evening',
                  sessionLogs: 1,
                  completedSessionLogs: 1,
                  endedEarlySessionLogs: 0,
                  totalDurationSeconds: 900,
                },
                {
                  timeOfDayBucket: 'night',
                  sessionLogs: 0,
                  completedSessionLogs: 0,
                  endedEarlySessionLogs: 0,
                  totalDurationSeconds: 0,
                },
              ],
            }),
          };
        }

        throw new TypeError('Network request failed');
      })
    );

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/completed: 4/i)).toBeInTheDocument());
    expect(screen.getByText(/manual log: 3/i)).toBeInTheDocument();
  });

  it('shows a calm fallback warning when the backend summary API is unavailable', async () => {
    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([createSessionLog('log-1', new Date(2026, 2, 24, 6, 0, 0, 0).toISOString(), 'auto log', 'completed', 900)])
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        throw new TypeError('Network request failed');
      })
    );

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(
        screen.getByText(/showing a locally derived summary because the backend summary service could not be reached/i)
      ).toBeInTheDocument()
    );
    expect(screen.getAllByText(/completed: 1/i).length).toBeGreaterThan(0);
  });

  it('uses explicit completed and ended-early labels in overall summary card', () => {
    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([
        createSessionLog('log-1', new Date(2026, 2, 24, 6, 0, 0, 0).toISOString(), 'auto log', 'completed', 900),
        createSessionLog('log-2', new Date(2026, 2, 24, 19, 0, 0, 0).toISOString(), 'manual log', 'ended early', 600),
      ])
    );

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    const overallSplitLabel = screen.getByText(/completed vs ended early/i);
    const overallSplitCard = overallSplitLabel.closest('.summary-card');
    expect(overallSplitCard).not.toBeNull();
    if (!overallSplitCard) {
      throw new Error('Expected overall split summary card to exist');
    }

    expect(within(overallSplitCard).getByText(/completed: 1/i)).toBeInTheDocument();
    expect(within(overallSplitCard).getByText(/ended early: 1/i)).toBeInTheDocument();
    expect(within(overallSplitCard).queryByText(/^1 \/ 1$/)).not.toBeInTheDocument();
  });

  it('hides inactive summary categories by default and reveals zero-duration rows when toggled', () => {
    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([createSessionLog('log-1', new Date(2026, 2, 24, 6, 0, 0, 0).toISOString(), 'auto log', 'completed', 900)])
    );

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/inactive categories hidden/i)).toBeInTheDocument();

    const byTypeHeading = screen.getByRole('heading', { name: /by meditation type/i });
    const byTypeSection = byTypeHeading.closest('.summary-by-type');
    expect(byTypeSection).not.toBeNull();
    if (!byTypeSection) {
      throw new Error('Expected by-meditation-type section to exist');
    }

    const byTimeOfDayHeading = screen.getByRole('heading', { name: /by time of day/i });
    const byTimeOfDaySection = byTimeOfDayHeading.closest('.summary-by-type');
    expect(byTimeOfDaySection).not.toBeNull();
    if (!byTimeOfDaySection) {
      throw new Error('Expected by-time-of-day section to exist');
    }

    expect(within(byTypeSection).queryByText(/^ajapa$/i)).not.toBeInTheDocument();
    expect(within(byTimeOfDaySection).queryByText(/night/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/show inactive categories/i));

    const ajapaRow = within(byTypeSection).getByText(/^ajapa$/i).closest('li');
    expect(ajapaRow).not.toBeNull();
    if (!ajapaRow) {
      throw new Error('Expected Ajapa row to exist');
    }

    const nightRow = within(byTimeOfDaySection).getByText(/night/i).closest('li');
    expect(nightRow).not.toBeNull();
    if (!nightRow) {
      throw new Error('Expected night row to exist');
    }

    expect(within(ajapaRow).getByText('0 min')).toBeInTheDocument();
    expect(within(nightRow).getByText('0 min')).toBeInTheDocument();
  });

  it('shows sankalpa progress and remaining requirement with optional filters', () => {
    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([
        createSessionLog('log-1', new Date(2026, 2, 24, 6, 15, 0, 0).toISOString(), 'auto log', 'completed', 900),
        createSessionLog('log-2', new Date(2026, 2, 25, 7, 5, 0, 0).toISOString(), 'manual log', 'completed', 1200),
        createSessionLog('log-3', new Date(2026, 2, 25, 18, 10, 0, 0).toISOString(), 'auto log', 'completed', 600),
      ])
    );

    localStorage.setItem(
      SANKALPAS_KEY,
      JSON.stringify([
        {
          id: 'goal-1',
          goalType: 'session-count-based',
          targetValue: 3,
          days: 10,
          meditationType: 'Vipassana',
          timeOfDayBucket: 'morning',
          createdAt: '2026-03-23T00:00:00.000Z',
        },
      ])
    );

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/3 session logs in 10 days/i)).toBeInTheDocument();
    expect(screen.getByText(/filters: meditation type: vipassana · time of day: morning/i)).toBeInTheDocument();
    expect(screen.getByText(/progress: 2 \/ 3 session logs · 1 session log remaining/i)).toBeInTheDocument();
  });

  it('edits an existing sankalpa while preserving the original goal identity and window', async () => {
    localStorage.setItem(
      SANKALPAS_KEY,
      JSON.stringify([
        {
          id: 'goal-edit',
          goalType: 'duration-based',
          targetValue: 180,
          days: 7,
          createdAt: '2026-03-23T08:00:00.000Z',
          archived: false,
        },
      ])
    );

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));

    expect(screen.getByRole('heading', { name: /edit sankalpa/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/target duration \(minutes\)/i), { target: { value: '240' } });
    fireEvent.change(screen.getByLabelText(/^days$/i), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(screen.getByText(/sankalpa updated\./i)).toBeInTheDocument());

    const storedGoals = JSON.parse(localStorage.getItem(SANKALPAS_KEY) ?? '[]');
    expect(storedGoals).toHaveLength(1);
    expect(storedGoals[0]).toMatchObject({
      id: 'goal-edit',
      targetValue: 240,
      days: 10,
      createdAt: '2026-03-23T08:00:00.000Z',
      archived: false,
    });
  });

  it('edits goal type and optional filters, then recalculates visible progress from the original window', async () => {
    const now = Date.now();
    const createdAt = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    const eveningMatchEndedAt = new Date();
    eveningMatchEndedAt.setDate(eveningMatchEndedAt.getDate() - 1);
    eveningMatchEndedAt.setHours(18, 0, 0, 0);
    const morningOtherEndedAt = new Date();
    morningOtherEndedAt.setDate(morningOtherEndedAt.getDate() - 1);
    morningOtherEndedAt.setHours(8, 0, 0, 0);

    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([
        createSessionLog('log-evening-match', eveningMatchEndedAt.toISOString(), 'auto log', 'completed', 900),
        createSessionLog('log-morning-other', morningOtherEndedAt.toISOString(), 'manual log', 'completed', 1200),
      ])
    );

    localStorage.setItem(
      SANKALPAS_KEY,
      JSON.stringify([
        {
          id: 'goal-edit-filters',
          goalType: 'duration-based',
          targetValue: 30,
          days: 7,
          meditationType: 'Ajapa',
          timeOfDayBucket: 'morning',
          createdAt,
          archived: false,
        },
      ])
    );

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));

    fireEvent.change(screen.getByLabelText(/goal type/i), { target: { value: 'session-count-based' } });
    expect(screen.getByLabelText(/target session logs/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/target session logs/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/^days$/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/meditation type filter \(optional\)/i), { target: { value: 'Vipassana' } });
    fireEvent.change(screen.getByLabelText(/time-of-day filter \(optional\)/i), { target: { value: 'evening' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(screen.getByText(/sankalpa updated\./i)).toBeInTheDocument());

    expect(screen.getByText(/1 session log in 5 days/i)).toBeInTheDocument();
    expect(screen.getByText(/filters: meditation type: vipassana · time of day: evening/i)).toBeInTheDocument();
    expect(screen.getByText(/progress: 1 \/ 1 session logs · 0 session logs remaining/i)).toBeInTheDocument();

    const storedGoals = JSON.parse(localStorage.getItem(SANKALPAS_KEY) ?? '[]');
    expect(storedGoals[0]).toMatchObject({
      id: 'goal-edit-filters',
      goalType: 'session-count-based',
      targetValue: 1,
      days: 5,
      meditationType: 'Vipassana',
      timeOfDayBucket: 'evening',
      createdAt,
      archived: false,
    });
  });

  it('archives a sankalpa and moves it into the archived section', async () => {
    const activeCreatedAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    localStorage.setItem(
      SANKALPAS_KEY,
      JSON.stringify([
        {
          id: 'goal-archive',
          goalType: 'session-count-based',
          targetValue: 3,
          days: 7,
          createdAt: activeCreatedAt,
          archived: false,
        },
      ])
    );

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^archive$/i }));
    const confirmDialog = screen.getByRole('dialog', { name: /archive active sankalpas confirmation/i });
    fireEvent.click(within(confirmDialog).getByRole('button', { name: /archive sankalpa/i }));

    await waitFor(() => expect(screen.getByText(/sankalpa archived\./i)).toBeInTheDocument());

    const archivedHeading = screen.getByRole('heading', { name: /archived sankalpas/i });
    const archivedSection = archivedHeading.closest('section');
    expect(archivedSection).not.toBeNull();
    if (!archivedSection) {
      throw new Error('Expected archived sankalpa section to exist');
    }

    expect(within(archivedSection).getByText(/3 session logs in 7 days/i)).toBeInTheDocument();
    expect(within(archivedSection).getByText(/^archived$/i)).toBeInTheDocument();

    const storedGoals = JSON.parse(localStorage.getItem(SANKALPAS_KEY) ?? '[]');
    expect(storedGoals[0]).toMatchObject({
      id: 'goal-archive',
      archived: true,
    });
  });

  it('archives completed and expired sankalpas from their current sections', async () => {
    const now = Date.now();
    const completedCreatedAt = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
    const expiredCreatedAt = new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString();
    const completedLogEndedAt = new Date();
    completedLogEndedAt.setDate(completedLogEndedAt.getDate() - 2);
    completedLogEndedAt.setHours(7, 0, 0, 0);

    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([
        createSessionLog('log-completed', completedLogEndedAt.toISOString(), 'auto log', 'completed', 1200),
      ])
    );

    localStorage.setItem(
      SANKALPAS_KEY,
      JSON.stringify([
        {
          id: 'goal-completed-archive',
          goalType: 'session-count-based',
          targetValue: 1,
          days: 7,
          createdAt: completedCreatedAt,
          archived: false,
        },
        {
          id: 'goal-expired-archive',
          goalType: 'session-count-based',
          targetValue: 3,
          days: 1,
          createdAt: expiredCreatedAt,
          archived: false,
        },
      ])
    );

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    const completedSection = screen.getByRole('heading', { name: /completed sankalpas/i }).closest('section');
    expect(completedSection).not.toBeNull();
    if (!completedSection) {
      throw new Error('Expected completed sankalpa section to exist');
    }

    fireEvent.click(within(completedSection).getByRole('button', { name: /^archive$/i }));
    const completedConfirmDialog = screen.getByRole('dialog', { name: /archive completed sankalpas confirmation/i });
    fireEvent.click(within(completedConfirmDialog).getByRole('button', { name: /archive sankalpa/i }));

    await waitFor(() => expect(screen.getByText(/sankalpa archived\./i)).toBeInTheDocument());

    const expiredSection = screen.getByRole('heading', { name: /expired sankalpas/i }).closest('section');
    expect(expiredSection).not.toBeNull();
    if (!expiredSection) {
      throw new Error('Expected expired sankalpa section to exist');
    }

    fireEvent.click(within(expiredSection).getByRole('button', { name: /^archive$/i }));
    const expiredConfirmDialog = screen.getByRole('dialog', { name: /archive expired sankalpas confirmation/i });
    fireEvent.click(within(expiredConfirmDialog).getByRole('button', { name: /archive sankalpa/i }));

    await waitFor(() => expect(screen.getAllByText(/sankalpa archived\./i).length).toBeGreaterThan(0));

    const archivedSection = screen.getByRole('heading', { name: /archived sankalpas/i }).closest('section');
    expect(archivedSection).not.toBeNull();
    if (!archivedSection) {
      throw new Error('Expected archived sankalpa section to exist');
    }

    expect(within(archivedSection).getByText(/1 session log in 7 days/i)).toBeInTheDocument();
    expect(within(archivedSection).getByText(/3 session logs in 1 day/i)).toBeInTheDocument();

    const storedGoals = JSON.parse(localStorage.getItem(SANKALPAS_KEY) ?? '[]');
    expect(storedGoals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'goal-completed-archive', archived: true }),
        expect.objectContaining({ id: 'goal-expired-archive', archived: true }),
      ])
    );
  });

  it('keeps a locally saved sankalpa visible without replaying failed sync attempts on every queue update', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.includes('/api/settings/timer') && method === 'GET') {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              id: 'default',
              durationMinutes: 20,
              meditationType: '',
              startSound: 'None',
              endSound: 'Temple Bell',
              intervalEnabled: false,
              intervalMinutes: 5,
              intervalSound: 'Temple Bell',
              updatedAt: '2026-03-26T12:00:00.000Z',
            }),
          };
        }

        if (url.includes('/api/session-logs') && method === 'GET') {
          return { ok: true, status: 200, json: async () => [] };
        }

        if (url.includes('/api/media/custom-plays') && method === 'GET') {
          return { ok: true, status: 200, json: async () => [] };
        }

        if (url.includes('/api/playlists') && method === 'GET') {
          return { ok: true, status: 200, json: async () => [] };
        }

        if (url.includes('/api/summaries') && method === 'GET') {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              overallSummary: {
                totalSessionLogs: 0,
                completedSessionLogs: 0,
                endedEarlySessionLogs: 0,
                totalDurationSeconds: 0,
                averageDurationSeconds: 0,
                autoLogs: 0,
                manualLogs: 0,
              },
              byTypeSummary: [
                { meditationType: 'Vipassana', sessionLogs: 0, totalDurationSeconds: 0 },
                { meditationType: 'Ajapa', sessionLogs: 0, totalDurationSeconds: 0 },
                { meditationType: 'Tratak', sessionLogs: 0, totalDurationSeconds: 0 },
                { meditationType: 'Kriya', sessionLogs: 0, totalDurationSeconds: 0 },
                { meditationType: 'Sahaj', sessionLogs: 0, totalDurationSeconds: 0 },
              ],
              bySourceSummary: [
                {
                  source: 'auto log',
                  sessionLogs: 0,
                  completedSessionLogs: 0,
                  endedEarlySessionLogs: 0,
                  totalDurationSeconds: 0,
                },
                {
                  source: 'manual log',
                  sessionLogs: 0,
                  completedSessionLogs: 0,
                  endedEarlySessionLogs: 0,
                  totalDurationSeconds: 0,
                },
              ],
              byTimeOfDaySummary: [
                {
                  timeOfDayBucket: 'morning',
                  sessionLogs: 0,
                  completedSessionLogs: 0,
                  endedEarlySessionLogs: 0,
                  totalDurationSeconds: 0,
                },
                {
                  timeOfDayBucket: 'afternoon',
                  sessionLogs: 0,
                  completedSessionLogs: 0,
                  endedEarlySessionLogs: 0,
                  totalDurationSeconds: 0,
                },
                {
                  timeOfDayBucket: 'evening',
                  sessionLogs: 0,
                  completedSessionLogs: 0,
                  endedEarlySessionLogs: 0,
                  totalDurationSeconds: 0,
                },
                {
                  timeOfDayBucket: 'night',
                  sessionLogs: 0,
                  completedSessionLogs: 0,
                  endedEarlySessionLogs: 0,
                  totalDurationSeconds: 0,
                },
              ],
            }),
          };
        }

        if (url.includes('/api/sankalpas') && method === 'GET') {
          return { ok: true, status: 200, json: async () => [] };
        }

        if (url.includes('/api/sankalpas') && method === 'PUT') {
          return {
            ok: false,
            status: 400,
            text: async () => 'Sankalpa goal type is invalid.',
          };
        }

        throw new TypeError(`Unhandled ${method} ${url}`);
      });

    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /create sankalpa/i }));

    await waitFor(() => expect(screen.getByText(/120 min in 7 days/i)).toBeInTheDocument());
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([input, init]) => {
          const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
          return url.includes('/api/sankalpas') && (init?.method ?? 'GET') === 'PUT';
        })
      ).toHaveLength(1)
    );
    expect(screen.queryByText(/sankalpa goal type is invalid/i)).not.toBeInTheDocument();
  });
});
