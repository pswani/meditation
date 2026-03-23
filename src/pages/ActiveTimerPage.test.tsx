import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('ActiveTimerPage UX', () => {
  it('requires confirmation before ending early', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/meditation type/i), { target: { value: 'Vipassana' } });
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));

    fireEvent.click(screen.getByRole('button', { name: /end early/i }));
    expect(screen.getByRole('dialog', { name: /end session early confirmation/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continue session/i }));
    expect(screen.queryByRole('dialog', { name: /end session early confirmation/i })).not.toBeInTheDocument();
  });
});
