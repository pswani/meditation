# ExecPlan: Playlist Runtime Audio Verification

## Objective
Verify playlist runtime audio behavior thoroughly enough to separate implementation gaps from remaining correctness bugs before the fix step.

## Why This Matters
This slice now combines timer-style sequencing, linked recording playback, optional gap phases, persistence, and `session log` output. A shallow rerun of the existing suite would miss regressions in the new runtime helper layer.

## Scope
- verify playlist launch setup for timed and linked-recording items
- verify optional small-gap sequencing and derived remaining-time behavior
- verify pause/resume, completion, and early-end behavior through the existing suite
- add focused unit coverage for the new `src/utils/playlistRuntime.ts` helper layer
- rerun frontend and backend verification commands

## Explicit Exclusions
- fixing the review findings in this step
- unrelated refactors to `TimerContext`

## Source Docs Reviewed
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
- `docs/review-playlist-runtime-audio-feature.md`

## Verification Strategy
1. Add focused unit tests for launch-time media resolution, gap transitions, and remaining-time math in `src/utils/playlistRuntime.ts`.
2. Rerun:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
   - `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/`
3. Write a concise report with scenarios covered, observed risks, and the known review findings that remain open for the fix step.

## Risks And Tradeoffs
- The new unit tests intentionally avoid asserting the currently reviewed buggy recovery behavior so the fix step can still tighten that contract cleanly.
- The verification report should distinguish between scenarios covered by automation and findings still based on code inspection.
