Read:
- AGENTS.md
- PLANS.md
- README.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- docs/review-open-ended-timer.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:

1. Create an ExecPlan.

2. Implement the critical and important issues from docs/review-open-ended-timer.md.

3. Keep scope bounded to the open-ended timer feature and its immediate integration points:
   - timer setup
   - active timer
   - session log / history integration
   - any minimal backend or API changes needed for correctness

4. Preserve existing timer functionality unless a reviewed issue requires a fix.

5. Maintain:
   - calm, minimal UX
   - responsiveness across mobile, tablet, and desktop
   - clean domain/data model boundaries

6. Add or update focused tests where behavior changes.

7. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
   - any relevant backend build/test commands that exist in the repo

8. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md

9. In session-handoff, include:
   - what issues were fixed
   - remaining limitations
   - exact recommended next prompt

10. Commit with a clear message, for example:
   fix(timer): refine open-ended meditation timer behavior
