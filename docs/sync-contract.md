# Sync Contract

The canonical sync contract for this repo now lives in:

- `contracts/sync-contract.json`

Generated runtime constants are produced from that artifact by:

- `scripts/generate-sync-contract.mjs`

Generated outputs:

- `src/generated/syncContract.ts`
- `backend/src/main/java/com/meditation/backend/sync/GeneratedSyncContract.java`
- `ios-native/Sources/MeditationNativeCore/Domain/GeneratedSyncContract.swift`

## Contract summary

- Queued mutation timestamp header:
  - `X-Meditation-Sync-Queued-At`
- Sync-result classification header on queued-mutation responses:
  - `X-Meditation-Sync-Result`
- Standard sync outcomes:
  - `applied`
  - `stale`
  - `deleted`
- Stale delete responses expose one canonical field:
  - `currentRecord`

## Compatibility behavior

- Backend stale delete responses still emit the older alias fields alongside `currentRecord` during this transition:
  - `currentCustomPlay`
  - `currentPlaylist`
  - `currentSankalpa`
- Web and iOS clients now prefer `currentRecord` and keep the legacy aliases as a fallback path.
- Stale queued upserts still return the authoritative record body for the route, but the response is now explicitly classified through `X-Meditation-Sync-Result: stale`.
- `session log` replay remains idempotent and continues to use the persisted creation timestamp as the stale-write anchor because `session log` records are append-style rather than mutable collections.
