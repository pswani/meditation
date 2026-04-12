# Fix: Cross-Platform Contract Hardening

Use the review and test outputs to close any remaining in-scope issues.

Fix priorities:
1. backend, web, and iOS still disagreeing on the contract
2. inconsistent stale-write status or payload behavior
3. missing transaction or concurrency protection on touched write paths
4. reference-data drift that still depends on manual duplication
5. documentation drift caused by the contract update

Rules:
- stay within sync and API contract hardening
- do not widen into unrelated runtime decomposition or UI work
- if a residual breaking-change risk remains, document it explicitly instead of hiding it

After fixes:
1. update the ExecPlan, review doc, and test doc if needed
2. rerun the relevant verification commands
3. confirm the working tree only contains intended bundle changes

When complete:
- summarize what changed after review or testing
- then continue to `99-merge-branch.md`
