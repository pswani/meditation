# Session I — Web: Error Handling, Data Safety & Input Validation

## Context

Meditation app — React 19 / TypeScript / Vite web client.
Working branch: `review-fixes`. Sessions A–D address top-10 cross-cutting issues. Sessions E–H address backend. This session addresses Web findings from `CODE-REVIEW-2026-04-24.md`.

Run `npm test` from the repo root to verify all changes.

**Issues addressed (12 total):**
- W-H3: Sync queue retries unbounded — no `maxRetries`, no backoff, no dead-letter
- W-H4: `localStorage` writes swallow `QuotaExceededError` silently
- W-M6: API error responses parsed as text even when JSON `{error, message}`
- W-M10: Session-log timestamps are purely client-generated (no server re-stamp awareness)
- W-M11: Manual duration input not range-validated
- W-M14: `crypto.randomUUID` fallback uses `Date.now() + Math.random()` (collision-prone)
- W-L2: Sync discriminated unions lack `as const` — literals get widened
- W-L3: No auto-dismiss on `ShellStatusBanners`
- W-L4: Playlist form allows empty / whitespace-only titles; no duplicate-title guard
- W-L7: Sankalpa observance doesn't guard against duplicate same-day entries
- W-L8: Interval cue plays even when session is paused
- W-L11: Playlist item durations not guarded at ≥ 1

**Already confirmed fixed — do NOT re-implement:**
- W-H6: `performance.now()` elapsed timer — done in Session A
- W-H7: Stale in-flight sync detection — `STALLED_INFLIGHT_THRESHOLD_MS = 30_000` already in `syncQueue.ts`
- W-H8: `ErrorBoundary` — `src/app/ErrorBoundary.tsx` exists and is used in `src/main.tsx`
- W-M7: Sync dedup correctly preserves deletes — already implemented in `enqueueSyncQueueEntry`

---

## W-H3: Sync queue retry — maxRetries + exponential backoff + dead-letter

**Problem:** `markSyncQueueEntryFailed` (in `src/utils/syncQueue.ts`) increments `retryCount` with no cap and no backoff. A permanently-failing entry retries forever at the fixed 15 s poll interval.

**Files to read first:**
- `src/utils/syncQueue.ts` — full file; find `markSyncQueueEntryFailed`, `SyncQueueEntry` type, `retryCount`
- `src/types/sync.ts` — `SyncQueueEntryState` and `SyncQueueEntry` type shape
- `src/features/timer/useTimerSyncEffects.ts` — find where `markSyncQueueEntryFailed` is called and where failed entries are displayed

**Changes:**

1. In `src/types/sync.ts`, add `'dead-letter'` to `SyncQueueEntryState`:
   ```ts
   export type SyncQueueEntryState = 'pending' | 'in-flight' | 'failed' | 'dead-letter';
   ```

2. In `src/utils/syncQueue.ts`, define:
   ```ts
   export const MAX_SYNC_RETRIES = 5;
   ```

3. In `markSyncQueueEntryFailed`, after incrementing `retryCount`, check the cap:
   ```ts
   const nextRetryCount = entry.retryCount + 1;
   const nextState: SyncQueueEntryState =
     nextRetryCount >= MAX_SYNC_RETRIES ? 'dead-letter' : 'failed';
   // update entry with nextState and nextRetryCount
   ```

4. Add exponential backoff helper:
   ```ts
   export function syncRetryDelayMs(retryCount: number): number {
     // 15s, 30s, 60s, 120s, 240s — capped at 5 min, ±20% jitter
     const base = Math.min(15_000 * Math.pow(2, retryCount), 300_000);
     return Math.floor(base * (0.8 + Math.random() * 0.4));
   }
   ```

5. In the sync poller (wherever `markSyncQueueEntryFailed` is called and re-polling is scheduled), skip entries in `'dead-letter'` state — do not attempt them again.

6. In `src/app/ShellStatusBanners.tsx` (or equivalent), if any entries are in `'dead-letter'` state, surface: *"Some changes could not sync after several retries. Check your connection and reload to try again."* with a "Discard" option that removes dead-letter entries from the queue.

