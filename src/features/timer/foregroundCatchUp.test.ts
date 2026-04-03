import { describe, expect, it } from 'vitest';
import {
  FOREGROUND_CATCH_UP_COALESCE_WINDOW_MS,
  shouldRunForegroundCatchUp,
} from './foregroundCatchUp';

describe('shouldRunForegroundCatchUp', () => {
  it('allows the first foreground catch-up for a session', () => {
    expect(shouldRunForegroundCatchUp(null, 1_000)).toBe(true);
  });

  it('coalesces rapid repeated foreground events', () => {
    expect(
      shouldRunForegroundCatchUp(1_000, 1_000 + FOREGROUND_CATCH_UP_COALESCE_WINDOW_MS)
    ).toBe(false);
    expect(
      shouldRunForegroundCatchUp(1_000, 1_000 + FOREGROUND_CATCH_UP_COALESCE_WINDOW_MS + 1)
    ).toBe(true);
  });
});
