# Session J — Web: Audio Lifecycle, Service Worker & Fetch Hygiene

## Context

Meditation app — React 19 / TypeScript / Vite web client.
Working branch: `review-fixes`. This session addresses audio resource management, service worker correctness, and fetch hygiene from `CODE-REVIEW-2026-04-24.md`.

Run `npm test` from the repo root. There are no automated tests for the service worker; verify SW changes manually or via a browser DevTools inspection.

**Issues addressed (9 total):**
- W-H5: Service worker media cache evicts by count (12 entries), not by total bytes
- W-H9: Audio players not disposed on unmount; `AppShell.tsx` audio refs have no explicit cleanup
- W-M1: `visibilitychange` + `pageshow` both call `runForegroundCatchUp` — duplicate completions on alt-tab
- W-M2: Playlist item deletion mid-playback orphans the audio element in `AppShell.tsx`
- W-M3: `useShellAudioSync.ts` dispatches fetches without `AbortController`
- W-M8: Four collection hydrations fire simultaneously on boot — no concurrency bound
- W-M15: Service worker cache version read from `?v=` URL param (manipulable); should be embedded constant
- W-L6: Audio `onError` in `AppShell.tsx` reports but never retries
- W-L14: SW skip-waiting / cache update policy is undocumented

---

## W-H5: Service worker byte-based media cache eviction

**Problem:** `public/offline-sw.js` limits the media cache to `MAX_MEDIA_CACHE_ENTRIES = 12` entries regardless of size. `MAX_CACHEABLE_MEDIA_BYTES = 25 * 1024 * 1024` is defined but unused in the eviction logic.

**Files to read first:**
- `public/offline-sw.js` — full file; find `rememberCachedMediaUrl`, `MAX_MEDIA_CACHE_ENTRIES`, `MAX_CACHEABLE_MEDIA_BYTES`, and `readMediaCacheIndex` / `writeMediaCacheIndex`

**Changes:**

1. Change the media cache index format from an array of URL strings to an array of `{url, sizeBytes}` objects:
   ```js
   // Old index format: ['url1', 'url2', ...]
   // New index format: [{url: 'url1', sizeBytes: 123456}, ...]
   ```

2. When caching a new media response, capture its size:
   ```js
   const clonedResponse = response.clone();
   const blob = await clonedResponse.blob();
   const sizeBytes = blob.size;
   ```
   (Use `Content-Length` header as a fast path if available and reliable; fall back to `blob.size`.)

3. In `rememberCachedMediaUrl`, switch eviction to byte-total:
   ```js
   async function rememberCachedMediaUrl(cache, url, sizeBytes) {
     const index = await readMediaCacheIndex(cache);
     // Remove any existing entry for this URL (de-dup)
     const withoutCurrent = index.filter(entry => entry.url !== url);
     const newEntry = { url, sizeBytes };
     let updated = [...withoutCurrent, newEntry];

     // Evict oldest entries until total bytes fit within cap
     let totalBytes = updated.reduce((sum, e) => sum + (e.sizeBytes ?? 0), 0);
     while (totalBytes > MAX_CACHEABLE_MEDIA_BYTES && updated.length > 1) {
       const evicted = updated.shift(); // oldest first
       await cache.delete(evicted.url);
       totalBytes -= (evicted.sizeBytes ?? 0);
     }

     await writeMediaCacheIndex(cache, updated);
   }
   ```

4. Update `readMediaCacheIndex` to handle both old format (array of strings) and new format for backward compatibility:
   ```js
   async function readMediaCacheIndex(cache) {
     const response = await cache.match('/__offline__/media-cache-index');
     if (!response) return [];
     const data = await response.json();
     // Migrate old string-array format
     if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
       return data.map(url => ({ url, sizeBytes: 0 }));
     }
     return Array.isArray(data) ? data : [];
   }
   ```

5. Remove or keep `MAX_MEDIA_CACHE_ENTRIES` as a secondary hard cap (e.g., 50 entries max, regardless of bytes) to prevent the index from growing too large:
   ```js
   const MAX_MEDIA_CACHE_ENTRIES = 50; // secondary safety limit, bytes-first
   while (updated.length > MAX_MEDIA_CACHE_ENTRIES) {
     const evicted = updated.shift();
     await cache.delete(evicted.url);
   }
   ```

