Read before merge:
- `AGENTS.md`
- `README.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-observance-sankalpa-feature.md`
- `docs/review-observance-sankalpa-feature.md`
- `docs/test-observance-sankalpa-feature.md`

Merge goal:
- Safely merge the completed observance-based sankalpa slice back into the parent branch.

Pre-merge requirements:
1. Confirm the feature branch is clean aside from the intended slice changes.
2. Confirm required verification has passed and the review artifact does not contain unresolved blocker, high, or medium findings.
3. Confirm durable docs are up to date:
   - `requirements/decisions.md`
   - `requirements/session-handoff.md`
   - any product or architecture docs changed by the slice
4. Create a focused commit if one has not already been created.
5. Merge back into the recorded parent branch with a normal non-fast-forward merge unless the repo state makes a different safe strategy necessary.

Output requirements:
- Report the feature branch name.
- Report the parent branch name.
- Report the merge command used.
- Report the final recommended next slice for `requirements/session-handoff.md`.
