# ExecPlan: Foundation Remediation And Testing

## 1. Objective
Implement the critical and important findings from the foundation review by hardening backend runtime defaults, aligning CORS and LAN documentation, making the media path contract truthful, narrowing frontend fallback behavior, and strengthening foundation tests.

## 2. Why
The foundation works, but a few trust and hygiene gaps remain:
- the default backend runtime exposes developer-only surfaces too broadly
- the health payload leaks internals
- the documented LAN flow is not aligned with backend CORS behavior
- the backend advertises media paths it does not yet serve
- the frontend fallback can hide backend regressions

Fixing these now keeps the foundation safe and predictable before broader API migrations begin.

## 3. Scope
Included:
- move the H2 console behind a dev-only profile or equivalent local-only runtime behavior
- remove filesystem-path leakage from `/api/health`
- align backend CORS behavior with the documented local/LAN workflow
- make `/media/...` backend media paths actually resolvable
- narrow frontend media fallback behavior so backend regressions are more visible
- strengthen tests for:
  - backend startup/config
  - API client boundary
  - schema/repository/service/controller-level foundation behavior
- update docs, decisions, and session handoff

Excluded:
- playlist REST implementation
- sankalpa REST implementation
- custom-play CRUD REST implementation
- session-log REST implementation
- media upload/import workflows
- unrelated UI refactors outside the custom-play media integration surface

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/architecture.md`
- `docs/product-requirements.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `docs/review-foundation-fullstack.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 5. Affected files and modules
- `requirements/execplan-foundation-remediation-and-testing.md`
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/application-dev.yml`
- `backend/src/main/java/com/meditation/backend/config/CorsProperties.java`
- `backend/src/main/java/com/meditation/backend/config/WebConfig.java`
- `backend/src/main/java/com/meditation/backend/config/MediaStorageProperties.java`
- `backend/src/main/java/com/meditation/backend/health/ApiHealthResponse.java`
- `backend/src/main/java/com/meditation/backend/health/ApiHealthService.java`
- `backend/src/test/java/com/meditation/backend/**`
- `backend/src/test/resources/application-test.yml`
- `scripts/common.sh`
- `src/utils/apiClient.ts`
- `src/utils/apiClient.test.ts`
- `src/utils/mediaAssetApi.ts`
- `src/utils/mediaAssetApi.test.ts`
- `src/features/customPlays/CustomPlayManager.tsx`
- `src/features/customPlays/CustomPlayManager.test.tsx`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Local development should still be simple:
  - `npm run dev:backend` should keep the local-only developer conveniences it needs
  - frontend media integration should still work against the backend and still remain usable when the backend is down
- If the backend is unavailable or the media endpoint is not present, the custom-play media picker may use fallback sample media with calm guidance.
- If the backend responds incorrectly or returns server errors, the UI should make that problem more explicit instead of silently looking healthy.
- The health endpoint should remain useful for readiness checks without exposing local file paths.

## 7. Data and state model
- Backend runtime config:
  - default profile should avoid exposing the H2 console
  - dev profile can enable developer-only conveniences
  - CORS should support documented local/LAN development flows
- Media contract:
  - backend `/api/media/custom-plays` continues returning media metadata
  - `/media/**` should resolve through the backend if the API advertises those public paths
- Frontend media boundary:
  - keep fallback sample assets
  - classify failures into:
    - backend unavailable / not implemented
    - backend error / invalid contract
  - surface stronger UI messaging for contract/server failures

## 8. Risks
- Spring profile changes can accidentally break the local dev workflow if the backend helper does not activate the right profile.
- Resource handler changes can create path mistakes or broken URLs if the public prefix and storage root are not normalized correctly.
- Narrowing fallback behavior must not make the custom-play flow unusable when the backend is simply offline.
- Test coverage needs to stay deterministic despite filesystem-backed media roots and profile-specific config.

## 9. Milestones
1. Add the ExecPlan and inspect current backend/frontend config boundaries.
2. Harden backend runtime defaults and align local/dev profile behavior.
3. Implement truthful backend media serving for advertised `/media/...` paths.
4. Narrow frontend media fallback classification and messaging.
5. Strengthen backend and frontend foundation tests.
6. Update docs, decisions, and session handoff.
7. Run verification and commit.

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
  - `curl -s http://localhost:8080/api/health`
  - `curl -s http://localhost:8080/api/media/custom-plays`
  - `curl -i -s http://localhost:8080/media/custom-plays/vipassana-sit-20.mp3`
  - `curl -s http://localhost:5173/api/media/custom-plays` or the actual Vite port used in-session

## 11. Decision log
- Prefer a dev-only backend profile over leaving the H2 console exposed in the default runtime.
- Implement backend media serving instead of weakening the media response contract because the API already advertises public file paths.
- Keep fallback sample media, but separate availability failures from backend-regression failures.
- Keep the remediation slice focused on the foundation layer only; do not expand into broader feature REST migrations.

## 12. Progress log
- 2026-03-26: reviewed the foundation remediation prompt, review findings, backend scripts, and current tests.
- 2026-03-26: hardened the backend runtime defaults, health payload, CORS behavior, and `/media/**` serving contract.
- 2026-03-26: narrowed frontend media fallback classification and surfaced clearer integration warnings.
- 2026-03-26: strengthened backend and frontend foundation tests and passed the full verification suite.
