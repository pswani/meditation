# Fix: iOS Native Low-Risk Cleanup

Use the review and test outputs to close any remaining in-scope cleanup issues.

Fix priorities:
1. accidental behavior changes
2. incomplete cleanup of the targeted warning or doc drift
3. missing verification tied directly to the touched files
4. documentation drift caused by the implementation

Rules:
- stay within this bundle's low-risk cleanup scope
- do not widen into feature work or broad refactors
- document any intentionally deferred cleanup instead of forcing it in

After fixes:
1. update the ExecPlan, review doc, and test doc if needed
2. rerun the relevant verification commands
3. confirm the working tree only contains intended bundle changes

When complete:
- summarize what changed after review or testing
- then continue to `99-merge-branch.md`
