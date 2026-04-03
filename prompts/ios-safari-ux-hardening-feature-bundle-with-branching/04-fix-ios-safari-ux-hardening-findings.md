# 04-fix-ios-safari-ux-hardening-findings.md

## Goal
Fix review/test findings for the iPhone Safari UX hardening slice.

## Instructions
1. Fix blocker/high/medium findings first.
2. Keep changes narrowly scoped to this slice.
3. Add/adjust tests for every meaningful fix.
4. Re-run:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
5. Update docs only when behavior/decisions changed.

## Output
- Findings addressed and final status.
- Verification evidence.
- Final commit message used.
