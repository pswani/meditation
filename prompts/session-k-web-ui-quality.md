# Session K — Web: UI Quality, Performance & Runtime Contract

## Context

Meditation app — React 19 / TypeScript / Vite web client.
Working branch: `review-fixes`. Sessions I and J address error handling and audio/SW. This session addresses UI quality, performance, cache correctness, and contract validation.

Run `npm test` from the repo root. Read the files carefully before changing anything — several items here depend on what Session D (monster-file split) did to `TimerContext.tsx`.

**Issues addressed (11 total):**
- W-M5: Tests are heavy on snapshots — critical paths should use behavior assertions
- W-M9: `recentLogs` derived list recomputed on every render without memo
- W-M12: Audio elements hidden with `style={{display:'none'}}` — no keyboard pause access
- W-M13: Asset version hash not reproducible across platforms (file traversal order)
- W-L1: Inconsistent `useCallback` / `useMemo` across files — no enforced convention
- W-L5: Media URLs have no cache-busting version suffix
- W-L9: `getUserTimeZone()` returns unvalidated IANA string — non-canonical values break summaries
- W-L10: Session log list is unpaginated — `listSessionLogsFromApi` loads everything
- W-L12: Custom play media catalog cache not invalidated on update
- W-L13: No runtime contract validation — unexpected API shapes can cascade silently
- W-L15: Generated files checked in without a CI diff-check

---

## W-M5: Convert critical snapshot tests to behavior assertions

**Problem:** `src/pages/SankalpaPage.test.tsx` and other page tests use many snapshot assertions. Snapshots catch structure churn, not behavior, and they fail on every UI text change.

**Files to read first:**
- `src/pages/SankalpaPage.test.tsx` — identify which tests are pure snapshots vs. behavior tests
- `src/pages/` — list all page test files and assess snapshot-to-assertion ratio

**Changes:**

For each snapshot test that asserts on a user-visible behavior (not just "the component renders"), convert to a `@testing-library/react` behavior assertion:
```ts
// Before:
expect(container).toMatchSnapshot();

// After (example):
expect(screen.getByRole('button', { name: /save goal/i })).toBeInTheDocument();
expect(screen.getByText('Daily meditation goal')).toBeVisible();
expect(screen.queryByText('Error')).not.toBeInTheDocument();
```

Target: convert the 3–5 most important snapshot tests per file to behavior assertions. Do not delete all snapshots at once — keep structural snapshots for pure presentational components where the structure IS the contract (e.g., icon layout). Update the remaining snapshots if they're stale.

Add at least one behavior test per page that confirms the critical user action works (e.g., "clicking Save saves the goal", "completed goal shows 100%").

---

## W-M9: Memoize recentLogs derivation

**Problem:** The derived `recentLogs` list (a slice of `sessionLogs`) is recomputed on every state change in the context — including every timer tick.

**Files to read first:**
- Read the output of Session D first: check whether `TimerContext.tsx` was split. If it was refactored, find where `recentLogs` or `sessionLogs` is now derived and exposed.
- `src/features/timer/timerContextObject.ts` — look for `recentLogs` definition (likely `state.sessionLogs.slice(0, 20)`)
- `src/features/timer/sessionLogContext.ts` — if it exists after the split

**Changes:**

If `recentLogs` is computed inside the context value object without `useMemo`, extract it:
```ts
// Before (in context value factory, runs every render):
recentLogs: state.sessionLogs.slice(0, 20),

// After (in the component that creates context, with memo):
const recentLogs = useMemo(
  () => state.sessionLogs.slice(0, 20),
  [state.sessionLogs]
);
```

If the session log list is already separated into its own context (from Session D), confirm the memoization is in place there. If it is already memoized, document that fact and skip this item.

---

## W-M12: Keyboard-accessible audio pause

**Problem:** `AppShell.tsx` renders the audio element with `style={{display:'none'}}`. Screen reader users and keyboard navigators have no way to pause audio.

**Files to read first:**
- `src/app/AppShell.tsx` — find both audio elements and their `display:none` styling
- Any existing keyboard shortcut handlers in the app

