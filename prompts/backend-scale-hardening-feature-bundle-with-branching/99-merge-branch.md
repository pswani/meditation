Read before merging:
- `AGENTS.md`
- `README.md`
- `requirements/session-handoff.md`
- `docs/review-backend-scale-hardening-feature.md`
- `docs/test-backend-scale-hardening-feature.md`

Goal:
- Safely land the completed backend scale and API hardening phase after implementation, review, testing, and any follow-up fixes are finished.

Pre-merge checklist:
1. Review the changed files carefully.
2. Confirm no unrelated edits were introduced.
3. Confirm required verification has passed on the final branch state.
4. Confirm all required durable docs and artifacts are included:
   - `docs/execplan-backend-scale-hardening-feature.md`
   - `docs/review-backend-scale-hardening-feature.md`
   - `docs/test-backend-scale-hardening-feature.md`
   - any updated durable product or architecture docs
5. Create a clear commit if one has not already been created.

Merge instructions:
- Merge back into the original parent branch used in `00-create-branch.md`.
- Prefer a normal non-fast-forward merge when that matches current repo workflow.
- Do not delete unrelated branches.
- Do not amend unrelated commits.

Suggested final commit message if needed:
- `feat(api): scale history and summary query paths`

Output requirements:
- Report the final commit hash used for merge.
- Report the merge target branch.
- Report whether the merge was clean.
- Report the exact recommended next prompt or state that the bundle is complete.

