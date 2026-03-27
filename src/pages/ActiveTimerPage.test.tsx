import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../App';

describe('ActiveTimerPage UX', () => {
  it('requires confirmation before ending early', async () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
    );

    const meditationTypeSelect = screen.getAllByLabelText(/meditation type/i)[0];
    fireEvent.change(meditationTypeSelect, { target: { value: 'Vipassana' } });
    await waitFor(() => expect(screen.getByRole('button', { name: /start session/i })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));

    fireEvent.click(screen.getByRole('button', { name: /end early/i }));
    expect(screen.getByRole('dialog', { name: /end session early confirmation/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continue session/i }));
    expect(screen.queryByRole('dialog', { name: /end session early confirmation/i })).not.toBeInTheDocument();
  });
});
