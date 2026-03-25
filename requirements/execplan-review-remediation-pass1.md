# ExecPlan: Review Remediation Pass 1

## 1. Objective
Address the highest-priority review findings in one bounded slice by fixing trust-critical session-log retention, reducing active-session persistence churn, tightening a small API/UX consistency seam around sankalpa, and cleaning up the clearest repo-hygiene drift.

## 2. Why
These issues affect product trust more than polish:
- session logs must remain complete for history, summary, and sankalpa accuracy
- active timer and playlist persistence should not write to storage on every tick
- sankalpa copy should feel human-facing rather than internal
- repo docs/config should describe the workspace we actually have today

## 3. Scope
Included:
- remove session-log truncation from shared timer state updates
- stop per-tick persistence writes for active timer and active playlist run state while preserving recovery behavior
- route Home sankalpa reads through the sankalpa API boundary
- replace raw sankalpa goal-type labels with human-readable UI copy
- update stale prompt and architecture docs
- remove clearly unused/generated repo artifacts if not needed
- add focused tests for changed behavior

Excluded:
- actual sound playback implementation
- large timer-context refactors or context-splitting
- playlist gap feature work
- accessibility dialog rework
- custom-play media-model redesign

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `docs/review-usability-full-app.md`
- `docs/review-code-quality.md`
- `docs/review-performance.md`
- `docs/review-hygiene.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/reviews/05-remediate-review-findings.md`

## 5. Affected files and modules
- `src/features/timer/timerReducer.ts`
- `src/features/timer/TimerContext.tsx`
- `src/features/timer/timerReducer.test.ts`
- `src/pages/HomePage.tsx`
- `src/pages/HomePage.test.tsx`
- `src/pages/SankalpaPage.tsx`
- `src/utils/sankalpa.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/sankalpaApi.test.ts`
- `prompts/README.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- possible file removals:
  - `src/components/PlaceholderScreen.tsx`
  - `vite.config.js`
  - `vite.config.d.ts`

## 6. UX behavior
- Session history, summaries, and sankalpa should continue to reflect the full local session-log set.
- Timer and playlist recovery should still work after reloads, including paused-state recovery.
- Sankalpa UI should show human-readable goal-type language:
  - `Duration goal`
  - `Session-count goal`
- Home sankalpa snapshot should avoid raw enum wording.
- Repo docs should match the front-end-only workspace and implemented routes.

## 7. Data and state model
- `sessionLogs` remains a recency-sorted array, but no longer drops older valid entries.
- Active timer persistence continues storing the same recoverable shape; write frequency is reduced by only persisting when recovery-relevant fields change.
- Active playlist persistence follows the same rule: persist on run start, pause/resume, item transitions, and run end, not every countdown tick.
- Sankalpa persistence remains local-first behind the existing API-boundary utility.

## 8. Risks
- Persistence effect dependency narrowing must still capture paused-state remaining time correctly.
- Removing session-log truncation could expose latent assumptions in tests or summary views.
- Deleting duplicate config files must not break the build toolchain.
- Sankalpa label cleanup must preserve stored enum values and validation behavior.

## 9. Milestones
1. Remove session-log truncation and cover it with reducer tests.
2. Reduce active timer/playlist persistence churn and add focused provider tests.
3. Tighten sankalpa boundary/copy consistency in Home and Sankalpa screens.
4. Apply hygiene cleanup to docs and stale artifacts.
5. Run verification and update decisions/handoff.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual reasoning checks:
  - timer recovery still uses `endAtMs`
  - paused timer/run snapshots still persist updated remaining time
  - sankalpa UI shows friendly labels without changing stored values

## 11. Decision log
- Keep audio playback deferred in this slice because the current reviews also identify deeper engine and hygiene work that can be fixed cleanly without broadening into media runtime behavior.
- Prefer targeted dependency/persistence fixes over a large `TimerContext` split so the slice remains review-driven and verifiable in one pass.

## 12. Progress log
- Completed: consolidated review findings into one bounded remediation slice.
- In progress: implementing engine, sankalpa, and hygiene fixes with focused tests.
