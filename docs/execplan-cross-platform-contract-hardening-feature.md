# ExecPlan: Cross-Platform Contract Hardening Feature

## 1. Objective
Establish one canonical sync contract across backend, web, and iOS for queued mutation metadata, stale-write classification, stale-delete payload shape, and shared reference-data values, while tightening transaction boundaries on multi-step backend writes.

## 2. Why
The repo already contains meaningful sync hardening, but the remaining contract surface is still too implicit:
- backend stale-upsert outcomes are not explicitly classified for clients
- stale-delete payloads still vary by endpoint field name
- shared reference data still drifts across runtimes through manual duplication
- `Sankalpa` save and delete paths still perform multi-step persistence without an explicit transaction boundary

This slice makes replay and conflict behavior predictable without widening into unrelated runtime decomposition or UI work.

## 3. Scope
Included:
- create one canonical contract artifact for sync headers, sync outcomes, stale-delete payload shape, and shared reference data
- generate runtime constants or checks from that artifact where practical
- standardize backend sync-result signaling for queued mutation routes
- standardize stale-delete response shape while preserving explicit compatibility behavior where reasonable
- add an explicit transaction boundary to `Sankalpa` multi-step writes
- add focused backend, web, and iOS tests for conflict and contract alignment
- update durable architecture and handoff docs

Excluded:
- large UI redesigns
- runtime-boundary decomposition beyond the touched API and sync paths
- unrelated repo hygiene cleanup
- service-worker or media-serving changes outside the contract surface
- a new sync endpoint family

## 4. Source documents
- `AGENTS.md`
- `PLANS.md`
- `README.md`
- `requirements/intent.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/ux-spec.md`
- `docs/screen-inventory.md`
- `requirements/roadmap.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `prompts/expert-review-remediation-phased-plan.md`
- `docs/execplan-offline-app-sync-feature.md`
- `docs/review-offline-app-sync-feature.md`
- `docs/test-offline-app-sync-feature.md`
- `prompts/cross-platform-contract-hardening-feature-bundle-with-branching/00-create-branch.md`
- `prompts/cross-platform-contract-hardening-feature-bundle-with-branching/01-implement-cross-platform-contract-hardening.md`

## 5. Affected files and modules
- new canonical contract artifact under `contracts/`
- new generator script under `scripts/`
- `backend/src/main/java/com/meditation/backend/sync/`
- `backend/src/main/java/com/meditation/backend/reference/ReferenceData.java`
- `backend/src/main/java/com/meditation/backend/customplay/`
- `backend/src/main/java/com/meditation/backend/playlist/`
- `backend/src/main/java/com/meditation/backend/sankalpa/`
- `backend/src/main/java/com/meditation/backend/settings/`
- `backend/src/main/java/com/meditation/backend/sessionlog/`
- `src/types/referenceData.ts`
- `src/utils/syncApi.ts`
- `src/utils/customPlayApi.ts`
- `src/utils/playlistApi.ts`
- `src/utils/sankalpaApi.ts`
- `src/utils/sessionLogApi.ts`
- `src/utils/timerSettingsApi.ts`
- `ios-native/Sources/MeditationNativeCore/Domain/ReferenceData.swift`
- `ios-native/Sources/MeditationNativeCore/Services/AppSyncService.swift`
- focused backend, web, and iOS tests
- `docs/architecture.md`
- `requirements/decisions.md`
- `requirements/session-handoff.md`
- `docs/review-cross-platform-contract-hardening-feature.md`
- `docs/test-cross-platform-contract-hardening-feature.md`

## 6. UX behavior
- No major surface redesign is planned.
- Sync-heavy flows should remain calm and local-first.
- Stale queued deletes should keep restoring the authoritative backend record to the relevant collection with explicit, trust-preserving copy.
- The contract should make stale results explicit for runtime code without requiring users to understand transport details.

## 7. Data and state model
- Canonical contract artifact should define:
  - sync header names
  - sync outcome values
  - generic stale-delete payload field
  - shared reference-data values used across runtimes
- Backend queued mutation routes should classify outcomes through one shared sync-result header.
- Delete responses should expose one generic `currentRecord` field for stale outcomes, with compatibility aliases retained only if the migration cost is low.
- `Sankalpa` save and delete operations should run inside one transaction because they coordinate goal rows plus observance-entry replacement or deletion.

## 8. Risks
- Changing delete payload shape can break older clients if compatibility is not handled carefully.
- Generator output can create drift if the source artifact is not used consistently by all touched runtimes.
- iOS enums still require manual semantic mapping in places where Swift type modeling is richer than raw string lists.
- A partial contract rollout would be worse than the current state, so all touched runtimes must move together.

## 9. Milestones
1. Create the canonical contract artifact and generated runtime constants.
2. Standardize backend sync headers and stale-delete envelopes on the touched routes.
3. Update web and iOS API-boundary code to consume the standardized contract.
4. Add `Sankalpa` transaction boundaries and any focused concurrency coverage needed.
5. Add or update backend, web, and iOS tests plus durable docs.
6. Review, fix any remaining issues, remove the executed prompt bundle, and merge back to `codex/expert-review`.

## 10. Verification
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `./gradlew -PjavaVersion=21 test`
- `swift test --package-path ios-native`
- focused stale-update and stale-delete contract checks in backend, web, and iOS tests

## 11. Decision log
- 2026-04-11: Narrowed the bundle to the remaining gap instead of reworking already-hardened offline queue behavior.
- 2026-04-11: Chosen direction is one canonical contract artifact plus runtime-specific generated constants or checks, not three manually maintained contract copies.
- 2026-04-11: Plan is to standardize sync outcome classification via headers and a generic stale-delete field without widening the mutable-route body shape into a full new envelope.

## 12. Progress log
- 2026-04-11: Reviewed the runner, bundle prompts, required product and architecture docs, the remediation phased plan, and existing offline-sync artifacts.
- 2026-04-11: Re-verified the current repo state and narrowed the main remaining gaps to sync-result signaling, stale-delete response consistency, shared reference-data source-of-truth, and `Sankalpa` transaction discipline.
- 2026-04-11: Added `contracts/sync-contract.json`, generated runtime constants for backend, web, and iOS, standardized backend sync-result headers plus stale-delete `currentRecord`, and added transactional boundaries to `Sankalpa` writes.