---

## W-H4: localStorage QuotaExceededError handling

**Problem:** All `localStorage.setItem()` calls in `src/utils/storage/` are unguarded. On quota exceeded (common in Safari private mode, or after heavy use), they throw silently, leaving in-memory state diverged from storage.

**Files to read first:**
- `src/utils/storage/collections.ts` — `saveCustomPlays`, `savePlaylists`, `saveSankalpas`, etc.
- `src/utils/storage/runtime.ts` — `saveActiveTimerState`, any sync queue saves
- `src/utils/storage/settings.ts` — `saveTimerSettings`
- `src/utils/storage/sessionLogs.ts` — `saveSessionLogs`
- `src/utils/storage/snapshots.ts` — if it exists, check for setItem calls
- `src/app/ShellStatusBanners.tsx` — find how to surface a storage-full banner

**Changes:**

1. Create `src/utils/storage/safeSetItem.ts`:
   ```ts
   export type StorageWriteResult = 'ok' | 'quota-exceeded' | 'error';

   export function safeSetItem(key: string, value: string): StorageWriteResult {
     try {
       localStorage.setItem(key, value);
       return 'ok';
     } catch (err) {
       if (err instanceof DOMException && (
         err.name === 'QuotaExceededError' ||
         err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
       )) {
         return 'quota-exceeded';
       }
       return 'error';
     }
   }
   ```

2. Replace every `localStorage.setItem(...)` in the storage files with `safeSetItem(...)`. Callers that currently return `void` should now return or emit `StorageWriteResult` — or at minimum check the result and log a warning.

3. In `src/utils/storage/sessionLogs.ts`, add a quota-recovery function:
   ```ts
   export function evictOldSessionLogs(): void {
     // Load current logs, drop those older than 90 days, re-save
     const logs = loadSessionLogs();
     const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
     const trimmed = logs.filter(log => new Date(log.endedAt).getTime() > cutoff);
     if (trimmed.length < logs.length) {
       safeSetItem(SESSION_LOGS_KEY, JSON.stringify(trimmed));
     }
   }
   ```

4. In the main save paths (custom plays, playlists, session logs), on `'quota-exceeded'`:
   - Try `evictOldSessionLogs()` as a recovery step, then retry the write.
   - If still failing, emit a signal that the TimerContext / app shell can surface.

5. In `src/app/ShellStatusBanners.tsx`, add a banner for the `'storage-full'` condition — e.g., "Device storage is full. Some data may not be saved. Free up space or clear old session history."

---

## W-M6: Parse JSON error responses in apiClient

