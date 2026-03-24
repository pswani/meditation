# ExecPlan: Playlists Implementation (Pass 3)

## 1. Objective
Complete the playlist implementation slice requested by prompt 07 and ensure playlist persistence uses a clean REST-style integration boundary within this front-end-only workspace.

## 2. Why
Playlists are a core composition flow for longer, structured meditation sessions. A stable playlist model, run logging behavior, and clear persistence contracts are essential for trust and future backend integration.

## 3. Scope
Included:
- verify existing playlist create/edit/delete/reorder/favorite/run/history behavior
- add REST-style playlist persistence boundary utility and integrate it in state persistence flow
- strengthen playlist load validation/normalization at persistence boundary
- add focused tests for playlist contract boundaries and persistence filtering

Excluded:
- backend service implementation
- network transport implementation
- major playlist UX redesign beyond bounded scope

## 4. Source documents
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- prompts/milestone-b-practice-composition/07-implement-playlists.md

## 5. Affected files and modules
- `src/utils/playlistApi.ts` (new)
- `src/utils/playlistApi.test.ts` (new)
- `src/features/timer/TimerContext.tsx`
- `src/utils/storage.ts`
- `src/utils/storage.test.ts`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Playlist management and run flow remain unchanged for users:
  - create/edit/delete
  - reorder
  - favorite
  - run flow
  - history integration with playlist metadata
- Persistence is routed through an explicit playlist API boundary contract.

## 7. Data and state model
- Add API-boundary constants and functions for playlists:
  - list endpoint
  - detail endpoint derivation
  - list/save operations
- Validate loaded playlist entries to drop malformed records and preserve valid ones.
- Keep local-first behavior as fallback datastore in this front-end workspace.

## 8. Risks
- Stricter playlist loading may drop malformed persisted entries.
- API-boundary layer must stay lightweight to avoid disrupting current local-first behavior.

## 9. Milestones
1. Add ExecPlan.
2. Add playlist REST-boundary utility and tests.
3. Integrate playlist persistence calls through API boundary.
4. Tighten playlist persistence loading validation.
5. Run verification commands.
6. Update decisions and session-handoff docs.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual checks:
  - create/edit/delete/reorder/favorite playlist behavior
  - run playlist and confirm history playlist metadata

## 11. Decision log
- Use local-first storage as backing persistence but expose explicit REST-style playlist contract boundaries for future backend alignment.
- Prefer filtering malformed playlist records during load over accepting invalid data into runtime state.

## 12. Progress log
- Completed: prompt and source-doc review.
- Completed: added playlist REST-style API boundary utility and contract tests.
- Completed: integrated playlist persistence writes through API boundary in timer context.
- Completed: tightened playlist load normalization and malformed-record filtering in storage.
- Completed: added focused persistence/contract boundary tests.
- Completed: verification commands:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Completed: updated decisions and session handoff docs.
