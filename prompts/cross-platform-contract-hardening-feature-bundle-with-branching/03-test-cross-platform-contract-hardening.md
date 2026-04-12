# Test: Cross-Platform Contract Hardening

Goal:
- verify that backend, web, and iOS now agree on one stale-write and reference-data contract

Minimum verification:
1. Run backend tests covering the changed controllers, services, and transaction paths.
2. Run frontend tests covering sync queue behavior or API-boundary handling touched by the new contract.
3. Run iOS tests covering decoding, normalization, or queued replay touched by the new contract.
4. Execute at least one concrete stale-update or stale-delete integration scenario when practical.
5. Verify the shared reference-data or schema source produces the expected values across runtimes.

Suggested command ideas when applicable:
- backend test commands scoped to the touched packages
- `npm run test`
- `npm run typecheck`
- `swift test --package-path ios-native`
- local `curl` or scripted integration checks against the changed REST routes

Record results in:
- `docs/test-cross-platform-contract-hardening-feature.md`

The test doc should include:
- commands run
- pass or fail status
- the concrete stale-write scenarios exercised
- how backend, web, and iOS contract alignment was verified
- any gaps that still require live multi-runtime verification

When complete:
- summarize the most important verification result
- then continue to `04-fix-cross-platform-contract-hardening.md`
