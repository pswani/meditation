# ExecPlan: Milestone E Accessibility And Responsive Polish

## 1. Objective
Improve accessibility semantics and responsive layout quality across the implemented meditation flows without changing the underlying product behavior.

## 2. Why
Milestone E should leave the app calmer and easier to use across phone, tablet, and desktop. The current UI already covers the main flows, but validation-heavy forms can do more to communicate errors accessibly and the management-heavy screens can use large-screen space more intentionally.

## 3. Scope
Included:
- Improve form accessibility semantics on key flows with validation:
  - timer setup
  - settings
  - manual log
  - `custom play`
  - playlist management
- Add responsive layout polish for management-heavy screens so tablet/desktop use extra space more effectively without becoming dense
- Keep the existing calm visual direction and terminology
- Add focused tests for the new accessibility wiring where practical
- Run full verification plus a local UI spot-check

Excluded:
- New product features
- New navigation destinations or route restructures
- Broad visual redesign
- End-to-end tooling additions beyond what later Milestone E prompts cover

## 4. Source documents
- AGENTS.md
- PLANS.md
- README.md
- docs/architecture.md
- docs/product-requirements.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md
- prompts/milestone-e-hardening-release/03-accessibility-responsive-polish.md

## 5. Affected files and modules
- `src/pages/PracticePage.tsx`
- `src/pages/SettingsPage.tsx`
- `src/pages/HistoryPage.tsx`
- `src/features/customPlays/CustomPlayManager.tsx`
- `src/features/playlists/PlaylistManager.tsx`
- `src/index.css`
- focused test files for the updated screens/components
- `requirements/decisions.md`
- `requirements/session-handoff.md`

## 6. UX behavior
Expected user-facing improvements:
- error states are announced more clearly because invalid fields expose the right accessible metadata
- helpful hint text remains associated with the relevant control
- tablet and desktop layouts use more width for `custom play` and playlist management instead of remaining one long stacked column
- phone behavior stays touch-friendly and calm

## 7. Data and state model
No data-model changes intended. This slice should preserve:
- current local-first and offline-first behavior
- existing REST contracts
- current validation rules and wording

## 8. Risks
- Widening layouts too aggressively could make the app feel dashboard-like instead of calm.
- Accessibility attributes can become brittle if tests over-couple to implementation details instead of user-facing behavior.
- Form markup changes must preserve existing label/query behavior used by the tests.

## 9. Milestones
1. Audit the validation-heavy screens/components and identify the highest-value accessibility gaps.
2. Add accessible field metadata and status semantics without changing validation copy.
3. Apply responsive layout refinements for `custom play` and playlist management on wider screens.
4. Add focused tests and perform a local UI spot-check.
5. Run the full verification suite, update docs, and commit the polish slice.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test`
- `mvn -Dmaven.repo.local=../local-data/m2 verify`
- local responsive UI spot-check on phone-sized and desktop-sized viewports

## 11. Decision log
- Focus accessibility work on the highest-value validation and form semantics first, rather than attempting a broad audit of every text block.
- Use responsive two-column management layouts on wider screens only where the content is naturally split between editing and reviewing lists.
- Preserve the existing calm copy and styling direction while improving structure and affordance.

## 12. Progress log
- Completed: reviewed the prompt, current CSS breakpoints, and the validation-heavy screen/component surfaces.
- Completed: wired `aria-invalid` and `aria-describedby` metadata plus stable hint and error ids into timer setup, settings, manual log, `custom play`, and playlist forms.
- Completed: applied wide-screen two-column management layouts for `custom play` and playlist management while preserving stacked phone layouts.
- Completed: added focused accessibility assertions in the relevant screen tests and updated app-level manual-log queries to match the more descriptive labels.
- Completed: verified frontend and backend checks, then spot-checked responsive behavior locally on `http://127.0.0.1:4174`.
