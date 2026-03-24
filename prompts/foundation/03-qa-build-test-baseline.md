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

1. Create an ExecPlan for establishing a stable build/test baseline before milestone implementation.
2. Inspect the current repo and fix the minimum necessary issues so the app can be:
   - installed
   - typechecked
   - linted
   - tested
   - built
   - run locally
3. Improve test reliability where existing tests are fragile or incomplete.
4. Add only foundational test improvements that support milestone work.
5. Ensure README startup and verification instructions are correct for both front end and back end if both are present.
6. Avoid unrelated feature work.
7. Run and verify:
   - npm install
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
8. Update:
   - README.md
   - requirements/decisions.md
   - requirements/session-handoff.md
9. In session-handoff, include:
   - build/test/run status
   - known baseline limitations
   - exact recommended next prompt
10. Commit with a clear message:
   chore(setup): establish stable build test and local run baseline
