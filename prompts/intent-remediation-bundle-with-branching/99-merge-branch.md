Read AGENTS.md, README.md, requirements/intent.md, docs/product-requirements.md, docs/architecture.md, docs/ux-spec.md, docs/screen-inventory.md, requirements/decisions.md, and requirements/session-handoff.md.

Then:
1. inspect the current git state and confirm the remediation bundle branch and its recorded parent branch from requirements/session-handoff.md
2. verify the working tree is clean
3. verify the latest remediation, review, and cleanup steps were completed and their recorded verification is sufficient
4. merge the remediation branch back into its parent branch locally with a normal merge that preserves history unless a safer local strategy is required
5. resolve conflicts carefully if they appear without losing intentional changes
6. confirm the resulting git status and current branch
7. update requirements/decisions.md and requirements/session-handoff.md with:
   - the merge outcome
   - the completion summary
   - any remaining known limitations
8. commit any final merge-related documentation updates with a clear message such as `chore(branch): merge intent remediation bundle into parent`

