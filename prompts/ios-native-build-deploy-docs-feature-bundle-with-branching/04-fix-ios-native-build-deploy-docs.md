# Fix: iOS Native Build Deploy And Docs

Use the review and test outputs to close the remaining in-scope issues.

Fix priorities:
1. broken or misleading scripts
2. mismatches between docs and actual workflow
3. missing prerequisite or troubleshooting guidance
4. documentation drift caused by the implementation

Rules:
- stay within this bundle's build, deploy, and documentation scope
- do not widen into unrelated app-feature work
- prefer documenting environment limits over pretending they were verified

After fixes:
1. update the ExecPlan, review doc, and test doc if needed
2. rerun the relevant script and build verification
3. confirm the working tree only contains intended bundle changes

When complete:
- summarize what changed after review or testing
- then continue to `99-merge-branch.md`
