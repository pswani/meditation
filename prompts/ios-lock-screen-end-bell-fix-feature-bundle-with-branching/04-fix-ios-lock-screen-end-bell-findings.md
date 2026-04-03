# 04-fix-ios-lock-screen-end-bell-findings.md

## Goal
Address review/test findings for the lock-screen end-bell slice without broad refactors.

## Instructions
1. Fix blocker/high/medium findings first.
2. Keep fixes scoped to the timer lock-screen behavior slice.
3. Add/update tests for each meaningful bug fixed.
4. Re-run required checks:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
5. Update docs only if behavior or decisions changed from the previous step.

## Output
- Summary of fixes by severity.
- Evidence of passing checks.
- Final commit message suggestion.
