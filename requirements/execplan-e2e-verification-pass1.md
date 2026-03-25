# ExecPlan: End-to-End Verification Pass 1

## 1. Objective
Run a thorough verification pass across the current meditation app, strengthen the highest-value end-to-end user-journey coverage, and fix any issues required for those journeys to pass reliably.

## 2. Why
The app now has most core product slices implemented, so confidence depends less on isolated helpers and more on whether the full flows hold together:
- startup and route navigation
- timer and playlist runs
- logging continuity into History and Sankalpa
- local persistence and recovery behavior

## 3. Scope
Included:
- inspect current implementation and identify the highest-value implemented journeys
- add targeted integration tests for missing end-to-end coverage
- run install, typecheck, lint, test, build, and local startup verification
- verify front-end-only repo shape and explicitly record absent backend/H2 concerns
- update docs/handoff/decisions as needed

Excluded:
- introducing a backend service
- inventing REST/H2/media-path runtime coverage that is not present in this workspace
- large refactors unrelated to failing journeys
- broad Playwright infrastructure unless clearly needed

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/reviews/06-*.md`

## 5. Affected files and modules
- `src/App.test.tsx`
- possible touched page/provider files only if journey failures require fixes
- `README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Major routes should load and connect coherently.
- Timer journey should support validation, start, pause/resume, completion/end-early, and History continuity.
- Playlist journey should support active-run continuity and log completed items correctly.
- Home, Settings, History, Sankalpa, and Practice should continue to work as a coherent local-first app.

## 7. Data and state model
- Verification assumes the current local-first architecture:
  - `localStorage` persistence
  - no backend service present in repo
  - API boundary helpers exist as compatibility seams, not real network integrations
- Media/session metadata remains a fixed local catalog rather than uploaded user media.

## 8. Risks
- Time-based integration tests can become flaky if not controlled with fake timers.
- Full-flow tests may expose assumptions across route state, persistence, and provider updates.
- `npm install` may alter lockfile state or require network access.

## 9. Milestones
1. Inspect current journey coverage and confirm repo shape constraints.
2. Add high-value integration tests for missing full flows.
3. Fix any reliability or behavior issues surfaced by those tests.
4. Run install and verification commands.
5. Verify local startup path and update docs/handoff.

## 10. Verification
- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run dev`
- local HTTP check against the Vite dev server

## 11. Decision log
- Treat backend, H2, and real REST integration checks as not applicable in this workspace unless code inspection reveals an actual service.
- Prefer meaningful App-level integration tests over adding a new e2e framework in this pass.

## 12. Progress log
- Completed: repo-shape inspection confirmed this workspace is front-end only.
- In progress: adding the highest-value journey coverage and running the full verification pass.
