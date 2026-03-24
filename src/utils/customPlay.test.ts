import { describe, expect, it } from 'vitest';
import type { TimerSettings } from '../types/timer';
import { applyCustomPlayToTimerSettings, createCustomPlay, updateCustomPlay, validateCustomPlayDraft } from './customPlay';

describe('custom play helpers', () => {
  it('validates required custom play fields', () => {
    const result = validateCustomPlayDraft({
      name: '',
      meditationType: '',
      durationMinutes: 0,
      recordingLabel: '',
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.name).toMatch(/required/i);
    expect(result.errors.meditationType).toMatch(/required/i);
    expect(result.errors.durationMinutes).toMatch(/greater than 0/i);
  });

  it('creates and updates a custom play', () => {
    const created = createCustomPlay(
      {
        name: 'Morning Focus',
        meditationType: 'Vipassana',
        durationMinutes: 20,
        recordingLabel: 'Session A',
      },
      new Date('2026-03-23T10:00:00.000Z')
    );

    const updated = updateCustomPlay(
      created,
      {
        name: 'Morning Focus Updated',
        meditationType: 'Ajapa',
        durationMinutes: 25,
        recordingLabel: 'Session B',
      },
      new Date('2026-03-23T11:00:00.000Z')
    );

    expect(updated.name).toBe('Morning Focus Updated');
    expect(updated.meditationType).toBe('Ajapa');
    expect(updated.durationMinutes).toBe(25);
    expect(updated.updatedAt).toBe('2026-03-23T11:00:00.000Z');
  });

  it('applies custom play fields onto timer settings', () => {
    const settings: TimerSettings = {
      durationMinutes: 10,
      meditationType: 'Ajapa',
      startSound: 'Soft Chime',
      endSound: 'Temple Bell',
      intervalEnabled: true,
      intervalMinutes: 4,
      intervalSound: 'Wood Block',
    };

    const next = applyCustomPlayToTimerSettings(settings, {
      durationMinutes: 30,
      meditationType: 'Vipassana',
    });

    expect(next.durationMinutes).toBe(30);
    expect(next.meditationType).toBe('Vipassana');
    expect(next.startSound).toBe('Soft Chime');
    expect(next.intervalEnabled).toBe(true);
  });
});
