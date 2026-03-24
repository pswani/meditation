# ExecPlan: UX Refinement for Home + Settings

## 1. Objective
Implement the critical and important UX improvements from `docs/ux-review-home-settings.md` for `Home`, `Settings`, and their route/shell integration.

## 2. Why
Home and Settings are now functional but still have key clarity and flow issues that reduce trust and focus, especially quick-start failure feedback and settings state confidence. This refinement aims to make both screens feel polished and calm without expanding feature scope.

## 3. Scope
Included:
- Fix quick-start failure guidance visibility through route integration
- Add Home `sankalpa` snapshot
- Reduce duplicated action density in Home
- Add Settings unsaved-edits clarity and save-state affordance
- Improve mobile shortcut row scanability/touch behavior
- Strengthen tests for Home/Settings behavior and route integration

Excluded:
- new backend/cloud behavior
- new major feature areas
- broad shell redesign
- unrelated refactors

## 4. Source documents
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- docs/ux-review-home-settings.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- prompts/13-fix-ux-home-settings-and-test.md

## 5. Affected files and modules
- `src/pages/HomePage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/PracticePage.tsx`
- `src/utils/home.ts`
- `src/utils/home.test.ts`
- `src/pages/HomePage.test.tsx`
- `src/pages/SettingsPage.test.tsx`
- `src/pages/PracticePage.test.tsx`
- `src/index.css`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Home quick-start failure shows clear actionable feedback in Practice entry context.
- Home includes a lightweight active sankalpa snapshot.
- Home avoids redundant route-button clutter from duplicated action groups.
- Settings clearly indicates unsaved changes and disables save when unchanged.
- Favorite shortcut rows remain readable and touch-friendly on narrow screens.

## 7. Data and state model
- Reuse existing local state and persistence.
- Read `sankalpa` snapshot from existing local storage and derive active progress using existing utilities.
- Use route state for one-time Home -> Practice quick-start failure messaging.
- Keep timer settings persistence behavior unchanged.

## 8. Risks
- Route-state message could persist unexpectedly if not cleared after display.
- Sankalpa snapshot could drift if derived from stale local data while route remains mounted.
- Additional UI tests could become brittle if overly tied to copy details.

## 9. Milestones
1. Add route-state based quick-start failure message handoff and display.
2. Add Home sankalpa snapshot and simplify duplicated action density.
3. Add Settings dirty-state UX improvements.
4. Refine mobile shortcut row layout.
5. Add and update focused tests.
6. Verify, update docs, and commit.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

## 11. Decision log
- Prefer route-state message handoff to avoid hidden Home feedback after navigation.
- Keep sankalpa snapshot lightweight and read-only for this slice.
- Use explicit dirty-state affordance in Settings for save confidence.

## 12. Progress log
- Completed: prompt + docs review and implementation planning.
- Completed: route-state quick-start guidance handoff from Home to Practice with one-time banner display.
- Completed: Home sankalpa snapshot with active-goal selection and progress display.
- Completed: Home action-density cleanup by removing redundant Next Actions navigation block.
- Completed: Settings unsaved-edits cue and save-button dirty-state gating.
- Completed: mobile shortcut-row responsiveness improvements for long labels on narrow screens.
- Completed: focused tests added for Home, Settings, and Practice route-state message handling.
- Completed: verification pass (`typecheck`, `lint`, `test`, `build`) succeeded.
