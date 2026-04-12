# Implement: Cross-Platform Contract Hardening

Objective:
- make backend, web, and iOS agree on one explicit contract for mutable sync-heavy behavior so stale writes, unsupported values, and replay outcomes are predictable instead of inferred separately per client

Primary outcomes:
1. One canonical contract exists for sync metadata, stale-write detection, and conflict-response semantics.
2. Controllers and services use shared stale-write handling rather than ad hoc per-endpoint behavior.
3. Shared reference data or schema definitions stop drifting between backend, web, and iOS.
4. Multi-step write paths have explicit transaction and concurrency boundaries where they matter.
5. Cross-platform tests cover representative conflict and replay cases.

Read before implementation:
- `prompts/expert-review-remediation-phased-plan.md`
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- backend sync, controller, and service code
- web sync queue and API boundary code
- iOS sync service and any related decoding or normalization code

In scope:
- canonical contract documentation and code changes needed to enforce it
- reference-data or schema source-of-truth work
- stale-write HTTP semantics and response-shape cleanup
- transaction or optimistic-concurrency hardening for multi-step write paths
- focused backend, web, and iOS tests for replay and conflict behavior
- durable docs explaining the new contract

Explicitly out of scope:
- large UI redesigns
- unrelated repo-hygiene cleanup
- broad decomposition of `TimerContext` or `ShellViewModel`
- media-serving or service-worker cache hardening outside what the contract tests need

Implementation guidance:
1. Start by re-verifying which review findings still apply. The current repo already contains some sync hardening and reference-data cleanup, so narrow the work to the remaining gap.
2. Prefer one explicit contract artifact over prose spread across three runtimes.
3. Keep stale-write outcomes easy for clients to classify. Do not make them guess from mixed status codes and payload shapes.
4. If reference data remains duplicated by necessity, generate it from one canonical source rather than maintaining three manual copies.
5. Keep backward compatibility explicit. If a breaking change is necessary, document the migration and update all runtimes in the same bundle.

Quality expectations:
- conflict behavior should be testable without reading controller internals
- transaction boundaries should match real multi-step write invariants
- unsupported reference values should fail clearly and consistently

Verification expectations:
- run backend, web, and iOS tests relevant to the changed contract
- run local integration verification for at least one stale-update and one stale-delete scenario when practical
- capture concrete evidence in the test doc

Documentation updates required:
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/execplan-cross-platform-contract-hardening-feature.md`
- any canonical contract or schema doc created by this bundle

Before handing off to review:
- summarize the final canonical contract and where it now lives
- list any intentional compatibility behavior retained for older local data or clients
- then continue to `02-review-cross-platform-contract-hardening.md`
