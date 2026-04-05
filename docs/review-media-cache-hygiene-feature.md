# Media Cache Hygiene Review

Date: 2026-04-05
Branch: `codex/media-cache-hygiene-feature-bundle-with-branching`

## Findings

No blocker, high, or medium findings were recorded in this review.

## Review summary

- Timer sound ownership now has one clear runtime model:
  - `src/data/timerSoundCatalog.json` is the canonical selectable-and-playable catalog
  - shipped sounds are explicit `bundled` entries resolved from `src/assets/sounds/`
  - script-added sounds are explicit `media` entries resolved from `/media/sounds/<filename>`
- The redundant tracked `public/media/sounds/*` copies for shipped sounds were removed, so the repo no longer implies a second production ownership path for `Temple Bell` and `Gong`.
- `scripts/add-custom-play-media.mjs` no longer depends on the removed `src/data/meditationTypes.json` file and now validates against the shared frontend meditation-type export.
- Offline cache invalidation no longer depends on matching hand-edited literals across the app and service worker; the built app now computes one asset version and passes it to `offline-sw.js` through the registration URL.

## Residual risk

- Browser-level service-worker registration was validated through unit coverage and built-artifact inspection, but a live preview-origin browser smoke is still worth doing on the installed app origin because this repo does not provide a dedicated `npm run preview` script.
