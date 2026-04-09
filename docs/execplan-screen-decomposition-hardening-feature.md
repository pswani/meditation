## Objective

Reduce the size and maintenance risk of the remaining oversized frontend screens and manager modules without changing the product experience.

## Why This Change Matters

- The current route files and manager modules mix state orchestration, pure helper logic, and large JSX trees.
- Smaller modules will make behavior safer to review, easier to test, and easier to extend in later production-hardening work.

## Scope

- Decompose the remaining oversized frontend screens and managers:
  - `src/pages/SankalpaPage.tsx`
  - `src/features/customPlays/CustomPlayManager.tsx`
  - `src/features/playlists/PlaylistManager.tsx`
  - `src/pages/PracticePage.tsx`
  - `src/pages/SettingsPage.tsx`
  - `src/pages/HomePage.tsx`
  - `src/app/AppShell.tsx`
- Extract smaller components, hooks, and pure helpers where that improves readability and testability.
- Preserve current UX, routing, data flow, validation, and messaging.

## Explicit Exclusions

- Backend query or API redesign
- Vite or workflow cleanup handled by earlier bundles
- Media ownership or cache-version work handled by earlier bundles
- Broad UX redesign or navigation changes
- Refactors outside the touched screen and manager boundaries

## Source Docs Reviewed

- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/intent.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/production-grade-hardening-phased-plan.md`

## Affected Modules

- Existing screens and managers listed in scope
- New feature-local helper, hook, and presentational modules introduced during decomposition
- Tests for touched screens and managers
- Durable docs:
  - `docs/architecture.md`
  - `requirements/decisions.md`
  - `requirements/session-handoff.md`
  - review and test artifacts for this bundle

## UX Behavior And Validations

- Preserve calm, responsive behavior across phone, tablet, and desktop.
- Keep timer, sankalpa, custom play, playlist, Home, Settings, and shell messaging behavior unchanged.
- Preserve existing validation message timing and wording wherever practical.
- Keep management-heavy tools collapsed behind progressive disclosure on Practice.

## Data / State Model

- Keep `useTimer()` as the primary state boundary for timer, custom play, playlist, and settings flows.
- Keep `useSankalpaProgress()` and `useSyncStatus()` as the existing sync boundaries.
- Favor page-local hooks for derived state and effects over widening provider responsibilities.

## Risks And Tradeoffs

- Extracting JSX can accidentally change `aria-*`, labels, or button text that tests rely on.
- Moving effects into hooks can change dependency behavior if not kept identical.
- Too much abstraction would only shuffle code, so extractions should be small and named by responsibility.

## Milestones

1. Create the ExecPlan and map the remaining hotspots.
2. Decompose Sankalpa, Custom Plays, and Playlists into smaller modules.
3. Decompose Practice, Settings, Home, and AppShell into smaller modules.
4. Run required verification and fix any issues.
5. Write review and test artifacts, update durable docs, and merge the slice.

## Verification Plan

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Focused local smoke validation through the existing UI tests and, if practical, local route checks

## Decision Log

- Keep extractions feature-local first; move code into `src/components` only if it is genuinely reusable.
- Prefer pure helper modules and page-local hooks over introducing new shared state layers.
- Preserve current copy and UX semantics unless a test or clarity issue forces a narrowly scoped correction.

## Progress Log

- 2026-04-08: Reviewed bundle prompts and confirmed `codex/cleanup` as the safe parent branch.
- 2026-04-08: Created feature branch `codex/screen-decomposition-hardening-feature-bundle-with-branching`.
- 2026-04-08: Reconfirmed the remaining hotspots are still oversized in the current repo state and need decomposition.
- 2026-04-08: Split `SankalpaPage`, `CustomPlayManager`, `PlaylistManager`, `PracticePage`, `SettingsPage`, `HomePage`, and `AppShell` into smaller feature-local helpers, hooks, and presentational modules while keeping the route boundaries stable.
- 2026-04-08: Verified the final branch state with `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`, plus a local `npx vite` route smoke for `/`, `/practice`, `/goals`, and `/settings`.
