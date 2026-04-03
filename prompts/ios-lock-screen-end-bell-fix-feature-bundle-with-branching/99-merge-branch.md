# 99-merge-branch.md

## Goal
Finalize and merge the lock-screen end-bell fix branch safely.

## Preconditions
- Review completed with no unresolved blocker/high/medium findings.
- Required checks passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- Relevant docs updated.

## Steps
1. Ensure current branch is `fix/ios-lock-screen-end-bell`.
2. Rebase or merge latest integration branch as team policy requires.
3. Resolve conflicts carefully; avoid unrelated edits.
4. Merge into integration branch with a clear merge commit or approved strategy.
5. Update `requirements/session-handoff.md` with final shipped state and remaining known gap (if any).

## Final output
- Merge summary
- Commits included
- Verification recap
- Remaining known limitations (if any)
