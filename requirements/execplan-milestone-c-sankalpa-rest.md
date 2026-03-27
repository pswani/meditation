# ExecPlan: Milestone C Sankalpa REST

## 1. Objective
Add clean backend-backed `sankalpa` support so goals persist in H2, progress is derived from persisted `session log` data, and both Home and Sankalpa screens load the same trustworthy progress state through a dedicated REST boundary.

## 2. Why
`sankalpa` is part of the app's discipline and insight layer. With `session log` history already backed by H2, keeping `sankalpa` goals and progress only in browser storage would make the feature feel less trustworthy and could create inconsistent progress between screens.

## 3. Scope
Included:
- backend `sankalpa` persistence backed by the existing H2 table
- backend progress derivation from persisted `session log` rows
- frontend `sankalpa` API boundary
- frontend migration/fallback flow from local storage to backend-backed state
- shared frontend loading logic for Home and Sankalpa
- calm loading and fallback messaging where needed
- focused frontend and backend tests
- docs, decisions, and session-handoff updates

Excluded:
- sankalpa editing, deletion, or archive management UI
- new summary analytics work beyond the existing summary slice
- unrelated timer, playlist, media, or navigation refactors

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
- `prompts/milestone-c-discipline-insight-fullstack/02-sankalpa-rest.md`

## 5. Affected files and modules
- `backend/src/main/java/com/meditation/backend/sankalpa/*`
- `backend/src/test/java/com/meditation/backend/sankalpa/*`
- `backend/src/main/resources/db/migration/*`
- `backend/src/main/java/com/meditation/backend/sessionlog/SessionLogRepository.java`
- `src/features/sankalpa/*`
- `src/utils/sankalpa.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/sankalpaApi.test.ts`
- `src/utils/home.ts`
- `src/pages/SankalpaPage.tsx`
- `src/pages/SankalpaPage.test.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/HomePage.test.tsx`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- `Sankalpa` creation stays on the existing calm form and keeps the current validations.
- Saving a new `sankalpa` should persist through the backend and then appear immediately in the active/completed/expired sections.
- `Home` and `Sankalpa` should agree on the active progress snapshot because they read the same backend-derived progress data.
- When backend `sankalpa` data is still loading, screens should use lightweight, understandable guidance rather than dense spinners.
- If the backend cannot be reached, the UI may fall back to locally cached `sankalpa` goals so the feature remains usable in prototype mode, but the messaging should stay calm and explicit.

## 7. Data and state model
- Backend owns:
  - `sankalpa` goal persistence
  - progress derivation
  - deadline/status calculation
  - filter matching against persisted `session log` rows
- Frontend owns:
  - form draft and validation
  - request lifecycle state
  - local cache hydration and migration
  - presentation
- `GET /api/sankalpas` should return progress-shaped entries compatible with the frontend `SankalpaProgress` model.
- `PUT /api/sankalpas/{id}` should upsert a goal by id so previously cached local goals can be migrated without id churn.
- The existing schema stores `target_value` as an integer, which conflicts with the current duration-based UI allowing `0.5` minute steps. The backend should adjust persistence so duration-based values remain accurate.

## 8. Risks
- Frontend and backend progress derivation can drift if they do not share the same goal-window assumptions.
- Local cache migration can create duplicates if ids are regenerated instead of preserved.
- The `target_value` numeric type needs careful handling so duration-based goals do not lose precision.
- Home screen loading should avoid feeling empty or flickery while `sankalpa` data hydrates.

## 9. Milestones
1. Define the backend `sankalpa` contract, persistence shape, and any schema migration needed for goal target precision.
2. Implement backend repository, service, controller, and focused test coverage for progress derivation and validation.
3. Add the frontend `sankalpa` API boundary plus a shared load/migrate/save hook.
4. Integrate Home and Sankalpa with backend-backed `sankalpa` progress and calm fallback states.
5. Run verification, update docs, and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`

## 11. Decision log
- Prefer backend-derived progress over frontend-only derivation so Home and Sankalpa reflect the same H2-backed progress rules.
- Keep a local cache and id-preserving migration path so existing prototype `sankalpa` data can move into the backend without forcing users to recreate goals.
- Preserve the current calm form and avoid adding edit/archive UI in this slice.

## 12. Progress log
- Completed: source-doc review and prompt alignment.
- Completed: backend `sankalpa` contract, H2 persistence, and fractional target-value migration.
- Completed: shared frontend `sankalpa` hydration/save hook with backend migration and local fallback handling.
- Completed: Home and Sankalpa integration with backend-backed `sankalpa` progress.
- Completed: focused test coverage for:
  - backend controller behavior
  - frontend API normalization
  - Home snapshot backend hydration
  - shared Home helper selection logic
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 test`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify`
