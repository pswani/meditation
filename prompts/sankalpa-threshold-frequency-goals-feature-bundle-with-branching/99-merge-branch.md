# 99 Merge Branch

Merge only if the recurring-goal branch is clean and verified.

Pre-merge checklist:
- `docs/execplan-sankalpa-threshold-frequency-goals-feature.md` is current.
- `docs/review-sankalpa-threshold-frequency-goals-feature.md` is complete.
- `docs/test-sankalpa-threshold-frequency-goals-feature.md` records the final verification state.
- Migration, compatibility, and time-window risks are documented appropriately.

Merge steps:
1. Review the final diff for scope creep.
2. Commit with a message such as `feat(sankalpa): add recurring threshold-based goals`.
3. Merge back into the recorded parent branch.
4. Confirm `requirements/session-handoff.md` reflects the completed slice and any remaining edge-case QA.

Do not merge if the chosen model still fails to express the user example or leaves migration behavior unclear.
