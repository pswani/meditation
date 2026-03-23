# ExecPlan: Responsive App Shell and Route Placeholders

## 1. Objective
Implement a responsive app shell with route-level placeholder screens and breakpoint-adaptive navigation, and rename the Goals navigation label to Sankalpa.

## 2. Why
This delivers the V1 foundation from the roadmap and enables consistent, calm navigation across mobile, tablet, and desktop while preserving product terminology.

## 3. Scope
Included:
- responsive shell structure
- shared navigation configuration
- route-level placeholder screens
- responsive navigation behavior for mobile and tablet/desktop
- rename Goals label to Sankalpa
- update decisions and session handoff docs

Excluded:
- timer business logic
- logging, playlists, custom plays, or settings behavior implementation
- persistence and data model changes

## 4. Source documents
- AGENTS.md
- README.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- requirements/prompts.md
- PLANS.md

## 5. Affected files and modules
- `src/App.tsx`
- `src/index.css`
- `src/app/*` (new shell and route config)
- `src/pages/*` (route-level placeholder screens)
- `src/App.test.tsx`
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
- Mobile uses bottom navigation for primary destinations.
- Tablet and desktop use left sidebar navigation.
- Destination labels stay consistent across breakpoints.
- Navigation includes: Home, Practice, History, Sankalpa, Settings.
- Placeholder screens are calm, minimal, and clearly indicate destination intent.

## 7. Data and state model
- Static route metadata for path, label, and description.
- No new persisted state.
- Route selection state remains managed by React Router `NavLink`.

## 8. Risks
- Over-refactoring the scaffold beyond requested shell work.
- Inconsistent labels across mobile and desktop navigation.
- Responsive regressions if breakpoints are not validated.

## 9. Milestones
1. Add shell and route metadata modules.
2. Add route-level placeholder screens.
3. Wire routes and navigation through `App.tsx`.
4. Update styling for calm responsive behavior.
5. Update tests and docs.
6. Run typecheck, lint, test, build.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual check of navigation labels and routes across breakpoints

## 11. Decision log
- Keep route path as `/goals` for compatibility while presenting user-facing label as Sankalpa.
- Build placeholders as route-level pages in `src/pages` to align with architecture guidance.

## 12. Progress log
- Completed: required docs and architecture constraints review.
- Completed: implementation of shell, routes, and responsive navigation.
- Completed: docs updates for decisions and session handoff.
- Completed: verification on 2026-03-23 (`typecheck`, `lint`, `test`, `build`).
