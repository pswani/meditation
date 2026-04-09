Read before review:
- `AGENTS.md`
- `README.md`
- `docs/ux-spec.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-ios-native-sync-polish-feature.md`

Review target:
- The branch `codex/ios-native-sync-polish-feature-bundle-with-branching` after implementation is complete.

Review focus:
- API-boundary correctness
- offline fallback and conflict behavior
- backend-environment configuration mistakes
- real-device debugging clarity
- release-readiness gaps

Priority review questions:
1. Does the native app still feel trustworthy when the backend is slow, unavailable, or stale?
2. Are simulator and physical-device base-URL rules documented clearly enough to avoid `localhost` mistakes?
3. Are sync decisions aligned with the existing backend contracts and product terminology?
4. Did polish work remain bounded instead of drifting into unrelated refactors?
5. Are the highest-risk sync paths covered by meaningful tests?

Artifact requirement:
- Create or update `docs/review-ios-native-sync-polish-feature.md` with the review outcome.

Output requirements:
- Findings first, ordered by severity.
- Include file references and line references where possible.
- If no blocker, high, or medium findings exist, state that explicitly.
- Keep any summary brief.
