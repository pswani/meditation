# ExecPlan: Milestone C Summaries REST

## 1. Objective
Add clean backend-backed summary support for the `Sankalpa` screen so summary views can load from H2-backed `session log` data through a dedicated REST boundary.

## 2. Why
Summaries are part of the app's insight layer. Now that `session log` history already persists in the backend, summary derivation should also have a trustworthy backend path instead of depending only on browser-side aggregation.

## 3. Scope
Included:
- backend summary endpoint backed by `session log` rows
- optional date-range filtering on `endedAt`
- summary aggregation for:
  - overall
  - by meditation type
  - by source
  - by time-of-day bucket
- frontend summary API boundary
- `Sankalpa` page integration with calm loading/error handling
- local derived summary fallback when the backend is temporarily unavailable
- focused frontend and backend tests
- docs, decisions, and handoff updates

Excluded:
- sankalpa CRUD backend persistence
- chart-heavy analytics or dashboard redesign
- unrelated timer, playlist, or media refactors

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
- `prompts/milestone-c-discipline-insight-fullstack/01-summaries-rest.md`

## 5. Affected files and modules
- `backend/src/main/java/com/meditation/backend/summary/*`
- `backend/src/test/java/com/meditation/backend/summary/*`
- `src/utils/summary.ts`
- `src/utils/summaryApi.ts`
- `src/utils/summaryApi.test.ts`
- `src/pages/SankalpaPage.tsx`
- `src/pages/SankalpaPage.test.tsx`
- `README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Summary range selection stays on the `Sankalpa` screen.
- Summary cards and grouped sections keep the existing calm, readable layout.
- While a summary request is in flight, the summary panel shows lightweight loading guidance.
- If the backend summary request fails, the page falls back to local derived summaries from hydrated `session log` data and shows a calm warning explaining that the local view is being used.
- Invalid custom ranges still stop summary rendering until the user fixes the dates.

## 7. Data and state model
- Backend owns aggregate summary derivation from persisted `session log` rows.
- Frontend owns:
  - summary range selection
  - request lifecycle state
  - presentation
  - local fallback derivation
- Summary endpoint accepts optional inclusive `startAt` and `endAt` ISO timestamps keyed to `session log` `endedAt`.
- Backend time-of-day bucket derivation uses the local runtime zone as the current single-user local-development assumption.

## 8. Risks
- Local timezone bucket derivation can be surprising if backend runtime timezone differs from the browser timezone.
- Loading summary data separately from `session log` hydration can create flicker if the page does not preserve prior data during range changes.
- Returning the wrong shape order could cause noisy UI regressions in grouped summary sections.

## 9. Milestones
1. Define the summary API contract and add backend aggregate/service/controller support.
2. Add focused backend controller and service coverage for range filtering and bucket aggregation.
3. Add the frontend summary API utility and integrate the `Sankalpa` page with loading/fallback behavior.
4. Update focused frontend tests for backend-backed summary states.
5. Run verification, update docs, and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`

## 11. Decision log
- Use a dedicated summary aggregate endpoint instead of asking the frontend to keep deriving all summaries from hydrated `session log` arrays now that history already persists in H2.
- Keep date-range input handling in the frontend so the page can preserve its current calm validation UX.
- Keep a local derived fallback from hydrated `session log` data so summary insight remains available during temporary backend issues.

## 12. Progress log
- Completed: source-doc review and prompt alignment.
- Completed: backend summary aggregate package and `/api/summaries` route.
- Completed: frontend summary API boundary and `Sankalpa` summary integration with local fallback messaging.
- Completed: focused tests for:
  - backend summary controller coverage
  - frontend summary API normalization
  - `Sankalpa` summary backend success and fallback states
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `mvn -Dmaven.repo.local=../local-data/m2 test`
  - `mvn -Dmaven.repo.local=../local-data/m2 verify`
