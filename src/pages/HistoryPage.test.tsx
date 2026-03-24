import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TimerProvider } from '../features/timer/TimerContext';
import HistoryPage from './HistoryPage';

describe('HistoryPage UX', () => {
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
});
