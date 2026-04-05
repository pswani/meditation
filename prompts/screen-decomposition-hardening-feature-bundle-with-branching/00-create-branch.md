Read before doing anything else:
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

Task:
- Create a dedicated feature branch for the remaining screen and manager decomposition phase.
- Default branch name: `codex/screen-decomposition-hardening-feature-bundle-with-branching`

Scope for this bundle:
- decompose the remaining oversized frontend screens and managers that still need cleanup after the earlier phases
- prioritize:
  - `src/pages/SankalpaPage.tsx`
  - `src/features/customPlays/CustomPlayManager.tsx`
  - `src/features/playlists/PlaylistManager.tsx`
  - `src/pages/PracticePage.tsx`
  - `src/pages/SettingsPage.tsx`
  - `src/pages/HomePage.tsx`
  - `src/app/AppShell.tsx`
- extract smaller components, hooks, and pure helpers while preserving current UX and behavior

Explicitly out of scope:
- backend query redesign
- Vite or verification-workflow cleanup already covered by earlier phases
- media asset ownership or cache-version work
- broad design refresh or navigation redesign
- forcing churn in modules already cleaned up adequately by earlier phases

Branching instructions:
1. Confirm the current branch is a safe parent for this bounded slice.
2. Prefer branching after the earlier phases are merged, especially the runtime-boundary bundle.
3. Create and switch to `codex/screen-decomposition-hardening-feature-bundle-with-branching`.
4. Do not change production code in this step.

Output expectations:
- Report the parent branch used.
- Report the created branch name.
- Stop after branch creation so the next prompt can drive implementation.

