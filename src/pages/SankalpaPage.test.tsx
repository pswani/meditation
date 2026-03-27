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
});
