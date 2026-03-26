# Session Handoff

## Current status
LAN / Wi-Fi access support is in place for the current front-end-only workspace.

This pass made the minimum necessary operational changes so the app can be opened from a phone or another computer on the same local network, while keeping the implementation local-first and avoiding unrelated backend or deployment refactors.

## What was changed to support LAN / Wi-Fi access
- Configured Vite dev server to bind to `0.0.0.0:5173` in `vite.config.ts`.
- Configured Vite preview server to bind to `0.0.0.0:4173` in `vite.config.ts`.
- Added shared API-base configuration utilities in `src/utils/apiConfig.ts` with:
  - default same-origin base `/api`
  - optional `VITE_API_BASE_URL` override for separate backend testing
- Updated REST-style boundary utilities so they expose:
  - stable same-origin endpoint paths
  - LAN-safe URL builders derived from `VITE_API_BASE_URL`
- Added focused tests for API-base behavior and the updated boundary helpers.
- Added `.env.example` documenting the optional API-base override.
- Updated `README.md` with a dedicated `Accessing The App From Other Devices On The Same Wi-Fi` section.
- Updated `requirements/decisions.md` with the LAN access decisions from this slice.

## Exact commands to run the app from a phone

### Dev mode
```bash
npm run dev
```

Open from the phone:

```text
http://<LAN-IP>:5173/
```

### Local production preview
```bash
npm run build
npm run preview
```

Open from the phone:

```text
http://<LAN-IP>:4173/
```

### If pairing with a separate backend outside this repo
```bash
VITE_API_BASE_URL=http://<LAN-IP>:<BACKEND-PORT>/api npm run dev
```

Important backend note:

- no backend service exists in this repository, so backend bind-address and CORS setup remain external to this workspace

## Example URL format
- dev example: `http://192.168.68.76:5173/`
- preview example: `http://192.168.68.76:4173/`

## Verification status
- Passed `npm run typecheck`
- Passed `npm run lint`
- Passed `npm run test`
- Passed `npm run build`
- Started dev server successfully with `npm run dev`
- Vite reported:
  - local: `http://localhost:5173/`
  - network: `http://192.168.68.76:5173/`
- Started preview server successfully with `npm run preview`
- Vite reported:
  - local: `http://localhost:4173/`
  - network: `http://192.168.68.76:4173/`
- Confirmed there are no backend build/run/test commands in this repo:
  - no `gradlew`
  - no `pom.xml`
  - no `build.gradle`
  - no backend source tree or server entrypoint
- In-sandbox `curl` checks to `127.0.0.1:5173` and `127.0.0.1:4173` returned exit code `7`, so LAN verification is based on Vite server output rather than sandbox loopback fetches

## Known limitations
- This repo remains front-end only; there is still no backend service to bind, run, or test here.
- The app still uses browser `localStorage`, so data does not sync between the phone and the developer machine.
- `VITE_API_BASE_URL` now provides a clean base-URL strategy, but the current app still does not perform live HTTP requests.
- Backend CORS guidance is documented only; no backend code exists here to apply CORS settings.
- Firewall, VPN, or Wi-Fi isolation settings on the developer machine or router can still block device-to-device access even when the app is correctly bound to `0.0.0.0`.

## Documentation updates made
- Updated `README.md`
- Updated `requirements/decisions.md`
- Updated `requirements/session-handoff.md`
- Added `requirements/execplan-lan-access-wifi.md`

## Exact recommended next prompt
Read:
- AGENTS.md
- PLANS.md
- README.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md


Then:

1. Create an ExecPlan for live playlist REST transport using the new LAN-safe API base configuration.
2. Keep the implementation to one meaningful vertical slice:
   - replace the local-only playlist API boundary with real `fetch` requests
   - keep `sankalpa` and `custom play media` local-first for now
   - preserve the existing playlist validation, logging, and UI flow
   - add clear load/save error handling in playlist management and playlist run entry points
3. Include:
   - a shared HTTP helper built on the existing `src/utils/apiConfig.ts`
   - focused tests for request URL building, success handling, and failure states
   - README updates describing how to run the front end against a separate LAN backend
   - updates to `requirements/decisions.md` and `requirements/session-handoff.md`
4. Exclude:
   - backend implementation
   - auth
   - sankalpa transport changes
   - unrelated route or shell refactors
5. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
6. Commit with a clear message:
   feat(playlists): add live REST transport via configurable API base
