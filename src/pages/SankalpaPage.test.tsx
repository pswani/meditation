import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';

const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';
const SANKALPAS_KEY = 'meditation.sankalpas.v1';

describe('SankalpaPage UX', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows empty summary guidance and validation errors for invalid sankalpa input', () => {
    render(
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/no session log entries yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no active sankalpas\. create one above\./i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/target duration \(minutes\)/i), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText(/^days$/i), { target: { value: '0' } });
    fireEvent.submit(screen.getByRole('button', { name: /create sankalpa/i }).closest('form') as HTMLFormElement);

    expect(screen.getByText(/target value must be greater than 0/i)).toBeInTheDocument();
    expect(screen.getByText(/days must be greater than 0/i)).toBeInTheDocument();
  });

  it('renders summary content and persists a newly created sankalpa', () => {
    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([
        {
          id: 'log-1',
          startedAt: '2026-03-24T06:00:00.000Z',
          endedAt: '2026-03-24T06:20:00.000Z',
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
          id: 'log-2',
          startedAt: '2026-03-23T20:00:00.000Z',
          endedAt: '2026-03-23T20:10:00.000Z',
          meditationType: 'Ajapa',
          intendedDurationSeconds: 900,
          completedDurationSeconds: 600,
          status: 'ended early',
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
      <MemoryRouter initialEntries={['/goals']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/auto log: 1 .* manual log: 1/i)).toBeInTheDocument();
    expect(screen.getAllByText('Vipassana').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ajapa').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(/goal type/i), {
      target: { value: 'session-count-based' },
    });
    fireEvent.change(screen.getByLabelText(/target session logs/i), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByLabelText(/^days$/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/meditation type filter \(optional\)/i), {
      target: { value: 'Vipassana' },
    });
    fireEvent.change(screen.getByLabelText(/time-of-day filter \(optional\)/i), {
      target: { value: 'morning' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create sankalpa/i }));

    expect(screen.getByText(/sankalpa saved/i)).toBeInTheDocument();
    expect(screen.getByText(/3 session logs in 10 days/i)).toBeInTheDocument();
    expect(screen.getByText(/filters: meditation type: vipassana .* time of day: morning/i)).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(SANKALPAS_KEY) ?? '[]') as Array<Record<string, unknown>>;
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      goalType: 'session-count-based',
      targetValue: 3,
      days: 10,
      meditationType: 'Vipassana',
      timeOfDayBucket: 'morning',
    });
  });
});
