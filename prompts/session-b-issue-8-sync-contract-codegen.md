# Session B — Issue #8: Sync contract codegen + CI check

## Context

This is a meditation app with a Spring Boot backend, React/TypeScript web client, and a Swift iOS client.
We are working on branch `review-fixes`. Issues #1–#5, #7, #9, #2, #3 are already done and committed.

The fix plan lives at `docs/fix-plan-top10-2026-04-24.md` (Issue #8 section).

## Problem

`contracts/sync-contract.json` is the single source of truth for the sync API. Three derived files exist across three tiers:
- `src/generated/syncContract.ts` (web, JS-generated)
- `backend/src/main/java/com/meditation/backend/sync/GeneratedSyncContract.java` (backend, unclear provenance)
- `ios-native/Sources/MeditationNativeCore/Domain/GeneratedSyncContract.swift` (iOS, hand-maintained)

No CI step verifies these are in sync. A change to `sync-contract.json` that misses one tier causes a silent runtime protocol mismatch.

## Files to read first (read ALL before writing any code)

1. `contracts/sync-contract.json` — understand the structure and all keys
2. `scripts/generate-sync-contract.mjs` — the existing JS generator
3. `src/generated/syncContract.ts` — the current web output (confirm it matches the JSON)
4. `backend/src/main/java/com/meditation/backend/sync/GeneratedSyncContract.java` — current Java constants
5. `ios-native/Sources/MeditationNativeCore/Domain/GeneratedSyncContract.swift` — current Swift constants
6. `package.json` — find existing scripts and where to add `generate:sync-contract`
7. `scripts/pipeline.sh` — find where to insert the CI diff check

## Changes

### 1. Extend `scripts/generate-sync-contract.mjs`

Add a function that reads `contracts/sync-contract.json` and emits `GeneratedSyncContract.java`:
- Output: `public final class GeneratedSyncContract` with `public static final String` constants for each key in the JSON.
- Add a `// DO NOT EDIT — generated from contracts/sync-contract.json. Run: npm run generate:sync-contract` header.
- Write the file to `backend/src/main/java/com/meditation/backend/sync/GeneratedSyncContract.java`.

Add a second function that emits `GeneratedSyncContract.swift`:
- Output: `public enum GeneratedSyncContract` with `public static let` string constants.
- Same DO NOT EDIT header.
- Write the file to `ios-native/Sources/MeditationNativeCore/Domain/GeneratedSyncContract.swift`.

Ensure the existing web output (`src/generated/syncContract.ts`) already has the DO NOT EDIT header; add it if missing.

### 2. Update `package.json`

Add (or update) the script:
```json
"generate:sync-contract": "node scripts/generate-sync-contract.mjs"
```

### 3. Update `scripts/pipeline.sh`

After the existing lint/test steps, add a contract freshness check:
```bash
npm run generate:sync-contract
git diff --exit-code \
    src/generated/syncContract.ts \
    backend/src/main/java/com/meditation/backend/sync/GeneratedSyncContract.java \
    ios-native/Sources/MeditationNativeCore/Domain/GeneratedSyncContract.swift \
  || { echo "ERROR: Generated sync contract files are stale. Run: npm run generate:sync-contract"; exit 1; }
```

### 4. Add a web unit test

In an appropriate test file (create `src/generated/syncContract.test.ts` if none exists), add assertions for specific constant values imported from `syncContract.ts`. This ensures a regeneration that silently changes values fails the test suite, not just the CI diff check.

## Verification

1. Run `npm run generate:sync-contract` — all three files should be written without error.
2. Run `git diff` on the three generated files — there should be no diff (they were already in sync, or are now corrected).
3. Manually change a value in `contracts/sync-contract.json`, re-run the generator, confirm all three files update consistently.
4. Run `npm test` — existing and new web tests pass.
5. Run the backend tests (`mvn test` in `backend/`) — no regressions.

## After finishing

Commit on branch `review-fixes` and push.
