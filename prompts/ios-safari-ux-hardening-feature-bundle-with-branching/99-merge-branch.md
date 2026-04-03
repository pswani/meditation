# 99-merge-branch.md

## Goal
Safely merge the iPhone Safari UX hardening branch after verification.

## Preconditions
- No unresolved blocker/high/medium findings.
- Required checks passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Docs and session handoff updated.

## Steps
1. Confirm branch is `fix/ios-safari-ux-hardening`.
2. Sync with parent branch per team policy.
3. Resolve conflicts carefully.
4. Merge back to parent branch.
5. Update `requirements/session-handoff.md` with latest state.

## Final output
- Merge summary
- commits included
- verification recap
- remaining known gaps
