Read:
- AGENTS.md
- PLANS.md
- requirements/session-handoff.md
- requirements/decisions.md
- README.md
- docs/architecture.md
- docs/product-requirements.md
- docs/ux-spec.md
- docs/screen-inventory.md

Then:

1. Inspect the current git state and determine:
   - the current milestone branch
   - the parent branch recorded earlier in requirements/session-handoff.md if present
2. Verify the milestone work is in a good state before merging:
   - review git status
   - ensure there are no unintended uncommitted changes
   - run the relevant verification commands for the milestone if they have not already been run recently
3. Merge the current milestone branch back into its parent branch locally.
4. Prefer a normal merge that preserves milestone history unless the repo state clearly requires another safe local strategy.
5. Switch to the parent branch and complete the merge locally.
6. If a merge conflict occurs, resolve it carefully, rerun relevant checks, and continue.
7. After merge, confirm:
   - parent branch name
   - merged milestone branch name
   - resulting git status
8. Update:
   - requirements/decisions.md
   - requirements/session-handoff.md
9. In session-handoff, record:
   - milestone branch merged
   - parent branch updated
   - milestone completion summary
   - exact recommended next prompt
10. Commit any final merge-related documentation updates if needed with a clear message such as:
   chore(branch): merge Milestone A branch into parent
