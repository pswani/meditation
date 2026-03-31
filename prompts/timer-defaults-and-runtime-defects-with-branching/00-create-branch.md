Read:
- AGENTS.md
- PLANS.md
- requirements/session-handoff.md
- requirements/decisions.md

Then:

1. Inspect the current git branch and confirm the current branch name before making changes.
2. Treat the current branch as the parent branch for this timer-defect remediation bundle unless requirements/session-handoff.md already records a more specific parent branch for this exact bundle.
3. Create a new local feature branch for fixing the timer-defaults and runtime defects from that parent branch.
4. Use a clear branch name in this format if available:
   - `codex/timer-defaults-runtime-defects`
   If that exact name already exists locally, create a clear alternative with a short numeric suffix.
5. Switch to the new branch.
6. Confirm:
   - parent branch name
   - new branch name
   - that the working tree is ready for the defect-fix work
7. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md
8. In session-handoff, record:
   - parent branch
   - feature branch
   - bundle scope
   - exact recommended next prompt
9. Do not implement defect fixes in this step beyond branch setup and minimal documentation updates if needed.
10. Commit documentation-only changes if any were made, with a clear message such as:
   - `chore(branch): prepare local branch for timer defect remediation`
