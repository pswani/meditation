# 99-merge-branch.md

## Goal
Safely merge the `main` upstream publication branch and complete upstream publication when allowed.

## Preconditions
- No unresolved blocker/high/medium findings.
- Required checks passed.
- `requirements/session-handoff.md` reflects the true merged state.

## Steps
1. Confirm branch is `chore/main-upstream-publish`.
2. Sync with parent branch per team policy.
3. Resolve conflicts carefully.
4. Merge back to `main`.
5. If environment permissions and team policy allow, push `main` to `origin`.
6. If push is blocked, stop after merge and report the exact remaining push command.

## Final output
- Merge summary
- commits included
- verification recap
- push status or exact remaining push command
