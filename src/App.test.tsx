import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App shell', () => {
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
});