---

## W-H9: Audio player disposal on unmount

**Problem:** `src/features/timer/timerSoundPlayback.ts` holds a `Map<string, AudioLike>` that is never cleared. `src/app/AppShell.tsx` holds `customPlayAudioRef` and `playlistAudioRef` audio elements that are never explicitly paused or cleaned up.

### Part 1: timerSoundPlayback.ts

**Files to read first:**
- `src/features/timer/timerSoundPlayback.ts` — full file; find the `audioByLabel` Map and the returned player interface

**Changes:**

Add a `dispose()` method to the returned player object that clears all audio instances:
```ts
function createTimerSoundPlayer(...): TimerSoundPlayer {
  const audioByLabel = new Map<string, AudioLike>();

  function dispose() {
    for (const audio of audioByLabel.values()) {
      audio.pause();
      // Reset src to release the media resource
      if ('src' in audio) {
        (audio as HTMLAudioElement).src = '';
        (audio as HTMLAudioElement).load();
      }
    }
    audioByLabel.clear();
  }

  return { prepare, play, dispose };
}
```

Add `dispose` to the `TimerSoundPlayer` type (wherever it is defined).

In the consumer (`TimerContext.tsx` or wherever the player is created), call `player.dispose()` in the effect cleanup:
```ts
useEffect(() => {
  const player = createTimerSoundPlayer(...);
  // ...
  return () => {
    player.dispose();
  };
}, []);
```

### Part 2: AppShell.tsx audio elements

**Files to read first:**
- `src/app/AppShell.tsx` — find where `customPlayAudioRef` and `playlistAudioRef` audio elements are used; find any existing unmount cleanup

**Changes:**

Add explicit cleanup for audio refs. If there is a `useEffect` that manages the audio lifecycle, add a cleanup function:
```ts
useEffect(() => {
  return () => {
    // Pause and release resources on unmount
    const customPlayAudio = customPlayAudioRef.current;
    if (customPlayAudio) {
      customPlayAudio.pause();
      customPlayAudio.src = '';
      customPlayAudio.load();
    }
    const playlistAudio = playlistAudioRef.current;
    if (playlistAudio) {
      playlistAudio.pause();
      playlistAudio.src = '';
      playlistAudio.load();
    }
  };
}, []);
```

---

## W-M1: Coalesce visibilitychange + pageshow catch-up

**Problem:** `src/features/timer/TimerContext.tsx` lines 465–490 register both `visibilitychange` and `pageshow` handlers, both calling `runForegroundCatchUp`. Alt-tabbing can fire both in sequence, running the completion check twice.

**Files to read first:**
- `src/features/timer/TimerContext.tsx` — lines 465–500; find both event handlers and `runForegroundCatchUp`
- `src/features/timer/foregroundCatchUp.ts` — understand what `runForegroundCatchUp` does and whether it is idempotent

**Changes:**

Wrap both handlers behind a shared debounce of 100 ms:
```ts
let catchUpTimeoutId: ReturnType<typeof setTimeout> | null = null;

function debouncedCatchUp() {
  if (catchUpTimeoutId !== null) clearTimeout(catchUpTimeoutId);
  catchUpTimeoutId = setTimeout(() => {
    catchUpTimeoutId = null;
    runForegroundCatchUp();
  }, 100);
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') debouncedCatchUp();
};
const handlePageShow = () => { debouncedCatchUp(); };
```

Clear the timeout in the effect cleanup alongside the event listener removals.

---

## W-M2: Playlist audio cleanup on item deletion mid-playback

**Problem:** `src/app/AppShell.tsx` lines ~95–165: when `activePlaylistItem` becomes `null` during an active playlist run (because the item was deleted from the library), the playlist `<audio>` element continues playing.

**Files to read first:**
- `src/app/AppShell.tsx` — find the playlist audio element and the `activePlaylistItem` prop/state
- `src/features/timer/playlistRuntimeContext.ts` or the relevant context — how is `activePlaylistItem` exposed?

