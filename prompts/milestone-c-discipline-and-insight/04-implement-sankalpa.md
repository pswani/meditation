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

1. Create an ExecPlan for sankalpa.
2. Implement:
   - duration-based sankalpas
   - session-count-based sankalpas
   - optional meditation type filtering
   - optional time-of-day filtering
   - progress tracking and remaining requirement display
3. Clearly define what counts toward sankalpa progress.
4. Use clean REST integration between front end and back end if persistence or derivation is server-backed.
5. Make it responsive across mobile, tablet, and desktop.
6. Add focused tests for sankalpa counting logic and relevant API behavior.
7. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
8. Update decisions and session-handoff.
9. Commit with a clear message:
   feat(insight): add sankalpa goals and progress tracking
