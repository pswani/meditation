# Fix: iOS Native Runtime UX And Resilience

Use the review and test outputs to close the remaining in-scope issues.

Fix priorities:
1. correctness bugs in runtime restoration
2. validation or UX regressions in timer and manual-log entry
3. misleading connectivity or settings behavior
4. missing tests directly tied to the changed behavior
5. documentation drift caused by the implementation

Rules:
- stay within this bundle's runtime, settings, and UX-resilience scope
- do not widen into unrelated feature work
- document any remaining real-device-only risk rather than hand-waving it

After fixes:
1. update the ExecPlan, review doc, and test doc if needed
2. rerun the relevant verification commands
3. confirm the working tree only contains intended bundle changes

When complete:
- summarize what changed after review or testing
- then continue to `99-merge-branch.md`
