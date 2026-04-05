# Media Cache Hygiene Verification

Date: 2026-04-05
Branch: `codex/media-cache-hygiene-feature-bundle-with-branching`

## Automated verification

- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run test`: pass
  - 47 files
  - 320 tests
- `npm run build`: pass

## Focused checks

1. Timer sound resolution for supported labels: pass
   - `src/features/timer/timerSoundCatalog.test.ts` passed with explicit `bundled` ownership for `Temple Bell` and `Gong`
   - `src/features/timer/timerSoundPlayback.test.tsx` passed, including legacy label remapping and playback preparation behavior
2. Sound registration script behavior: pass
   - `npm run sound:add -- --label "Crystal Bowl" --filename crystal-bowl.wav --dry-run`
   - dry run reported the expected catalog target `src/data/timerSoundCatalog.json`
   - dry run reported the expected playback path `/media/sounds/crystal-bowl.wav`
3. Custom-play media registration script behavior: pass
   - `npm run media:add:custom-play -- --id media-sahaj-evening-25 --label "Sahaj Evening Sit (25 min)" --meditation-type Sahaj --filename sahaj-evening-25.mp3 --duration-seconds 1500 --size-bytes 11000000 --dry-run`
   - dry run accepted `Sahaj`, proving the script no longer depends on the removed JSON file
   - dry run reported the expected catalog update target plus a new migration path under `backend/src/main/resources/db/migration/`
4. Cache-version strategy in built artifacts: pass
   - `dist/offline-sw.js` now derives `CACHE_VERSION` from the service-worker registration URL
   - the old literal `2026-04-04-offline-app-sync-v1` no longer appears in the built output
   - the built main bundle contains one computed asset version token (`b60391d09ffc` in this build), which is used by the registration helper
5. Offline app registration and cache-related smoke: pass with residual manual validation
   - `src/features/sync/offlineApp.test.ts` passed, covering versioned service-worker registration and cache-message posting
   - `src/features/sync/offlineCacheVersion.test.ts` passed, covering fallback normalization and versioned service-worker path generation
   - a live preview-origin browser smoke was not run because this repo does not define `npm run preview`

## Residual risk

- Service-worker behavior was verified through unit coverage and built-artifact inspection rather than a live browser session on the installed origin.
