import { describe, expect, it } from 'vitest';
import { listPlayableTimerSounds, resolveTimerSound } from './timerSoundCatalog';

describe('timer sound catalog', () => {
  it('maps each shipped playable label to an inline bundled media path', () => {
    expect(listPlayableTimerSounds()).toMatchObject([
      {
        label: 'Temple Bell',
        filename: 'temple-bell.mp3',
        relativePath: 'sounds/temple-bell.mp3',
      },
      {
        label: 'Gong',
        filename: 'gong.mp3',
        relativePath: 'sounds/gong.mp3',
      },
    ]);

    expect(resolveTimerSound('Temple Bell')?.filePath.startsWith('data:')).toBe(true);
    expect(resolveTimerSound('Gong')?.filePath.startsWith('data:')).toBe(true);
  });

  it('keeps None silent, maps legacy labels, and fails safely for unknown labels', () => {
    expect(resolveTimerSound('None')).toBeNull();
    expect(resolveTimerSound('Soft Chime')).toMatchObject({
      label: 'Temple Bell',
    });
    expect(resolveTimerSound('Wood Block')).toMatchObject({
      label: 'Gong',
    });
    expect(resolveTimerSound('Soft Chime')?.filePath.startsWith('data:')).toBe(true);
    expect(resolveTimerSound('Wood Block')?.filePath.startsWith('data:')).toBe(true);
    expect(resolveTimerSound('Missing Bell')).toBeNull();
  });
});
