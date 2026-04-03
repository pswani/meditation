# 99-merge-branch.md

## Goal
Safely merge the `sankalpa` delete and unarchive branch after verification.

## Preconditions
- No unresolved blocker/high/medium findings.
- Required checks passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - backend verification if backend code changed
- Docs and session handoff updated.

## Steps
1. Confirm branch is `feat/sankalpa-delete-unarchive`.
2. Sync with parent branch per team policy.
3. Resolve conflicts carefully.
4. Merge back to parent branch.
5. Update `requirements/session-handoff.md` with latest state.

## Final output
- Merge summary
- commits included
- verification recap
- remaining known gaps
