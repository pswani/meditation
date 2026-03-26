# ExecPlan: Backend Bootstrap H2 REST Foundation

## 1. Objective
Bootstrap the minimum clean backend foundation for the meditation app with a checked-in Spring Boot module, H2 configuration, Flyway migrations, media-storage conventions, controller/service/repository layering, and startup/test documentation.

## 2. Why
The repo already has a substantial React product surface, but it cannot evolve into a real full-stack application without a persistent backend foundation. This slice establishes the server, database, schema, and media-storage conventions needed for future frontend REST integration without prematurely migrating every feature.

## 3. Scope
Included:
- add one in-repo Spring Boot backend module
- add Maven build files and application configuration
- add H2 local-development configuration
- add Flyway migrations for core reference/domain tables
- add controller/service/repository layering with:
  - health endpoint
  - seeded custom-play media metadata endpoint
- add local-development CORS configuration
- add backend tests
- update root helper-script defaults so backend commands work with the in-repo module
- update docs and handoff

Excluded:
- full playlist REST implementation
- full sankalpa REST implementation
- full custom-play REST implementation
- frontend fetch/transport rewiring
- media upload/import flows
- audio playback implementation

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
- `requirements/execplan-fullstack-gap-assessment.md`

## 5. Affected files and modules
- `backend/pom.xml`
- `backend/src/main/java/com/meditation/backend/**`
- `backend/src/main/resources/application.yml`
- `backend/src/main/resources/db/migration/**`
- `backend/src/test/**`
- `scripts/common.sh`
- `.env.example`
- `.gitignore`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/execplan-backend-bootstrap-foundation.md`

## 6. UX behavior
- No user-facing frontend route behavior changes in this slice.
- New operator/developer-facing behavior:
  - backend can start locally
  - `/api/health` reports backend readiness
  - `/api/media/custom-plays` exposes seeded media metadata
- Frontend feature flows remain calm and unchanged because they still use local-first persistence for now.

## 7. Data and state model
- H2 becomes the backend persistence foundation.
- Flyway owns schema creation and seed data.
- Initial schema includes core reference/domain tables for:
  - meditation types
  - media assets
  - custom plays
  - playlists
  - playlist items
  - sankalpa goals
  - session logs
- Media files are stored on disk under a configured root with DB-relative paths, not blobs.
- Frontend state remains local-first until later REST migration slices.

## 8. Risks
- Introducing too much domain API surface at once would create integration churn before the frontend is ready.
- Media storage needs a clear convention now to avoid path churn later.
- Backend tooling must work cleanly alongside the existing frontend Node toolchain.
- The sandboxed environment may require repo-local Maven cache usage and escalated verification for dependency download and port binding.

## 9. Milestones
1. Add Spring Boot module and base configuration.
2. Add Flyway schema + seed data for core tables.
3. Add media storage properties, startup directory initialization, and media metadata API.
4. Add backend tests for health, CORS, and seeded media catalog behavior.
5. Update root helper-script defaults, docs, decisions, and handoff.
6. Run backend and frontend verification.

## 10. Verification
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`
- start backend and confirm:
  - `/api/health`
  - `/api/media/custom-plays`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 11. Decision log
- Use one Spring Boot backend module under `backend/` rather than multiple backend services.
- Use Maven for the backend foundation because it is available and reliable in this environment, while the local Gradle installation is not.
- Use Flyway for schema creation and seed data instead of relying on Hibernate schema generation.
- Seed only meditation types and custom-play media metadata in this slice.
- Keep frontend feature data local-first until dedicated REST migration slices are ready.

## 12. Progress log
- 2026-03-25: reviewed required docs and current frontend/backlog context.
- 2026-03-25: confirmed Java 21 and Maven were available; local Gradle was not viable in this environment.
- 2026-03-25: added the backend module, H2/Flyway configuration, media-storage conventions, and foundation endpoints.
- 2026-03-25: updated root backend helper defaults to auto-detect the in-repo backend and use a repo-local Maven cache.
- 2026-03-25: verified backend tests after dependency download outside the sandbox, then continued with docs/handoff updates.
