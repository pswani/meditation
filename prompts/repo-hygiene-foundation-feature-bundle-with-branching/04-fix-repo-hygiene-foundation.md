# Fix: Repo Hygiene Foundation

Use the review and test outputs to close any remaining in-scope issues.

Fix priorities:
1. accidental deletion or hiding of real source
2. tracked generated or mutable runtime artifacts that still remain
3. setup/reset flows that are still not reproducible
4. config ambiguity that still leaves multiple canonical entrypoints
5. documentation drift caused by the cleanup

Rules:
- stay within repo hygiene, runtime-state cleanup, and config-surface clarity
- do not widen into CI workflow authoring, sync redesign, or media-serving security
- document intentional exceptions instead of quietly leaving them ambiguous

After fixes:
1. update the ExecPlan, review doc, and test doc if needed
2. rerun the relevant verification commands
3. confirm the working tree only contains intended bundle changes

When complete:
- summarize what changed after review or testing
- then continue to `99-merge-branch.md`
