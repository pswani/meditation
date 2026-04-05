import timerSoundCatalogData from '../data/timerSoundCatalog.json';

export const SILENT_TIMER_SOUND_LABEL = 'None';
export const DEFAULT_START_SOUND_LABEL = 'None';
export const DEFAULT_END_SOUND_LABEL = 'Temple Bell';
export const DEFAULT_INTERVAL_SOUND_LABEL = 'Temple Bell';

interface TimerSoundLabelRecord {
  readonly label: string;
}

const timerSoundCatalog = timerSoundCatalogData as readonly TimerSoundLabelRecord[];
const selectableTimerSoundLabels = [SILENT_TIMER_SOUND_LABEL, ...timerSoundCatalog.map((entry) => entry.label)] satisfies readonly string[];
const supportedTimerSoundLabels = new Set(selectableTimerSoundLabels);

const legacyTimerSoundLabelMap: Readonly<Record<string, string>> = {
  'Soft Chime': 'Temple Bell',
  'Wood Block': 'Gong',
};

export function listSelectableTimerSoundLabels(): readonly string[] {
  return selectableTimerSoundLabels;
}

export function normalizeTimerSoundLabel(label: string | null | undefined, fallback: string): string {
  if (typeof label !== 'string') {
    return fallback;
  }

  const trimmedLabel = label.trim();
  if (!trimmedLabel) {
    return fallback;
  }

  const normalizedLabel = legacyTimerSoundLabelMap[trimmedLabel] ?? trimmedLabel;
  return supportedTimerSoundLabels.has(normalizedLabel) ? normalizedLabel : fallback;
}
