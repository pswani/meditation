# ExecPlan: Milestone A Core Practice Engine End To End

## 1. Objective
Complete the Milestone A core practice engine flow so Home, Practice, active timer, History, and Settings behave coherently against the new backend-backed timer-settings and `session log` APIs.

## 2. Why
Prompt 01 established the backend contracts and basic integration, but the user-visible core flow still needs polishing around backend hydration, launch-state clarity, and end-to-end confidence. This slice turns the new REST wiring into a calmer, more trustworthy day-to-day experience.

## 3. Scope
Included:
- refine Home, Practice, active timer, History, and Settings around backend-backed timer settings / session logs
- make backend hydration and save states clearer in the core flow
- improve focused tests for:
  - REST-backed settings persistence
  - History rendering from backend data
  - timer completion / ended-early log sync flow
  - Home launch-surface behavior against backend-backed defaults
- run full relevant verification
- update docs, decisions, and session handoff

Excluded:
- playlist REST persistence
- sankalpa REST persistence
- custom-play CRUD REST persistence
- audio playback
- media upload/import workflows
- unrelated UX redesigns outside the core flow

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
- `prompts/milestone-a-core-fullstack/02-timer-history-home-settings-e2e.md`

## 5. Affected files and modules
- `requirements/execplan-milestone-a-core-practice-engine.md`
- `src/pages/HomePage.tsx`
- `src/pages/PracticePage.tsx`
- `src/pages/ActiveTimerPage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/features/timer/TimerContext.tsx`
- `src/App.test.tsx`
- `src/pages/HomePage.test.tsx`
- `src/pages/HistoryPage.test.tsx`
- `src/pages/SettingsPage.test.tsx`
- `README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Home should clearly communicate when timer defaults are still loading from the backend.
- Practice should avoid starting a timer from stale defaults before backend hydration finishes.
- Settings should stay explicit about backend-backed save/load behavior without becoming noisy.
- Timer completion and ended-early feedback should remain calm while staying honest about backend history sync.
- History should continue to communicate backend load/sync state cleanly.

## 7. Data and state model
- Continue using backend-backed timer settings and `session log` data from `TimerContext`.
- Keep active runtime recovery local-only.
- Add minimal UI state on top of the provider’s sync flags rather than introducing a second data layer.
- Prefer stateful frontend integration tests that model the backend through mocked REST endpoints, so screen behavior can be verified end to end without duplicating backend logic in the UI.

## 8. Risks
- Over-correcting for loading could make the core flow feel blocked or heavy.
- Integration tests can become brittle if they assert too much incidental markup instead of the user-visible flow.
- Any changes to start/quick-start gating must not regress existing timer correctness or playlist-run safeguards.

## 9. Milestones
1. Add the ExecPlan and inspect remaining prompt-02 gaps on top of prompt-01 behavior.
2. Refine Home/Practice/Settings UX for backend hydration and save states.
3. Add focused integration tests for backend-backed settings and timer-to-history flow.
4. Run verification, update docs/handoff, and commit.

## 10. Verification
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- manual local setup checks with:
  - `npm run dev:backend`
  - `npm run dev:frontend`

## 11. Decision log
- Keep prompt 02 focused on the core practice engine surfaces already backed by REST, rather than broadening into playlist or sankalpa transport.
- Prefer calm, explicit loading states over silent fallback when backend-backed defaults are still hydrating.
- Use focused stateful mocked-fetch tests to verify frontend/backend flow continuity without adding a new e2e framework in this slice.

## 12. Progress log
- 2026-03-26: reviewed prompt 02 on top of the prompt-01 REST integration slice and identified the main remaining work as backend-hydration UX clarity plus stronger core-flow integration tests.
