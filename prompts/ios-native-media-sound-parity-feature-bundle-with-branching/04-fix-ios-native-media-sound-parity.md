# Fix: iOS Native Media And Sound Parity

Use the review and test outputs to close any remaining in-scope issues.

Fix priorities:
1. correctness bugs
2. parity mismatches
3. regression risks
4. missing tests tied directly to changed behavior
5. documentation drift caused by the implementation

Rules:
- stay within this bundle's media and sound scope
- do not widen into unrelated refactors
- if a serious blocker remains, document it clearly rather than masking it

After fixes:
1. update the ExecPlan, review doc, and test doc if their conclusions changed
2. rerun the relevant verification commands
3. confirm the working tree only contains intended bundle changes

When complete:
- summarize what was fixed after review or test feedback
- then continue to `99-merge-branch.md`
