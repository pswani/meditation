# Test: Media Surface And CI Hardening

Goal:
- verify that media delivery is safer, offline media caching is bounded, and CI mirrors the real repo quality gates

Minimum verification:
1. Run the local commands that the new CI workflows enforce.
2. Verify unsafe or overly broad media-root configurations are rejected or normalized as intended.
3. Verify the service worker no longer relies on full in-memory buffering for the targeted risky media path.
4. Verify the hygiene check catches a representative generated/runtime artifact case or otherwise prove its coverage.
5. Validate workflow syntax or dry-run behavior where practical.

Suggested command ideas when applicable:
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- backend test commands for touched media config or controller code
- `swift test --package-path ios-native`
- any local workflow-validation command or script introduced in this bundle

Record results in:
- `docs/test-media-surface-and-ci-hardening-feature.md`

The test doc should include:
- commands run
- pass or fail status
- how media-root and cache-policy behavior were verified
- how CI and hygiene checks were validated
- any limits that prevented full GitHub-hosted workflow execution locally

When complete:
- summarize the most important verification result
- then continue to `04-fix-media-surface-and-ci-hardening.md`
