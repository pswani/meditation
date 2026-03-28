import type { MeditationType } from '../../types/timer';
import meditationTypesCatalog from '../../data/meditationTypes.json';
import soundOptionsCatalog from '../../data/soundOptions.json';

export const meditationTypes = meditationTypesCatalog as readonly MeditationType[];
export const soundOptions = soundOptionsCatalog as readonly string[];

export const defaultTimerSettings = {
  durationMinutes: 20,
  meditationType: '',
  startSound: 'None',
  endSound: 'Temple Bell',
  intervalEnabled: false,
  intervalMinutes: 5,
  intervalSound: 'Temple Bell',
} as const;
