import type { CustomPlay, CustomPlayDraft, CustomPlayValidationResult } from '../types/customPlay';
import type { TimerSettings } from '../types/timer';
import { findCustomPlayMediaAssetById } from './mediaAssetApi';
import {
  DEFAULT_END_SOUND_LABEL,
  DEFAULT_START_SOUND_LABEL,
  normalizeTimerSoundLabel,
} from './timerSound';

const DEFAULT_CUSTOM_PLAY_START_SOUND = DEFAULT_START_SOUND_LABEL;
const DEFAULT_CUSTOM_PLAY_END_SOUND = DEFAULT_END_SOUND_LABEL;

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

  if (draft.mediaAssetId && !findCustomPlayMediaAssetById(draft.mediaAssetId)) {
    errors.mediaAssetId = 'Selected media session is no longer available.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function createCustomPlay(draft: CustomPlayDraft, now: Date): CustomPlay {
  const timestamp = now.toISOString();
  const selectedAsset = draft.mediaAssetId ? findCustomPlayMediaAssetById(draft.mediaAssetId) : null;

  return {
    id: `custom-play-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    name: draft.name.trim(),
    meditationType: draft.meditationType as CustomPlay['meditationType'],
    durationMinutes: draft.durationMinutes,
    startSound: normalizeTimerSoundLabel(draft.startSound, DEFAULT_CUSTOM_PLAY_START_SOUND),
    endSound: normalizeTimerSoundLabel(draft.endSound, DEFAULT_CUSTOM_PLAY_END_SOUND),
    mediaAssetId: selectedAsset?.id ?? '',
    recordingLabel: draft.recordingLabel.trim(),
    favorite: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateCustomPlay(existing: CustomPlay, draft: CustomPlayDraft, now: Date): CustomPlay {
  const selectedAsset = draft.mediaAssetId ? findCustomPlayMediaAssetById(draft.mediaAssetId) : null;

  return {
    ...existing,
    name: draft.name.trim(),
    meditationType: draft.meditationType as CustomPlay['meditationType'],
    durationMinutes: draft.durationMinutes,
    startSound: normalizeTimerSoundLabel(draft.startSound, DEFAULT_CUSTOM_PLAY_START_SOUND),
    endSound: normalizeTimerSoundLabel(draft.endSound, DEFAULT_CUSTOM_PLAY_END_SOUND),
    mediaAssetId: selectedAsset?.id ?? '',
    recordingLabel: draft.recordingLabel.trim(),
    updatedAt: now.toISOString(),
  };
}

export function applyCustomPlayToTimerSettings(
  settings: TimerSettings,
  play: Pick<CustomPlay, 'durationMinutes' | 'meditationType' | 'startSound' | 'endSound'>
): TimerSettings {
  return {
    ...settings,
    timerMode: 'fixed',
    durationMinutes: play.durationMinutes,
    lastFixedDurationMinutes: play.durationMinutes,
    meditationType: play.meditationType,
    startSound: normalizeTimerSoundLabel(play.startSound, DEFAULT_CUSTOM_PLAY_START_SOUND),
    endSound: normalizeTimerSoundLabel(play.endSound, DEFAULT_CUSTOM_PLAY_END_SOUND),
  };
}

export function areCustomPlaysEqual(left: CustomPlay, right: CustomPlay): boolean {
  return (
    left.id === right.id &&
    left.name === right.name &&
    left.meditationType === right.meditationType &&
    left.durationMinutes === right.durationMinutes &&
    left.startSound === right.startSound &&
    left.endSound === right.endSound &&
    left.mediaAssetId === right.mediaAssetId &&
    left.recordingLabel === right.recordingLabel &&
    left.favorite === right.favorite &&
    left.createdAt === right.createdAt &&
    left.updatedAt === right.updatedAt
  );
}
