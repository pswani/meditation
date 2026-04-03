Read:

- `AGENTS.md`
- `PLANS.md`
- `requirements/session-handoff.md`
- `requirements/decisions.md`

Then:

1. Inspect the current git state and confirm the current branch name before making changes.
2. Treat the current branch as the parent branch for this bundle unless the repo state clearly points to a safer local parent.
3. Create a new local feature branch from that parent branch.
4. Use a clear branch name in this format if available:
   - `codex/sankalpa-edit-archive-feature-bundle-with-branching`
   If that exact name already exists locally, create a clear alternative with a short numeric suffix.
5. Switch to the new branch.
6. Confirm:
   - parent branch name
   - new feature branch name
   - that the working tree is ready for this bundle
7. Update `requirements/session-handoff.md` with:
   - parent branch
   - feature branch
   - bundle scope
   - exact recommended next prompt
8. Do not implement feature changes in this step.
9. If only handoff documentation changed, commit with a clear message such as:
   - `chore(branch): prepare sankalpa edit and archive feature bundle`

