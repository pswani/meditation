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
});
