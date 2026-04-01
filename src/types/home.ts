import type { Playlist } from './playlist';
import type { TimerSettings } from './timer';

export type LastUsedMeditation =
  | {
      readonly kind: 'timer';
      readonly settings: TimerSettings;
      readonly usedAt: string;
    }
  | {
      readonly kind: 'playlist';
      readonly playlistId: Playlist['id'];
      readonly playlistName: Playlist['name'];
      readonly usedAt: string;
    };
