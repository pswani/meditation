# 01-implement-main-upstream-publish.md

## Objective
Prepare the current local `main` state for a safe upstream push.

## Required outcomes
1. **Commit and scope audit**
   - Identify exactly which local commits are ahead of `origin/main`.
   - Confirm they belong to the intended product state and do not include stray work.

2. **Verification audit**
   - Ensure the required verification evidence is current for the commits being published.
   - Re-run missing checks when needed.

3. **Documentation and handoff audit**
   - Ensure `requirements/session-handoff.md` reflects the true merged state.
   - Ensure any new review/test artifacts needed to explain the current state are present.

4. **Push readiness**
   - Leave `main` in a safe state to push.
   - If upstream push is allowed in the execution environment, prepare to push in the merge step.
   - If upstream push is blocked by permissions or environment, stop with the exact remaining command and status.

## Scope guardrails
- Keep this bundle focused on publication readiness and small documentation or hygiene fixes.
- Do not broaden into new feature work.
- If major product issues are found, document them and stop rather than widening scope.

## Verification requirements
Run and report:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 verify` in `backend/` if full-stack confidence is required for the release decision

## Commit guidance
Suggested commit message:
- `chore(release): prepare main for upstream publish`
