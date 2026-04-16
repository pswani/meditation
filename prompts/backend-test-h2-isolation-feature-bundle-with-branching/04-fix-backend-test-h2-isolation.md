# 04 Fix Backend Test H2 Isolation

Address anything left open in:

- `docs/review-backend-test-h2-isolation-feature.md`
- `docs/test-backend-test-h2-isolation-feature.md`

Fix rules:
- Keep scope limited to test-runtime safety and documentation.
- Update the ExecPlan progress log as new decisions or follow-up fixes land.
- Re-run the affected verification commands and refresh the test doc with the final state.
- Update `requirements/session-handoff.md` before merge.

Do not merge from this prompt. Recommend `99-merge-branch.md` only when the branch is clean.
