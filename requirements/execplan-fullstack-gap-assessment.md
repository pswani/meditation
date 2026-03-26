# ExecPlan: Full-Stack Gap Assessment And Implementation Sequence

## 1. Objective
Assess the current front-end-only repository, confirm the concrete gaps between the existing app and the intended full-stack product, and define a practical implementation sequence for converting it into a React + Spring Boot + H2 application with filesystem-backed media storage.

## 2. Why
The product surface is already substantial in the front end, but the repo still lacks the backend, database, schema, persistence transport, and media-management foundations needed for a fully functioning full-stack application. A clear implementation sequence will reduce churn, preserve current UX behavior, and keep the migration from local-first prototype behavior to real persistence bounded and safe.

## 3. Scope
Included:
- confirm the current repository state and explicit full-stack gaps
- create an ExecPlan for the full-stack conversion path
- document the chosen target architecture:
  - React front end
  - Java/Spring Boot backend
  - H2 database
  - media files stored on disk with DB-referenced paths
  - REST integration between front end and backend
- update planning docs minimally so the repo truth and next steps are accurate
- run current verification commands for the existing workspace

Excluded:
- implementing the backend in this slice
- adding real REST transport in the front end
- adding H2 schema or migrations in code
- changing product UX or route behavior
- broad repo restructuring

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
- `src/utils/apiConfig.ts`
- `src/utils/playlistApi.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/mediaAssetApi.ts`

## 5. Affected files and modules
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `requirements/execplan-fullstack-gap-assessment.md`

## 6. UX behavior
- No user-facing app behavior changes are expected in this slice.
- The planning outcome should preserve the current calm, multi-device React experience while defining a migration path that does not force route redesigns.
- The eventual full-stack migration should keep current user journeys intact:
  - timer practice
  - custom plays
  - playlists
  - history/manual log
  - summaries
  - sankalpa

## 7. Data and state model
- Current state:
  - front end owns runtime orchestration and local persistence
  - `playlistApi` and `sankalpaApi` persist to `localStorage`
  - `mediaAssetApi` returns a fixed in-memory media catalog
- Target state:
  - Spring Boot owns persistent records and media metadata
  - H2 stores relational data for:
    - playlists
    - playlist items
    - sankalpas
    - custom plays
    - media assets
    - optional future session-log persistence
  - media files live under a configured filesystem root
  - database rows reference media by stable ID plus relative filesystem path metadata
  - front end consumes REST endpoints through the existing API-boundary utilities, replacing local shim implementations incrementally

## 8. Risks
- Migrating directly from local-first state to real persistence could create behavior regressions if done across too many domains at once.
- Session logging and timer runtime correctness are trust-critical and should not be destabilized by early backend work.
- Media handling introduces two persistence layers:
  - database metadata
  - filesystem storage
  Both need clear ownership and cleanup rules.
- H2 is suitable for local development and small deployments, but schema design and migration discipline still matter to avoid rework.

## 9. Milestones
1. Confirm current-state gaps and define target architecture.
2. Add a Spring Boot backend foundation with:
   - Gradle build
   - application entrypoint
   - H2 datasource configuration
   - media-root configuration
   - health endpoint
3. Add backend persistence foundation:
   - schema migration strategy
   - initial entities/repositories for media assets, custom plays, playlists, and sankalpas
4. Replace one front-end local API seam at a time with real REST transport:
   - media asset catalog first
   - playlists second
   - sankalpas third
5. Add media file-management flows:
   - scan/bootstrap configured media root
   - persist metadata rows
   - expose list/read APIs
6. Add coordinated local run/build workflow for frontend + backend with truthful docs and verification.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- manual review that the updated docs match the current repo state and the proposed full-stack sequence

## 11. Decision log
- Keep this slice planning-only; do not scaffold a partial backend without an implementation-ready next slice.
- Choose one Spring Boot backend module as the primary backend entrypoint instead of splitting into multiple Java services at the start.
- Keep H2 as the first full-stack persistence target for local-first development and bounded deployment complexity.
- Keep media files on disk under a configured root and store relative file paths plus metadata in the database.
- Reuse the current front-end API-boundary utilities as the seam for incremental REST migration instead of rewriting feature screens first.

## 12. Progress log
- 2026-03-25: reviewed required planning/product/architecture docs.
- 2026-03-25: confirmed the repo still contains no backend module, Gradle build, H2 configuration, schema, or live HTTP transport.
- 2026-03-25: confirmed `playlistApi`, `sankalpaApi`, and `mediaAssetApi` are still local shim layers behind REST-shaped paths.
- 2026-03-25: documented the target full-stack architecture and ordered implementation sequence.
