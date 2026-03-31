Read:
- AGENTS.md
- PLANS.md
- README.md
- docs/product-requirements.md
- docs/architecture.md
- docs/ux-spec.md
- docs/screen-inventory.md
- docs/review-timer-defaults-and-runtime-defects.md
- requirements/roadmap.md
- requirements/decisions.md
- requirements/session-handoff.md

Then:

1. Create an ExecPlan.

2. Implement the critical and important issues from docs/review-timer-defaults-and-runtime-defects.md.

3. Keep the scope bounded to the reviewed findings plus regression-proofing of the timer defects already fixed in this bundle.
   Included:
   - reviewed timer/runtime issues
   - focused cleanup of timer state, storage, validation, or UI where the review shows a real defect or maintainability risk
   - additional test coverage needed to lock in the defect fixes and reviewed corrections

   Excluded:
   - unrelated product expansion
   - broad refactors without a clear review-driven payoff

4. Verify the bundle thoroughly.
   Cover at minimum:
   - Settings default timer persistence
   - Practice draft behavior
   - Home quick start and custom play shortcuts
   - active timer runtime and reload recovery
   - validation edge cases
   - session-log correctness

5. Run:
   - npm run typecheck
   - npm run lint
   - npm run test
   - npm run build
   - any relevant backend build/test commands that exist in the repo

6. Update:
   - README.md if user-facing behavior or verification notes need clarification
   - requirements/decisions.md
   - requirements/session-handoff.md

7. In session-handoff, include:
   - what review findings were fixed
   - scenarios verified
   - remaining risks or limitations
   - exact recommended next prompt

8. Commit with a clear message, for example:
   - `fix(timer): address review findings and verify defect remediation`
