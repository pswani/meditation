import timerSoundCatalogData from '../../data/timerSoundCatalog.json';

export const SILENT_TIMER_SOUND_LABEL = 'None';

interface TimerSoundCatalogEntryRecord {
  readonly label: string;
  readonly filename: string;
}

export interface TimerSoundCatalogEntry {
  readonly label: string;
  readonly filename: string;
  readonly relativePath: string;
  readonly filePath: string;
}

const timerSoundCatalog = (timerSoundCatalogData as readonly TimerSoundCatalogEntryRecord[]).map((entry) => ({
  ...entry,
  relativePath: `sounds/${entry.filename}`,
  filePath: `/media/sounds/${entry.filename}`,
})) satisfies readonly TimerSoundCatalogEntry[];

const timerSoundCatalogByLabel = new Map(timerSoundCatalog.map((entry) => [entry.label, entry] as const));

export function resolveTimerSound(label: string): TimerSoundCatalogEntry | null {
  if (label === SILENT_TIMER_SOUND_LABEL) {
    return null;
  }

  return timerSoundCatalogByLabel.get(label) ?? null;
}

export function listPlayableTimerSounds(): readonly TimerSoundCatalogEntry[] {
  return timerSoundCatalog;
}
