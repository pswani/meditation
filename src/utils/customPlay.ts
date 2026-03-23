import type { CustomPlay, CustomPlayDraft, CustomPlayValidationResult } from '../types/customPlay';

export function validateCustomPlayDraft(draft: CustomPlayDraft): CustomPlayValidationResult {
  const errors: CustomPlayValidationResult['errors'] = {};

  if (!draft.name.trim()) {
    errors.name = 'Custom play name is required.';
  }

  if (!draft.meditationType) {
    errors.meditationType = 'Meditation type is required.';
  }

  if (Number.isNaN(draft.durationMinutes) || draft.durationMinutes <= 0) {
    errors.durationMinutes = 'Duration must be greater than 0.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function createCustomPlay(draft: CustomPlayDraft, now: Date): CustomPlay {
  const timestamp = now.toISOString();

  return {
    id: `custom-play-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    name: draft.name.trim(),
    meditationType: draft.meditationType as CustomPlay['meditationType'],
    durationMinutes: draft.durationMinutes,
    recordingLabel: draft.recordingLabel.trim(),
    favorite: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateCustomPlay(existing: CustomPlay, draft: CustomPlayDraft, now: Date): CustomPlay {
  return {
    ...existing,
    name: draft.name.trim(),
    meditationType: draft.meditationType as CustomPlay['meditationType'],
    durationMinutes: draft.durationMinutes,
    recordingLabel: draft.recordingLabel.trim(),
    updatedAt: now.toISOString(),
  };
}
