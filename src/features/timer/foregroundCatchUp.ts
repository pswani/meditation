export const FOREGROUND_CATCH_UP_COALESCE_WINDOW_MS = 750;

export function shouldRunForegroundCatchUp(
  lastForegroundCatchUpAtMs: number | null,
  nowMs: number,
  windowMs = FOREGROUND_CATCH_UP_COALESCE_WINDOW_MS
): boolean {
  if (lastForegroundCatchUpAtMs === null) {
    return true;
  }

  return nowMs - lastForegroundCatchUpAtMs > windowMs;
}
