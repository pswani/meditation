# ExecPlan: Sankalpa Delete And Unarchive

## 1. Objective
Complete the remaining `sankalpa` lifecycle by adding delete and unarchive flows across the Goals screen, local-first sync behavior, and backend persistence.

## 2. Why
The app already supports create, edit, and archive for `sankalpa`, but the lifecycle still stops short of two important actions:

- intentionally removing an archived goal when the user no longer wants it
- restoring an archived goal when it should return to the live product surface

Finishing those actions closes the main `sankalpa` lifecycle gap called out in the current handoff docs.

## 3. Scope
Included:
- add archived-only permanent delete with explicit confirmation
- add unarchive from the archived section
- restore unarchived goals by existing derived rules:
  - `active` if still within the goal window and incomplete
  - `completed` if target is already met
  - `expired` if the goal window has already passed without completion
- extend local-first queue replay so queued deletes do not resurrect stale local state on refresh
- add backend delete handling and stale-delete protection for `sankalpa`
- focused frontend/backend tests and durable doc updates

Excluded:
- unrelated `sankalpa` redesigns
- non-archived permanent delete affordances
- new dashboard-style controls or broader Goals screen refactors

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/run-milestone-bundle.md`
- `prompts/sankalpa-delete-unarchive-feature-bundle/*.md`

## 5. Affected files and modules
- `src/pages/SankalpaPage.tsx`
- `src/pages/SankalpaPage.test.tsx`
- `src/features/sankalpa/useSankalpaProgress.ts`
- `src/features/sankalpa/useSankalpaProgress.test.ts`
- `src/utils/sankalpa.ts`
- `src/utils/sankalpa.test.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/sankalpaApi.test.ts`
- `backend/src/main/java/com/meditation/backend/sankalpa/*`
- `backend/src/test/java/com/meditation/backend/sankalpa/SankalpaControllerTest.java`
- `backend/src/main/resources/db/migration/*`
- durable docs under `docs/ux-spec.md`, `requirements/decisions.md`, and `requirements/session-handoff.md`

## 6. UX behavior
- Active, completed, and expired sections keep their current archive action.
- Archived goals gain:
  - `Unarchive`
  - `Delete`
- Delete requires calm confirmation and is only available for archived goals.
- Unarchive does not need destructive confirmation; the restored status is shown by the section it moves into.
- Controls stay touch-friendly and low-noise across phone, tablet, and desktop.

## 7. Data and state model
- Unarchive is modeled as persisting the same `sankalpa` with `archived: false`.
- Delete is modeled as a queue-backed `delete` mutation for `sankalpa`.
- Backend adds `updatedAt` tracking for stale mutation protection on `sankalpa` writes and deletes.
- Frontend hydration overlays queued `delete` mutations so archived goals removed locally do not reappear from a stale backend list before replay finishes.

## 8. Risks
- Delete could be too destructive if shown on live goals, so it should stay archived-only.
- Queue replay must not resurrect deleted archived goals from a stale backend read.
- Unarchive must not invent a custom restoration status; it should reuse the current derived progress rules.
- Backend stale-mutation support must stay narrowly scoped and not broaden into unrelated `sankalpa` refactors.

## 9. Milestones
1. Add `sankalpa` delete/unarchive domain helpers and queue overlay rules.
2. Update Goals-screen actions, confirmation states, and user feedback.
3. Add backend delete endpoint plus stale-mutation protection.
4. Add focused frontend/backend tests.
5. Update docs, review, and verification artifacts.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`

## 11. Decision log
- Permanent delete will be archived-only.
- Unarchive will reuse existing derived status rules instead of adding a new restoration state.
- `sankalpa` will adopt stale-delete protection so queued offline delete behavior matches the safety level already used by custom plays and playlists.

## 12. Progress log
- 2026-04-03: Reviewed the bundle prompts, current Goals screen, `sankalpa` helpers, queue replay logic, and backend service/controller structure. Branch `feat/sankalpa-delete-unarchive` created from `pending-wrk` at `66e56c7`.
