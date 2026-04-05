export { meditationTypes } from '../../types/referenceData';
import soundOptionsCatalog from '../../data/soundOptions.json';
import {
  DEFAULT_END_SOUND_LABEL,
  DEFAULT_INTERVAL_SOUND_LABEL,
  DEFAULT_START_SOUND_LABEL,
} from '../../utils/timerSound';

export const soundOptions = soundOptionsCatalog as readonly string[];

export const defaultTimerSettings = {
  timerMode: 'fixed',
  durationMinutes: 20,
  lastFixedDurationMinutes: 20,
  meditationType: '',
  startSound: DEFAULT_START_SOUND_LABEL,
  endSound: DEFAULT_END_SOUND_LABEL,
  intervalEnabled: false,
  intervalMinutes: 5,
  intervalSound: DEFAULT_INTERVAL_SOUND_LABEL,
} as const;
