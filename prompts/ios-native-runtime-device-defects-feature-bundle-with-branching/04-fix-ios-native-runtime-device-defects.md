# Fix: iOS Native Runtime Device Defects

Use the review and test outputs to close any remaining in-scope issues.

Fix priorities:
1. accidental behavior changes outside the four defects
2. incomplete fix for the backend reachability or configuration issue
3. keyboard-dismiss behavior that still leaves the user stuck with the numeric keypad
4. silent-mode audio behavior that remains inconsistent with the intended meditation experience
5. documentation drift caused by the implementation

Rules:
- stay within this bundle's four-defect scope
- do not widen into build-deploy automation or unrelated parity work
- document environment limits instead of pretending physical-device behavior was validated if it was not

After fixes:
1. update the ExecPlan, review doc, and test doc if needed
2. rerun the relevant verification commands
3. confirm the working tree only contains intended bundle changes

When complete:
- summarize what changed after review or testing
- then continue to `99-merge-branch.md`
