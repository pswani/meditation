import type { MeditationType } from './timer';

export interface CustomPlay {
  readonly id: string;
  readonly name: string;
  readonly meditationType: MeditationType;
  readonly durationMinutes: number;
  readonly recordingLabel: string;
  readonly favorite: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CustomPlayDraft {
  name: string;
  meditationType: MeditationType | '';
  durationMinutes: number;
  recordingLabel: string;
}

export interface CustomPlayValidationResult {
  readonly isValid: boolean;
  readonly errors: {
    name?: string;
    meditationType?: string;
    durationMinutes?: string;
  };
}