**Changes:**

Add a `useEffect` that watches `activePlaylistItem` — when it transitions to `null` during an active session, pause the audio and end the run:
```ts
const prevPlaylistItemRef = useRef(activePlaylistItem);
useEffect(() => {
  const prev = prevPlaylistItemRef.current;
  prevPlaylistItemRef.current = activePlaylistItem;

  if (prev !== null && activePlaylistItem === null && activePlaylistSession !== null) {
    // Item was deleted mid-playback; pause audio and end the run gracefully
    playlistAudioRef.current?.pause();
    endPlaylistRun(); // call the appropriate session-end action
  }
}, [activePlaylistItem, activePlaylistSession]);
```

---

## W-M3: AbortController for fetches in useShellAudioSync.ts

**Problem:** `src/app/useShellAudioSync.ts` dispatches media asset fetches (`mediaAssetApi.loadMediaAsset(...)`) without an `AbortController`. If the component unmounts during the fetch, the response handler fires on an unmounted component.

**Files to read first:**
- `src/app/useShellAudioSync.ts` — full file; find all `mediaAssetApi` or similar fetch calls inside `useEffect`

**Changes:**

For each `useEffect` that triggers an async fetch, add an `AbortController`:
```ts
useEffect(() => {
  const controller = new AbortController();
  let cancelled = false;

  async function loadAsset() {
    try {
      const asset = await mediaAssetApi.loadMediaAsset(id, { signal: controller.signal });
      if (!cancelled) {
        dispatch({ type: 'SET_MEDIA_ASSET', payload: asset });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!cancelled) handleError(err);
    }
  }

  loadAsset();
  return () => {
    cancelled = true;
    controller.abort();
  };
}, [id]);
```

If `mediaAssetApi.loadMediaAsset` doesn't accept a `signal` option yet, add one to its signature (it likely calls `apiClient` which already supports `signal` via its abort controller logic).

---

## W-M8: Concurrency bound on hydration fetches

**Problem:** On boot, `useTimerSyncEffects.ts` fires all collection hydrations (custom plays, playlists, sankalpas, session logs) simultaneously. Four concurrent fetches can overwhelm slow connections and cause head-of-line blocking.

**Files to read first:**
- `src/features/timer/useTimerSyncEffects.ts` — find where the four hydration effects fire; look for parallel fetches at boot
- `src/features/timer/queueCollectionSync.ts` — understand the hydration pattern

**Changes:**

Add a `pLimit`-style concurrency limiter (or implement a minimal one without adding a dependency):
```ts
async function runWithConcurrencyLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  const queue = [...tasks];
  let active = 0;

  return new Promise((resolve, reject) => {
    function next() {
      while (active < limit && queue.length > 0) {
        const task = queue.shift()!;
        active++;
        task().then(result => {
          results.push(result);
          active--;
          if (queue.length === 0 && active === 0) resolve(results);
          else next();
        }).catch(err => {
          active--;
          reject(err);
        });
      }
    }
    next();
  });
}
```

Wrap the four hydration calls:
```ts
await runWithConcurrencyLimit([
  () => hydrateCustomPlays(),
  () => hydratePlaylists(),
  () => hydrateSankalpas(),
  () => hydrateSessionLogs(),
], 2); // max 2 simultaneous
```

Place this utility in `src/utils/concurrency.ts`.

---

## W-M15: SW cache version from build constant

**Problem:** `public/offline-sw.js` calls `resolveCacheVersion()` which reads `?v=VERSION` from the SW's own URL. A manipulated registration URL can pin users to a stale cache name.

**Files to read first:**
- `public/offline-sw.js` — find `resolveCacheVersion` and how `CACHE_VERSION` is set
- `vite.config.ts` — find where the SW is registered and the `?v=` param is appended; find `__APP_ASSET_VERSION__`

**Changes:**

Use Vite's ability to inject defines into files processed by the build pipeline. Because `public/offline-sw.js` is in `public/` (not processed by Vite by default), move it to `src/offline-sw.js` and reference it as a Vite plugin entry. Alternatively, use a simpler approach:

