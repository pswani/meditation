Read:

- `AGENTS.md`
- `PLANS.md`
- `requirements/session-handoff.md`
- `requirements/decisions.md`
- `README.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`

Then:

1. Inspect the current git state and determine:
   - the current feature branch
   - the parent branch recorded earlier in `requirements/session-handoff.md`
2. Verify the feature work is in a good state before merging:
   - review git status
   - ensure there are no unintended uncommitted changes
   - run relevant verification commands for this feature if they have not been run recently
3. Merge the current feature branch back into its parent branch locally.
4. Prefer a normal merge that preserves feature history unless the repo state clearly requires another safe local strategy.
5. Switch to the parent branch and complete the merge locally.
6. If a merge conflict occurs, resolve it carefully, rerun relevant checks, and continue.
7. After merge, confirm:
   - parent branch name
   - merged feature branch name
   - resulting git status
8. Update `requirements/session-handoff.md` with:
   - feature branch merged
   - parent branch updated
   - feature completion summary
   - exact recommended next prompt
9. Commit any final merge-related documentation updates if needed with a clear message such as:
   - `chore(branch): merge custom play runtime feature branch into parent`

