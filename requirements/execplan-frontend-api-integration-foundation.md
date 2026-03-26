# ExecPlan: Frontend API Integration Foundation

## 1. Objective
Establish the frontend REST integration foundation with a shared typed API client, configurable API-base strategy, backend-aware API boundaries, local-dev proxy support, and graceful fallback/error handling without migrating every feature to live persistence yet.

## 2. Why
The backend foundation now exists, but the frontend still relies on ad hoc local-only API shims. This slice creates the integration layer that future migrations can build on while preserving today’s UX and avoiding a risky all-at-once transport rewrite.

## 3. Scope
Included:
- add a common typed API client layer
- keep a configurable API-base URL strategy
- add local-dev proxy support for the in-repo backend
- refactor API-boundary modules toward typed request/response handling
- switch custom-play media loading to prefer the backend API with graceful fallback
- update docs, tests, decisions, and handoff

Excluded:
- playlist REST migration
- sankalpa REST migration
- custom-play CRUD REST migration
- session-log REST migration
- backend feature expansion beyond current foundation endpoints
- unrelated UI refactors

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/execplan-backend-bootstrap-foundation.md`

## 5. Affected files and modules
- `src/utils/apiConfig.ts`
- `src/utils/apiClient.ts`
- `src/utils/mediaAssetApi.ts`
- `src/utils/playlistApi.ts`
- `src/utils/sankalpaApi.ts`
- `src/features/customPlays/CustomPlayManager.tsx`
- `src/vite-env.d.ts`
- `src/utils/*.test.ts`
- `vite.config.ts`
- `vite.config.js`
- `.env.example`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/execplan-frontend-api-integration-foundation.md`

## 6. UX behavior
- The app should keep working when the backend is unavailable.
- Custom-play media options should prefer backend data when reachable.
- If the backend media API is unavailable, the UI should continue working with built-in sample media options and clear non-blocking guidance.
- Playlist and sankalpa UX should remain unchanged in this slice.

## 7. Data and state model
- Shared API client handles:
  - base URL resolution
  - JSON request/response parsing
  - typed API errors
- Media API boundary becomes local-fallback aware:
  - source: backend
  - source: sample fallback
- Frontend local persistence remains the active source of truth for playlists, sankalpas, custom plays, and session logs.

## 8. Risks
- Swapping transport under active UI flows can create subtle regressions if fallback behavior is not explicit.
- Relative `/api` requests need a reliable local-dev path to the backend or the frontend will silently fail in development.
- Tests need deterministic fetch stubbing and catalog-cache reset behavior.

## 9. Milestones
1. Add shared API client and typed error handling.
2. Add Vite dev proxy and env-based API configuration support.
3. Refactor media API boundary to use live backend fetch with fallback.
4. Keep playlist/sankalpa boundaries stable while aligning them with the new boundary conventions.
5. Update tests, docs, decisions, and handoff.
6. Run frontend and backend verification, including startup/proxy checks.

## 10. Verification
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run dev:backend`
- `npm run dev:frontend`
- verify:
  - `curl -s http://localhost:8080/api/media/custom-plays`
  - `curl -s http://localhost:5173/api/media/custom-plays`

## 11. Decision log
- Keep the first live frontend/backend transport migration bounded to the media API because the backend already exposes that endpoint.
- Preserve sample media data as a fallback instead of breaking the custom-play flow when the backend is unavailable.
- Use Vite dev proxy for same-origin local development when `VITE_API_BASE_URL` is unset.
- Keep playlists and sankalpas local-first until their backend APIs exist.

## 12. Progress log
- 2026-03-26: reviewed current frontend API shims, backend foundation, and dev-server configuration.
- 2026-03-26: implemented the shared API client and dev proxy strategy.
- 2026-03-26: migrated custom-play media loading to prefer the backend API with graceful fallback.
- 2026-03-26: updated README, architecture, decisions, and handoff docs for the new transport behavior.
- 2026-03-26: passed frontend/backend verification and confirmed the frontend proxy path against the live media API.
