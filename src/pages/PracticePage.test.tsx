import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { TimerProvider } from '../features/timer/TimerContext';
import PracticePage from './PracticePage';

describe('PracticePage UX', () => {
  afterEach(() => {
    cleanup();
  });

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
        <TimerProvider>
          <Routes>
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </TimerProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/quick start needs valid defaults/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^dismiss$/i }));
    expect(screen.queryByText(/quick start needs valid defaults/i)).not.toBeInTheDocument();
  });

  it('keeps management-heavy practice tools collapsed until requested', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TimerProvider>
          <Routes>
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </TimerProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /show tools/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /custom plays/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));
    expect(screen.getByRole('heading', { name: /custom plays/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open playlists/i })).toBeInTheDocument();
  });
});
