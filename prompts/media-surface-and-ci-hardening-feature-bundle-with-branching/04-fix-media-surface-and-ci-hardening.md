# Fix: Media Surface And CI Hardening

Use the review and test outputs to close any remaining in-scope issues.

Fix priorities:
1. unsafe media exposure that still remains
2. risky or unbounded media caching behavior
3. missing or incorrect CI enforcement
4. hygiene checks that are too weak or too broad
5. documentation drift caused by the hardening work

Rules:
- stay within media-serving, cache-policy, and CI or hygiene enforcement
- do not widen into broader repo cleanup or sync redesign
- document any local-versus-production tradeoffs explicitly

After fixes:
1. update the ExecPlan, review doc, and test doc if needed
2. rerun the relevant verification commands
3. confirm the working tree only contains intended bundle changes

When complete:
- summarize what changed after review or testing
- then continue to `99-merge-branch.md`
