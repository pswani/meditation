import { describe, expect, it } from 'vitest';
import { listPlayableTimerSounds, resolveTimerSound } from './timerSoundCatalog';

describe('timer sound catalog', () => {
  it('maps each shipped playable label to a stable media path', () => {
    expect(listPlayableTimerSounds()).toEqual([
      {
        label: 'Temple Bell',
        filename: 'temple-bell.mp3',
        relativePath: 'sounds/temple-bell.mp3',
        filePath: '/media/sounds/temple-bell.mp3',
      },
      {
        label: 'Gong',
        filename: 'gong.mp3',
        relativePath: 'sounds/gong.mp3',
        filePath: '/media/sounds/gong.mp3',
      },
    ]);
  });

  it('keeps None silent, maps legacy labels, and fails safely for unknown labels', () => {
    expect(resolveTimerSound('None')).toBeNull();
    expect(resolveTimerSound('Soft Chime')).toMatchObject({
      label: 'Temple Bell',
      filePath: '/media/sounds/temple-bell.mp3',
    });
    expect(resolveTimerSound('Wood Block')).toMatchObject({
      label: 'Gong',
      filePath: '/media/sounds/gong.mp3',
    });
    expect(resolveTimerSound('Missing Bell')).toBeNull();
  });
});