**Changes:**

Two acceptable approaches — pick the simpler one:

**Option A (minimal):** Add a visually-hidden but focusable pause button that appears when audio is actively playing:
```tsx
{isPlaying && (
  <button
    className="sr-only"
    aria-label="Pause audio"
    onClick={handlePause}
  >
    Pause
  </button>
)}
```

**Option B (preferred):** Add a `<VisuallyHidden>` wrapper (or `clip: rect(0,0,0,0)` CSS class) around the native `<audio controls>` element so it's focusable by screen readers but not visible:
```tsx
<div style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
  <audio ref={customPlayAudioRef} controls ... />
</div>
```

The `controls` attribute makes the native audio player accessible via keyboard without needing a custom button.

---

## W-M13: Deterministic asset version hash

**Problem:** `vite.config.ts`'s `createAppAssetVersion` walks the source directory with `walkFiles`. File traversal order is OS-dependent (macOS HFS+ vs. Linux ext4 differ). Two platforms building from the same commit can produce different hashes.

**Files to read first:**
- `vite.config.ts` — find `createAppAssetVersion` and `walkFiles`

**Changes:**

Sort the file list before hashing:
```ts
function createAppAssetVersion(): string {
  const hash = crypto.createHash('sha256');
  const files = ['index.html', 'package.json', 'src', 'public']
    .map(c => path.join(rootDir, c))
    .filter(fs.existsSync)
    .flatMap(walkFiles)
    .map(f => path.relative(rootDir, f))
    .sort(); // <-- sort for determinism

  for (const relativePath of files) {
    hash.update(relativePath);
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(rootDir, relativePath)));
    hash.update('\0');
  }

  return hash.digest('hex').slice(0, 12);
}
```

Confirm that `walkFiles` returns absolute paths (or adapt accordingly). The sort must be on the relative paths, not absolute, so it's platform-independent.

**Optional enhancement:** If `MEDITATION_APP_ASSET_VERSION` env var is set (CI use case), bypass the hash entirely — it already short-circuits. Document this in a comment near the function.

---

## W-L1: Consistent memoization convention

**Problem:** `useCallback` / `useMemo` usage varies file to file. Some expensive computations are memoized; others aren't. ESLint `react-hooks/exhaustive-deps` should enforce dependency arrays.

**Files to read first:**
- `.eslintrc.*` or `eslint.config.*` at the repo root — check if `react-hooks` plugin is already configured
- `package.json` — check if `eslint-plugin-react-hooks` is a devDependency

**Changes:**

1. If `eslint-plugin-react-hooks` is not already a devDependency:
   ```
   npm install --save-dev eslint-plugin-react-hooks
   ```

2. In the ESLint config, add (if not already present):
   ```js
   rules: {
     'react-hooks/rules-of-hooks': 'error',
     'react-hooks/exhaustive-deps': 'warn',
   }
   ```

3. Run `npx eslint src/ --ext .ts,.tsx` to surface exhaustive-deps warnings. Fix any that are `'error'` level (missing deps that would cause a stale closure bug). Leave `'warn'` violations for a separate pass — do not attempt to fix all of them in this session.

4. Add a comment in `AGENTS.md` under Engineering expectations: "Use `useCallback` for callbacks passed as props; use `useMemo` for expensive computed values. Always provide complete dependency arrays (enforced by `react-hooks/exhaustive-deps`)."

---

## W-L5: Media URL cache-busting

**Problem:** If the backend updates a recording (replaces the file at the same path), clients see the cached version indefinitely because the URL never changes.

**Files to read first:**
- Find where media asset URLs are constructed — likely in an API response mapper or in `src/features/timer/timerSoundPlayback.ts`
- `backend/src/main/java/com/meditation/backend/media/MediaAssetResponse.java` — check if `updatedAt` is in the response
- `src/generated/syncContract.ts` or `src/types/` — `MediaAsset` type

**Changes:**

