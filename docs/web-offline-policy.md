# Web Offline & Service Worker Policy

This document describes how the meditation app's service worker (`public/offline-sw.js`) manages caching, updates, and media storage.

---

## 1. Cache names and versioning

The service worker uses three separate `Cache Storage` buckets, all versioned:

| Cache | Name pattern | Contents |
|---|---|---|
| App shell | `meditation-app-shell-{VERSION}` | `index.html`, `manifest.webmanifest` |
| Static assets | `meditation-static-assets-{VERSION}` | JS bundles, CSS, fonts, images |
| Media assets | `meditation-media-assets-{VERSION}` | Audio recordings |

`VERSION` is a 12-character SHA-256 hex digest computed at build time from the content of all source files (`src/`, `public/`, `index.html`, `package.json`). It changes whenever any source file changes.

**How the version reaches the SW:** `vite.config.ts` contains an `inject-sw-version` plugin that reads `public/offline-sw.template.js` at build start, replaces the `__SW_CACHE_VERSION__` placeholder with the JSON-stringified version string, and writes the result to `public/offline-sw.js`. The generated file is gitignored; only the template is committed.

`src/features/sync/offlineCacheVersion.ts` exposes `getOfflineAppAssetVersion()` (which reads the `__APP_ASSET_VERSION__` Vite define) and `getOfflineAppServiceWorkerPath()` (which constructs the SW registration URL with `?v=VERSION`). The `?v=` param is now informational only and is **not** used by the SW to determine cache names — the version is embedded at build time.

---

## 2. Install + activate lifecycle

### Install

When the browser downloads a new SW script (version changed), it runs `install`:

1. Opens `meditation-app-shell-{NEW_VERSION}` and fetches `index.html` + `manifest.webmanifest`.
2. Calls `self.skipWaiting()` immediately (see §3).

The old SW continues controlling all open tabs until `activate` finishes.

### Activate

Once the new SW is installed and no other tabs are running the old SW:

1. `deleteOldCaches()` removes every cache whose name is not in the current expected set (`app-shell`, `static-assets`, `media-assets` for the new version). This cleans up stale versioned caches from previous deployments.
2. `self.clients.claim()` makes the new SW take control of all open clients immediately without waiting for a page reload.

---

## 3. Skip-waiting policy

The SW calls `self.skipWaiting()` unconditionally during `install`. This means:

- **Behaviour:** A new SW becomes active as soon as it finishes installing, even if another tab is still open with the old version.
- **Risk:** If a user has an active meditation session in one tab and a new deployment lands, the old static assets may be evicted from cache before the session tab reloads. In practice this is low-risk because the app shell re-fetches `index.html` on every navigation request and the static assets are still served from the network.
- **Why chosen:** Meditation sessions are short-lived (minutes), and stale-bundle bugs from _not_ skipping waiting are a worse UX failure than a possible mid-session cache disruption.

### Forcing an update from the app

The app can send a `SKIP_WAITING` message to trigger an immediate SW swap without waiting for a tab closure:

```js
navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
```

The SW handles this in its `message` listener:

```js
if (event.data.type === 'SKIP_WAITING') {
  event.waitUntil(self.skipWaiting());
}
```

After `skipWaiting`, the page should reload to pick up the new bundles:

```js
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
});
```

---

## 4. Media cache eviction

The media cache is governed by a byte-total budget rather than an entry count:

- **Budget:** 25 MB (`MAX_CACHEABLE_MEDIA_BYTES`).
- **Secondary limit:** 50 index entries (`MAX_MEDIA_CACHE_ENTRIES`).
- **Only cacheable:** responses with a `Content-Length` header ≤ 25 MB and status 200 (non-opaque).

An index of cached entries is stored inside the media cache itself at `/__offline__/media-cache-index` as a JSON array of `{ url: string, sizeBytes: number }` objects. Entries are ordered oldest-first. When a new file is cached:

1. Any existing entry for that URL is removed (de-dup).
2. The new entry is appended.
3. Oldest entries are deleted from the cache and the index until total bytes ≤ 25 MB.
4. Then oldest entries are deleted until the entry count ≤ 50.

**Migration:** The previous index format was a top-level `{ urls: [...] }` object (string array). `readMediaCacheIndex` migrates this format by assigning `sizeBytes: 0` to migrated entries so they are treated as 0-byte for eviction purposes and will be naturally replaced by the new format on next access.

Range requests (e.g., `Range: bytes=...`) are always forwarded to the network and not served from cache, since the Cache API does not support partial responses.

---

## 5. Static asset caching strategy

Static assets (JS, CSS, fonts, images, manifest) use **cache-first with network fallback**:

1. If the asset is in `meditation-static-assets-{VERSION}`, return it immediately.
2. Otherwise fetch from network, store in cache, and return.

Because the cache name is versioned, a new deployment creates a fresh cache; the old cache for the previous version is deleted during `activate`. Users on the new version never see stale bundles.

---

## 6. Navigation requests

`index.html` is served with **network-first**:

1. Fetch the current `index.html` from the network.
2. On success, update the app shell cache.
3. On network failure, fall back to the cached `index.html`, then to the generic offline shell.

This ensures users always get the latest app shell when online, and see a usable page offline.
