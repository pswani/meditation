import { describe, expect, it } from 'vitest';
import { listPlayableTimerSounds, resolveTimerSound } from './timerSoundCatalog';

describe('timer sound catalog', () => {
  it('maps each shipped playable label to a stable media path', () => {
    expect(listPlayableTimerSounds()).toEqual([
      {
        label: 'Temple Bell',
        filename: 'temple-bell.wav',
        relativePath: 'sounds/temple-bell.wav',
        filePath: '/media/sounds/temple-bell.wav',
      },
      {
        label: 'Soft Chime',
        filename: 'soft-chime.wav',
        relativePath: 'sounds/soft-chime.wav',
        filePath: '/media/sounds/soft-chime.wav',
      },
      {
        label: 'Wood Block',
        filename: 'wood-block.wav',
        relativePath: 'sounds/wood-block.wav',
        filePath: '/media/sounds/wood-block.wav',
      },
    ]);
  });

  it('keeps None silent and fails safely for unknown labels', () => {
    expect(resolveTimerSound('None')).toBeNull();
    expect(resolveTimerSound('Missing Bell')).toBeNull();
  });
});
