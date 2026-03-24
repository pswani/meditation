import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TimerProvider } from '../features/timer/TimerContext';
import HistoryPage from './HistoryPage';

const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';

describe('HistoryPage UX', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows timestamp helper text and save success feedback for manual log', () => {
    render(
      <MemoryRouter initialEntries={['/history']}>
        <TimerProvider>
          <Routes>
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </TimerProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/use your local date and time when the session ended/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Meditation type$/i), { target: { value: 'Vipassana' } });
    fireEvent.click(screen.getByRole('button', { name: /save manual log/i }));

    expect(screen.getByText(/manual log saved to history/i)).toBeInTheDocument();
    expect(screen.getByText(/^manual log$/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Duration \(minutes\)$/i), { target: { value: '25' } });
    expect(screen.queryByText(/manual log saved to history/i)).not.toBeInTheDocument();
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
        <TimerProvider>
          <Routes>
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </TimerProvider>
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
        <TimerProvider>
          <Routes>
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </TimerProvider>
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
        <TimerProvider>
          <Routes>
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </TimerProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/^auto log$/i)).toBeInTheDocument();
    expect(screen.getByText(/^manual log$/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/source filter/i), { target: { value: 'manual log' } });

    expect(screen.queryByText(/^auto log$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/^manual log$/i)).toBeInTheDocument();
    expect(screen.getByText(/showing 1 of 1 filtered entries/i)).toBeInTheDocument();
  });
});
