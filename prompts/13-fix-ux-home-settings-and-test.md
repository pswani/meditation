Read:
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

Then:

1. Create an ExecPlan.

2. Implement the critical and important UX improvements from docs/ux-review-home-settings.md for:
   - Home
   - Settings
   - route/shell integration for those screens

3. Keep scope bounded to Home + Settings UX and the minimum supporting behavior needed to make those screens feel polished and functional.

4. Preserve existing functionality unless a reviewed issue requires a behavior fix.

5. Improve responsive behavior across mobile, tablet, and desktop.

6. Add a strong round of testing for this slice:
   - update/add focused unit tests for new logic
   - add screen-level tests where practical
   - add navigation/render tests where practical
   - ensure settings persistence behavior is covered
   - ensure Home empty states and populated states are covered where practical

7. Run a thorough verification pass:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build

8. If test coverage or test reliability is weak in this area, improve it with focused, maintainable tests only. Avoid meaningless tests.

9. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md

10. In session-handoff, include:
   - UX issues fixed
   - tests added or improved
   - current status of Home and Settings
   - known limitations
   - exact recommended next prompt

11. Commit with a clear message:
   feat(ux): refine home and settings experience and strengthen tests