# Test Report: Cross-Platform Contract Hardening Feature

## Canonical contract evidence
- Canonical artifact: `contracts/sync-contract.json`
- Generator: `scripts/generate-sync-contract.mjs`
- Generated runtime outputs:
  - `src/generated/syncContract.ts`
  - `backend/src/main/java/com/meditation/backend/sync/GeneratedSyncContract.java`
  - `ios-native/Sources/MeditationNativeCore/Domain/GeneratedSyncContract.swift`

## Commands run
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `mvn -Dmaven.repo.local=../local-data/m2 test` in `backend/`
- `swift test --package-path ios-native`

## Results
- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run test`: pass
- `npm run build`: pass
- `mvn -Dmaven.repo.local=../local-data/m2 test`: pass
- `swift test --package-path ios-native`: pass

## Contract scenarios exercised
- Backend controller tests now verify `X-Meditation-Sync-Result: applied` on queued upserts and `X-Meditation-Sync-Result: stale` on stale retries for:
  - timer settings
  - `session log`
  - `custom play`
  - playlist
- Backend controller tests verify stale deletes now return:
  - `outcome: "stale"`
  - `currentRecord`
  - the legacy alias field for compatibility
- Web API-boundary tests verify stale-delete parsing through the canonical `currentRecord` field for:
  - `custom play`
  - playlist
  - `sankalpa`
- Native tests verify:
  - generated contract values align with native vocabulary expectations
  - queued mutation requests use the canonical queued-at header
  - stale custom-play delete responses can flow through the native sync client while preserving the stale-notice behavior

## Cross-runtime alignment notes
- Backend, web, and iOS now share generated constants for:
  - queued mutation header names
  - sync-result header name
  - stale-delete canonical field name
  - meditation types
  - `session log` sources
  - time-of-day buckets
- `Sankalpa` save and delete now run inside explicit backend transactions so multi-step goal and observance writes cannot partially commit.

## Gaps
- This bundle verified the stale-update and stale-delete paths through automated integration-style tests rather than a separately booted localhost server process.
- External callers outside this repo still need to move from legacy stale-delete alias fields to `currentRecord` if they want the long-term canonical field only.