**Problem:** `src/utils/apiClient.ts` reads error bodies as `response.text()` (around line 132). When the backend returns `Content-Type: application/json` with `{status, title, detail}` (as the backend's `ProblemDetail` format does), the raw JSON string appears as the error message.

**Files to read first:**
- `src/utils/apiClient.ts` — lines 128–145 (HTTP error handling)
- `src/utils/ApiClientError.ts` or wherever `ApiClientError` is defined — check the `detail` field

**Changes:**

In the HTTP error path, detect the content type and parse accordingly:
```ts
if (!response.ok) {
  let detail: string | null = null;
  try {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json') || contentType.includes('application/problem+json')) {
      const json = await response.json();
      detail = json?.detail ?? json?.message ?? json?.error ?? null;
    } else {
      const text = await response.text();
      detail = text.trim() || null;
    }
  } catch {
    detail = null;
  }
  throw new ApiClientError(..., { detail, kind: 'http' });
}
```

---

## W-M10: Session-log client timestamp annotation

**Problem:** `SessionLogUpsertRequest` timestamps are generated entirely client-side (`new Date().toISOString()`). The backend re-stamps mutations via sync header, but the log's `startedAt`/`endedAt` fields are never server-verified.

**Files to read first:**
- Find where session log upsert requests are built — likely in `src/features/timer/useTimerSyncEffects.ts` or `src/features/timer/sessionLogContext.ts`
- `src/types/` — the `SessionLog` type

**Changes:**

This is a documentation + minor hardening change (not a full server re-stamp, which requires backend changes):

1. In the session log build path, confirm that `startedAt` and `endedAt` are taken from the `ActiveSession.lastResumedAtMs` (wall-clock) and `Date.now()` at session end, not from any user input.

2. Add a comment in the log-building code:
   ```ts
   // startedAt and endedAt are client wall-clock times; server re-stamps updatedAt
   // via X-Meditation-Sync-Queued-At. Backend records clientCreatedAt for audit.
   ```

3. Ensure that `completedDurationSeconds` is sourced from `elapsedSeconds` (the accumulated value in the timer reducer), NOT from `endedAt - startedAt`. This prevents wall-clock rewind from producing negative durations. If the existing code uses `endedAt - startedAt`, fix it to use `elapsedSeconds`.

---

## W-M11: Manual duration input validation

**Problem:** The manual session log form's duration field accepts any number. The backend validates, but the UX should surface errors early.

**Files to read first:**
- `src/features/timer/PracticeSetupForm.tsx` or wherever the manual log form lives — find the `durationMinutes` or equivalent input
- Any validation schema or helper in `src/utils/` for form validation

**Changes:**

In the manual log form's `durationMinutes` input:
1. Set `min="1"` and `max="1440"` HTML attributes.
2. Add client-side validation on submit or on change:
   ```ts
   if (durationMinutes < 1 || durationMinutes > 1440) {
     setDurationError('Duration must be between 1 and 1440 minutes.');
     return;
   }
   ```
3. Display the error inline below the input.

---

## W-M14: Secure crypto.randomUUID fallback

**Problem:** `syncQueue.ts`'s `createQueueId` (or equivalent) falls back to `sync-${Date.now()}-${Math.random()}`. `Math.random()` is not cryptographically random; two clients starting at the same millisecond can collide.

**Files to read first:**
- `src/utils/syncQueue.ts` — find `createQueueId` or equivalent queue ID generator
- Check if `src/utils/crypto.ts` or similar exists

**Changes:**

Replace the fallback:
```ts
function createQueueId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: 128 bits of randomness via getRandomValues, formatted as UUID-ish string
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
```

Note: `crypto.getRandomValues` is available in all modern browsers and in Node.js ≥ 19. If `crypto` itself is unavailable (extremely old browsers), fall back to a timestamp + counter rather than `Math.random()`.

---

## W-L2: `as const` on sync type union literals

**Problem:** `src/types/sync.ts` defines `SyncQueueEntryState`, `SyncOperation`, and `SyncEntityType` as plain string union types. Action-type constants elsewhere may be widened from `string` literal to `string`.

**Files to read first:**
- `src/types/sync.ts` — full file
- `src/features/timer/timerReducer.ts` — check if action type constants use `as const`

**Changes:**

Where string union types are defined as object constants (e.g., `const SYNC_OPERATIONS = { UPSERT: 'upsert', DELETE: 'delete' }`), add `as const`. For plain type aliases (`type SyncOperation = 'upsert' | 'delete'`), no change is needed — union types are already narrow.

For any object-style action type definitions in `timerReducer.ts` or similar:
```ts
// Before:
const TimerActionTypes = { START: 'START', PAUSE: 'PAUSE' };
// After:
const TimerActionTypes = { START: 'START', PAUSE: 'PAUSE' } as const;
type TimerActionType = typeof TimerActionTypes[keyof typeof TimerActionTypes];
```

Only change files where widening is actually occurring (use TypeScript to confirm). Do not change every file speculatively.

---

## W-L3: Auto-dismiss banners

**Problem:** `src/app/ShellStatusBanners.tsx` banners persist until manually cleared. Informational banners (e.g., "sync complete") should auto-dismiss after ~5 s.

**Files to read first:**
- `src/app/ShellStatusBanners.tsx` — full file; understand how banners are added and removed
- The context or state that drives banners

**Changes:**

For transient / informational banners (not error banners):
1. When a banner is added with a `transient: true` flag (add this flag to the banner type), set a `setTimeout` of 5000 ms that dispatches a "dismiss" action for that banner ID.
2. Permanent error banners (storage full, dead-letter sync failures, network offline) must NOT auto-dismiss.

If the banner type has no `transient` field, add one with a default of `false` so existing banners are unaffected.

---

## W-L4: Playlist form title validation

**Problem:** `src/features/playlists/PlaylistForm.tsx` allows saving with an empty title or whitespace-only name. The code review also noted no duplicate-title guard.

**Files to read first:**
- `src/features/playlists/PlaylistForm.tsx` — find the title input and form submit handler
- The playlists state (from context or store) — to check for existing titles

**Changes:**

1. In the form submit handler, validate:
   ```ts
   const trimmedName = name.trim();
   if (!trimmedName) {
     setNameError('Playlist name is required.');
     return;
   }
   if (existingPlaylists.some(p => p.name.trim() === trimmedName && p.id !== editingId)) {
     setNameError('A playlist with this name already exists.');
     return;
   }
   ```
2. Display the error inline. Clear the error when the field changes.
3. Trim the name before saving.

---

## W-L7: Sankalpa observance duplicate same-day guard

**Problem:** The client-side Sankalpa observance entry path doesn't check if an entry for today already exists before adding another.

**Files to read first:**
- Find the component/hook that adds a Sankalpa observance entry — likely in `src/pages/` or `src/features/sankalpa/` or via `TimerContext`
- `src/types/` — the `SankalpaObservanceRecord` or equivalent type shape

**Changes:**

Before adding a new observance entry for a given date:
```ts
const alreadyRecorded = existingObservances.some(
  obs => obs.observanceDate === newEntry.observanceDate
);
if (alreadyRecorded) {
  // Update the existing entry's status rather than adding a duplicate
  // OR display: "An observance for today is already recorded."
  return;
}
```

The preferred behavior is to UPDATE the existing entry (change `'observed'` → `'missed'` or vice versa) rather than append a duplicate.

---

## W-L8: Interval cue respects paused state

**Problem:** When a meditation session is paused, a queued interval bell can still fire.

**Files to read first:**
- Find the interval bell scheduling code — likely in `src/features/timer/TimerContext.tsx` or `src/features/timer/timerSoundPlayback.ts`
- `src/types/timer.ts` — the `ActiveSession` type; find `isPaused`

**Changes:**

In the interval bell fire path, add a paused-state guard:
```ts
if (activeSession.isPaused) {
  return; // Don't play interval bell when paused
}
```

If the interval is scheduled via `setTimeout`, cancel it on pause and re-schedule it on resume with the remaining time.

---

## W-L11: Playlist item duration guard

**Problem:** `PlaylistItemUpsertRequest.durationMinutes` is not client-validated before sending to the backend. The backend validates, but negative or zero values should be caught in the UI.

**Files to read first:**
- Find the playlist item form or the code path that builds `PlaylistItemUpsertRequest` — likely in `src/features/playlists/`
- Any existing duration input component

**Changes:**

In the playlist item form, add `min="1"` to the duration input and validate on submit:
```ts
if (durationMinutes < 1) {
  setDurationError('Item duration must be at least 1 minute.');
  return;
}
```

Also guard `getPlaylistItemDurationSeconds` (if it exists in timer logic) against returning 0 or negative:
```ts
export function getPlaylistItemDurationSeconds(item: PlaylistItem): number {
  return Math.max(60, item.durationMinutes * 60); // at least 1 minute
}
```

---

## Verification

1. Run `npm test` — all existing tests must pass.
2. Confirm that the sync dead-letter state appears correctly and retries stop.
3. Confirm that quota-exceeded storage writes do not throw (test by mocking `localStorage.setItem` to throw `DOMException`).
4. Confirm that a bad API response with JSON body shows the parsed `detail` field in the error, not raw JSON.
5. Confirm that saving a playlist with a blank name shows a validation error.

## After finishing

Commit on branch `review-fixes`:
```
fix(web): error handling, data safety, and input validation (W-H3, W-H4, W-M6, W-M10, W-M11, W-M14, W-L2, W-L3, W-L4, W-L7, W-L8, W-L11)
```
