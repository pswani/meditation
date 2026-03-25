# ExecPlan: Accessibility And Responsive Polish

## 1. Objective
Improve accessibility, keyboard usability, semantics, and breakpoint behavior across the meditation app while preserving the current calm, minimal product structure.

## 2. Why
Production-readiness depends on more than correctness. The app now has real user journeys, but several shared UX details still make it harder to use confidently:
- weak or absent focus visibility
- limited keyboard/state affordances for collapsible controls
- dense layouts that do not fully use tablet/desktop space
- mobile text/action groupings that can feel cramped in information-heavy screens

This pass should make the app easier to navigate, scan, and trust without changing the underlying flows.

## 3. Scope
Included:
- shared shell accessibility improvements
- focus-visible styling for interactive elements
- improved semantics and state signaling for collapsible/toggle controls
- responsive spacing/density updates for shell and key route-level screens
- focused tests for the highest-signal accessibility/responsive behaviors

Excluded:
- major information architecture changes
- new routes or new product features
- backend integration
- broad visual redesign outside the current calm design language

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
- `prompts/milestone-d-production-readiness/02-accessibility-responsive-polish.md`
- `/.agents/skills/ux-designer/SKILL.md`

## 5. Affected files and modules
- `src/index.css`
- `src/app/AppShell.tsx`
- `src/pages/PracticePage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/pages/SankalpaPage.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/features/customPlays/CustomPlayManager.tsx`
- `src/features/playlists/PlaylistManager.tsx`
- touched route/app tests as needed
- docs/handoff files

## 6. UX behavior
- Keyboard users should be able to:
  - see clear focus on links, buttons, inputs, selects, summaries
  - skip directly to main content from the shell
  - understand whether collapsible sections are expanded or collapsed
- Dense sections should read more clearly:
  - top-bar banners should stack cleanly on phones and align more intentionally on larger screens
  - history, summary, and favorites sections should gain breathing room on tablet/desktop
  - playlist and custom-play action groups should wrap cleanly without crowding
- Mobile readability should improve through better spacing, line lengths, and action stacking without changing destination structure.

## 7. Data and state model
- No domain model changes are expected.
- State changes are limited to presentation affordances such as:
  - IDs/ARIA attributes for toggled sections
  - optional focus/skip-link behavior in shared layout

## 8. Risks
- CSS changes can unintentionally regress established layouts on untouched screens.
- Accessibility tweaks around collapsible controls can break existing tests if selectors rely on copy alone.
- Responsive refinements can accidentally make desktop feel too dashboard-like if spacing gets too dense.

## 9. Milestones
1. Define the polish slice and identify shared friction points.
2. Improve shared shell semantics and focus behavior.
3. Improve route-level semantics and responsive layout in dense screens.
4. Add focused tests for skip-link/toggle semantics and key responsive-affordance behavior.
5. Run verification and update decisions/handoff.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual sanity through code review of focus states, collapse semantics, and breakpoint rules

## 11. Decision log
- Favor small, high-signal accessibility wins over introducing new abstractions.
- Keep responsive polish within the existing visual system rather than redesigning the app shell.

## 12. Progress log
- 2026-03-24: Reviewed prompt, required docs, and `ux-designer` skill.
- 2026-03-24: Audited shared CSS and key route-level screens for focus, semantics, and layout density issues.
- 2026-03-24: Began implementation planning.
- 2026-03-24: Added shared focus-visible treatment, skip link, collapsible section semantics, and responsive layout refinements.
- 2026-03-24: Added focused tests for skip-link presence and expanded/invalid control semantics.
- 2026-03-24: Verified with `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
