import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TimerProvider } from '../features/timer/TimerContext';
import PracticePage from './PracticePage';

describe('PracticePage UX', () => {
  it('keeps required meditation type error hidden until start attempt', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TimerProvider>
          <Routes>
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </TimerProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText(/meditation type is required/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    expect(screen.getByText(/meditation type is required/i)).toBeInTheDocument();
  });
});
