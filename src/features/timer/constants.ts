import type { MeditationType } from '../../types/timer';

export const meditationTypes: readonly MeditationType[] = ['Vipassana', 'Ajapa', 'Tratak', 'Kriya', 'Sahaj'];

export const soundOptions: readonly string[] = ['None', 'Temple Bell', 'Soft Chime', 'Wood Block'];

export const defaultTimerSettings = {
  durationMinutes: 20,
  meditationType: '',
  startSound: 'None',
  endSound: 'Temple Bell',
  intervalEnabled: false,
  intervalMinutes: 5,
  intervalSound: 'Temple Bell',
} as const;