**Simpler approach — build-time string replacement:**
1. Rename `public/offline-sw.js` to `public/offline-sw.template.js`.
2. In `vite.config.ts`, add a plugin that reads the template, replaces `__SW_CACHE_VERSION__` with the computed app asset version, and writes `public/offline-sw.js`:
   ```ts
   {
     name: 'inject-sw-version',
     buildStart() {
       const version = process.env.MEDITATION_APP_ASSET_VERSION ?? createAppAssetVersion();
       const template = fs.readFileSync(path.join(rootDir, 'public/offline-sw.template.js'), 'utf8');
       const output = template.replace('__SW_CACHE_VERSION__', JSON.stringify(version));
       fs.writeFileSync(path.join(rootDir, 'public/offline-sw.js'), output);
     }
   }
   ```
3. In `offline-sw.template.js`, replace the `resolveCacheVersion()` call with:
   ```js
   const CACHE_VERSION = __SW_CACHE_VERSION__;
   ```
4. Add `public/offline-sw.js` to `.gitignore` (generated at build time). Update `public/offline-sw.template.js`.

If the plugin approach is too complex for this session, a minimal fix is to read the version from a `GET /sw-version` endpoint or `/manifest.webmanifest` (which already contains version info) during SW install. Document this in `docs/web-offline-policy.md` (see W-L14).

---

## W-L6: Audio onError retry

**Problem:** `AppShell.tsx` lines ~140–145 report an audio error but never retry. A transient network hiccup surfaces as a permanent failure.

**Files to read first:**
- `src/app/AppShell.tsx` — find the `onError` handler on both audio elements

**Changes:**

Add a retry counter (capped at 3) with a 2-second delay:
```ts
const audioErrorCountRef = useRef(0);
const MAX_AUDIO_RETRIES = 3;

function handleAudioError() {
  if (audioErrorCountRef.current < MAX_AUDIO_RETRIES) {
    audioErrorCountRef.current++;
    setTimeout(() => {
      const audio = customPlayAudioRef.current;
      if (audio) {
        audio.load(); // Reload the source
        audio.play().catch(() => {});
      }
    }, 2000);
  } else {
    audioErrorCountRef.current = 0;
    reportCustomPlayRuntimeIssue('Audio failed after 3 retries.');
  }
}
```

Reset `audioErrorCountRef.current` to 0 on successful playback start (`onLoadedMetadata` or `onPlaying`).

---

## W-L14: Document SW skip-waiting policy

**Problem:** The service worker update lifecycle (skip-waiting, client claim) is not documented. This leads to users being stuck on old bundles.

**Changes:**

Create `docs/web-offline-policy.md` with content covering:
1. **Cache names and versioning:** how `CACHE_VERSION` is set at build time; when it changes (any source file change).
2. **Install + activate lifecycle:** what happens when a new SW is downloaded.
3. **Skip-waiting policy:** whether the app calls `skipWaiting()` immediately (fast updates, may disrupt active sessions) or waits (safer, requires tab reload). Document what the current code does and why.
4. **Forcing a client to update:** `navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })` and the corresponding `self.addEventListener('message', ...)` handler — add it to the SW if not present.
5. **Cache eviction:** how the byte-based media cache works (updated in this session), and what happens to static assets on update (old cache deleted in `activate`).

---

## Verification

1. Run `npm test` — all tests must pass.
2. In Chrome DevTools → Application → Service Workers: confirm the new SW installs and the cache names include the version constant (not `?v=` from the URL).
3. In DevTools → Application → Cache Storage: add a media file to cache, verify the byte-based index is stored at `/__offline__/media-cache-index`, add more files until 25 MB is approached, verify old files are evicted.
4. Confirm `useShellAudioSync.ts` no longer leaves dangling fetch promises after component unmount (check for React "can't setState on unmounted component" warnings in the console).
5. Alt-tab away and back during an active session — confirm `runForegroundCatchUp` fires once, not twice.

## After finishing

Commit on branch `review-fixes`:
```
fix(web): audio lifecycle, service worker, and fetch hygiene (W-H5, W-H9, W-M1, W-M2, W-M3, W-M8, W-M15, W-L6, W-L14)
```
