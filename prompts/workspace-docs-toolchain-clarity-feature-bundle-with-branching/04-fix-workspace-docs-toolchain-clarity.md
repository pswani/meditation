# Fix: Workspace Docs Toolchain Clarity

Use the review and test outputs to close any remaining in-scope issues.

Fix priorities:
1. README or iOS docs that still mislead contributors
2. toolchain pins or metadata that do not match reality
3. unsupported-platform or target-name confusion in Swift package metadata
4. lingering absolute local paths or stale repo-map text
5. documentation drift caused by the cleanup

Rules:
- stay within repo-map, toolchain, and workflow clarity
- do not widen into large implementation refactors or CI authoring
- prefer correcting docs to match reality unless the underlying metadata bug is small and clearly in scope

After fixes:
1. update the ExecPlan, review doc, and test doc if needed
2. rerun the relevant verification commands
3. confirm the working tree only contains intended bundle changes

When complete:
- summarize what changed after review or testing
- then continue to `99-merge-branch.md`