1. If `MediaAssetResponse` includes `updatedAt` (check the backend response type), append it as a query param when constructing the playback URL:
   ```ts
   const mediaUrl = `${asset.url}?v=${encodeURIComponent(asset.updatedAt)}`;
   ```

2. If `updatedAt` is not in the response, use the asset's `id` as a stable cache key and document that URL changes on file replacement require a new asset ID.

3. Update all places that construct media URLs to use the versioned form.

---

## W-L9: Validate IANA timezone string

**Problem:** `getUserTimeZone()` returns whatever `Intl.DateTimeFormat().resolvedOptions().timeZone` gives — usually a canonical IANA ID, but non-canonical aliases (e.g., `"US/Eastern"`) may not be accepted by the backend's `ZoneId.of()`.

**Files to read first:**
- `src/utils/timeZone.ts` — find `getUserTimeZone`
- Find where `getUserTimeZone()` is called and the value is sent to the backend

**Changes:**

Add a normalization step that validates the string against `Intl.supportedValuesOf('timeZone')` (available in modern browsers and Node.js):
```ts
export function getUserTimeZone(): string | undefined {
  try {
    const raw = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof raw !== 'string' || !raw.trim()) return undefined;

    // Validate against the browser's IANA list if supported
    if (typeof Intl.supportedValuesOf === 'function') {
      const supported = Intl.supportedValuesOf('timeZone');
      if (!supported.includes(raw)) {
        // Try to normalize via DateTimeFormat round-trip
        const normalized = Intl.DateTimeFormat(undefined, { timeZone: raw })
          .resolvedOptions().timeZone;
        return supported.includes(normalized) ? normalized : undefined;
      }
    }

    return raw;
  } catch {
    return undefined;
  }
}
```

If `Intl.supportedValuesOf` is unavailable (older browsers), fall back to the existing behavior.

---

## W-L10: Session log list pagination

**Problem:** `listSessionLogsFromApi` loads all session logs in one request. A user with years of history causes a large payload on every summary/history page load.

**Files to read first:**
- Find `listSessionLogsFromApi` — likely in `src/api/` or `src/utils/apiClient.ts` or a feature-level api file
- Find where the session log list is rendered — `src/pages/HistoryPage.tsx` or similar
- The backend `SessionLogService` already accepts `page` and `size` params

**Changes:**

1. Update the API call to accept optional pagination params:
   ```ts
   export async function listSessionLogsFromApi(options?: {
     page?: number;
     size?: number;
     startAt?: string;
     endAt?: string;
   }): Promise<SessionLogListResponse> {
     const params = new URLSearchParams();
     if (options?.page !== undefined) params.set('page', String(options.page));
     if (options?.size !== undefined) params.set('size', String(options.size));
     // ... other filters
     return apiClient.get(`/api/session-logs?${params}`);
   }
   ```

2. In the history page, implement infinite scroll or a "Load more" button:
   - Start with `size=50`.
   - Show "Load more" when `response.hasMore` is true.
   - Append new logs to the existing list.

3. For `TimerContext` hydration, keep loading a limited recent set (e.g., `size=100`) rather than all logs. The context only needs recent logs for the home page summary.

---

## W-L12: Custom play media catalog cache invalidation

**Problem:** `useCustomPlayMediaCatalog` (or equivalent) caches the media asset list on mount and never re-fetches when a custom play's linked asset is updated.

**Files to read first:**
- Find `useCustomPlayMediaCatalog` — likely in `src/features/timer/` or `src/features/customPlay/`
- Understand what triggers the catalog to reload (currently: mount only)

**Changes:**

Add an invalidation signal. Two options:

**Option A (dependency on a version counter):** Add a `mediaCatalogVersion` counter to the context state. Increment it whenever a custom play is saved or deleted. Pass it as a dependency to `useCustomPlayMediaCatalog`:
```ts
useEffect(() => {
  fetchMediaCatalog();
}, [mediaCatalogVersion]); // re-fetch when any custom play mutates
```

**Option B (direct refetch on save):** After a successful custom play upsert in the sync queue handler, call `invalidateMediaCatalog()` which triggers a re-fetch.

