Read:
- AGENTS.md
- PLANS.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md


Then:

1. Create an ExecPlan for Milestone A line item 2:
   - Home and Settings fully integrated with real app behavior
   - front-end to back-end integration for persisted settings and displayed summaries where appropriate

2. Ensure Home acts as a meaningful launch surface:
   - quick start
   - today’s activity
   - recent activity
   - useful next actions
   - good empty states

3. Ensure Settings affects real app behavior:
   - default duration
   - default meditation type
   - default sounds
   - local or server-side persistence as appropriate for the current architecture
   - reflected in timer setup where applicable

4. Make the screens responsive across mobile, tablet, and desktop.
5. Add focused tests for persistence and derived display logic.
6. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
7. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md
8. Include exact recommended next prompt in session-handoff.
9. Commit with a clear message:
   feat(core): integrate home and settings with real practice flows
