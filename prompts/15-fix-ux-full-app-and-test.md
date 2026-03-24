Read:
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- docs/ux-review-full-app.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:

1. Create an ExecPlan.

2. Implement the critical and important UX/usability improvements from docs/ux-review-full-app.md.

3. Keep scope bounded to the highest-priority UX/usability issues only.
   Do not try to redesign the whole app if that would make the slice too large.
   Focus on the changes that most improve:
   - clarity
   - navigation
   - responsiveness
   - usability
   - user flow continuity

4. Preserve existing functionality unless a reviewed issue requires a behavior fix.

5. Improve responsive behavior across mobile, tablet, and desktop where called out in the review.

6. Add or update focused tests where behavior changes, especially for:
   - navigation behavior
   - form validation behavior
   - screen states and empty states where practical
   - route rendering
   - critical interaction logic affected by UX fixes

7. Run a thorough verification pass:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build

8. If test reliability is weak in the areas touched, improve it with focused maintainable tests only.

9. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md

10. In session-handoff, include:
   - UX/usability issues fixed
   - tests added or improved
   - remaining high-priority issues
   - known limitations
   - exact recommended next prompt

11. Commit with a clear message, for example:
   feat(ux): address high-priority full-app usability issues