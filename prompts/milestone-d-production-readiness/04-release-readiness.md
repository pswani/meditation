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

1. Create an ExecPlan for release readiness.
2. Prepare the repo for a clean handoff/release-ready state:
   - verify setup instructions
   - verify run/build/test instructions
   - verify app behavior against requirements
   - identify remaining gaps for a v1 release candidate
3. Update docs as needed:
   - README.md
   - requirements/roadmap.md
   - requirements/decisions.md
   - requirements/session-handoff.md
4. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
5. Produce a concise release-readiness summary in session-handoff.
6. Commit with a clear message:
   chore(release): prepare repo for release candidate handoff
