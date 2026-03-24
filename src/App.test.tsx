import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';

describe('App shell', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders home route with functional quick-start content and Sankalpa navigation label', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    expect(screen.getAllByText('Sankalpa').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /start timer now/i })).toBeInTheDocument();
  });

  it('renders settings route with functional defaults form', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save defaults/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/default duration \(minutes\)/i)).toBeInTheDocument();
  });

  it('reflects saved defaults from Settings in timer setup', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/default duration \(minutes\)/i), { target: { value: '32' } });
    fireEvent.change(screen.getByLabelText(/default meditation type/i), { target: { value: 'Sahaj' } });
    fireEvent.click(screen.getByRole('button', { name: /save defaults/i }));

    fireEvent.click(screen.getAllByRole('link', { name: /^Practice$/i })[0]);

    expect(screen.getByRole('heading', { name: /timer setup/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/duration \(minutes\)/i)).toHaveValue(32);
    expect(screen.getByRole('combobox', { name: /meditation type/i })).toHaveValue('Sahaj');
  });

  it('shows a global active timer resume banner outside Practice', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
    );

    const meditationTypeSelect = screen.getAllByLabelText(/meditation type/i)[0];
    fireEvent.change(meditationTypeSelect, { target: { value: 'Vipassana' } });
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));

    fireEvent.click(screen.getByRole('button', { name: /view history/i }));

    expect(screen.getByText(/active timer: vipassana/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /resume active timer/i }));
    expect(screen.getByRole('heading', { level: 2, name: /\d{2}:\d{2}/i })).toBeInTheDocument();
  });

  it('redirects /sankalpa to the Sankalpa route', () => {
    render(
      <MemoryRouter initialEntries={['/sankalpa']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Sankalpa' })).toBeInTheDocument();
    expect(screen.getByText(/review summaries and track sankalpa progress/i)).toBeInTheDocument();
  });

  it('redirects unknown routes to Home', () => {
    render(
      <MemoryRouter initialEntries={['/does-not-exist']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /quick start/i })).toBeInTheDocument();
  });
});
