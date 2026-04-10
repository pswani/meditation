Read before merging:
- `AGENTS.md`
- `README.md`
- `requirements/session-handoff.md`
- `docs/review-ios-native-home-parity-feature.md`
- `docs/test-ios-native-home-parity-feature.md`

Goal:
- Safely land the native iOS Home parity slice after implementation, review, testing, and follow-up fixes are finished.

Pre-merge checklist:
1. Review the changed files carefully.
2. Confirm no unrelated edits were introduced.
3. Confirm required verification has passed on the final branch state.
4. Confirm all required durable docs and artifacts are included:
   - `docs/execplan-ios-native-home-parity-feature.md`
   - `docs/review-ios-native-home-parity-feature.md`
   - `docs/test-ios-native-home-parity-feature.md`
   - any updated durable repo docs
5. Create a clear commit if one has not already been created.

Suggested final commit message if needed:
- `feat(ios): add home parity shortcuts`

Output requirements:
- Report the final commit hash used for merge.
- Report the merge target branch.
- Report whether the merge was clean.
- Report the exact recommended next prompt or state that the bundle is complete.