Pick the approach that fits the existing data flow pattern. Prefer Option A if `mediaCatalogVersion` is easy to thread through the context.

---

## W-L13: Runtime contract validation with zod

**Problem:** Frontend assumes `/api/*` responses match `src/generated/syncContract.ts` shapes. One unexpected field shape (e.g., a missing field after a backend deploy) can cascade through the app silently.

**Files to read first:**
- `src/generated/syncContract.ts` — full file; understand what types are generated
- `src/utils/apiClient.ts` — find the JSON parse path (successful responses)
- `package.json` — check if `zod` is already a dependency

**Changes:**

1. Add zod:
   ```
   npm install zod
   ```

2. Create `src/api/schemas/` with zod schemas for each entity. Start with the most critical ones:
   - `customPlaySchema` — mirrors `CustomPlayResponse`
   - `sessionLogSchema` — mirrors `SessionLogResponse`
   - `timerSettingsSchema` — mirrors `TimerSettingsResponse`

   Example:
   ```ts
   import { z } from 'zod';
   export const customPlaySchema = z.object({
     id: z.string(),
     name: z.string(),
     meditationType: z.string(),
     durationMinutes: z.number().positive(),
     startSound: z.string(),
     endSound: z.string(),
     mediaAssetId: z.string().nullable().optional(),
     // ...
   });
   ```

3. In `apiClient.ts` (or in each API function that parses a response), validate the response after `response.json()`:
   ```ts
   const raw = await response.json();
   const parsed = customPlaySchema.safeParse(raw);
   if (!parsed.success) {
     console.error('[API contract mismatch]', parsed.error.flatten());
     // Do not throw in production — log and return raw (degrade gracefully)
     // In development, throw to catch early:
     if (import.meta.env.DEV) {
       throw new Error(`API contract mismatch: ${parsed.error.message}`);
     }
   }
   return parsed.success ? parsed.data : (raw as unknown);
   ```

4. Wire validation into the per-entity API functions, not into `apiClient.ts` directly, so the schema is co-located with the call.

Note: Full schema coverage for all endpoints is out of scope for this session. Focus on the three schemas above and the pattern. Others can be added incrementally.

---

## W-L15: CI check for generated files

**Problem:** `src/generated/syncContract.ts` is checked in but generated by `scripts/generate-sync-contract.mjs`. If a developer edits `contracts/sync-contract.json` and forgets to regenerate, the repo silently drifts.

**Files to read first:**
- `scripts/generate-sync-contract.mjs` — confirm it writes to `src/generated/syncContract.ts`
- `.github/workflows/` — find the CI workflow file(s)
- `package.json` — check for a `generate` or `codegen` npm script

**Changes:**

1. In `package.json`, confirm there is a script:
   ```json
   "generate": "node scripts/generate-sync-contract.mjs"
   ```
   Add it if missing.

2. In the CI workflow (`.github/workflows/*.yml`), add a step after the build:
   ```yaml
   - name: Verify generated files are up to date
     run: |
       npm run generate
       git diff --exit-code src/generated/
     # Fails if generate produced a diff — means the committed file is stale
   ```

3. If the CI workflow doesn't yet run backend codegen (`GeneratedSyncContract.java`), add that as a separate step — but only if `scripts/generate-sync-contract.mjs` also generates the Java file (read the script to confirm). If it only generates TS, CI only needs to check the TS side.

---

## Verification

1. Run `npm test` — all tests must pass, including updated behavior tests.
2. Run `npm run generate` and confirm it produces no git diff.
3. Run `npx eslint src/ --ext .ts,.tsx` and confirm no new `error`-level violations.
4. Confirm `getUserTimeZone()` returns a valid IANA ID (test in a browser console).
5. Confirm the history page loads paginated (check network tab — first load should be 50 logs, not all).

## After finishing

Commit on branch `review-fixes`:
```
fix(web): UI quality, performance, cache correctness, and runtime contract (W-M5, W-M9, W-M12, W-M13, W-L1, W-L5, W-L9, W-L10, W-L12, W-L13, W-L15)
```
