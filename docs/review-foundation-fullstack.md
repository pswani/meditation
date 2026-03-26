# Foundation Review: Full-Stack

## Scope reviewed
- usability
- architecture cleanliness
- code quality
- REST boundary quality
- backend hygiene
- H2 and media-storage design sanity

This review covered the current foundation state documented in `README.md`, `docs/architecture.md`, and the shipped frontend/backend foundation code. No code changes were made in this step.

## Critical issues

### 1. H2 console is enabled in the default backend runtime
- Files:
  - `backend/src/main/resources/application.yml:21-24`
- Why this matters:
  - The backend enables the H2 console for the default runtime, not only for a local-only profile.
  - The same config also supports LAN-access workflows elsewhere in the repo, so this creates a real risk of exposing an unauthenticated database console outside a strictly local machine context.
- Recommendation:
  - Disable the H2 console by default.
  - Re-enable it only in an explicit local/dev profile.
  - Document that it is a developer-only tool and not part of the normal runtime surface.

## Important issues

### 1. The health endpoint leaks absolute filesystem paths
- Files:
  - `backend/src/main/java/com/meditation/backend/health/ApiHealthService.java:16-23`
  - `backend/src/main/java/com/meditation/backend/health/ApiHealthResponse.java:5-10`
- Why this matters:
  - `/api/health` currently returns absolute values for `mediaRoot` and `customPlayDirectory`.
  - That leaks deployment internals that are useful for debugging locally but unnecessary and risky in any shared or deployed environment.
- Recommendation:
  - Keep the health response to service/readiness metadata.
  - Move path-level diagnostics behind logs, a dev-only endpoint, or an authenticated admin surface if they are still needed.

### 2. The documented LAN frontend-to-backend workflow is not aligned with backend CORS defaults
- Files:
  - `backend/src/main/resources/application.yml:28-37`
  - `backend/src/main/java/com/meditation/backend/config/WebConfig.java:17-21`
  - `README.md:451-486`
- Why this matters:
  - The README documents using `VITE_API_BASE_URL=http://<LAN-IP>:<BACKEND-PORT>/api` for device testing.
  - The backend CORS allowlist only includes localhost variants on a few fixed ports, not `http://<LAN-IP>:5173` or other LAN origins.
  - That means the documented direct LAN frontend-to-backend flow will fail with CORS even though the docs present it as supported.
- Recommendation:
  - Make allowed origins configurable for real LAN/dev use.
  - Either document the proxy-only path as the supported default or add LAN-origin guidance that matches the backend config exactly.

### 3. The media API response implies a public file-serving contract that the backend does not actually implement
- Files:
  - `backend/src/main/java/com/meditation/backend/media/MediaAssetService.java:30-39`
  - `backend/src/main/java/com/meditation/backend/config/WebConfig.java:16-21`
  - `backend/src/main/resources/application.yml:38-41`
- Why this matters:
  - The media API returns `filePath` values like `/media/custom-plays/...`, which looks like a usable backend-served asset URL.
  - The backend foundation currently creates storage directories and returns these paths, but it does not add a matching static resource handler or media-serving endpoint.
  - That makes the contract misleading and easy for future frontend work to misuse.
- Recommendation:
  - Either implement backend media serving for the advertised public path, or rename/reshape the contract so it clearly exposes metadata only until serving exists.

### 4. The frontend media boundary falls back too broadly and can hide backend regressions
- Files:
  - `src/utils/mediaAssetApi.ts:115-149`
  - `src/features/customPlays/CustomPlayManager.tsx:37-58`
- Why this matters:
  - The current implementation falls back to built-in sample media for network failures, 404s, malformed payloads, and server-side failures alike.
  - That keeps the UX functional, but it also masks backend 5xx responses and contract drift, making integration problems harder to detect.
  - In practice, preview or local sessions can appear healthy while silently using fallback data instead of the backend.
- Recommendation:
  - Keep the fallback for “backend unavailable” states.
  - Distinguish “server unreachable/not implemented yet” from “backend responded incorrectly.”
  - Surface stronger operator-visible errors for malformed payloads and 5xx responses.

## Nice-to-have improvements

### 1. Keep one Vite config source of truth
- Files:
  - `vite.config.ts:1-32`
  - `vite.config.js:1-29`
- Why this matters:
  - Carrying the same config in both TS and JS increases drift risk during future proxy/build changes.
- Recommendation:
  - Consolidate to one canonical config file and generate any derived artifact intentionally if it is truly required.

### 2. README media workflow guidance still mixes old fixed-catalog instructions with the new backend-aware foundation
- Files:
  - `README.md:584-824`
- Why this matters:
  - Several README sections still describe the media catalog as if `src/utils/mediaAssetApi.ts` were the primary editable source of truth.
  - That was true earlier, but the foundation now prefers backend media metadata with frontend fallback.
- Recommendation:
  - Rewrite the media-management sections after the remediation pass so sample fallback, backend metadata, and future serving/upload work are clearly separated.

### 3. Foundation tests should pin configuration expectations more directly
- Files:
  - `src/utils/apiClient.test.ts:1-58`
  - `src/utils/mediaAssetApi.test.ts:1-97`
  - `backend/src/main/resources/application.yml:1-41`
- Why this matters:
  - The current tests cover the API client and media normalization well, but they do not directly guard the CORS/profile/runtime-configuration assumptions that now matter to the full-stack foundation.
- Recommendation:
  - Add focused tests around backend config behavior, media service contract expectations, and frontend integration failure modes in the remediation/testing slice.
