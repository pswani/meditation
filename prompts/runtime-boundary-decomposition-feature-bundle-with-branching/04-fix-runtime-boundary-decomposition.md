# Fix: Runtime Boundary Decomposition

Use the review and test outputs to close any remaining in-scope issues.

Fix priorities:
1. regressions introduced by the extraction
2. new modules that still mix too many concerns
3. missing or weak coverage around extracted seams
4. unclear ownership or import boundaries
5. documentation drift caused by the decomposition

Rules:
- stay within web and iOS orchestration-boundary cleanup
- do not widen into unrelated contract redesign, CI, or media work
- keep the final top-level orchestrators small enough to read as coordination layers

After fixes:
1. update the ExecPlan, review doc, and test doc if needed
2. rerun the relevant verification commands
3. confirm the working tree only contains intended bundle changes

When complete:
- summarize what changed after review or testing
- then continue to `99-merge-branch.md`
