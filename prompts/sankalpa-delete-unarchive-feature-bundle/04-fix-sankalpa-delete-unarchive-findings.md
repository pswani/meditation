# 04-fix-sankalpa-delete-unarchive-findings.md

## Goal
Fix review and test findings for the `sankalpa` delete and unarchive slice.

## Instructions
1. Fix blocker/high/medium findings first.
2. Keep changes narrowly scoped to this slice.
3. Add/adjust tests for every meaningful fix.
4. Re-run:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
   - `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/` if backend code changed
5. Update docs only when behavior or decisions changed.

## Output
- Findings addressed and final status.
- Verification evidence.
- Final commit message used.
