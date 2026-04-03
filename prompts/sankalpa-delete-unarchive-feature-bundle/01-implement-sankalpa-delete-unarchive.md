# 01-implement-sankalpa-delete-unarchive.md

## Objective
Complete the remaining `sankalpa` lifecycle by adding delete and unarchive flows as one bounded vertical slice.

## In-scope user journeys
1. Delete an existing `sankalpa` intentionally.
2. Restore an archived `sankalpa` back to the active product surface when it still makes sense to keep it.
3. Keep frontend, local cache, and backend behavior aligned for those state changes.

## Required implementation outcomes
1. **Delete flow**
   - Add an explicit delete action with calm confirmation copy.
   - Define which `sankalpa` states can be deleted.
   - Keep accidental destructive actions hard to trigger.

2. **Unarchive flow**
   - Add an unarchive action in the archived section.
   - Define the restored state clearly:
     - active if still within the goal window
     - otherwise expired or completed if existing rules require it
   - Keep terminology consistent with current `sankalpa` state labels.

3. **Persistence alignment**
   - Update local-first queue-backed frontend behavior.
   - Update backend persistence and API handling if required.
   - Keep `id` stability and progress semantics trustworthy.

4. **Responsive UX**
   - Ensure delete and unarchive actions remain clear on phone, tablet, and desktop.
   - Avoid noisy controls or dashboard-like clutter.

## Architecture constraints
- Use an ExecPlan before implementation because this changes state and persistence behavior.
- Keep business logic out of large JSX trees.
- Reuse domain helpers for `sankalpa` state transitions where practical.
- Avoid unrelated refactors.

## Validation integrity
Do not break existing `sankalpa` rules:
- goal must be duration-based or session-count-based
- days must be greater than 0
- optional filters stay intact
- completed duration counting stays proportional where applicable
- manual logs continue to count unless existing requirements say otherwise

## Tests required
Add/update focused tests for:
- delete confirmation and allowed states
- unarchive state restoration rules
- frontend persistence/local cache behavior
- backend/API behavior if backend contracts change

Run:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/` if backend code changes

## Documentation updates required
- update `docs/ux-spec.md` if the user-facing flow changes materially
- update `requirements/decisions.md`
- update `requirements/session-handoff.md`
- add/update review and verification artifacts under `docs/`

## Commit guidance
Suggested commit message:
- `feat(sankalpa): add delete and unarchive flows`
