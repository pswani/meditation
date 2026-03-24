import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TimerProvider } from '../timer/TimerContext';
import PracticePage from '../../pages/PracticePage';

describe('CustomPlayManager UX', () => {
  it('applies custom play values to timer setup and confirms deletion', async () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TimerProvider>
          <Routes>
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </TimerProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /show tools/i }));

    fireEvent.change(screen.getByLabelText(/custom play name/i), { target: { value: 'Morning Focus' } });
    fireEvent.change(screen.getByLabelText(/custom play meditation type/i), { target: { value: 'Vipassana' } });
    fireEvent.change(screen.getByLabelText(/custom play duration \(minutes\)/i), { target: { value: '33' } });
    fireEvent.change(screen.getByLabelText(/custom play start sound \(optional\)/i), { target: { value: 'Soft Chime' } });
    fireEvent.change(screen.getByLabelText(/custom play end sound \(optional\)/i), { target: { value: 'Wood Block' } });
    await screen.findByRole('option', { name: /vipassana sit \(20 min\)/i });
    fireEvent.change(screen.getByLabelText(/media session \(optional\)/i), { target: { value: 'media-vipassana-sit-20' } });
    fireEvent.click(screen.getByRole('button', { name: /create custom play/i }));

    expect(screen.getByText('Morning Focus')).toBeInTheDocument();
    expect(screen.getByText(/media: vipassana sit \(20 min\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /use custom play/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/custom play "Morning Focus" applied to timer setup/i);

    const timerDurationField = screen.getAllByLabelText(/duration \(minutes\)/i)[0] as HTMLInputElement;
    const timerTypeField = screen.getAllByLabelText(/meditation type/i)[0] as HTMLSelectElement;
    expect(timerDurationField.value).toBe('33');
    expect(timerTypeField.value).toBe('Vipassana');

    fireEvent.click(screen.getByRole('button', { name: /show advanced options/i }));
    const timerStartSoundField = screen.getByLabelText(/^Start sound \(optional\)$/i) as HTMLSelectElement;
    const timerEndSoundField = screen.getByLabelText(/^End sound \(optional\)$/i) as HTMLSelectElement;
    expect(timerStartSoundField.value).toBe('Soft Chime');
    expect(timerEndSoundField.value).toBe('Wood Block');

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('dialog', { name: /delete custom play morning focus confirmation/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /keep custom play/i }));
    expect(screen.queryByRole('dialog', { name: /delete custom play morning focus confirmation/i })).not.toBeInTheDocument();
    expect(screen.getByText('Morning Focus')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    fireEvent.click(screen.getByRole('button', { name: /delete custom play/i }));

    expect(screen.queryByText('Morning Focus')).not.toBeInTheDocument();
  });
});
