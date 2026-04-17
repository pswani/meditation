# Backend Test H2 Isolation Review

Date: 2026-04-17

## Findings

No blocker, high, or medium findings were recorded in this review.

## Review focus covered

- whether any automated backend test path still points at the persistent `local-data/h2` datasource
- whether `./scripts/pipeline.sh verify` uses disposable runtime state for its smoke backend
- whether production runtime defaults in `backend/src/main/resources/application.yml` remain intact
- whether the documentation now describes the safe verification path accurately
- whether focused configuration coverage exists for the changed isolation contract

## Notes

- The backend `test` profile now uses a unique `jdbc:h2:mem:meditation-test-...` datasource per Spring context and a disposable temp media root rather than reusing `local-data` paths.
- `./scripts/pipeline.sh verify` now creates disposable runtime, H2, and media directories for the smoke backend and prints those paths so the safety evidence is visible in command output.
- The production-like file-backed datasource in `backend/src/main/resources/application.yml` remains unchanged, which keeps this slice scoped to verification hardening rather than runtime-default changes.
- The opt-in live native backend integration path remains explicitly gated behind `MEDITATION_NATIVE_LIVE_SYNC_BASE_URL`, and the docs now call out that local runs should use explicit non-production H2 configuration.

## Residual risk

- Opt-in live integration checks can still touch a persistent local backend if someone points them at one manually, so the remaining safety boundary is documentation plus the explicit environment gate rather than a second automated guardrail in the native test target.
